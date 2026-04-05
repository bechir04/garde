import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Plus } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  emptyLabel?: string;
  /** If provided, a "+ إضافة [text]" row appears when the query has no match, and this fn is called to create it */
  onCreate?: (text: string) => Promise<{ id: number | string; [k: string]: any }>;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'اكتب للبحث أو اختر...',
  required = false,
  emptyLabel = '— لا شيء —',
  onCreate,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const showCreate = onCreate && query.trim().length > 0 && filtered.length === 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (val: string) => {
    onChange(val);
    setQuery('');
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  const handleCreate = async () => {
    if (!onCreate || !query.trim() || creating) return;
    setCreating(true);
    try {
      const newItem = await onCreate(query.trim());
      onChange(String(newItem.id));
      setQuery('');
      setOpen(false);
    } catch {
      // keep open so user can retry
    } finally {
      setCreating(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center',
          border: `1px solid ${open ? 'var(--primary-light)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)',
          background: '#fff',
          boxShadow: open ? '0 0 0 3px rgba(41,128,185,0.1)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          minHeight: 40,
          cursor: 'text',
        }}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <input
          ref={inputRef}
          style={{
            flex: 1, border: 'none', outline: 'none', padding: '9px 14px',
            fontSize: 14, fontFamily: 'inherit', background: 'transparent',
            direction: 'rtl', color: 'var(--text-primary)', cursor: 'text',
          }}
          placeholder={open ? 'اكتب للبحث أو أدخل قيمة جديدة...' : (selectedLabel || placeholder)}
          value={open ? query : selectedLabel}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' && showCreate) { e.preventDefault(); handleCreate(); } }}
          required={required && !value}
          readOnly={!open}
        />
        {value && !open && (
          <button type="button" onClick={clear} style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', padding: '0 6px', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        )}
        <ChevronDown
          size={16}
          color="var(--text-secondary)"
          style={{ marginLeft: 10, marginRight: 4, flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, left: 0,
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
          zIndex: 300, maxHeight: 240, overflowY: 'auto',
        }}>
          {/* Empty / clear option */}
          <div
            onClick={() => select('')}
            style={{ padding: '8px 14px', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fb')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {emptyLabel}
          </div>

          {/* Matching options */}
          {filtered.map((opt) => (
            <div
              key={opt.value}
              onClick={() => select(opt.value)}
              style={{
                padding: '9px 14px', fontSize: 14, cursor: 'pointer',
                background: opt.value === value ? 'rgba(41,128,185,0.08)' : 'transparent',
                color: opt.value === value ? 'var(--primary)' : 'var(--text-primary)',
                fontWeight: opt.value === value ? 600 : 400,
                borderBottom: '1px solid #f5f5f5',
              }}
              onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = '#f8f9fb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = opt.value === value ? 'rgba(41,128,185,0.08)' : 'transparent'; }}
            >
              {opt.label}
            </div>
          ))}

          {/* No results message (when query typed but matches exist — shouldn't happen — or no create) */}
          {filtered.length === 0 && !showCreate && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
              لا توجد نتائج مطابقة
            </div>
          )}

          {/* Create new option */}
          {showCreate && (
            <button
              type="button"
              onClick={handleCreate}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 13, cursor: creating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--success)', fontWeight: 600,
                background: 'rgba(39,174,96,0.04)',
                borderTop: '1px solid var(--border)',
                border: 'none', borderBottom: 'none',
                opacity: creating ? 0.6 : 1,
                fontFamily: 'inherit',
                textAlign: 'right',
              }}
            >
              <Plus size={15} />
              {creating ? 'جاري الإضافة...' : `إضافة "${query.trim()}" كعنصر جديد`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
