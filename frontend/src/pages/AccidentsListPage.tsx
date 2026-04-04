import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAccidents, getGovernorates, getCauses, deleteAccident } from '../api/services';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SIDI_BOUZID_MUNICIPALITIES } from '../constants/municipalities';

export default function AccidentsListPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<any>({ data: [], total: 0 });
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [causes, setCauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = 15;
  const search = searchParams.get('search') || '';
  const governorateId = searchParams.get('governorateId') || '';
  const cityId = searchParams.get('cityId') || '';
  const causeId = searchParams.get('causeId') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  const showMunicipalityDropdown = governorateId === '18';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params: Record<string, unknown> = { page, limit, sortBy: 'accidentDate', sortOrder: 'desc' };
      if (search) params.search = search;
      if (governorateId) params.governorateId = parseInt(governorateId);
      if (cityId) params.cityId = parseInt(cityId);
      if (causeId) params.causeId = parseInt(causeId);
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await getAccidents(params);
      setData(res);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search, governorateId, cityId, causeId, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    Promise.all([getGovernorates(), getCauses()]).then(([g, c]) => {
      setGovernorates(g);
      setCauses(c);
    });
  }, []);

  const updateFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    if (key !== 'page') p.set('page', '1');
    setSearchParams(p);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحادث؟')) return;
    setDeleting(id);
    try {
      await deleteAccident(id);
      success('تم الحذف', 'تم حذف الحادث بنجاح');
      fetchData();
    } catch {
      toastError('خطأ', 'فشل في حذف الحادث');
    }
    setDeleting(null);
  };

  const rows: any[] = data.data || [];
  const allPageIds = rows.map((a: any) => a.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id: string) => selected.has(id));
  const someSelected = allPageIds.some((id: string) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      allPageIds.forEach((id: string) => next.delete(id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      allPageIds.forEach((id: string) => next.add(id));
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selected.size} حادث؟ لا يمكن التراجع عن هذه العملية.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all([...selected].map((id) => deleteAccident(id)));
      success('تم الحذف', `تم حذف ${selected.size} حادث بنجاح`);
      setSelected(new Set());
      fetchData();
    } catch {
      toastError('خطأ', 'فشل في حذف بعض الحوادث');
    }
    setBulkDeleting(false);
  };

  const totalPages = Math.ceil((data.total || 0) / limit);
  const canEdit = user?.role === 'ADMIN' || user?.role === 'OFFICER';
  const canDelete = user?.role === 'ADMIN';
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">سجل الحوادث</h1>
          <p className="page-subtitle">إجمالي {data.total || 0} حادث مسجل</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {canDelete && selected.size > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              <Trash2 size={16} />
              {bulkDeleting ? 'جاري الحذف...' : `حذف المحدد (${selected.size})`}
            </button>
          )}
          {canEdit && (
            <Link to="/accidents/new" className="btn btn-primary">
              <Plus size={18} /> تسجيل حادث
            </Link>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar">
          <div className="form-group" style={{ flex: '1 1 100%', minWidth: '100%' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                className="form-input"
                placeholder="بحث في الطريق أو الوصف..."
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
                style={{ paddingRight: 36 }}
              />
            </div>
          </div>
          <div className="form-group" style={{ flex: '1 1 180px' }}>
            <select className="form-select" value={governorateId} onChange={(e) => updateFilter('governorateId', e.target.value)}>
              <option value="">كل الولايات</option>
              {governorates.map((g: any) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
            </select>
          </div>
          {showMunicipalityDropdown && (
            <div className="form-group" style={{ flex: '1 1 180px' }}>
              <select className="form-select" value={cityId} onChange={(e) => updateFilter('cityId', e.target.value)}>
                <option value="">كل المعتمديات</option>
                {SIDI_BOUZID_MUNICIPALITIES.map((m) => <option key={m.id} value={m.id}>{m.nameAr}</option>)}
              </select>
            </div>
          )}
          <div className="form-group" style={{ flex: '1 1 180px' }}>
            <select className="form-select" value={causeId} onChange={(e) => updateFilter('causeId', e.target.value)}>
              <option value="">كل الأسباب</option>
              {causes.map((c: any) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 140px' }}>
            <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>من تاريخ</label>
            <input type="date" className="form-input" value={dateFrom} onChange={(e) => updateFilter('dateFrom', e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 140px' }}>
            <label className="form-label" style={{ fontSize: 12, marginBottom: 4 }}>إلى تاريخ</label>
            <input type="date" className="form-input" value={dateTo} onChange={(e) => updateFilter('dateTo', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : (
          <>
            {isMobile ? (
              /* Mobile card view */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rows.length === 0 && (
                  <div className="empty-state">لا توجد حوادث مطابقة للبحث</div>
                )}
                {rows.map((a: any, idx: number) => (
                  <div key={a.id} style={{
                    background: selected.has(a.id) ? 'rgba(26,82,118,0.05)' : '#fff',
                    border: `1px solid ${selected.has(a.id) ? 'rgba(26,82,118,0.2)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {canDelete && (
                          <input
                            type="checkbox"
                            checked={selected.has(a.id)}
                            onChange={() => toggleOne(a.id)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                          />
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>#{(page - 1) * limit + idx + 1}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <Link to={`/accidents/${a.id}`} className="btn btn-outline btn-icon btn-sm" title="عرض"><Eye size={14} /></Link>
                        {canEdit && <Link to={`/accidents/${a.id}/edit`} className="btn btn-outline btn-icon btn-sm" title="تعديل"><Pencil size={14} /></Link>}
                        {canDelete && (
                          <button className="btn btn-danger btn-icon btn-sm" title="حذف" onClick={() => handleDelete(a.id)} disabled={deleting === a.id}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Date & Time */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📅</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(a.accidentDate).toLocaleDateString('ar-TN')}</span>
                      </div>
                      {a.accidentTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>🕐</span>
                          <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{a.accidentTime}</span>
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 12 }}>
                      <div style={{ color: 'var(--text-secondary)' }}>الولاية: <strong style={{ color: 'var(--text-primary)' }}>{a.governorate?.nameAr || '—'}</strong></div>
                      <div style={{ color: 'var(--text-secondary)' }}>السبب: <span className="tag" style={{ fontSize: 11 }}>{a.cause?.nameAr || '—'}</span></div>
                      {a.route && <div style={{ color: 'var(--text-secondary)', gridColumn: '1/-1' }}>الطريق: <strong style={{ color: 'var(--text-primary)' }}>{a.route}</strong></div>}
                    </div>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <span className={`badge ${a.deathsCount > 0 ? 'badge-danger' : 'badge-success'}`}>وفيات: {a.deathsCount}</span>
                      <span className={`badge ${a.injuriesCount > 0 ? 'badge-warning' : 'badge-success'}`}>جرحى: {a.injuriesCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop table view */
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {canDelete && (
                        <th style={{ width: 40, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onChange={toggleAll}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                            title="تحديد الكل"
                          />
                        </th>
                      )}
                      <th>#</th>
                      <th>التاريخ</th>
                      <th>الوقت</th>
                      <th>الولاية</th>
                      <th>المعتمدية</th>
                      <th>الطريق</th>
                      <th>السبب</th>
                      <th>وفيات</th>
                      <th>جرحى</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a: any, idx: number) => (
                      <tr key={a.id} style={{ background: selected.has(a.id) ? 'rgba(26,82,118,0.05)' : undefined }}>
                        {canDelete && (
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selected.has(a.id)}
                              onChange={() => toggleOne(a.id)}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                          </td>
                        )}
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{(page - 1) * limit + idx + 1}</td>
                        <td>{new Date(a.accidentDate).toLocaleDateString('ar-TN')}</td>
                        <td>{a.accidentTime || '—'}</td>
                        <td>{a.governorate?.nameAr || '—'}</td>
                        <td>{a.city?.nameAr || '—'}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.route || '—'}</td>
                        <td><span className="tag">{a.cause?.nameAr || '—'}</span></td>
                        <td><span className={`badge ${a.deathsCount > 0 ? 'badge-danger' : 'badge-success'}`}>{a.deathsCount}</span></td>
                        <td><span className={`badge ${a.injuriesCount > 0 ? 'badge-warning' : 'badge-success'}`}>{a.injuriesCount}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Link to={`/accidents/${a.id}`} className="btn btn-outline btn-icon btn-sm" title="عرض"><Eye size={14} /></Link>
                            {canEdit && <Link to={`/accidents/${a.id}/edit`} className="btn btn-outline btn-icon btn-sm" title="تعديل"><Pencil size={14} /></Link>}
                            {canDelete && (
                              <button className="btn btn-danger btn-icon btn-sm" title="حذف" onClick={() => handleDelete(a.id)} disabled={deleting === a.id}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr><td colSpan={canDelete ? 11 : 10} className="empty-state">لا توجد حوادث مطابقة للبحث</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pagination" style={{ marginTop: 16 }}>
              <span className="pagination-info" style={{ marginLeft: 'auto', marginRight: 0 }}>
                {data.total > 0
                  ? `عرض ${(page - 1) * limit + 1}–${Math.min(page * limit, data.total)} من ${data.total} حادث`
                  : 'لا توجد سجلات'}
              </span>
              {totalPages > 1 && (
                <>
                  <button disabled={page <= 1} onClick={() => updateFilter('page', String(page - 1))}>السابق</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 7) p = i + 1;
                    else if (page <= 4) p = i + 1;
                    else if (page >= totalPages - 3) p = totalPages - 6 + i;
                    else p = page - 3 + i;
                    return (
                      <button key={p} className={p === page ? 'active' : ''} onClick={() => updateFilter('page', String(p))}>{p}</button>
                    );
                  })}
                  <button disabled={page >= totalPages} onClick={() => updateFilter('page', String(page + 1))}>التالي</button>
                  <span className="pagination-info">صفحة {page} من {totalPages}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
