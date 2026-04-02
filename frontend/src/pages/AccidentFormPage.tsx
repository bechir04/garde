import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAccident, createAccident, updateAccident, getGovernorates, getCauses, getBrands, createCause, createBrand } from '../api/services';
import { Save, ArrowRight } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

export default function AccidentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [governorates, setGovernorates] = useState<any[]>([]);
  const [causes, setCauses] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    accidentDate: '', accidentTime: '', governorateId: '',
    route: '', kilometrePoint: '', causeId: '',
    vehicleBrand1Id: '', vehicleBrand2Id: '',
    deathsCount: '0', injuriesCount: '0', description: '',
  });

  useEffect(() => {
    Promise.all([getGovernorates(), getCauses(), getBrands()])
      .then(([g, c, b]) => { setGovernorates(g); setCauses(c); setBrands(b); })
      .then(() => {
        if (isEdit && id) {
          return getAccident(id).then((a: any) => {
            setForm({
              accidentDate: a.accidentDate?.split('T')[0] || '',
              accidentTime: a.accidentTime || '',
              governorateId: String(a.governorateId || ''),
              route: a.route || '',
              kilometrePoint: a.kilometrePoint != null ? String(a.kilometrePoint) : '',
              causeId: String(a.causeId || ''),
              vehicleBrand1Id: a.vehicleBrand1Id ? String(a.vehicleBrand1Id) : '',
              vehicleBrand2Id: a.vehicleBrand2Id ? String(a.vehicleBrand2Id) : '',
              deathsCount: String(a.deathsCount || 0),
              injuriesCount: String(a.injuriesCount || 0),
              description: a.description || '',
            });
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload: Record<string, unknown> = {
      accidentDate: form.accidentDate,
      accidentTime: form.accidentTime || undefined,
      governorateId: parseInt(form.governorateId),
      route: form.route || undefined,
      kilometrePoint: form.kilometrePoint ? parseFloat(form.kilometrePoint) : undefined,
      causeId: parseInt(form.causeId),
      vehicleBrand1Id: form.vehicleBrand1Id ? parseInt(form.vehicleBrand1Id) : undefined,
      vehicleBrand2Id: form.vehicleBrand2Id ? parseInt(form.vehicleBrand2Id) : undefined,
      deathsCount: parseInt(form.deathsCount) || 0,
      injuriesCount: parseInt(form.injuriesCount) || 0,
      description: form.description || undefined,
    };

    try {
      if (isEdit && id) {
        await updateAccident(id, payload);
      } else {
        await createAccident(payload);
      }
      navigate('/accidents');
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    }
    setSaving(false);
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'تعديل الحادث' : 'تسجيل حادث جديد'}</h1>
          <p className="page-subtitle">أدخل جميع البيانات المتعلقة بالحادث</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/accidents')}>
          <ArrowRight size={16} /> العودة للقائمة
        </button>
      </div>

      <div className="card">
        {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            📍 معلومات الحادث الأساسية
          </h3>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">تاريخ الحادث *</label>
              <input type="date" className="form-input" value={form.accidentDate} onChange={(e) => handleChange('accidentDate', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">وقت الحادث</label>
              <input type="time" className="form-input" value={form.accidentTime} onChange={(e) => handleChange('accidentTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">الولاية *</label>
              <SearchableSelect
                options={governorates.map((g: any) => ({ value: String(g.id), label: g.nameAr }))}
                value={form.governorateId}
                onChange={(v) => handleChange('governorateId', v)}
                placeholder="اختر الولاية"
                emptyLabel="— اختر الولاية —"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الطريق</label>
              <input className="form-input" value={form.route} onChange={(e) => handleChange('route', e.target.value)} placeholder="مثال: الطريق الوطنية رقم 1" />
            </div>
            <div className="form-group">
              <label className="form-label">النقطة الكيلومترية</label>
              <input type="number" step="0.01" className="form-input" value={form.kilometrePoint} onChange={(e) => handleChange('kilometrePoint', e.target.value)} placeholder="مثال: 45.5" />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 24, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            🚗 تفاصيل الحادث
          </h3>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">سبب الحادث *</label>
              <SearchableSelect
                options={causes.map((c: any) => ({ value: String(c.id), label: c.nameAr }))}
                value={form.causeId}
                onChange={(v) => handleChange('causeId', v)}
                placeholder="اختر أو اكتب سبباً جديداً"
                emptyLabel="— اختر السبب —"
                required
                onCreate={async (text) => {
                  const newCause = await createCause(text);
                  const updated = await getCauses();
                  setCauses(updated);
                  return newCause;
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">ماركة السيارة 1</label>
              <SearchableSelect
                options={brands.map((b: any) => ({ value: String(b.id), label: `${b.nameAr} (${b.nameEn})` }))}
                value={form.vehicleBrand1Id}
                onChange={(v) => handleChange('vehicleBrand1Id', v)}
                placeholder="اختر أو اكتب ماركة جديدة"
                onCreate={async (text) => {
                  const newBrand = await createBrand(text);
                  const updated = await getBrands();
                  setBrands(updated);
                  return newBrand;
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">ماركة السيارة 2</label>
              <SearchableSelect
                options={brands.map((b: any) => ({ value: String(b.id), label: `${b.nameAr} (${b.nameEn})` }))}
                value={form.vehicleBrand2Id}
                onChange={(v) => handleChange('vehicleBrand2Id', v)}
                placeholder="اختر أو اكتب ماركة جديدة"
                onCreate={async (text) => {
                  const newBrand = await createBrand(text);
                  const updated = await getBrands();
                  setBrands(updated);
                  return newBrand;
                }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">عدد الوفيات</label>
              <input type="number" min="0" className="form-input" value={form.deathsCount} onChange={(e) => handleChange('deathsCount', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">عدد الإصابات</label>
              <input type="number" min="0" className="form-input" value={form.injuriesCount} onChange={(e) => handleChange('injuriesCount', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">وصف إضافي</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="تفاصيل إضافية عن الحادث..." />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'تسجيل الحادث'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/accidents')}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
