import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AnalyticsFilters = {
  dateFrom?: string;
  dateTo?: string;
  governorateId?: number;
  cityId?: number;
};

function buildFilterWhere(filters: AnalyticsFilters): any {
  const where: any = { deletedAt: null };
  if (filters.dateFrom || filters.dateTo) {
    where.accidentDate = {};
    if (filters.dateFrom) where.accidentDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      where.accidentDate.lte = end;
    }
  }
  if (filters.governorateId) where.governorateId = Number(filters.governorateId);
  if (filters.cityId) where.cityId = Number(filters.cityId);
  return where;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(filters?: AnalyticsFilters) {
    const where = buildFilterWhere(filters || {});
    const [totalAccidents, totals, recentAccidents] = await Promise.all([
      this.prisma.accident.count({ where }),
      this.prisma.accident.aggregate({
        where,
        _sum: { deathsCount: true },
      }),
      this.prisma.accident.findMany({
        where,
        include: { governorate: true, cause: true, city: true },
        orderBy: { accidentDate: 'desc' },
        take: 5,
      }),
    ]);

    const monthlyCount = await this.prisma.accident.count({ where });

    return {
      totalAccidents,
      totalDeaths: totals._sum.deathsCount || 0,
      monthlyAccidents: monthlyCount,
      recentAccidents,
    };
  }

  async getByGovernorate(filters?: AnalyticsFilters) {
    const where = buildFilterWhere(filters || {});
    delete where.governorateId;
    delete where.cityId;
    if (filters?.cityId) {
      const city = await this.prisma.city.findUnique({ where: { id: filters.cityId } });
      if (city) where.governorateId = city.governorateId;
    }
    if (filters?.governorateId) {
      where.governorateId = Number(filters.governorateId);
    }

    const results = await this.prisma.accident.groupBy({
      by: ['governorateId'],
      where,
      _count: { id: true },
      _sum: { deathsCount: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const governorates = await this.prisma.governorate.findMany();
    const govMap = new Map(governorates.map((g) => [g.id, g.nameAr]));

    return results.map((r) => ({
      governorateId: r.governorateId,
      governorateName: govMap.get(r.governorateId) || '',
      accidentCount: r._count.id,
      deathsCount: r._sum.deathsCount || 0,
    }));
  }

  async getByCause(filters?: AnalyticsFilters) {
    const where = buildFilterWhere(filters || {});

    const results = await this.prisma.accident.groupBy({
      by: ['causeId'],
      where,
      _count: { id: true },
      _sum: { deathsCount: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const causes = await this.prisma.accidentCause.findMany();
    const causeMap = new Map(causes.map((c) => [c.id, c.nameAr]));

    return results.map((r) => ({
      causeId: r.causeId,
      causeName: causeMap.get(r.causeId) || '',
      accidentCount: r._count.id,
      deathsCount: r._sum.deathsCount || 0,
    }));
  }

  async getByBrand(filters?: AnalyticsFilters) {
    const where = buildFilterWhere(filters || {});
    const accidents = await this.prisma.accident.findMany({
      where,
      select: { vehicleBrand1Id: true, vehicleBrand2Id: true, deathsCount: true },
    });

    const brands = await this.prisma.vehicleBrand.findMany();
    const brandMap = new Map(brands.map((b) => [b.id, b.nameAr]));
    const stats = new Map<number, { count: number; deaths: number }>();

    for (const acc of accidents) {
      for (const brandId of [acc.vehicleBrand1Id, acc.vehicleBrand2Id]) {
        if (brandId) {
          const existing = stats.get(brandId) || { count: 0, deaths: 0 };
          existing.count++;
          existing.deaths += acc.deathsCount;
          stats.set(brandId, existing);
        }
      }
    }

    return Array.from(stats.entries())
      .map(([brandId, s]) => ({
        brandId,
        brandName: brandMap.get(brandId) || '',
        accidentCount: s.count,
        deathsCount: s.deaths,
      }))
      .sort((a, b) => b.accidentCount - a.accidentCount);
  }

  async getByMonth(filters?: AnalyticsFilters) {
    const where = buildFilterWhere(filters || {});
    const accidents = await this.prisma.accident.findMany({
      where,
      select: { accidentDate: true, deathsCount: true },
      orderBy: { accidentDate: 'asc' },
    });

    const monthly = new Map<string, { count: number; deaths: number }>();
    for (const acc of accidents) {
      const d = new Date(acc.accidentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthly.get(key) || { count: 0, deaths: 0 };
      existing.count++;
      existing.deaths += acc.deathsCount;
      monthly.set(key, existing);
    }

    return Array.from(monthly.entries()).map(([month, s]) => ({
      month,
      accidentCount: s.count,
      deathsCount: s.deaths,
    }));
  }

  async getByHour(filters?: AnalyticsFilters) {
    const where = buildFilterWhere(filters || {});
    const accidents = await this.prisma.accident.findMany({
      where,
      select: { accidentTime: true },
    });

    const hourly = new Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
    for (const acc of accidents) {
      if (acc.accidentTime) {
        const hour = parseInt(acc.accidentTime.split(':')[0], 10);
        if (hour >= 0 && hour < 24) hourly[hour].count++;
      }
    }
    return hourly;
  }

  async getTopRoutes(limit = 10, filters?: AnalyticsFilters) {
    const where = buildFilterWhere(filters || {});
    where.route = { not: null };
    const accidents = await this.prisma.accident.findMany({
      where,
      select: { route: true, deathsCount: true },
    });

    const routes = new Map<string, { count: number; deaths: number }>();
    for (const acc of accidents) {
      if (acc.route) {
        const existing = routes.get(acc.route) || { count: 0, deaths: 0 };
        existing.count++;
        existing.deaths += acc.deathsCount;
        routes.set(acc.route, existing);
      }
    }

    return Array.from(routes.entries())
      .map(([route, s]) => ({ route, accidentCount: s.count, deathsCount: s.deaths }))
      .sort((a, b) => b.accidentCount - a.accidentCount)
      .slice(0, limit);
  }

  async getIntelligence(filters: { dateFrom?: string; dateTo?: string; governorateId?: number; cityId?: number }) {
    const baseWhere: any = { deletedAt: null };
    if (filters.governorateId) baseWhere.governorateId = Number(filters.governorateId);
    if (filters.cityId) baseWhere.cityId = Number(filters.cityId);

    const now = new Date();
    let periodStart: Date, periodEnd: Date, prevStart: Date, prevEnd: Date;

    if (filters.dateFrom && filters.dateTo) {
      periodStart = new Date(filters.dateFrom);
      periodEnd = new Date(filters.dateTo);
      // Auto-swap if dates are reversed
      if (periodStart > periodEnd) {
        [periodStart, periodEnd] = [periodEnd, periodStart];
      }
      const len = periodEnd.getTime() - periodStart.getTime();
      prevEnd = new Date(periodStart.getTime() - 86400000);
      prevStart = new Date(prevEnd.getTime() - len);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = now;
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const currentCount = await this.prisma.accident.count({
        where: { ...baseWhere, accidentDate: { gte: periodStart, lte: periodEnd } },
      });
      if (currentCount === 0) {
        const latestAccident = await this.prisma.accident.findFirst({
          where: baseWhere,
          select: { accidentDate: true },
          orderBy: { accidentDate: 'desc' },
        });
        if (latestAccident) {
          const latestDate = new Date(latestAccident.accidentDate);
          const latestMonth = latestDate.getMonth();
          const latestYear = latestDate.getFullYear();

          // Use last 3 months of available data as current period
          periodEnd = new Date(latestYear, latestMonth + 1, 0, 23, 59, 59);
          periodStart = new Date(latestYear, latestMonth - 2, 1);
          if (periodStart < new Date(latestYear, 0, 1)) periodStart = new Date(latestYear, 0, 1);

          // Previous period: same duration before current period
          const duration = periodEnd.getTime() - periodStart.getTime();
          prevEnd = new Date(periodStart.getTime() - 86400000);
          prevStart = new Date(prevEnd.getTime() - duration);
          if (prevStart < new Date(latestYear - 2, 0, 1)) prevStart = new Date(latestYear - 2, 0, 1);
        }
      }
    }

    const [governorates, causes] = await Promise.all([
      this.prisma.governorate.findMany(),
      this.prisma.accidentCause.findMany(),
    ]);
    const govMap = new Map(governorates.map((g) => [g.id, g.nameAr]));
    const causeMap = new Map(causes.map((c) => [c.id, c.nameAr]));

    const [currentPeriod, prevPeriod, allAccidents] = await Promise.all([
      this.prisma.accident.findMany({
        where: { ...baseWhere, accidentDate: { gte: periodStart, lte: periodEnd } },
        select: { governorateId: true, causeId: true, accidentTime: true, accidentDate: true, deathsCount: true, vehicleBrand1Id: true, vehicleBrand2Id: true, route: true },
      }),
      this.prisma.accident.findMany({
        where: { ...baseWhere, accidentDate: { gte: prevStart, lte: prevEnd } },
        select: { governorateId: true, causeId: true, deathsCount: true },
      }),
      this.prisma.accident.findMany({
        where: baseWhere,
        select: { governorateId: true, causeId: true, accidentTime: true, accidentDate: true, deathsCount: true, injuriesCount: true, vehicleBrand1Id: true, vehicleBrand2Id: true, route: true },
      }),
    ]);

    // 1. Period comparison
    const currAcc = currentPeriod.length;
    const prevAcc = prevPeriod.length;
    const currDeaths = currentPeriod.reduce((s, a) => s + a.deathsCount, 0);
    const prevDeaths = prevPeriod.reduce((s, a) => s + a.deathsCount, 0);
    const pct = (cur: number, prev: number) => prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);
    const currLeth = currAcc > 0 ? +(currDeaths / currAcc).toFixed(3) : 0;
    const prevLeth = prevAcc > 0 ? +(prevDeaths / prevAcc).toFixed(3) : 0;

    const comparison = {
      accidents:     { current: currAcc,      previous: prevAcc,      change: pct(currAcc, prevAcc) },
      deaths:        { current: currDeaths,   previous: prevDeaths,   change: pct(currDeaths, prevDeaths) },
      lethalityRate: { current: currLeth,     previous: prevLeth,     change: pct(Math.round(currLeth * 1000), Math.round(prevLeth * 1000)) },
    };

    // 2. Anomaly detection per governorate
    const allDates = allAccidents.map((a) => new Date(a.accidentDate).getTime());
    const dataSpanMonths = allDates.length > 1
      ? Math.max(1, Math.round((Math.max(...allDates) - Math.min(...allDates)) / (30 * 24 * 3600000)))
      : 1;

    const govCurrentMap = new Map<number, number>();
    for (const a of currentPeriod) govCurrentMap.set(a.governorateId, (govCurrentMap.get(a.governorateId) || 0) + 1);

    const govAllMap = new Map<number, number>();
    for (const a of allAccidents) govAllMap.set(a.governorateId, (govAllMap.get(a.governorateId) || 0) + 1);

    const anomalies: any[] = [];
    for (const [govId, cur] of govCurrentMap.entries()) {
      const total = govAllMap.get(govId) || 0;
      const avg = total / dataSpanMonths;
      if (avg > 0 && cur > avg * 1.4) {
        const spike = Math.round(((cur - avg) / avg) * 100);
        anomalies.push({
          governorateId: govId,
          governorateName: govMap.get(govId) || '',
          currentCount: cur,
          averageCount: +avg.toFixed(1),
          spikePercent: spike,
          severity: spike > 100 ? 'critical' : spike > 50 ? 'high' : 'medium',
        });
      }
    }
    anomalies.sort((a, b) => b.spikePercent - a.spikePercent);

    // 3. Time-slot analysis
    const slots = { night: [0,6], morning: [6,12], afternoon: [12,18], evening: [18,24] };
    const slotLabels: Record<string, string> = { night: 'ليلاً (00–06)', morning: 'صباحاً (06–12)', afternoon: 'ظهراً (12–18)', evening: 'مساءً (18–00)' };
    const slotCount: Record<string, number> = { night: 0, morning: 0, afternoon: 0, evening: 0 };
    const slotDeaths: Record<string, number> = { night: 0, morning: 0, afternoon: 0, evening: 0 };
    for (const a of allAccidents) {
      if (a.accidentTime) {
        const h = parseInt(a.accidentTime.split(':')[0], 10);
        const slot = h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
        slotCount[slot]++;
        slotDeaths[slot] += a.deathsCount;
      }
    }
    const timeSlotAnalysis = Object.keys(slots).map((slot) => ({
      slot, label: slotLabels[slot],
      count: slotCount[slot],
      deaths: slotDeaths[slot],
      deathRate: slotCount[slot] > 0 ? +(slotDeaths[slot] / slotCount[slot]).toFixed(3) : 0,
      pct: allAccidents.length > 0 ? Math.round(slotCount[slot] / allAccidents.length * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    // 4. Weekday analysis
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayCounts = new Array(7).fill(0);
    const dayDeaths = new Array(7).fill(0);
    for (const a of allAccidents) {
      const d = new Date(a.accidentDate).getDay();
      dayCounts[d]++;
      dayDeaths[d] += a.deathsCount;
    }
    const maxDay = Math.max(...dayCounts);
    const weekdayAnalysis = dayNames.map((name, i) => ({
      day: name,
      count: dayCounts[i],
      deaths: dayDeaths[i],
      deathRate: dayCounts[i] > 0 ? +(dayDeaths[i] / dayCounts[i]).toFixed(3) : 0,
      pct: maxDay > 0 ? Math.round(dayCounts[i] / maxDay * 100) : 0,
    }));

    // 5. Cause lethality ranking
    const causeStats = new Map<number, { count: number; deaths: number }>();
    for (const a of allAccidents) {
      if (a.causeId) {
        const s = causeStats.get(a.causeId) || { count: 0, deaths: 0 };
        s.count++; s.deaths += a.deathsCount;
        causeStats.set(a.causeId, s);
      }
    }
    const causeLethality = Array.from(causeStats.entries())
      .map(([id, s]) => ({
        causeId: id, causeName: causeMap.get(id) || '',
        count: s.count, deaths: s.deaths,
        deathRate: s.count > 0 ? +(s.deaths / s.count).toFixed(3) : 0,
        deathPct: s.count > 0 ? Math.round(s.deaths / s.count * 100) : 0,
      }))
      .filter((c) => c.count >= 2)
      .sort((a, b) => b.deathRate - a.deathRate)
      .slice(0, 8);

    // 6. 6-month sparkline trend
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - 4 + i, 0, 23, 59, 59);
      const label = d.toLocaleDateString('ar-TN', { month: 'short' });
      const items = allAccidents.filter((a) => { const ad = new Date(a.accidentDate); return ad >= d && ad <= end; });
      return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label, count: items.length, deaths: items.reduce((s, a) => s + a.deathsCount, 0) };
    });

    // 7. Heatmap: weekday × time-slot
    const slotKeys = ['night', 'morning', 'afternoon', 'evening'];
    const heatmapDayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const heatmap: { day: string; dayIndex: number; slot: string; label: string; count: number }[] = [];
    const heatMapData: Record<string, number> = {};
    for (const a of allAccidents) {
      if (a.accidentTime) {
        const h = parseInt(a.accidentTime.split(':')[0], 10);
        const slot = h < 6 ? 'night' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
        const d = new Date(a.accidentDate).getDay();
        const key = `${d}-${slot}`;
        heatMapData[key] = (heatMapData[key] || 0) + 1;
      }
    }
    for (let d = 0; d < 7; d++) {
      for (const slot of slotKeys) {
        const slotLabels: Record<string, string> = { night: '00–06', morning: '06–12', afternoon: '12–18', evening: '18–00' };
        heatmap.push({ day: heatmapDayNames[d], dayIndex: d, slot, label: slotLabels[slot], count: heatMapData[`${d}-${slot}`] || 0 });
      }
    }

    // 8. Top dangerous routes
    const routeStats = new Map<string, { count: number; deaths: number; injuries: number }>();
    for (const a of allAccidents) {
      if (a.route) {
        const s = routeStats.get(a.route) || { count: 0, deaths: 0, injuries: 0 };
        s.count++; s.deaths += a.deathsCount; s.injuries += a.injuriesCount;
        routeStats.set(a.route, s);
      }
    }
    const topRoutes = Array.from(routeStats.entries())
      .map(([route, s]) => ({ route, count: s.count, deaths: s.deaths, injuries: s.injuries }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 9. Vehicle brand severity
    const [brands] = await Promise.all([this.prisma.vehicleBrand.findMany()]);
    const brandMap = new Map(brands.map((b) => [b.id, b.nameAr]));
    const brandStats = new Map<number, { count: number; deaths: number; injuries: number }>();
    for (const a of allAccidents) {
      for (const brandId of [a.vehicleBrand1Id, a.vehicleBrand2Id]) {
        if (brandId) {
          const s = brandStats.get(brandId) || { count: 0, deaths: 0, injuries: 0 };
          s.count++; s.deaths += a.deathsCount; s.injuries += a.injuriesCount;
          brandStats.set(brandId, s);
        }
      }
    }
    const brandSeverity = Array.from(brandStats.entries())
      .map(([id, s]) => ({
        brandId: id, brandName: brandMap.get(id) || '',
        count: s.count, deaths: s.deaths, injuries: s.injuries,
        severityScore: s.count > 0 ? +(s.deaths * 3 + s.injuries * 1) / s.count : 0,
      }))
      .sort((a, b) => b.severityScore - a.severityScore)
      .slice(0, 8);

    // 10. Predictive forecast (simple moving average)
    const last3Months = monthlyTrend.slice(-3).map((m) => m.count);
    const avgLast3 = last3Months.length > 0 ? Math.round(last3Months.reduce((a, b) => a + b, 0) / last3Months.length) : 0;
    const trendDirection = last3Months.length >= 2
      ? last3Months[last3Months.length - 1] > last3Months[last3Months.length - 2] ? 'up' : last3Months[last3Months.length - 1] < last3Months[last3Months.length - 2] ? 'down' : 'stable'
      : 'stable';
    const forecast = {
      nextMonthEstimate: avgLast3,
      trendDirection,
      confidence: last3Months.length >= 3 ? 'medium' : 'low',
      warning: trendDirection === 'up' && avgLast3 > 0 ? `متوقع ارتفاع الحوادث الشهر القادم (~${avgLast3} حادث)` : null,
    };

    // 11. Severity index (0-100)
    const severityIndex = allAccidents.length > 0
      ? Math.min(100, Math.round(
          (currAcc > 0 ? (currDeaths / currAcc) * 50 : 0) +
          (allAccidents.length > 0 ? (allAccidents.filter((a) => a.deathsCount > 0).length / allAccidents.length) * 30 : 0) +
          (comparison.accidents.change !== null && comparison.accidents.change > 0 ? Math.min(comparison.accidents.change, 20) : 0)
        ))
      : 0;
    const severityLevel = severityIndex >= 70 ? 'حرج' : severityIndex >= 50 ? 'مرتفع' : severityIndex >= 30 ? 'متوسط' : 'منخفض';

    // 12. Priority recommendations
    const recommendations: any[] = [];
    if (comparison.accidents.change !== null && comparison.accidents.change > 20)
      recommendations.push({ priority: 1, type: 'critical', title: 'ارتفاع حاد في الحوادث', detail: `ارتفعت الحوادث بنسبة ${comparison.accidents.change}% مقارنة بالفترة السابقة. يستلزم تدخلاً أمنياً فورياً.` });

    if (anomalies.length > 0)
      recommendations.push({ priority: 2, type: 'high', title: `نشر دوريات في ولاية ${anomalies[0].governorateName}`, detail: `سجّلت ${anomalies[0].currentCount} حادث (+${anomalies[0].spikePercent}% عن المعدل). أعلى ولاية شذوذاً في هذه الفترة.` });

    const peakSlot = timeSlotAnalysis[0];
    if (peakSlot && peakSlot.count > 0)
      recommendations.push({ priority: 3, type: 'medium', title: `تعزيز المراقبة ${peakSlot.label}`, detail: `${peakSlot.pct}% من الحوادث تقع في هذه الفترة (${peakSlot.count} حادث). تكثيف الدوريات خلال هذا التوقيت ضرورة.` });

    if (causeLethality.length > 0)
      recommendations.push({ priority: 4, type: 'high', title: `حملة توعية: ${causeLethality[0].causeName}`, detail: `أعلى معدل وفيات: ${(causeLethality[0].deathRate * 100).toFixed(1)} وفاة لكل 100 حادث (${causeLethality[0].deaths} وفاة من ${causeLethality[0].count} حادث).` });

    const peakDay = weekdayAnalysis.reduce((m, d) => d.count > m.count ? d : m, weekdayAnalysis[0]);
    if (peakDay)
      recommendations.push({ priority: 5, type: 'medium', title: `يوم ${peakDay.day} — أكثر الأيام حوادث`, detail: `${peakDay.count} حادث مسجّل. يُنصح بتعزيز التواجد الميداني في هذا اليوم.` });

    if (topRoutes.length > 0)
      recommendations.push({ priority: 6, type: 'high', title: `مراقبة مكثفة: ${topRoutes[0].route}`, detail: `أخطر طريق: ${topRoutes[0].count} حادث (${topRoutes[0].deaths} وفاة). يُنصح بتثبيت كاميرات مراقبة.` });

    if (forecast.warning)
      recommendations.push({ priority: 7, type: 'medium', title: 'توقعات الشهر القادم', detail: forecast.warning });

    return {
      period: { start: periodStart.toISOString().split('T')[0], end: periodEnd.toISOString().split('T')[0], label: filters.dateFrom ? 'الفترة المحددة' : 'الشهر الحالي مقابل الشهر الماضي' },
      comparison,
      anomalies: anomalies.slice(0, 5),
      timeSlotAnalysis,
      weekdayAnalysis,
      causeLethality,
      monthlyTrend,
      recommendations,
      totalAnalyzed: allAccidents.length,
      heatmap,
      topRoutes,
      brandSeverity,
      forecast,
      severityIndex,
      severityLevel,
    };
  }

  async getInsights() {
    const [byGov, byCause, byMonth, byHour, topRoutes, summary] = await Promise.all([
      this.getByGovernorate(),
      this.getByCause(),
      this.getByMonth(),
      this.getByHour(),
      this.getTopRoutes(5),
      this.getSummary(),
    ]);

    const topGov = byGov[0];
    const topCause = byCause[0];
    const peakHour = byHour.reduce((max, h) => (h.count > max.count ? h : max), byHour[0]);
    const avgDeathRate = summary.totalAccidents > 0 ? (summary.totalDeaths / summary.totalAccidents).toFixed(2) : '0';

    return {
      summary,
      insights: [
        { key: 'top_governorate', title: 'أكثر ولاية حوادث', value: topGov?.governorateName, count: topGov?.accidentCount },
        { key: 'top_cause', title: 'أكثر سبب للحوادث', value: topCause?.causeName, count: topCause?.accidentCount },
        { key: 'peak_hour', title: 'ساعة الذروة', value: `${peakHour.hour}:00`, count: peakHour.count },
        { key: 'death_rate', title: 'معدل الوفيات لكل حادث', value: avgDeathRate },
        { key: 'top_route', title: 'أخطر طريق', value: topRoutes[0]?.route, count: topRoutes[0]?.accidentCount },
      ],
      charts: { byGov, byCause, byMonth, byHour, topRoutes },
    };
  }
}
