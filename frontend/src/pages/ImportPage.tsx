import { useState, useRef, useEffect, type DragEvent, type ChangeEvent } from 'react';
import { uploadExcel, commitImport, getImportTemplate, getGovernorates } from '../api/services';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError, info } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [defaultGovId, setDefaultGovId] = useState<number | ''>('');

  useEffect(() => {
    getGovernorates().then(setGovernorates).catch(() => {});
  }, []);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.xlsx')) {
      setFile(f); setError(''); setPreviewData(null); setResult(null);
    } else {
      setError('يرجى رفع ملف Excel (.xlsx) فقط');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.name.endsWith('.xlsx')) {
        setFile(f); setError(''); setPreviewData(null); setResult(null);
      } else {
        setError('يرجى رفع ملف Excel (.xlsx) فقط');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const res = await uploadExcel(file, defaultGovId ? Number(defaultGovId) : undefined);
      setPreviewData(res);
      setResult(null);
      info('تم الرفع', `تم رفع ${res.totalRows} سطر — ${res.validRows} صالح للاستيراد`);
    } catch (err: any) {
      toastError('خطأ في الرفع', err.response?.data?.message || 'حدث خطأ أثناء رفع الملف');
    }
    setUploading(false);
  };

  const handleCommit = async () => {
    if (!previewData?.importJobId) return;
    setCommitting(true);
    setError('');
    try {
      const res = await commitImport(previewData.importJobId);
      setResult(res);
      setPreviewData(null);
      setFile(null);
      success('تم الاستيراد', `تم إضافة ${res.committed} سجل إلى قاعدة البيانات`);
    } catch (err: any) {
      toastError('خطأ في الاستيراد', err.response?.data?.message || 'حدث خطأ أثناء تأكيد الاستيراد');
    }
    setCommitting(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await getImportTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_accidents.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('تعذر تحميل النموذج');
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData(null);
    setResult(null);
    setError('');
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">استيراد البيانات</h1>
          <p className="page-subtitle">رفع ملفات Excel لمعالجة حوادث المرور دفعة واحدة</p>
        </div>
        <button className="btn" style={{ background: '#fff', border: '1px solid var(--border)' }} onClick={handleDownloadTemplate}>
          <Download size={16} /> تحميل النموذج المرجعي
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>

        {/* Default governorate selector */}
        {!previewData && !result && (
          <div style={{ marginBottom: 20, padding: '14px 16px', background: '#f0f4ff', border: '1px solid #c7d7fd', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Info size={18} color="#3b6fd4" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#1e3a8a', marginBottom: 2 }}>
                إذا كان ملفك لا يحتوي على عمود الولاية
              </div>
              <div style={{ fontSize: 12, color: '#3b6fd4' }}>
                اختر الولاية الافتراضية وستُطبَّق على جميع الأسطر
              </div>
            </div>
            <select
              className="form-select"
              style={{ minWidth: 180, maxWidth: 260 }}
              value={defaultGovId}
              onChange={(e) => setDefaultGovId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— الولاية موجودة في الملف —</option>
              {governorates.map((g: any) => (
                <option key={g.id} value={g.id}>{g.nameAr}</option>
              ))}
            </select>
          </div>
        )}

        {!previewData && !result && (
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="upload-icon"><Upload size={48} /></div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              اسحب ملف Excel هنا أو انقر للاختيار
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              الصيغة المدعومة: XLSX فقط
            </p>
            <input ref={fileRef} type="file" accept=".xlsx" hidden onChange={handleFileChange} />
          </div>
        )}

        {file && !previewData && !result && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: '#f8f9fb', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileSpreadsheet size={24} color="var(--primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              <Upload size={16} /> {uploading ? 'جاري الرفع...' : 'معاينة البيانات'}
            </button>
          </div>
        )}

        {error && (
          <div className="login-error" style={{ marginTop: 16 }}>
            <AlertCircle size={16} /> <span style={{ marginRight: 8 }}>{error}</span>
          </div>
        )}

        {previewData && (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>ملخص المعاينة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 16, background: '#f8f9fb', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: window.innerWidth < 768 ? 20 : 24, fontWeight: 700 }}>{previewData.totalRows}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>إجمالي الأسطر</div>
              </div>
              <div style={{ padding: 16, background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: window.innerWidth < 768 ? 20 : 24, fontWeight: 700, color: 'var(--success)' }}>{previewData.validRows}</div>
                <div style={{ fontSize: 12, color: 'var(--success)' }}>أسطر صالحة للاستيراد</div>
              </div>
              <div style={{ padding: 16, background: 'rgba(235,87,87,0.06)', border: '1px solid rgba(235,87,87,0.2)', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: window.innerWidth < 768 ? 20 : 24, fontWeight: 700, color: 'var(--danger)' }}>{previewData.invalidRows}</div>
                <div style={{ fontSize: 12, color: 'var(--danger)' }}>تحتوي على أخطاء (سيتم تجاهلها)</div>
              </div>
            </div>

            {previewData.preview && previewData.preview.length > 0 && (
              <div className="table-container" style={{ marginBottom: 24, maxHeight: 300, overflow: 'auto' }}>
                <table style={{ fontSize: 13, width: '100%', textAlign: 'right' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
                    <tr style={{ background: '#f0f2f5' }}>
                      <th style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>سطر</th>
                      <th style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>الحالة</th>
                      <th style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>التاريخ</th>
                      <th style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>الأخطاء (إن وجدت)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.preview.map((row: any, idx: number) => (
                      <tr key={idx} style={{ background: row.isValid ? 'transparent' : 'rgba(235,87,87,0.04)' }}>
                        <td style={{ padding: 12, borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{row.rowNumber}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
                          {row.isValid ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontWeight: 500 }}><CheckCircle size={14} /> صالح</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontWeight: 500 }}><AlertCircle size={14} /> خطأ</span>
                          )}
                        </td>
                        <td style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>{row.data?.accidentDate || '-'}</td>
                        <td style={{ padding: 12, borderBottom: '1px solid var(--border)', color: 'var(--danger)' }}>{row.errors?.join('، ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button className="btn" style={{ background: '#f8f9fb', border: '1px solid var(--border)' }} onClick={resetForm} disabled={committing}>
                إلغاء
              </button>
              <button className="btn btn-primary" onClick={handleCommit} disabled={committing || previewData.validRows === 0}>
                {committing ? 'جاري إضافة السجلات...' : `تأكيد استيراد (${previewData.validRows} سجل)`}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 16, padding: '32px 24px', background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 'var(--radius)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: 'center' }}>
              <CheckCircle size={48} color="var(--success)" />
            </div>
            <h2 style={{ textAlign: 'center', color: 'var(--success)', marginBottom: 8 }}>تم استيراد البيانات بنجاح</h2>
            <div style={{ textAlign: 'center', fontSize: 16, marginBottom: 24, color: 'var(--text-secondary)' }}>
              تمت إضافة <strong>{result.committed}</strong> سجل صالح إلى قاعدة البيانات من أصل {result.total}.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={resetForm}>
                استيراد ملف جديد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
