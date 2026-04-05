import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  getAnalyticsSummary, getAnalyticsByGovernorate, getAnalyticsByCause,
  getAnalyticsByBrand, getAnalyticsByHour, getAnalyticsByMonth,
  getAnalyticsByCity, getIntelligence,
  getGovernorates,
} from '../api/services';
import type { AnalyticsFilters } from '../api/services';
import { Filter, Calendar, MapPin, Building2, RotateCcw, TrendingDown, Map, BarChart3, Eye } from 'lucide-react';
import { SIDI_BOUZID_MUNICIPALITIES } from '../constants/municipalities';
import { useDisplaySettings } from '../contexts/DisplaySettingsContext';

const COLORS = ['#1a5276','#e67e22','#27ae60','#e74c3c','#8e44ad','#2980b9','#d35400','#16a085','#c0392b','#2c3e50'];

export default function StatisticsPage() {
  const navigate = useNavigate();
  const { settings } = useDisplaySettings();
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [byGov, setByGov] = useState<any[]>([]);
  const [byCause, setByCause] = useState<any[]>([]);
  const [byBrand, setByBrand] = useState<any[]>([]);
  const [byTime, setByTime] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [byCity, setByCity] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [dateMode, setDateMode] = useState<'range' | 'comparison'>('range');

  const showMunicipalityDropdown = filters.governorateId === '18';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, g, c, b, t, tr] = await Promise.all([
        getAnalyticsSummary(appliedFilters),
        getAnalyticsByGovernorate(appliedFilters),
        getAnalyticsByCause(appliedFilters),
        getAnalyticsByBrand(appliedFilters),
        getAnalyticsByHour(appliedFilters),
        getAnalyticsByMonth(appliedFilters),
      ]);
      setSummary(s);
      setByGov(g.slice(0, 10));
      setByCause(c.slice(0, 8));
      setByBrand(b.slice(0, 8));
      setByTime(t);
      setTrends(tr);

      if (appliedFilters.governorateId === '18') {
        const cityData = await getAnalyticsByCity({ ...appliedFilters, governorateId: '18' });
        setByCity(cityData);
      } else {
        setByCity([]);
      }

      if (appliedFilters.dateFrom && appliedFilters.dateTo) {
        const intel = await getIntelligence({ dateFrom: appliedFilters.dateFrom, dateTo: appliedFilters.dateTo, governorateId: appliedFilters.governorateId ? Number(appliedFilters.governorateId) : undefined, cityId: appliedFilters.cityId ? Number(appliedFilters.cityId) : undefined });
        setComparison(intel);
      } else {
        setComparison(null);
      }
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    getGovernorates().then(setGovernorates);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const handleGovernorateChange = (govId: string) => {
    setFilters((prev) => ({ ...prev, governorateId: govId || undefined, cityId: undefined }));
    setSelectedMunicipality('');
  };

  const handleMunicipalityChange = (cityId: string) => {
    setSelectedMunicipality(cityId);
    setFilters((prev) => ({ ...prev, cityId: cityId || undefined }));
  };

  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedMunicipality('');
    setDateMode('range');
    setComparison(null);
    setAppliedFilters({});
  };

  const hasActiveFilters = !!(filters.dateFrom || filters.dateTo || filters.governorateId || filters.cityId);

  if (loading && !summary) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">الإحصائيات والتحليلات</h1>
          <p className="page-subtitle">تحليل شامل لبيانات حوادث المرور</p>
        </div>
        <button
          className={`btn ${hasActiveFilters ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} /> {showFilters ? 'إخفاء الفلاتر' : 'تصفية البيانات'}
          {hasActiveFilters && <span style={{
            marginRight: 6, background: '#fff', color: 'var(--primary)',
            borderRadius: '50%', width: 20, height: 20, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
          }}>
            {[filters.dateFrom, filters.dateTo, filters.governorateId, filters.cityId].filter(Boolean).length}
          </span>}
        </button>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: 24, background: '#f8f9fb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} /> فلترة البيانات
            </h3>
            <button className="btn btn-outline" onClick={clearFilters} style={{ fontSize: 12, padding: '6px 12px' }}>
              <RotateCcw size={14} /> إعادة تعيين
            </button>
          </div>

          <div className="form-group" style={{ flex: '1 1 220px', marginBottom: 16 }}>
            <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>
              <Calendar size={12} style={{ display: 'inline', marginLeft: 4 }} />
              وضع التاريخ
            </label>
            <select
              className="form-input"
              value={dateMode}
              onChange={(e) => {
                setDateMode(e.target.value as 'range' | 'comparison');
                setFilters((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined }));
                setComparison(null);
              }}
              style={{ fontSize: 13, padding: '8px 12px', background: '#fff', borderColor: 'var(--primary)', borderWidth: 1 }}
            >
              <option value="range">من تاريخ ← إلى تاريخ</option>
              <option value="comparison">مقارنة بين فترتين</option>
            </select>
          </div>

          <div className="form-row" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>
                <Calendar size={12} style={{ display: 'inline', marginLeft: 4 }} />
                {dateMode === 'comparison' ? 'بداية الفترة' : 'من تاريخ'}
              </label>
              <input
                type="date"
                className="form-input"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                style={{ fontSize: 13, padding: '8px 12px' }}
              />
            </div>

            <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>
                <Calendar size={12} style={{ display: 'inline', marginLeft: 4 }} />
                {dateMode === 'comparison' ? 'نهاية الفترة' : 'إلى تاريخ'}
              </label>
              <input
                type="date"
                className="form-input"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                style={{ fontSize: 13, padding: '8px 12px' }}
              />
            </div>

            <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>
                <MapPin size={12} style={{ display: 'inline', marginLeft: 4 }} />
                الولاية
              </label>
              <select
                className="form-input"
                value={filters.governorateId || ''}
                onChange={(e) => handleGovernorateChange(e.target.value)}
                style={{ fontSize: 13, padding: '8px 12px' }}
              >
                <option value="">جميع الولايات</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>{g.nameAr}</option>
                ))}
              </select>
            </div>

            {showMunicipalityDropdown && (
              <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>
                  <Building2 size={12} style={{ display: 'inline', marginLeft: 4 }} />
                  المعتمدية
                </label>
                <select
                  className="form-input"
                  value={selectedMunicipality}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px' }}
                >
                  <option value="">
كل المعتمديات</option>
                  {SIDI_BOUZID_MUNICIPALITIES.map((m) => (
                    <option key={m.id} value={m.id}>{m.nameAr}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={applyFilters} disabled={loading} style={{ fontSize: 13, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} />
              {loading ? 'جاري التحليل...' : 'تطبيق التحليل'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
          جاري تحديث البيانات...
        </div>
      )}

      {settings.stats.kpi && (
        <div className="kpi-grid">
          <StatCard label="إجمالي الحوادث" value={summary?.totalAccidents} color="primary" />
          <StatCard label="إجمالي الوفيات" value={summary?.totalDeaths} color="danger" />
          <StatCard label="إجمالي الجرحى" value={summary?.totalInjuries} color="warning" />
        </div>
      )}

      {dateMode === 'comparison' && comparison && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #f8f9fb 0%, #eef2f7 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--primary)" /> مقارنة بين الفترتين
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {comparison.period?.start} ← {comparison.period?.end}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'الحوادث', key: 'accidents', icon: '🚗' },
              { label: 'الوفيات', key: 'deaths', icon: '💀' },
              { label: 'معدل القتلى', key: 'lethalityRate', icon: '📊' },
            ].map(({ label, key, icon }) => {
              const m = comparison.comparison?.[key];
              if (!m) return null;
              const changeColor = m.change === null ? 'var(--text-secondary)' : m.change > 0 ? 'var(--danger)' : 'var(--success)';
              const changeSign = m.change !== null ? (m.change > 0 ? '+' : '') : '';
              return (
                <div key={key} style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{icon}</span> {label}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{m.current}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>الفترة الحالية</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-secondary)' }}>{m.previous}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>الفترة السابقة</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: changeColor }}>
                    {m.change !== null ? `${changeSign}${m.change}%` : 'لا مقارنة'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {settings.stats.map && (
        <div className="card" style={{ marginBottom: 24, cursor: 'pointer', overflow: 'hidden' }} onClick={() => navigate('/map')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="chart-title" style={{ margin: 0 }}>🗺️ الخريطة التفاعلية — توزيع الحوادث حسب الولاية</div>
            <span style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              عرض الخريطة <Map size={14} />
            </span>
          </div>
          <div style={{
            height: 280, background: 'linear-gradient(135deg, #f0f4f8 0%, #d4e6f1 50%, #a9cce3 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <div style={{ textAlign: 'center' }}>
              <Map size={48} style={{ opacity: 0.4, marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>اضغط لعرض الخريطة التفاعلية</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0', opacity: 0.7 }}>خريطة تونس مع توزيع الحوادث بالألوان</p>
            </div>
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              background: '#fff', borderRadius: 8, padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 11,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>مفتاح الألوان</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {['#f0f4f8','#d4e6f1','#a9cce3','#7fb3d8','#5499c7','#2e86c1','#1a5276','#0b2545'].map((c, i) => (
                  <div key={i} style={{ width: 14, height: 10, background: c, borderRadius: 2, border: '1px solid rgba(0,0,0,0.1)' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        {settings.stats.govBar && (
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="chart-title" style={{ margin: 0 }}>🏛️ الحوادث حسب الولاية (أعلى 10)</div>
              <button className="btn btn-outline" onClick={() => navigate('/statistics/governorate')} style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>
                <Eye size={14} /> عرض التفاصيل
              </button>
            </div>
            {byGov.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={byGov} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={160} orientation="right" interval={0} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-lg)', direction: 'rtl', fontFamily: 'inherit' }} />
                  <Bar dataKey="count" fill="#1a5276" radius={[4, 0, 0, 4]} name="عدد الحوادث" barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {settings.stats.causePie && (
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="chart-title" style={{ margin: 0 }}>⚠️ توزيع الأسباب</div>
              <button className="btn btn-outline" onClick={() => navigate('/statistics/cause')} style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>
                <Eye size={14} /> عرض التفاصيل
              </button>
            </div>
            {byCause.length === 0 ? <EmptyChart /> : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={byCause} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {byCause.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any) => [value + ' حادث', name]} contentStyle={{ direction: 'rtl', fontFamily: 'inherit', fontSize: 13, borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, maxHeight: 150, overflowY: 'auto' }}>
                  {byCause.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {settings.stats.brandBar && (
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="chart-title" style={{ margin: 0 }}>🚗 حسب الصنف</div>
              <button className="btn btn-outline" onClick={() => navigate('/statistics/brand')} style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>
                <Eye size={14} /> عرض التفاصيل
              </button>
            </div>
            {byBrand.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byBrand} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl' }} />
                  <Bar dataKey="count" fill="#e67e22" radius={[4, 4, 0, 0]} name="عدد الحوادث" barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {settings.stats.hourBar && (
          <div className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="chart-title" style={{ margin: 0 }}>🕐 توزيع الحوادث حسب ساعة اليوم</div>
              <button className="btn btn-outline" onClick={() => navigate('/statistics/hour')} style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>
                <Eye size={14} /> عرض التفاصيل
              </button>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byTime} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl' }} />
                <Bar dataKey="count" fill="#27ae60" radius={[4, 4, 0, 0]} name="حوادث" barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {showMunicipalityDropdown && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="chart-title" style={{ margin: 0 }}>🏘️ الحوادث حسب المعتمدية</div>
            <button className="btn btn-outline" onClick={() => navigate('/statistics/city')} style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>
              <Eye size={14} /> عرض التفاصيل
            </button>
          </div>
          {byCity.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={byCity} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
                <YAxis dataKey="name" type="category" width={160} orientation="right" interval={0} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-lg)', direction: 'rtl', fontFamily: 'inherit' }} />
                <Bar dataKey="count" fill="#27ae60" radius={[4, 0, 0, 4]} name="عدد الحوادث" barSize={22} />
                <Bar dataKey="deaths" fill="#e74c3c" radius={[4, 0, 0, 4]} name="الوفيات" barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {settings.stats.trendLine && (
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="chart-title" style={{ margin: 0 }}>📈 الاتجاه الشهري — الحوادث والوفيات والجرحى</div>
            <button className="btn btn-outline" onClick={() => navigate('/statistics/month')} style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>
              <Eye size={14} /> عرض التفاصيل
            </button>
          </div>
          {trends.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl', fontSize: 12 }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="accidents" stroke="#1a5276" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="حوادث" />
                <Line type="monotone" dataKey="deaths" stroke="#e74c3c" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="وفيات" />
                <Line type="monotone" dataKey="injuries" stroke="#f39c12" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="جرحى" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${color}`} style={{ width: 44, height: 44, borderRadius: 10, fontSize: 18 }}>
        {color === 'primary' ? '🚗' : color === 'danger' ? '💀' : color === 'warning' ? '🚑' : '✅'}
      </div>
      <div>
        <div className="kpi-value" style={{ fontSize: 24 }}>{value ?? '—'}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
      <TrendingDown size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
      <p style={{ fontSize: 14, margin: 0 }}>لا توجد بيانات للعرض</p>
      <p style={{ fontSize: 12, margin: '4px 0 0', opacity: 0.7 }}>جرّب تغيير الفلاتر لعرض نتائج</p>
    </div>
  );
}
