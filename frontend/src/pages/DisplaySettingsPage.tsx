import { useState, useEffect, useRef } from 'react';
import { useDisplaySettings, STATS_SECTIONS, INSIGHTS_SECTIONS } from '../contexts/DisplaySettingsContext';
import { Eye, EyeOff, RotateCcw, Settings, BarChart3, Lightbulb, Car, Plus, Pencil, Trash2, Check, X, Search } from 'lucide-react';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../api/services';
import { useToast } from '../contexts/ToastContext';

const statsLabels: Record<string, string> = {
  kpi: 'بطاقات المؤشرات الرئيسية',
  map: 'معاينة الخريطة التفاعلية',
  govBar: 'الحوادث حسب الولاية',
  causePie: 'توزيع الأسباب',
  brandBar: 'حسب الصنف',
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

function BrandsManager() {
  const { success, error: toastError } = useToast();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addingName, setAddingName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBrands().then(setBrands).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showAddInput) addInputRef.current?.focus();
  }, [showAddInput]);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  const handleAdd = async () => {
    if (!addingName.trim()) return;
    setSavingAdd(true);
    try {
      const created = await createBrand(addingName.trim());
      setBrands((prev) => [...prev, created].sort((a, b) => a.nameAr.localeCompare(b.nameAr)));
      setAddingName('');
      setShowAddInput(false);
      success('تمت الإضافة', `تمت إضافة "${created.nameAr}" بنجاح`);
    } catch {
      toastError('خطأ', 'فشل في إضافة الماركة');
    }
    setSavingAdd(false);
  };

  const startEdit = (brand: any) => {
    setEditingId(brand.id);
    setEditingName(brand.nameAr);
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    const old = brands.find((b) => b.id === id);
    if (editingName.trim() === old?.nameAr) { setEditingId(null); return; }
    try {
      const updated = await updateBrand(id, editingName.trim());
      setBrands((prev) => prev.map((b) => b.id === id ? updated : b).sort((a, b) => a.nameAr.localeCompare(b.nameAr)));
      setEditingId(null);
      success('تم التحديث', `تم تحديث الماركة بنجاح`);
    } catch {
      toastError('خطأ', 'فشل في تحديث الماركة');
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteBrand(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
      success('تم الحذف', 'تم حذف الماركة بنجاح');
    } catch {
      toastError('خطأ', 'فشل في حذف الماركة — ربما تُستخدم في حوادث مسجلة');
    }
    setDeletingId(null);
  };

  const filtered = brands.filter((b) => b.nameAr.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="spinner" style={{ margin: '40px auto' }} />;

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن ماركة..."
            style={{ paddingRight: 34, fontSize: 13 }}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setShowAddInput(true); setEditingId(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <Plus size={15} /> إضافة ماركة
        </button>
      </div>

      {/* Add input */}
      {showAddInput && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: 12, background: '#f0f7ff', borderRadius: 10, border: '1px solid #b3d4f5', alignItems: 'center' }}>
          <input
            ref={addInputRef}
            className="form-input"
            value={addingName}
            onChange={(e) => setAddingName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAddInput(false); setAddingName(''); } }}
            placeholder="اسم الماركة الجديدة"
            style={{ flex: 1, fontSize: 13 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={savingAdd || !addingName.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', fontSize: 13 }}
          >
            {savingAdd ? <span className="login-spinner" /> : <Check size={14} />}
            {savingAdd ? 'جاري...' : 'حفظ'}
          </button>
          <button
            onClick={() => { setShowAddInput(false); setAddingName(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 6, borderRadius: 6, display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Count */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
        {filtered.length} ماركة {search && `(من ${brands.length} إجمالاً)`}
      </div>

      {/* Brand list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 13 }}>لا توجد نتائج</div>
        )}
        {filtered.map((brand) => (
          <div
            key={brand.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: editingId === brand.id ? '#f0f7ff' : '#f8f9fb',
              border: `1px solid ${editingId === brand.id ? '#b3d4f5' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}
          >
            <Car size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />

            {editingId === brand.id ? (
              <>
                <input
                  ref={editInputRef}
                  className="form-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(brand.id); if (e.key === 'Escape') setEditingId(null); }}
                  style={{ flex: 1, fontSize: 13, padding: '5px 10px', height: 32 }}
                />
                <button
                  onClick={() => handleUpdate(brand.id)}
                  disabled={!editingName.trim()}
                  style={{ background: 'var(--success)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                >
                  <Check size={13} /> حفظ
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)', padding: '5px 10px', display: 'flex', alignItems: 'center', fontSize: 12 }}
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{brand.nameAr}</span>
                <button
                  onClick={() => startEdit(brand)}
                  title="تعديل"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--primary)', padding: '5px 8px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(brand.id)}
                  disabled={deletingId === brand.id}
                  title="حذف"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--danger)', padding: '5px 8px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--danger)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                >
                  {deletingId === brand.id ? <span className="login-spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} />}
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DisplaySettingsPage() {
  const { settings, toggleStats, toggleInsights, resetAll } = useDisplaySettings();
  const [activeTab, setActiveTab] = useState<'stats' | 'insights' | 'brands'>('stats');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">إعدادات العرض</h1>
          <p className="page-subtitle">التحكم في البطاقات والأقسام المعروضة في الصفحات</p>
        </div>
        {activeTab !== 'brands' && (
          <button className="btn btn-outline" onClick={resetAll} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={16} /> إعادة تعيين الكل
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0f2f5', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'stats' as const,    label: 'الإحصائيات',    icon: <BarChart3 size={14} /> },
          { key: 'insights' as const, label: 'التقييم الشامل', icon: <Lightbulb size={14} /> },
          { key: 'brands' as const,   label: 'ماركات السيارات', icon: <Car size={14} /> },
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
        {activeTab === 'brands' ? (
          <>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Car size={17} /> إدارة ماركات السيارات
            </h3>
            <BrandsManager />
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={17} /> {activeTab === 'stats' ? 'أقسام صفحة الإحصائيات' : 'أقسام صفحة التقييم الشامل'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(activeTab === 'stats' ? STATS_SECTIONS : INSIGHTS_SECTIONS).map((section) => {
                const isVisible = activeTab === 'stats'
                  ? settings.stats[section as typeof STATS_SECTIONS[number]]
                  : settings.insights[section as typeof INSIGHTS_SECTIONS[number]];
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
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
                    </div>
                    <button
                      onClick={() => activeTab === 'stats'
                        ? toggleStats(section as typeof STATS_SECTIONS[number])
                        : toggleInsights(section as typeof INSIGHTS_SECTIONS[number])}
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
          </>
        )}
      </div>
    </div>
  );
}
