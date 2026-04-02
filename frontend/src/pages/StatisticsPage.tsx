import { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import { getAnalyticsSummary, getAnalyticsByGovernorate, getAnalyticsByCause, getAnalyticsByBrand, getAnalyticsByHour, getAnalyticsByMonth } from '../api/services';

const COLORS = ['#1a5276','#e67e22','#27ae60','#e74c3c','#8e44ad','#2980b9','#d35400','#16a085','#c0392b','#2c3e50'];

export default function StatisticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [byGov, setByGov] = useState<any[]>([]);
  const [byCause, setByCause] = useState<any[]>([]);
  const [byBrand, setByBrand] = useState<any[]>([]);
  const [byTime, setByTime] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(),
      getAnalyticsByGovernorate(),
      getAnalyticsByCause(),
      getAnalyticsByBrand(),
      getAnalyticsByHour(),
      getAnalyticsByMonth(),
    ]).then(([s, g, c, b, t, tr]) => {
      setSummary(s);
      setByGov(g.slice(0, 10));
      setByCause(c.slice(0, 8));
      setByBrand(b.slice(0, 8));
      setByTime(t);
      setTrends(tr);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">الإحصائيات والتحليلات</h1>
          <p className="page-subtitle">تحليل شامل لبيانات حوادث المرور</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="kpi-grid">
        <StatCard label="إجمالي الحوادث" value={summary?.totalAccidents} color="primary" />
        <StatCard label="إجمالي الوفيات" value={summary?.totalDeaths} color="danger" />
        <StatCard label="إجمالي الإصابات" value={summary?.totalInjuries} color="warning" />
        <StatCard label="حوادث بدون وفيات (%)" value={summary?.totalAccidents && summary?.accidentsWithDeaths
          ? `${(((summary.totalAccidents - summary.accidentsWithDeaths) / summary.totalAccidents) * 100).toFixed(0)}%`
          : '—'} color="success" />
      </div>

      <div className="charts-grid">
        {/* By Governorate */}
        <div className="chart-card">
          <div className="chart-title">🏛️ الحوادث حسب الولاية (أعلى 10)</div>
          <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 450 : 400}>
            <BarChart 
              data={byGov} 
              layout="vertical" 
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                axisLine={{ stroke: '#eee' }}
                tickLine={false}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={window.innerWidth < 768 ? 100 : 180}
                orientation="right"
                interval={0}
                tick={{ fontSize: window.innerWidth < 768 ? 11 : 14, fontWeight: 600, fill: 'var(--text-primary)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ 
                  borderRadius: '10px', 
                  border: 'none', 
                  boxShadow: 'var(--shadow-lg)',
                  direction: 'rtl',
                  fontFamily: 'inherit'
                }}
              />
              <Bar 
                dataKey="count" 
                fill="#1a5276" 
                radius={[4, 0, 0, 4]} 
                name="عدد الحوادث"
                barSize={window.innerWidth < 768 ? 18 : 24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Cause (Pie) */}
        <div className="chart-card">
          <div className="chart-title">⚠️ توزيع الأسباب</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={byCause}
                dataKey="count"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
              >
                {byCause.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [value + ' حادث', name]}
                contentStyle={{ direction: 'rtl', fontFamily: 'inherit', fontSize: 13, borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, maxHeight: 150, overflowY: 'auto' }}>
            {byCause.map((item, i) => {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600, flexShrink: 0 }}>{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Brand */}
        <div className="chart-card">
          <div className="chart-title">🚗 الحوادث حسب ماركة السيارة</div>
          <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 220 : 300}>
            <BarChart data={byBrand} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                axisLine={{ stroke: '#eee' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl' }}
              />
              <Bar dataKey="count" fill="#e67e22" radius={[4, 4, 0, 0]} name="عدد الحوادث" barSize={window.innerWidth < 768 ? 20 : 30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Time of Day */}
        <div className="chart-card">
          <div className="chart-title">🕐 توزيع الحوادث حسب ساعة اليوم</div>
          <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 220 : 300}>
            <BarChart data={byTime} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                axisLine={{ stroke: '#eee' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl' }}
              />
              <Bar dataKey="accidents" fill="#27ae60" radius={[4, 4, 0, 0]} name="حوادث" barSize={window.innerWidth < 768 ? 20 : 30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trends full-width */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="chart-title">📈 الاتجاه الشهري — الحوادث والوفيات والإصابات</div>
        <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 220 : 320}>
          <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              axisLine={{ stroke: '#eee' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow)', direction: 'rtl', fontSize: 12 }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="accidents" stroke="#1a5276" strokeWidth={window.innerWidth < 768 ? 2 : 3} dot={{ r: 3 }} activeDot={{ r: 5 }} name="حوادث" />
            <Line type="monotone" dataKey="deaths" stroke="#e74c3c" strokeWidth={window.innerWidth < 768 ? 2 : 3} dot={{ r: 3 }} activeDot={{ r: 5 }} name="وفيات" />
            <Line type="monotone" dataKey="injuries" stroke="#f39c12" strokeWidth={window.innerWidth < 768 ? 2 : 3} dot={{ r: 3 }} activeDot={{ r: 5 }} name="إصابات" />
          </LineChart>
        </ResponsiveContainer>
      </div>
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
