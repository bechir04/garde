import { useState } from 'react';
import { useDisplaySettings, STATS_SECTIONS, INSIGHTS_SECTIONS } from '../contexts/DisplaySettingsContext';
import { Eye, EyeOff, RotateCcw, Settings, BarChart3, Lightbulb } from 'lucide-react';

const statsLabels: Record<string, string> = {
  kpi: 'بطاقات المؤشرات الرئيسية',
  map: 'معاينة الخريطة التفاعلية',
  govBar: 'الحوادث حسب الولاية',
  causePie: 'توزيع الأسباب',
  brandBar: 'الحوادث حسب ماركة السيارة',
  hourBar: 'توزيع الحوادث حسب ساعة اليوم',
  trendLine: 'الاتجاه الشهري',
};

const insightsLabels: Record<string, string> = {
  gauge: 'مؤشر الخطورة',
  kpi: 'بطاقات المؤشرات',
  anomalies: 'نقاط السوداء',
  timeSlots: 'توزيع الحوادث حسب الفترة',
  causeLethality: 'الأسباب حسب معدل القتلى',
  weekday: 'الحوادث حسب اليوم',
  monthlyTrend: 'اتجاه الحوادث — 6 أشهر',
  topRoutes: 'أخطر الطرق',
  heatmap: 'الخريطة الحرارية',
  brands: 'الماركات',
  recommendations: 'التوصيات',
};

export default function DisplaySettingsPage() {
  const { settings, toggleStats, toggleInsights, resetAll } = useDisplaySettings();
  const [activeTab, setActiveTab] = useState<'stats' | 'insights'>('stats');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">إعدادات العرض</h1>
          <p className="page-subtitle">التحكم في البطاقات والأقسام المعروضة في الصفحات</p>
        </div>
        <button className="btn btn-outline" onClick={resetAll} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RotateCcw size={16} /> إعادة تعيين الكل
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0f2f5', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'stats' as const, label: 'الإحصائيات', icon: <BarChart3 size={14} /> },
          { key: 'insights' as const, label: 'التقييم الشامل', icon: <Lightbulb size={14} /> },
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

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={17} /> {activeTab === 'stats' ? 'أقسام صفحة الإحصائيات' : 'أقسام صفحة التقييم الشامل'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(activeTab === 'stats' ? STATS_SECTIONS : INSIGHTS_SECTIONS).map((section) => {
            const isVisible = activeTab === 'stats' ? settings.stats[section as typeof STATS_SECTIONS[number]] : settings.insights[section as typeof INSIGHTS_SECTIONS[number]];
            const label = activeTab === 'stats' ? statsLabels[section] : insightsLabels[section];
            return (
              <div
                key={section}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '12px 16px', borderRadius: 8,
                  background: isVisible ? '#f8f9fb' : '#f0f2f5',
                  border: `1px solid ${isVisible ? 'var(--border)' : 'transparent'}`,
                  opacity: isVisible ? 1 : 0.6,
                  transition: 'all 0.2s',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isVisible ? 'var(--primary)' : '#dfe6e9',
                    color: isVisible ? '#fff' : '#636e72',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                </div>
                <button
                  onClick={() => activeTab === 'stats' ? toggleStats(section as typeof STATS_SECTIONS[number]) : toggleInsights(section as typeof INSIGHTS_SECTIONS[number])}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: isVisible ? 'var(--danger)' : 'var(--success)',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  {isVisible ? <><EyeOff size={13} /> إخفاء</> : <><Eye size={13} /> عرض</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
