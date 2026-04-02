import { useEffect, useState, useCallback } from 'react';
import { getAuditLogs } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';

const actionLabels: Record<string, { label: string; badge: string }> = {
  CREATE: { label: 'إنشاء', badge: 'badge-success' },
  UPDATE: { label: 'تعديل', badge: 'badge-warning' },
  DELETE: { label: 'حذف', badge: 'badge-danger' },
  LOGIN: { label: 'دخول', badge: 'badge-info' },
  IMPORT: { label: 'استيراد', badge: 'badge-info' },
};

const entityLabels: Record<string, string> = {
  ACCIDENT: 'حادث',
  USER: 'مستخدم',
  IMPORT_JOB: 'ملف استيراد',
  AUTH: 'المصادقة',
};

export default function AuditPage() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const limit = 20;

  useEffect(() => {
    if (me && me.role !== 'ADMIN') navigate('/', { replace: true });
  }, [me, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (filterAction) params.action = filterAction;
      if (filterEntity) params.entity = filterEntity;
      const res = await getAuditLogs(params);
      // Backend returns { data, meta: { total } }
      if (Array.isArray(res)) {
        setLogs(res);
        setTotal(res.length);
      } else {
        setLogs(res.data ?? []);
        setTotal(res.meta?.total ?? res.total ?? (res.data?.length ?? 0));
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterEntity]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  const resetAndFilter = (action: string, entity: string) => {
    setPage(1);
    setFilterAction(action);
    setFilterEntity(entity);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">سجل المراجعة</h1>
          <p className="page-subtitle">تتبع كامل لجميع العمليات المنجزة في النظام</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={20} color="var(--text-secondary)" />
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{total} سجل</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filters-bar">
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>نوع العملية</label>
            <select
              className="form-select"
              value={filterAction}
              onChange={(e) => resetAndFilter(e.target.value, filterEntity)}
            >
              <option value="">كل العمليات</option>
              <option value="CREATE">إنشاء</option>
              <option value="UPDATE">تعديل</option>
              <option value="DELETE">حذف</option>
              <option value="LOGIN">دخول</option>
              <option value="IMPORT">استيراد</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>نوع الكيان</label>
            <select
              className="form-select"
              value={filterEntity}
              onChange={(e) => resetAndFilter(filterAction, e.target.value)}
            >
              <option value="">كل الكيانات</option>
              <option value="ACCIDENT">حوادث</option>
              <option value="USER">مستخدمون</option>
              <option value="IMPORT_JOB">ملفات الاستيراد</option>
            </select>
          </div>
          {(filterAction || filterEntity) && (
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => resetAndFilter('', '')}
              >
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ والوقت</th>
                    <th>المستخدم</th>
                    <th>العملية</th>
                    <th>الكيان</th>
                    <th>المعرف</th>
                    <th>تفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => {
                    const action = actionLabels[log.action] || { label: log.action, badge: 'badge-info' };
                    const entityLabel = entityLabels[log.entityType] || log.entityType;
                    const dt = new Date(log.createdAt);
                    return (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 12 }}>
                          <div>{dt.toLocaleDateString('ar-TN')}</div>
                          <div>{dt.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{log.user?.fullName || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{log.user?.username}</div>
                        </td>
                        <td>
                          <span className={`badge ${action.badge}`}>{action.label}</span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{entityLabel}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>
                          {log.entityId && log.entityId !== 'system' ? (
                            <span title={log.entityId}>{log.entityId.slice(0, 8)}…</span>
                          ) : (
                            <span style={{ opacity: 0.4 }}>—</span>
                          )}
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <details style={{ fontSize: 12, cursor: 'pointer' }}>
                              <summary style={{ color: 'var(--primary-light)', userSelect: 'none' }}>عرض التفاصيل</summary>
                              <pre style={{
                                background: '#f8f9fb', borderRadius: 6, padding: '6px 10px',
                                marginTop: 4, fontSize: 11, overflow: 'auto', maxHeight: 120,
                                direction: 'ltr', textAlign: 'left',
                              }}>
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', opacity: 0.4, fontSize: 12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <ClipboardList size={40} style={{ opacity: 0.3 }} />
                          <p style={{ marginTop: 12 }}>لا توجد سجلات مطابقة</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: 16 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ChevronRight size={16} /> السابق
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                  return (
                    <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  التالي <ChevronLeft size={16} />
                </button>
                <span className="pagination-info">صفحة {page} من {totalPages}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
