import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Car, Skull, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { getAnalyticsSummary, getAnalyticsByCause, getAnalyticsByMonth, getAccidents } from '../api/services';

const COLORS = ['#1a5276','#e67e22','#27ae60','#e74c3c','#8e44ad','#2980b9','#d35400','#16a085'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [byCause, setByCause] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(),
      getAnalyticsByCause(),
      getAnalyticsByMonth(),
      getAccidents({ page: 1, limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
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
            <LineChart data={trends} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ direction: 'rtl', fontFamily: 'inherit', fontSize: 13 }} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="accidents" stroke="#1a5276" strokeWidth={2} dot={false} name="accidents" />
              <Line type="monotone" dataKey="deaths" stroke="#e74c3c" strokeWidth={2} dot={false} name="deaths" />
            </LineChart>
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
