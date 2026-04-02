import { useEffect, useState, useCallback } from 'react';
import { getIntelligence, getGovernorates } from '../api/services';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Clock,
  Calendar, MapPin, Target, Zap, ChevronLeft, RotateCcw,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── helpers ──────────────────────────────────────────────────────────────────

const TrendIcon = ({ change }: { change: number | null }) => {
  if (change === null) return <Minus size={16} color="var(--text-secondary)" />;
  if (change > 0) return <TrendingUp size={16} color="var(--danger)" />;
  if (change < 0) return <TrendingDown size={16} color="var(--success)" />;
  return <Minus size={16} color="var(--text-secondary)" />;
};

const ChangeTag = ({ change }: { change: number | null }) => {
  if (change === null) return <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>لا مقارنة</span>;
  const color = change > 0 ? 'var(--danger)' : change < 0 ? 'var(--success)' : 'var(--text-secondary)';
  const sign = change > 0 ? '+' : '';
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 4 }}>
      <TrendIcon change={change} />
      {sign}{change}%
    </span>
  );
};

const MiniBar = ({ pct, color = 'var(--primary)' }: { pct: number; color?: string }) => (
  <div style={{ flex: 1, height: 8, background: '#f0f2f5', borderRadius: 4, overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
  </div>
);

const severityColors: Record<string, string> = {
  critical: 'var(--danger)',
  high: '#e67e22',
  medium: '#f39c12',
};
const severityLabels: Record<string, string> = {
  critical: 'خطر بالغ',
  high: 'مرتفع',
  medium: 'متوسط',
};
const typeColors: Record<string, string> = {
  critical: '#fff5f5',
  high: '#fff8f0',
  medium: '#fffbf0',
};
const typeBorder: Record<string, string> = {
  critical: 'rgba(235,87,87,0.3)',
  high: 'rgba(230,126,34,0.3)',
  medium: 'rgba(243,156,18,0.3)',
};

// ── component ─────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [govFilter, setGovFilter] = useState('');
  const [applied, setApplied] = useState<{ dateFrom: string; dateTo: string; governorateId: string }>({ dateFrom: '', dateTo: '', governorateId: '' });

  useEffect(() => {
    getGovernorates().then(setGovernorates).catch(() => {});
  }, []);

  const load = useCallback(async (filters: typeof applied) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.governorateId) params.governorateId = filters.governorateId;
      setData(await getIntelligence(params));
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(applied); }, [load, applied]);

  const applyFilters = () => setApplied({ dateFrom, dateTo, governorateId: govFilter });
  const resetFilters = () => { setDateFrom(''); setDateTo(''); setGovFilter(''); setApplied({ dateFrom: '', dateTo: '', governorateId: '' }); };
  const isFiltered = applied.dateFrom || applied.dateTo || applied.governorateId;

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />;

  const d = data;
  const hasCritical = d?.anomalies?.some((a: any) => a.severity === 'critical');
  const trendUp = d?.comparison?.accidents?.change > 20;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الاستخبارات الأمنية</h1>
          <p className="page-subtitle">
            {d?.period?.label} · تحليل {d?.totalAnalyzed?.toLocaleString('ar-TN') || 0} حادث مسجّل
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label className="form-label" style={{ fontSize: 12 }}>من تاريخ</label>
            <input type="date" className="form-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label className="form-label" style={{ fontSize: 12 }}>إلى تاريخ</label>
            <input type="date" className="form-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 2, minWidth: 180 }}>
            <label className="form-label" style={{ fontSize: 12 }}>الولاية</label>
            <select className="form-select" value={govFilter} onChange={(e) => setGovFilter(e.target.value)}>
              <option value="">كل الولايات</option>
              {governorates.map((g: any) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
            </select>
          </div>
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

      {/* ── Comparison KPI Cards ── */}
      {d?.comparison && (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'الحوادث — الفترة الحالية', key: 'accidents', icon: <AlertTriangle size={22} />, cls: 'danger' },
            { label: 'الوفيات — الفترة الحالية', key: 'deaths', icon: <Shield size={22} />, cls: 'danger' },
            { label: 'الإصابات — الفترة الحالية', key: 'injuries', icon: <TrendingUp size={22} />, cls: 'warning' },
            { label: 'معدل الفتك (وفاة/حادث)', key: 'lethalityRate', icon: <Target size={22} />, cls: 'primary' },
          ].map(({ label, key, icon, cls }) => {
            const m = d.comparison[key];
            return (
              <div key={key} className="kpi-card">
                <div className={`kpi-icon ${cls}`}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="kpi-value">{typeof m.current === 'number' && key === 'lethalityRate' ? m.current.toFixed(2) : m.current.toLocaleString('ar-TN')}</div>
                  <div className="kpi-label">{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <ChangeTag change={m.change} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      vs {typeof m.previous === 'number' && key === 'lethalityRate' ? m.previous.toFixed(2) : m.previous.toLocaleString('ar-TN')} سابق
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Row: Anomalies + Time Slots ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Anomalies */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={17} color="var(--danger)" /> شذوذ الولايات
          </h3>
          {(!d?.anomalies || d.anomalies.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              <Shield size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />لا توجد شذوذات مسجّلة
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
                  <div style={{ flex: 1 }}>
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

        {/* Time Slots */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={17} color="var(--primary)" /> توزيع الحوادث حسب الفترة الزمنية
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
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ fontWeight: 700 }}>{slot.count} حادث ({slot.pct}%)</span>
                      {slot.deaths > 0 && <span style={{ color: 'var(--danger)' }}>{slot.deaths} وفاة</span>}
                    </div>
                  </div>
                  <MiniBar pct={slot.pct} color={colors[i]} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row: Cause Lethality + Weekday ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>

        {/* Cause lethality */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={17} color="#e67e22" /> تصنيف الأسباب حسب معدل الفتك
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

        {/* Weekday */}
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
      </div>

      {/* ── 6-month Trend ── */}
      {d?.monthlyTrend && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={17} color="var(--primary)" /> اتجاه الحوادث — آخر 6 أشهر
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={d.monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: 'var(--shadow-lg)', direction: 'rtl', fontFamily: 'inherit' }}
                formatter={(val: any, name: any) => [val, name === 'count' ? 'حوادث' : 'وفيات']}
              />
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

      {/* ── Priority Recommendations ── */}
      {d?.recommendations && d.recommendations.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={17} color="var(--accent)" /> التوصيات ذات الأولوية
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {d.recommendations.map((r: any, i: number) => (
              <div key={i} style={{
                display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 10,
                background: typeColors[r.type] || '#f8f9fb',
                border: `1px solid ${typeBorder[r.type] || 'var(--border)'}`,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: severityColors[r.type] || 'var(--primary)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, fontWeight: 800,
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.detail}</div>
                </div>
                <ChevronLeft size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
