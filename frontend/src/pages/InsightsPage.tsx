import { useEffect, useState, useCallback, useRef } from 'react';
import { getIntelligence, getGovernorates } from '../api/services';
import { SIDI_BOUZID_MUNICIPALITIES } from '../constants/municipalities';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Clock,
  Calendar, MapPin, Target, Zap, ChevronLeft, RotateCcw, Car, Route,
  Download, BarChart3, Activity,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext';

const TrendIcon = ({ change }: { change: number | null }) => {
  if (change === null) return <Minus size={16} color="var(--text-secondary)" />;
  if (change > 0) return <TrendingUp size={16} color="var(--danger)" />;
  if (change < 0) return <TrendingDown size={16} color="var(--success)" />;
  return <Minus size={16} color="var(--text-secondary)" />;
};

const ChangeTag = ({ change, diff }: { change: number | null; diff?: number | null }) => {
  if (change === null) return <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>لا مقارنة</span>;
  const color = change > 0 ? 'var(--danger)' : change < 0 ? 'var(--success)' : 'var(--text-secondary)';
  const sign = change > 0 ? '+' : '';
  const diffSign = diff != null && diff > 0 ? '+' : '';
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 4 }}>
      <TrendIcon change={change} />
      {sign}{change}%
      {diff != null && (
        <span style={{ fontWeight: 400, opacity: 0.85 }}>({diffSign}{diff})</span>
      )}
    </span>
  );
};

const MiniBar = ({ pct, color = 'var(--primary)' }: { pct: number; color?: string }) => (
  <div style={{ flex: 1, height: 8, background: '#f0f2f5', borderRadius: 4, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
  </div>
);

const severityColors: Record<string, string> = { critical: 'var(--danger)', high: '#e67e22', medium: '#f39c12' };
const severityLabels: Record<string, string> = { critical: 'خطر بالغ', high: 'مرتفع', medium: 'متوسط' };
const typeColors: Record<string, string> = { critical: '#fff5f5', high: '#fff8f0', medium: '#fffbf0' };
const typeBorder: Record<string, string> = { critical: 'rgba(235,87,87,0.3)', high: 'rgba(230,126,34,0.3)', medium: 'rgba(243,156,18,0.3)' };

const heatmapColors = ['#f0f4f8', '#d4e6f1', '#a9cce3', '#7fb3d8', '#5499c7', '#2e86c1', '#1a5276', '#0b2545'];
function getHeatColor(count: number, max: number): string {
  if (max === 0) return heatmapColors[0];
  const idx = Math.min(heatmapColors.length - 1, Math.round((count / max) * (heatmapColors.length - 1)));
  return heatmapColors[idx];
}

const severityGaugeColors = ['#27ae60', '#f39c12', '#e67e22', '#e74c3c'];
const severityGaugeLabels = ['منخفض', 'متوسط', 'مرتفع', 'حرج'];

export default function InsightsPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings } = useDisplaySettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [govFilter, setGovFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [applied, setApplied] = useState<{ dateFrom: string; dateTo: string; governorateId: string; cityId: string }>({ dateFrom: '', dateTo: '', governorateId: '', cityId: '' });
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'brands'>('overview');
  const [expandedRec, setExpandedRec] = useState<number | null>(null);
  const [editingRec, setEditingRec] = useState<number | null>(null);
  const [recText, setRecText] = useState('');
  const [recTitle, setRecTitle] = useState('');

  const showMunicipalityDropdown = govFilter === '18';

  useEffect(() => { getGovernorates().then(setGovernorates).catch(() => {}); }, []);

  const load = useCallback(async (filters: typeof applied) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.governorateId) params.governorateId = filters.governorateId;
      if (filters.cityId) params.cityId = filters.cityId;
      setData(await getIntelligence(params));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(applied); }, [load, applied]);

  const applyFilters = () => setApplied({ dateFrom, dateTo, governorateId: govFilter, cityId: cityFilter });
  const resetFilters = () => { setDateFrom(''); setDateTo(''); setGovFilter(''); setCityFilter(''); setApplied({ dateFrom: '', dateTo: '', governorateId: '', cityId: '' }); };
  const isFiltered = applied.dateFrom || applied.dateTo || applied.governorateId || applied.cityId;

  const handleExport = () => {
    if (!d) return;
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['التقرير', 'ال الأمنيةاستخبارات'],
      ['الفترة', d.period?.label || ''],
      ['إجمالي الحوادث المحللة', d.totalAnalyzed || 0],
      ['مؤشر الخطورة', `${d.severityIndex || 0} - ${d.severityLevel || ''}`],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'ملخص');

    if (d.comparison) {
      const compData = [['المؤشر', 'الحالي', 'السابق', 'التغير (%)']];
      const labels: Record<string, string> = { accidents: 'الحوادث', deaths: 'الوفيات', injuries: 'الجرحى', lethalityRate: 'معدل القتلى' };
      Object.entries(d.comparison).forEach(([key, val]: [string, any]) => {
        compData.push([labels[key] || key, val.current, val.previous, val.change !== null ? val.change : '—']);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(compData);
      ws2['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'مقارنة الفترات');
    }

    if (d.anomalies?.length > 0) {
      const anomData = [['الولاية', 'الحوادث الحالية', 'المعدل الشهري', 'نسبة الارتفاع (%)', 'المستوى']];
      d.anomalies.forEach((a: any) => {
        anomData.push([a.governorateName, a.currentCount, a.averageCount, a.spikePercent, severityLabels[a.severity] || a.severity]);
      });
      const ws3 = XLSX.utils.aoa_to_sheet(anomData);
      ws3['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'شذوذ الولايات');
    }

    if (d.topRoutes?.length > 0) {
      const routeData = [['الطريق', 'عدد الحوادث', 'الوفيات', 'الجرحى']];
      d.topRoutes.forEach((r: any) => {
        routeData.push([r.route, r.count, r.deaths, r.injuries]);
      });
      const ws4 = XLSX.utils.aoa_to_sheet(routeData);
      ws4['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws4, 'أخطر الطرق');
    }

    if (d.causeLethality?.length > 0) {
      const causeData = [['السبب', 'عدد الحوادث', 'الوفيات', 'الجرحى', 'معدل القتلى']];
      d.causeLethality.forEach((c: any) => {
        causeData.push([c.causeName, c.count, c.deaths, c.injuries, c.deathRate]);
      });
      const ws5 = XLSX.utils.aoa_to_sheet(causeData);
      ws5['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws5, 'الأسباب والفتك');
    }

    if (d.brandSeverity?.length > 0) {
      const brandData = [['الماركة', 'عدد الحوادث', 'الوفيات', 'الجرحى', 'مؤشر الخطورة']];
      d.brandSeverity.forEach((b: any) => {
        brandData.push([b.brandName, b.count, b.deaths, b.injuries, b.severityScore]);
      });
      const ws6 = XLSX.utils.aoa_to_sheet(brandData);
      ws6['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws6, 'الماركات');
    }

    if (d.recommendations?.length > 0) {
      const recData = [['الأولوية', 'العنوان', 'التفاصيل']];
      d.recommendations.forEach((r: any, i: number) => {
        recData.push([i + 1, r.title, r.detail]);
      });
      const ws7 = XLSX.utils.aoa_to_sheet(recData);
      ws7['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, ws7, 'التوصيات');
    }

    const fileName = `تقرير_التقييم_الشامل_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;

  const d = data;
  const hasCritical = d?.anomalies?.some((a: any) => a.severity === 'critical');
  const trendUp = d?.comparison?.accidents?.change > 20;
  const gaugeIndex = d?.severityIndex || 0;
  const gaugeLevel = d?.severityLevel || 'منخفض';
  const gaugeColorIdx = gaugeIndex >= 70 ? 3 : gaugeIndex >= 50 ? 2 : gaugeIndex >= 30 ? 1 : 0;

  const forecastData = d?.forecast;
  const heatmapData = d?.heatmap || [];
  const heatmapMax = Math.max(...heatmapData.map((h: any) => h.count), 1);
  const slotLabels: Record<string, string> = { night: '00–06', morning: '06–12', afternoon: '12–18', evening: '18–00' };

  return (
    <div ref={contentRef}>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">التقييم الشامل</h1>
          <p className="page-subtitle"> 
            {d?.period?.label} · تحليل {d?.totalAnalyzed?.toLocaleString('ar-TN') || 0} حادث مسجّل
          </p>
        </div>
        <button className="btn btn-outline" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={16} /> تصدير Excel
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>من تاريخ</label>
            <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="اختر تاريخ البداية" />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>إلى تاريخ</label>
            <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="اختر تاريخ النهاية" />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 180 }}>
            <label className="form-label" style={{ fontSize: 12 }}>الولاية</label>
            <select className="form-select" value={govFilter} onChange={(e) => { setGovFilter(e.target.value); setCityFilter(''); }}>
              <option value="">كل الولايات</option>
              {governorates.map((g: any) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
            </select>
          </div>
          {showMunicipalityDropdown && (
            <div className="form-group" style={{ margin: 0, flex: 1.5, minWidth: 160 }}>
              <label className="form-label" style={{ fontSize: 12 }}>المعتمدية</label>
              <select className="form-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                <option value="">كل المعتمديات</option>
                {SIDI_BOUZID_MUNICIPALITIES.map((m) => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
              </select>
            </div>
          )}
          <button className="btn btn-primary" onClick={applyFilters} style={{ height: 42 }}>
            <Target size={16} /> تطبيق التحليل
          </button>
          {isFiltered && (
            <button className="btn btn-outline" onClick={resetFilters} style={{ height: 42 }}>
              <RotateCcw size={15} /> إعادة تعيين
            </button>
          )}
        </div>
        {isFiltered && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} />
            التحليل مفلتر · {applied.dateFrom && applied.dateTo ? `${applied.dateFrom} → ${applied.dateTo}` : applied.dateFrom || applied.dateTo || ''}
            {applied.governorateId && ` · ${governorates.find(g => String(g.id) === applied.governorateId)?.nameAr}`}
            {applied.cityId && ` · ${SIDI_BOUZID_MUNICIPALITIES.find(m => String(m.id) === applied.cityId)?.nameAr}`}
          </div>
        )}
      </div>

      {/* ── Critical Alert Banner ── */}
      {(hasCritical || trendUp) && (
        <div style={{
          marginBottom: 20, padding: '14px 20px', borderRadius: 10,
          background: 'rgba(235,87,87,0.08)', border: '1px solid rgba(235,87,87,0.3)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <AlertTriangle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 15 }}>تنبيه أمني — مستوى الخطر مرتفع</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
              {trendUp && `ارتفاع ${d.comparison.accidents.change}% في الحوادث مقارنة بالفترة السابقة. `}
              {hasCritical && `تم رصد شذوذ حاد في ${d.anomalies.filter((a: any) => a.severity === 'critical').length} ولاية.`}
            </div>
          </div>
        </div>
      )}

      {/* ── Forecast Alert ── */}
      {forecastData?.warning && (
        <div style={{
          marginBottom: 20, padding: '12px 18px', borderRadius: 10,
          background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.3)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Activity size={20} color="#f39c12" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#f39c12', fontSize: 14 }}>توقعات الشهر القادم</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{forecastData.warning}</div>
          </div>
        </div>
      )}

      {/* ── Severity Gauge + KPI Cards ── */}
      {(settings.insights.gauge || settings.insights.kpi) && (
      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '280px 1fr', gap: 20, marginBottom: 24 }}>
        {/* Severity Gauge */}
        {settings.insights.gauge && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>مؤشر الخطورة</div>
          <div style={{ position: 'relative', width: 140, height: 80, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: 140, height: 140, borderRadius: '50%',
              background: `conic-gradient(from 180deg at 50% 100%,
                ${severityGaugeColors[0]} 0deg 45deg,
                ${severityGaugeColors[1]} 45deg 90deg,
                ${severityGaugeColors[2]} 90deg 135deg,
                ${severityGaugeColors[3]} 135deg 180deg,
                transparent 180deg
              )`,
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: 100, height: 100, borderRadius: '50%', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: severityGaugeColors[gaugeColorIdx] }}>{gaugeIndex}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: severityGaugeColors[gaugeColorIdx] }}>{gaugeLevel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 10 }}>
            {severityGaugeLabels.map((label, i) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 3, color: gaugeColorIdx === i ? severityGaugeColors[i] : 'var(--text-secondary)', fontWeight: gaugeColorIdx === i ? 700 : 400 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: severityGaugeColors[i] }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        )}

        {/* KPI Cards */}
        {settings.insights.kpi && d?.comparison && (
          <div className="kpi-grid" style={{ marginBottom: 0 }}>
            {[
              { label: 'الحوادث', key: 'accidents', icon: <AlertTriangle size={20} />, cls: 'danger' },
              { label: 'الوفيات', key: 'deaths', icon: <Shield size={20} />, cls: 'danger' },
              { label: 'الجرحى', key: 'injuries', icon: <Target size={20} />, cls: 'warning' },
            ].map(({ label, key, icon, cls }) => {
              const m = d.comparison[key];
              return (
                <div key={key} className="kpi-card">
                  <div className={`kpi-icon ${cls}`}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="kpi-value" style={{ fontSize: 22 }}>{m.current.toLocaleString('ar-TN')}</div>
                    <div className="kpi-label">{label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <ChangeTag change={m.change} diff={m.current - m.previous} />
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        vs {m.previous.toLocaleString('ar-TN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0f2f5', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'overview' as const, label: 'نظرة عامة', icon: <BarChart3 size={14} /> },
          { key: 'heatmap' as const, label: 'خريطة حرارية', icon: <Activity size={14} /> },
          { key: 'brands' as const, label: 'الماركات', icon: <Car size={14} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? '#fff' : 'transparent',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontWeight: activeTab === tab.key ? 600 : 400, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <>
          {/* Anomalies + Time Slots */}
          {(settings.insights.anomalies || settings.insights.timeSlots) && (
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {settings.insights.anomalies && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={17} color="var(--danger)" /> نقاط السوداء
              </h3>
              {(!d?.anomalies || d.anomalies.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <Shield size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />لا توجد بؤر توتر حالياً
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {d.anomalies.map((a: any, i: number) => (
                    <div key={i} style={{
                      padding: '12px 14px', borderRadius: 8,
                      background: typeColors[a.severity], border: `1px solid ${typeBorder[a.severity]}`,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${severityColors[a.severity]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={18} color={severityColors[a.severity]} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{a.governorateName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {a.currentCount} حادث · معدل: {a.averageCount}/شهر
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: severityColors[a.severity] }}>+{a.spikePercent}%</div>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: severityColors[a.severity], color: '#fff', fontWeight: 700 }}>{severityLabels[a.severity]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {settings.insights.timeSlots && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={17} color="var(--primary)" /> توزيع الحوادث حسب الفترة
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(d?.timeSlotAnalysis || []).map((slot: any, i: number) => {
                  const colors = ['var(--danger)', '#e67e22', 'var(--primary)', 'var(--text-secondary)'];
                  return (
                    <div key={slot.slot}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {i === 0 && <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--danger)', color: '#fff', borderRadius: 20, fontWeight: 700 }}>الأعلى</span>}
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{slot.label}</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>{slot.count} (<span style={{ fontSize: 10 }}>{slot.pct}%</span>)</span>
                      </div>
                      <MiniBar pct={slot.pct} color={colors[i]} />
                    </div>
                  );
                })}
               </div>
            </div>
            )}
          </div>
          )}

           {/* Cause Lethality + Weekday */}
           {(settings.insights.causeLethality || settings.insights.weekday) && (
           <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '3fr 2fr', gap: 20, marginBottom: 20 }}>
             {settings.insights.causeLethality && (
             <div className="card">
               <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <AlertTriangle size={17} color="#e67e22" /> الأسباب حسب معدل القتلى
               </h3>
               {(!d?.causeLethality || d.causeLethality.length === 0) ? (
                 <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>لا توجد بيانات كافية</div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                   {d.causeLethality.map((c: any, i: number) => (
                     <div key={c.causeId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                       <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? 'var(--danger)' : '#f0f2f5', color: i === 0 ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                       <div style={{ flex: 1, minWidth: 0 }}>
                         <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.causeName}</div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                           <MiniBar pct={c.deathPct} color={i === 0 ? 'var(--danger)' : '#e67e22'} />
                           <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.count} حادث</span>
                         </div>
                       </div>
                       <div style={{ textAlign: 'left', flexShrink: 0 }}>
                         <div style={{ fontWeight: 800, fontSize: 15, color: c.deaths > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{c.deaths}</div>
                         <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>وفاة</div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
             )}

             {settings.insights.weekday && (
             <div className="card">
               <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Calendar size={17} color="var(--primary)" /> الحوادث حسب اليوم
               </h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                 {(d?.weekdayAnalysis || []).map((day: any, i: number) => {
                   const isMax = d.weekdayAnalysis.reduce((m: any, x: any) => x.count > m.count ? x : m, d.weekdayAnalysis[0])?.day === day.day;
                   return (
                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <span style={{ fontSize: 12, width: 60, flexShrink: 0, fontWeight: isMax ? 700 : 400, color: isMax ? 'var(--danger)' : undefined }}>{day.day}</span>
                       <MiniBar pct={day.pct} color={isMax ? 'var(--danger)' : 'var(--primary)'} />
                       <span style={{ fontSize: 12, fontWeight: 600, width: 28, textAlign: 'left', flexShrink: 0, color: isMax ? 'var(--danger)' : undefined }}>{day.count}</span>
                     </div>
                   );
                 })}
                </div>
             </div>
             )}
           </div>
           )}

          {/* 6-month Trend */}
          {settings.insights.monthlyTrend && d?.monthlyTrend && (
            <div className="chart-card" style={{ marginBottom: 20 }}>
              <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={17} color="var(--primary)" /> اتجاه الحوادث — آخر 6 أشهر
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={d.monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: 'var(--shadow-lg)', direction: 'rtl', fontFamily: 'inherit' }} formatter={(val: any, name: any) => [val, name === 'count' ? 'حوادث' : 'وفيات']} />
                  <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} name="count" />
                  <Line type="monotone" dataKey="deaths" stroke="var(--danger)" strokeWidth={2} dot={{ r: 3, fill: 'var(--danger)' }} strokeDasharray="4 2" name="deaths" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 20, height: 3, background: 'var(--primary)', borderRadius: 2 }} />حوادث</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ display: 'inline-block', width: 20, height: 3, background: 'var(--danger)', borderRadius: 2 }} />وفيات</span>
              </div>
            </div>
          )}

          {/* Top Routes */}
          {settings.insights.topRoutes && d?.topRoutes && d.topRoutes.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Route size={17} color="var(--danger)" /> أخطر الطرق
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {d.topRoutes.map((r: any, i: number) => (
                  <div key={i} style={{
                    padding: '12px 14px', borderRadius: 8, background: i === 0 ? '#fff5f5' : '#f8f9fb',
                    border: `1px solid ${i === 0 ? 'rgba(235,87,87,0.2)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: i === 0 ? 'var(--danger)' : i < 3 ? '#e67e22' : 'var(--primary)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.route}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {r.count} حادث · {r.deaths} وفاة · {r.injuries} جريح
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Tab: Heatmap ── */}
      {activeTab === 'heatmap' && settings.insights.heatmap && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={17} color="var(--primary)" /> خريطة حرارية — اليوم × الساعة
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 3 }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>اليوم</th>
                  {Object.entries(slotLabels).map(([key, label]) => (
                    <th key={key} style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                  const dayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayIdx];
                  const dayData = heatmapData.filter((h: any) => h.dayIndex === dayIdx);
                  return (
                    <tr key={dayIdx}>
                      <td style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{dayName}</td>
                      {['night', 'morning', 'afternoon', 'evening'].map((slot) => {
                        const cell = dayData.find((h: any) => h.slot === slot);
                        const count = cell?.count || 0;
                        return (
                          <td key={slot} style={{ padding: 0 }}>
                            <div style={{
                              padding: '10px 8px', borderRadius: 6, textAlign: 'center',
                              background: getHeatColor(count, heatmapMax),
                              color: count > heatmapMax * 0.6 ? '#fff' : 'var(--text-primary)',
                              fontWeight: count > 0 ? 700 : 400, fontSize: 13,
                              transition: 'all 0.2s',
                            }}>
                              {count}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>أقل</span>
            {heatmapColors.map((c, i) => (
              <div key={i} style={{ width: 20, height: 14, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>أكثر</span>
          </div>
        </div>
      )}

      {/* ── Tab: Brands ── */}
      {activeTab === 'brands' && settings.insights.brands && (
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Car size={17} color="var(--danger)" /> الماركات حسب مؤشر الخطورة
            </h3>
            {(!d?.brandSeverity || d.brandSeverity.length === 0) ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>لا توجد بيانات</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={d.brandSeverity} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
                  <YAxis dataKey="brandName" type="category" width={120} orientation="right" interval={0} tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl' }} formatter={(val: any) => [val, 'مؤشر الخطورة']} />
                  <Bar dataKey="severityScore" name="مؤشر الخطورة" radius={[4, 0, 0, 4]}>
                    {d.brandSeverity.map((_: any, i: number) => (
                      <Cell key={i} fill={i === 0 ? 'var(--danger)' : i < 3 ? '#e67e22' : 'var(--primary)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Car size={17} color="var(--primary)" /> تفاصيل الماركات
            </h3>
            {(!d?.brandSeverity || d.brandSeverity.length === 0) ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>لا توجد بيانات</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.brandSeverity.map((b: any, i: number) => (
                  <div key={b.brandId} style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: i === 0 ? '#fff5f5' : '#f8f9fb',
                    border: `1px solid ${i === 0 ? 'rgba(235,87,87,0.2)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: i === 0 ? 'var(--danger)' : i < 3 ? '#e67e22' : 'var(--primary)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{b.brandName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {b.count} حادث · {b.deaths} وفاة · {b.injuries} جريح
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{b.severityScore.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>مؤشر</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Recommendations ── */}
      {settings.insights.recommendations && d?.recommendations && d.recommendations.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={17} color="var(--accent)" /> التوصيات ذات الأولوية
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {d.recommendations.map((r: any, i: number) => {
              const isExpanded = expandedRec === i;
              const isEditing = editingRec === i;
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 12,
                    background: typeColors[r.type] || '#f8f9fb',
                    border: `1px solid ${typeBorder[r.type] || 'var(--border)'}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isExpanded ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Header - always visible */}
                  <div
                    onClick={() => { if (!isEditing) setExpandedRec(isExpanded ? null : i); }}
                    style={{
                      display: 'flex', gap: 14, padding: '16px 18px',
                      alignItems: 'center', cursor: isEditing ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: severityColors[r.type] || 'var(--primary)',
                      color: '#fff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 15, fontWeight: 800,
                      boxShadow: `0 2px 8px ${severityColors[r.type] || 'var(--primary)'}40`,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      {isEditing ? (
                        <input
                          value={recTitle}
                          onChange={(e) => setRecTitle(e.target.value)}
                          style={{
                            width: '100%', border: '1px solid var(--primary)', borderRadius: 6,
                            padding: '6px 10px', fontSize: 14, fontWeight: 700,
                            background: '#fff', outline: 'none', fontFamily: 'inherit',
                          }}
                          autoFocus
                        />
                      ) : (
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      background: severityColors[r.type] || 'var(--primary)',
                      color: '#fff', flexShrink: 0,
                    }}>{severityLabels[r.type] || r.type}</span>
                    <ChevronLeft size={18} color="var(--text-secondary)" style={{ flexShrink: 0, transition: 'transform 0.3s', transform: isExpanded ? 'rotate(90deg)' : undefined }} />
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{
                      padding: '0 18px 16px 18px',
                      animation: 'slideDown 0.3s ease',
                    }}>
                      <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
                      {isEditing ? (
                        <textarea
                          value={recText}
                          onChange={(e) => setRecText(e.target.value)}
                          rows={4}
                          style={{
                            width: '100%', border: '1px solid var(--primary)', borderRadius: 8,
                            padding: '10px 12px', fontSize: 13, lineHeight: 1.7,
                            background: '#fff', outline: 'none', resize: 'vertical',
                            fontFamily: 'inherit', color: 'var(--text-primary)',
                          }}
                          autoFocus
                        />
                      ) : (
                        <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                          {r.detail}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-outline"
                              onClick={() => {
                                d.recommendations[i].title = recTitle;
                                d.recommendations[i].detail = recText;
                                setData({ ...d });
                                setEditingRec(null);
                              }}
                              style={{ fontSize: 12, padding: '6px 14px' }}
                            >
                              ✓ حفظ
                            </button>
                            <button
                              className="btn btn-outline"
                              onClick={() => setEditingRec(null)}
                              style={{ fontSize: 12, padding: '6px 14px' }}
                            >
                              ✕ إلغاء
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-outline"
                            onClick={() => {
                              setEditingRec(i);
                              setRecText(r.detail);
                              setRecTitle(r.title);
                            }}
                            style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            ✏️ تعديل
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
