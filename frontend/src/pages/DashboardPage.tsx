import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Car, Skull, AlertTriangle, TrendingUp, Plus, MapPin, Clock, ChevronRight, Calendar } from 'lucide-react';
import { getAnalyticsSummary, getAnalyticsByCause, getAnalyticsByMonth, getAccidents } from '../api/services';

const COLORS = ['#1a5276','#e67e22','#27ae60','#e74c3c','#8e44ad','#2980b9','#d35400','#16a085'];

function TodayAccidentsBanner() {
  const [todayAccidents, setTodayAccidents] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    getAccidents({ page: 1, limit: 50, sortBy: 'accidentDate', sortOrder: 'desc', dateFrom: today, dateTo: today })
      .then((res: any) => setTodayAccidents(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (todayAccidents.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % todayAccidents.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [todayAccidents.length]);

  if (todayAccidents.length === 0) {
    return (
      <div className="today-banner today-banner-empty">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', padding: '20px 0' }}>
          <div className="today-empty-icon">
            <Calendar size={28} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>لا توجد حوادث اليوم</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>يوم هادئ — {todayFormatted}</div>
          </div>
        </div>
      </div>
    );
  }

  const accident = todayAccidents[currentIndex];
  const totalDeaths = todayAccidents.reduce((s: number, a: any) => s + (a.deathsCount || 0), 0);
  const totalInjuries = todayAccidents.reduce((s: number, a: any) => s + (a.injuriesCount || 0), 0);
  const severity = accident.deathsCount > 0 ? 'danger' : accident.injuriesCount > 2 ? 'warning' : 'info';
  const severityColors = { danger: '#e74c3c', warning: '#e67e22', info: '#2980b9' };
  const severityBg = { danger: 'rgba(231,76,60,0.08)', warning: 'rgba(230,126,34,0.08)', info: 'rgba(41,128,185,0.08)' };
  const severityBorder = { danger: 'rgba(231,76,60,0.25)', warning: 'rgba(230,126,34,0.25)', info: 'rgba(41,128,185,0.25)' };

  return (
    <div className="today-banner" style={{ background: severityBg[severity], borderColor: severityBorder[severity] }}>
      {/* Header with stats */}
      <div className="today-banner-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="today-header-dot" style={{ background: severityColors[severity] }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>حوادث اليوم</span>
          <span className="today-badge" style={{ background: severityColors[severity] }}>{todayAccidents.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="today-stat">
            <span className="today-stat-value danger">{totalDeaths}</span>
            <span className="today-stat-label">وفيات</span>
          </div>
          <div className="today-stat">
            <span className="today-stat-value warning">{totalInjuries}</span>
            <span className="today-stat-label">جرحى</span>
          </div>
        </div>
      </div>

      {/* Sliding content */}
      <div
        className="today-banner-content"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="today-accident-card">
          <div className="today-accident-severity" style={{ background: severityColors[severity] }}>
            {accident.deathsCount > 0 ? <Skull size={22} /> : <AlertTriangle size={22} />}
          </div>
          <div className="today-accident-info">
            <div className="today-accident-route">{accident.route || '—'}</div>
            <div className="today-accident-details">
              <span className="today-detail"><MapPin size={13} /> {accident.governorate?.nameAr || '—'}{accident.city?.nameAr ? ` — ${accident.city.nameAr}` : ''}</span>
              {accident.accidentTime && <span className="today-detail"><Clock size={13} /> {accident.accidentTime}</span>}
              <span className="today-detail">وفيات: <strong style={{ color: '#e74c3c' }}>{accident.deathsCount}</strong></span>
              <span className="today-detail">جرحى: <strong style={{ color: '#e67e22' }}>{accident.injuriesCount}</strong></span>
            </div>
          </div>
          <Link to={`/accidents/${accident.id}`} className="today-view-link" title="عرض التفاصيل">
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Progress dots */}
      {todayAccidents.length > 1 && (
        <div className="today-dots">
          {todayAccidents.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(i);
                  setIsTransitioning(false);
                }, 500);
              }}
              className={`today-dot ${i === currentIndex ? 'active' : ''}`}
              style={{
                width: i === currentIndex ? 28 : 8,
                background: i === currentIndex ? severityColors[severity] : 'rgba(0,0,0,0.12)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [byCause, setByCause] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const yearFilter = { dateFrom: `${currentYear}-01-01`, dateTo: `${currentYear}-12-31` };

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(yearFilter),
      getAnalyticsByCause(yearFilter),
      getAnalyticsByMonth(yearFilter),
      getAccidents({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc', ...yearFilter }),
    ]).then(([s, c, t, a]) => {
      setSummary(s);
      setByCause(c.slice(0, 6));
      setTrends(t);
      setRecent(a.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة القيادة</h1>
          <p className="page-subtitle">نظرة عامة على حوادث المرور</p>
        </div>
        <Link to="/accidents/new" className="btn btn-primary">
          <Plus size={18} /> تسجيل حادث جديد
        </Link>
      </div>

      <TodayAccidentsBanner />

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon primary"><Car size={24} /></div>
          <div>
            <div className="kpi-value">{summary?.totalAccidents || 0}</div>
            <div className="kpi-label">إجمالي الحوادث</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon danger"><Skull size={24} /></div>
          <div>
            <div className="kpi-value">{summary?.totalDeaths || 0}</div>
            <div className="kpi-label">إجمالي الوفيات</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon warning"><AlertTriangle size={24} /></div>
          <div>
            <div className="kpi-value">{summary?.totalInjuries || 0}</div>
            <div className="kpi-label">إجمالي الجرحى</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon success"><TrendingUp size={24} /></div>
          <div>
            <div className="kpi-value">{summary?.monthlyAccidents ?? 0}</div>
            <div className="kpi-label">حوادث هذا الشهر</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">توزيع الحوادث حسب السبب</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={byCause}
                dataKey="count"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={3}
              >
                {byCause.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [value + ' حادث', name]}
                contentStyle={{ direction: 'rtl', fontFamily: 'inherit', fontSize: 13 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Clean legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, maxHeight: 150, overflowY: 'auto' }}>
            {byCause.map((item, i) => {
              const total = byCause.reduce((s, d) => s + d.count, 0);
              const pct = total ? ((item.count / total) * 100).toFixed(0) : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>{item.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">اتجاه الحوادث الشهري</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trends} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ direction: 'rtl', fontFamily: 'inherit', fontSize: 13 }} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              <Bar dataKey="accidents" fill="#1a5276" name="الحوادث" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deaths" fill="#e74c3c" name="الوفيات" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">آخر الحوادث المسجلة</h3>
          <Link to="/accidents" className="btn btn-outline btn-sm">عرض الكل</Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الولاية</th>
                <th>الطريق</th>
                <th>السبب</th>
                <th>وفيات</th>
                <th>جرحى</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((a: any) => (
                <tr key={a.id}>
                  <td>{new Date(a.accidentDate).toLocaleDateString('ar-TN')}</td>
                  <td>{a.governorate?.nameAr || '—'}</td>
                  <td>{a.route || '—'}</td>
                  <td><span className="tag">{a.cause?.nameAr || '—'}</span></td>
                  <td><span className={`badge ${a.deathsCount > 0 ? 'badge-danger' : 'badge-success'}`}>{a.deathsCount}</span></td>
                  <td><span className={`badge ${a.injuriesCount > 0 ? 'badge-warning' : 'badge-success'}`}>{a.injuriesCount}</span></td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>لا توجد بيانات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
