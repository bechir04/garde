import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  getAnalyticsByGovernorate, getAnalyticsByCause,
  getAnalyticsByBrand, getAnalyticsByHour, getAnalyticsByMonth,
  getAnalyticsByCity, getGovernorates, getIntelligence, getBrands,
} from '../api/services';
import type { AnalyticsFilters } from '../api/services';
import { ArrowLeft, Filter, Calendar, MapPin, Building2, RotateCcw, TrendingDown, BarChart3 } from 'lucide-react';
import { SIDI_BOUZID_MUNICIPALITIES } from '../constants/municipalities';

const COLORS = ['#1a5276','#e67e22','#27ae60','#e74c3c','#8e44ad','#2980b9','#d35400','#16a085','#c0392b','#2c3e50'];

const chartConfig: Record<string, { title: string; api: string; color: string }> = {
  governorate: { title: 'الحوادث حسب الولاية', api: 'governorate', color: '#1a5276' },
  cause: { title: 'توزيع الأسباب', api: 'cause', color: '#e67e22' },
  brand: { title: 'حسب الصنف', api: 'brand', color: '#27ae60' },
  hour: { title: 'توزيع الحوادث حسب ساعة اليوم', api: 'hour', color: '#8e44ad' },
  month: { title: 'الاتجاه الشهري', api: 'month', color: '#2980b9' },
  city: { title: 'الحوادث حسب المعتمدية', api: 'city', color: '#16a085' },
};

export default function ChartDetailPage() {
  const { chartType } = useParams<{ chartType: string }>();
  const navigate = useNavigate();
  const config = chartConfig[chartType || ''];
  if (!config) return <div style={{ padding: 40, textAlign: 'center' }}>الرسم غير موجود</div>;

  const [governorates, setGovernorates] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [showFilters, setShowFilters] = useState(true);
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [dateMode, setDateMode] = useState<'range' | 'comparison'>('range');
  const [comparison, setComparison] = useState<any>(null);
  const [causePage, setCausePage] = useState(1);
  const [compareDate, setCompareDate] = useState('');
  const [compareData, setCompareData] = useState<any[]>([]);
  const CAUSE_PER_PAGE = 10;

  const showMunicipalityDropdown = filters.governorateId === '18';
  const isHourPage = config.api === 'hour';
  const isBrandPage = config.api === 'brand';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let result: any[];
      switch (config.api) {
        case 'governorate': result = await getAnalyticsByGovernorate(filters); break;
        case 'cause': result = await getAnalyticsByCause(filters); break;
        case 'brand': result = await getAnalyticsByBrand(filters); break;
        case 'hour': result = await getAnalyticsByHour(filters); break;
        case 'month': result = await getAnalyticsByMonth(filters); break;
        case 'city': result = await getAnalyticsByCity({ ...filters, governorateId: filters.governorateId || '18' }); break;
        default: result = [];
      }
      setData(result);

      if (dateMode === 'comparison' && filters.dateFrom && filters.dateTo) {
        const intel = await getIntelligence({ dateFrom: filters.dateFrom, dateTo: filters.dateTo, governorateId: filters.governorateId ? Number(filters.governorateId) : undefined, cityId: filters.cityId ? Number(filters.cityId) : undefined });
        setComparison(intel);
      } else {
        setComparison(null);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, config.api, dateMode]);

  useEffect(() => {
    getGovernorates().then(setGovernorates);
    getBrands().then(setBrands);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCausePage(1);
  }, [filters]);

  useEffect(() => {
    if (isHourPage && compareDate) {
      getAnalyticsByHour({ ...filters, dateFrom: compareDate, dateTo: compareDate })
        .then((r) => setCompareData(r))
        .catch(() => setCompareData([]));
    } else {
      setCompareData([]);
    }
  }, [compareDate, filters, isHourPage]);

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
    setCausePage(1);
    setCompareDate('');
    setCompareData([]);
  };

  const handleBrandChange = (brandId: string) => {
    setFilters((prev) => ({ ...prev, brandId: brandId || undefined }));
  };

  const hasActiveFilters = !!(filters.dateFrom || filters.dateTo || filters.governorateId || filters.cityId);

  const renderChart = () => {
    const isPie = config.api === 'cause';
    const isLine = config.api === 'month';
    const isHorizontal = config.api === 'governorate' || config.api === 'city';
    const isHour = config.api === 'hour';

    if (isPie) {
      const totalPages = Math.ceil(data.length / CAUSE_PER_PAGE);
      const startIdx = (causePage - 1) * CAUSE_PER_PAGE;
      const pageData = data.slice(startIdx, startIdx + CAUSE_PER_PAGE);

      return (
        <>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 320px' }}>
              <ResponsiveContainer width={320} height={320}>
                <PieChart>
                  <Pie data={pageData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={50} paddingAngle={2}>
                    {pageData.map((_, i) => <Cell key={i} fill={COLORS[(startIdx + i) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [value + ' حادث', name]} contentStyle={{ direction: 'rtl', fontFamily: 'inherit', fontSize: 13, borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f0f2f5', borderRadius: '8px 8px 0 0', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                <span style={{ flex: 1 }}>السبب</span>
                <span style={{ width: 50, textAlign: 'center' }}>حوادث</span>
                <span style={{ width: 50, textAlign: 'center' }}>وفيات</span>
                <span style={{ width: 50, textAlign: 'center' }}>جرحى</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pageData.map((item, i) => (
                  <div key={startIdx + i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: i % 2 === 0 ? '#fff' : '#fafbfc', borderRadius: 0, borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ width: 4, height: 24, borderRadius: 2, background: COLORS[(startIdx + i) % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
                    <span style={{ width: 50, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{item.count}</span>
                    <span style={{ width: 50, textAlign: 'center', fontSize: 13, fontWeight: 600, color: item.deaths > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{item.deaths || '—'}</span>
                    <span style={{ width: 50, textAlign: 'center', fontSize: 13, fontWeight: 600, color: item.injuries > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>{item.injuries || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <button className="btn btn-outline" disabled={causePage === 1} onClick={() => setCausePage(p => p - 1)} style={{ padding: '6px 12px', fontSize: 13 }}>السابق</button>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 60, textAlign: 'center' }}>{causePage} / {totalPages}</span>
              <button className="btn btn-outline" disabled={causePage === totalPages} onClick={() => setCausePage(p => p + 1)} style={{ padding: '6px 12px', fontSize: 13 }}>التالي</button>
            </div>
          )}
        </>
      );
    }

    if (isLine) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
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
      );
    }

    if (isHorizontal) {
      return (
        <ResponsiveContainer width="100%" height={Math.max(400, data.length * 40)}>
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
            <YAxis dataKey="name" type="category" width={160} orientation="right" interval={0} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-lg)', direction: 'rtl', fontFamily: 'inherit' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="count" fill={config.color} radius={[4, 0, 0, 4]} name="عدد الحوادث" barSize={18} />
            <Bar dataKey="deaths" fill="#e74c3c" radius={[4, 0, 0, 4]} name="الوفيات" barSize={18} />
            <Bar dataKey="injuries" fill="#f39c12" radius={[4, 0, 0, 4]} name="الجرحى" barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (isHour) {
      const merged = data.map((d, i) => ({
        ...d,
        compareCount: compareData[i]?.count || 0,
      }));
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={merged} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl' }} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="count" fill="#27ae60" radius={[4, 4, 0, 0]} name="حوادث" barSize={18} />
            {compareDate && <Bar dataKey="compareCount" fill="#95a5a6" radius={[4, 4, 0, 0]} name={`مقارنة (${compareDate})`} barSize={18} />}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={{ stroke: '#eee' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl' }} />
          <Bar dataKey="count" fill={config.color} radius={[4, 4, 0, 0]} name="عدد الحوادث" barSize={26} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-title">{config.title}</h1>
            <p className="page-subtitle">عرض تفصيلي مع إمكانية الفلترة</p>
          </div>
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

          {isHourPage && (
            <div className="form-group" style={{ flex: '1 1 220px', marginBottom: 16 }}>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>
                <Calendar size={12} style={{ display: 'inline', marginLeft: 4 }} />
                مقارنة مع يوم محدد
              </label>
              <input
                type="date"
                className="form-input"
                value={compareDate}
                onChange={(e) => setCompareDate(e.target.value)}
                style={{ fontSize: 13, padding: '8px 12px' }}
              />
            </div>
          )}

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
                  <option value="">جميع المعتمديات</option>
                  {SIDI_BOUZID_MUNICIPALITIES.map((m) => (
                    <option key={m.id} value={m.id}>{m.nameAr}</option>
                  ))}
                </select>
              </div>
            )}

            {isBrandPage && (
              <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>
                  <MapPin size={12} style={{ display: 'inline', marginLeft: 4 }} />
                  الطرف
                </label>
                <select
                  className="form-input"
                  value={filters.brandId || ''}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px' }}
                >
                  <option value="">جميع الاطراف</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.nameAr}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
          جاري تحديث البيانات...
        </div>
      )}

      {dateMode === 'comparison' && comparison && (
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #f8f9fb 0%, #eef2f7 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--primary)" /> مقارنة بين الفترتين
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span>الحالية: {comparison.period?.start} ← {comparison.period?.end}</span>
              <span>السابقة: {comparison.period?.prevStart} ← {comparison.period?.prevEnd}</span>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'الحوادث', key: 'accidents', icon: '🚗' },
              { label: 'الوفيات', key: 'deaths', icon: '💀' },
              { label: 'الجرحى', key: 'injuries', icon: '🚑' },
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

      <div className="card" style={{ marginBottom: 24 }}>
        {data.length === 0 && !loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
            <TrendingDown size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 15, margin: 0 }}>لا توجد بيانات للعرض</p>
            <p style={{ fontSize: 13, margin: '4px 0 0', opacity: 0.7 }}>جرّب تغيير الفلاتر لعرض نتائج</p>
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
}
