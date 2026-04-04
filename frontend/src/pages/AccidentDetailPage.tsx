import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAccident } from '../api/services';
import { ArrowRight, Pencil, Calendar, MapPin, Car, AlertTriangle } from 'lucide-react';

export default function AccidentDetailPage() {
  const { id } = useParams();
  const [accident, setAccident] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) getAccident(id).then(setAccident).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!accident) return <div className="empty-state">الحادث غير موجود</div>;

  const a = accident;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">تفاصيل الحادث</h1>
          <p className="page-subtitle">رقم: {a.id?.substring(0, 8)}...</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/accidents/${a.id}/edit`} className="btn btn-accent"><Pencil size={16} /> تعديل</Link>
          <Link to="/accidents" className="btn btn-outline"><ArrowRight size={16} /> العودة</Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <Calendar size={18} /> المعلومات الأساسية
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <InfoRow label="التاريخ" value={new Date(a.accidentDate).toLocaleDateString('ar-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
            <InfoRow label="الوقت" value={a.accidentTime || 'غير محدد'} />
            <InfoRow label="تاريخ التسجيل" value={new Date(a.createdAt).toLocaleString('ar-TN')} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <MapPin size={18} /> الموقع
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <InfoRow label="الولاية" value={a.governorate?.nameAr || '—'} />
            <InfoRow label="الطريق" value={a.route || '—'} />
            <InfoRow label="النقطة الكيلومترية" value={a.kilometrePoint != null ? `${a.kilometrePoint} كم` : '—'} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <AlertTriangle size={18} /> تفاصيل الحادث
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <InfoRow label="السبب" value={<span className="tag">{a.cause?.nameAr || '—'}</span>} />
            <InfoRow label="الوفيات" value={<span className={`badge ${a.deathsCount > 0 ? 'badge-danger' : 'badge-success'}`}>{a.deathsCount}</span>} />
            <InfoRow label="الجرحى" value={<span className={`badge ${a.injuriesCount > 0 ? 'badge-warning' : 'badge-success'}`}>{a.injuriesCount}</span>} />
          </div>
        </div>

        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            <Car size={18} /> المركبات
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <InfoRow
              label="المركبة 1"
              value={
                a.vehicleBrand1
                  ? `${a.vehicleBrand1.nameAr} (${a.vehicleBrand1.nameEn})`
                  : (a.metadata?.['ماركة السيارة 1'] as string) || '—'
              }
            />
            <InfoRow
              label="المركبة 2"
              value={
                a.vehicleBrand2
                  ? `${a.vehicleBrand2.nameAr} (${a.vehicleBrand2.nameEn})`
                  : (a.metadata?.['ماركة السيارة 2'] as string) || '—'
              }
            />
          </div>
        </div>
      </div>

      {a.description && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>ملاحظات</h3>
          <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>{a.description}</p>
        </div>
      )}

    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: 14 }}>{value}</span>
    </div>
  );
}
