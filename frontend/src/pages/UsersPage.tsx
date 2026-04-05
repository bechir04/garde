import { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Pencil, ShieldCheck, ShieldOff, X, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'OFFICER' | 'ANALYST';
  isActive: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'مدير النظام',
  OFFICER: 'ضابط إدخال',
  ANALYST: 'مطّلع / محلل',
};

const roleBadge: Record<string, string> = {
  ADMIN: 'badge-danger',
  OFFICER: 'badge-warning',
  ANALYST: 'badge-info',
};

const emptyForm = { username: '', password: '', fullName: '', role: 'OFFICER' };

export default function UsersPage() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (me && me.role !== 'ADMIN') navigate('/', { replace: true });
  }, [me, navigate]);

  const load = () => {
    setLoading(true);
    getUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setForm({ username: u.username, password: '', fullName: u.fullName, role: u.role });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editTarget) {
        const payload: any = { fullName: form.fullName, role: form.role };
        if (form.password) payload.password = form.password;
        await updateUser(editTarget.id, payload);
        success('تم التحديث', 'تم تحديث بيانات المستخدم بنجاح');
      } else {
        if (!form.password) { setError('كلمة المرور مطلوبة'); setSaving(false); return; }
        await createUser({ username: form.username, password: form.password, fullName: form.fullName, role: form.role });
        success('تم الإنشاء', 'تم إنشاء الحساب بنجاح');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toastError('خطأ', err?.response?.data?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    try {
      await updateUser(u.id, { isActive: !u.isActive });
      if (u.isActive) {
        info('تم التعطيل', 'تم تعطيل حساب المستخدم');
      } else {
        success('تم التفعيل', 'تم تفعيل حساب المستخدم');
      }
      load();
    } catch {
      toastError('خطأ', 'فشل تحديث الحالة');
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${u.fullName}"؟ لا يمكن التراجع عن هذه العملية.`)) return;
    try {
      await deleteUser(u.id);
      success('تم الحذف', 'تم حذف المستخدم بنجاح');
      load();
    } catch {
      toastError('خطأ', 'فشل في حذف المستخدم');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المستخدمين</h1>
          <p className="page-subtitle">{users.length} مستخدم مسجّل في النظام</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <UserPlus size={18} /> إضافة مستخدم
        </button>
      </div>

      <div className="card">
        {loading ? <div className="spinner" /> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الاسم الكامل</th>
                  <th>اسم المستخدم</th>
                  <th>الدور</th>
                  <th>الحالة</th>
                  <th>تاريخ الإنشاء</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--primary)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14, flexShrink: 0,
                        }}>
                          {u.fullName?.charAt(0) || '؟'}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.fullName}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{u.username}</td>
                    <td><span className={`badge ${roleBadge[u.role]}`}>{roleLabels[u.role]}</span></td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(u.createdAt).toLocaleDateString('ar-DZ')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-icon btn-sm"
                          title="تعديل"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className={`btn btn-icon btn-sm ${u.isActive ? 'btn-danger' : 'btn-outline'}`}
                          title={u.isActive ? 'تعطيل' : 'تفعيل'}
                          onClick={() => toggleActive(u)}
                          disabled={u.id === me?.id}
                        >
                          {u.isActive ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          title="حذف"
                          onClick={() => handleDelete(u)}
                          disabled={u.id === me?.id}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="empty-state">لا يوجد مستخدمون</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                {editTarget ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">الاسم الكامل *</label>
                <input
                  className="form-input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="مثال: رائد محمد بلعباس"
                  required
                />
              </div>
              {!editTarget && (
                <div className="form-group">
                  <label className="form-label">اسم المستخدم *</label>
                  <input
                    className="form-input"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="مثال: officer_tizi"
                    required
                    style={{ direction: 'ltr', textAlign: 'right' }}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">
                  {editTarget ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور *'}
                </label>
                <input
                  className="form-input"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required={!editTarget}
                  style={{ direction: 'ltr', textAlign: 'right' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">الدور *</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="ANALYST">مطّلع / محلل (قراءة فقط)</option>
                  <option value="OFFICER">ضابط إدخال (إدخال وتعديل)</option>
                  <option value="ADMIN">مدير النظام (صلاحيات كاملة)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editTarget ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
