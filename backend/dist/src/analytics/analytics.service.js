"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary() {
        const [totalAccidents, totals, recentAccidents] = await Promise.all([
            this.prisma.accident.count({ where: { deletedAt: null } }),
            this.prisma.accident.aggregate({
                where: { deletedAt: null },
                _sum: { deathsCount: true, injuriesCount: true },
            }),
            this.prisma.accident.findMany({
                where: { deletedAt: null },
                include: { governorate: true, cause: true },
                orderBy: { accidentDate: 'desc' },
                take: 5,
            }),
        ]);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        const monthlyCount = await this.prisma.accident.count({
            where: { deletedAt: null, accidentDate: { gte: thisMonth } },
        });
        return {
            totalAccidents,
            totalDeaths: totals._sum.deathsCount || 0,
            totalInjuries: totals._sum.injuriesCount || 0,
            monthlyAccidents: monthlyCount,
            recentAccidents,
        };
    }
    async getByGovernorate() {
        const results = await this.prisma.accident.groupBy({
            by: ['governorateId'],
            where: { deletedAt: null },
            _count: { id: true },
            _sum: { deathsCount: true, injuriesCount: true },
            orderBy: { _count: { id: 'desc' } },
        });
        const governorates = await this.prisma.governorate.findMany();
        const govMap = new Map(governorates.map((g) => [g.id, g.nameAr]));
        return results.map((r) => ({
            governorateId: r.governorateId,
            governorateName: govMap.get(r.governorateId) || '',
            accidentCount: r._count.id,
            deathsCount: r._sum.deathsCount || 0,
            injuriesCount: r._sum.injuriesCount || 0,
        }));
    }
    async getByCause() {
        const results = await this.prisma.accident.groupBy({
            by: ['causeId'],
            where: { deletedAt: null },
            _count: { id: true },
            _sum: { deathsCount: true, injuriesCount: true },
            orderBy: { _count: { id: 'desc' } },
        });
        const causes = await this.prisma.accidentCause.findMany();
        const causeMap = new Map(causes.map((c) => [c.id, c.nameAr]));
        return results.map((r) => ({
            causeId: r.causeId,
            causeName: causeMap.get(r.causeId) || '',
            accidentCount: r._count.id,
            deathsCount: r._sum.deathsCount || 0,
            injuriesCount: r._sum.injuriesCount || 0,
        }));
    }
    async getByBrand() {
        const accidents = await this.prisma.accident.findMany({
            where: { deletedAt: null },
            select: { vehicleBrand1Id: true, vehicleBrand2Id: true, deathsCount: true, injuriesCount: true },
        });
        const brands = await this.prisma.vehicleBrand.findMany();
        const brandMap = new Map(brands.map((b) => [b.id, b.nameAr]));
        const stats = new Map();
        for (const acc of accidents) {
            for (const brandId of [acc.vehicleBrand1Id, acc.vehicleBrand2Id]) {
                if (brandId) {
                    const existing = stats.get(brandId) || { count: 0, deaths: 0, injuries: 0 };
                    existing.count++;
                    existing.deaths += acc.deathsCount;
                    existing.injuries += acc.injuriesCount;
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
            injuriesCount: s.injuries,
        }))
            .sort((a, b) => b.accidentCount - a.accidentCount);
    }
    async getByMonth() {
        const accidents = await this.prisma.accident.findMany({
            where: { deletedAt: null },
            select: { accidentDate: true, deathsCount: true, injuriesCount: true },
            orderBy: { accidentDate: 'asc' },
        });
        const monthly = new Map();
        for (const acc of accidents) {
            const d = new Date(acc.accidentDate);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const existing = monthly.get(key) || { count: 0, deaths: 0, injuries: 0 };
            existing.count++;
            existing.deaths += acc.deathsCount;
            existing.injuries += acc.injuriesCount;
            monthly.set(key, existing);
        }
        return Array.from(monthly.entries()).map(([month, s]) => ({
            month,
            accidentCount: s.count,
            deathsCount: s.deaths,
            injuriesCount: s.injuries,
        }));
    }
    async getByHour() {
        const accidents = await this.prisma.accident.findMany({
            where: { deletedAt: null },
            select: { accidentTime: true },
        });
        const hourly = new Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
        for (const acc of accidents) {
            if (acc.accidentTime) {
                const hour = parseInt(acc.accidentTime.split(':')[0], 10);
                if (hour >= 0 && hour < 24)
                    hourly[hour].count++;
            }
        }
        return hourly;
    }
    async getTopRoutes(limit = 10) {
        const accidents = await this.prisma.accident.findMany({
            where: { deletedAt: null, route: { not: null } },
            select: { route: true, deathsCount: true, injuriesCount: true },
        });
        const routes = new Map();
        for (const acc of accidents) {
            if (acc.route) {
                const existing = routes.get(acc.route) || { count: 0, deaths: 0, injuries: 0 };
                existing.count++;
                existing.deaths += acc.deathsCount;
                existing.injuries += acc.injuriesCount;
                routes.set(acc.route, existing);
            }
        }
        return Array.from(routes.entries())
            .map(([route, s]) => ({ route, accidentCount: s.count, deathsCount: s.deaths, injuriesCount: s.injuries }))
            .sort((a, b) => b.accidentCount - a.accidentCount)
            .slice(0, limit);
    }
    async getIntelligence(filters) {
        const baseWhere = { deletedAt: null };
        if (filters.governorateId)
            baseWhere.governorateId = Number(filters.governorateId);
        const now = new Date();
        let periodStart, periodEnd, prevStart, prevEnd;
        if (filters.dateFrom && filters.dateTo) {
            periodStart = new Date(filters.dateFrom);
            periodEnd = new Date(filters.dateTo);
            const len = periodEnd.getTime() - periodStart.getTime();
            prevEnd = new Date(periodStart.getTime() - 86400000);
            prevStart = new Date(prevEnd.getTime() - len);
        }
        else {
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = now;
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
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
                select: { governorateId: true, causeId: true, accidentTime: true, accidentDate: true, deathsCount: true, injuriesCount: true },
            }),
            this.prisma.accident.findMany({
                where: { ...baseWhere, accidentDate: { gte: prevStart, lte: prevEnd } },
                select: { governorateId: true, causeId: true, deathsCount: true, injuriesCount: true },
            }),
            this.prisma.accident.findMany({
                where: baseWhere,
                select: { governorateId: true, causeId: true, accidentTime: true, accidentDate: true, deathsCount: true, injuriesCount: true },
            }),
        ]);
        const currAcc = currentPeriod.length;
        const prevAcc = prevPeriod.length;
        const currDeaths = currentPeriod.reduce((s, a) => s + a.deathsCount, 0);
        const prevDeaths = prevPeriod.reduce((s, a) => s + a.deathsCount, 0);
        const currInjuries = currentPeriod.reduce((s, a) => s + a.injuriesCount, 0);
        const prevInjuries = prevPeriod.reduce((s, a) => s + a.injuriesCount, 0);
        const pct = (cur, prev) => prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);
        const currLeth = currAcc > 0 ? +(currDeaths / currAcc).toFixed(3) : 0;
        const prevLeth = prevAcc > 0 ? +(prevDeaths / prevAcc).toFixed(3) : 0;
        const comparison = {
            accidents: { current: currAcc, previous: prevAcc, change: pct(currAcc, prevAcc) },
            deaths: { current: currDeaths, previous: prevDeaths, change: pct(currDeaths, prevDeaths) },
            injuries: { current: currInjuries, previous: prevInjuries, change: pct(currInjuries, prevInjuries) },
            lethalityRate: { current: currLeth, previous: prevLeth, change: pct(Math.round(currLeth * 1000), Math.round(prevLeth * 1000)) },
        };
        const allDates = allAccidents.map((a) => new Date(a.accidentDate).getTime());
        const dataSpanMonths = allDates.length > 1
            ? Math.max(1, Math.round((Math.max(...allDates) - Math.min(...allDates)) / (30 * 24 * 3600000)))
            : 1;
        const govCurrentMap = new Map();
        for (const a of currentPeriod)
            govCurrentMap.set(a.governorateId, (govCurrentMap.get(a.governorateId) || 0) + 1);
        const govAllMap = new Map();
        for (const a of allAccidents)
            govAllMap.set(a.governorateId, (govAllMap.get(a.governorateId) || 0) + 1);
        const anomalies = [];
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
        const slots = { night: [0, 6], morning: [6, 12], afternoon: [12, 18], evening: [18, 24] };
        const slotLabels = { night: 'ليلاً (00–06)', morning: 'صباحاً (06–12)', afternoon: 'ظهراً (12–18)', evening: 'مساءً (18–00)' };
        const slotCount = { night: 0, morning: 0, afternoon: 0, evening: 0 };
        const slotDeaths = { night: 0, morning: 0, afternoon: 0, evening: 0 };
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
        const causeStats = new Map();
        for (const a of allAccidents) {
            if (a.causeId) {
                const s = causeStats.get(a.causeId) || { count: 0, deaths: 0, injuries: 0 };
                s.count++;
                s.deaths += a.deathsCount;
                s.injuries += a.injuriesCount;
                causeStats.set(a.causeId, s);
            }
        }
        const causeLethality = Array.from(causeStats.entries())
            .map(([id, s]) => ({
            causeId: id, causeName: causeMap.get(id) || '',
            count: s.count, deaths: s.deaths, injuries: s.injuries,
            deathRate: s.count > 0 ? +(s.deaths / s.count).toFixed(3) : 0,
            deathPct: s.count > 0 ? Math.round(s.deaths / s.count * 100) : 0,
        }))
            .filter((c) => c.count >= 2)
            .sort((a, b) => b.deathRate - a.deathRate)
            .slice(0, 8);
        const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - 4 + i, 0, 23, 59, 59);
            const label = d.toLocaleDateString('ar-TN', { month: 'short' });
            const items = allAccidents.filter((a) => { const ad = new Date(a.accidentDate); return ad >= d && ad <= end; });
            return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label, count: items.length, deaths: items.reduce((s, a) => s + a.deathsCount, 0) };
        });
        const recommendations = [];
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map