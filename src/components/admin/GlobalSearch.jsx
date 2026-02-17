import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Building2, UserCheck, CreditCard, FileText, MapPin, Settings } from 'lucide-react';

const QUICK_LINKS = [
  { path: '/admin', label: 'Dashboard', icon: Search },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { path: '/admin/agents', label: 'Agents', icon: UserCheck },
  { path: '/admin/payments', label: 'Payments', icon: CreditCard },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/map', label: 'Map', icon: MapPin },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filtered = query.trim()
    ? QUICK_LINKS.filter((l) => l.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_LINKS;

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    const onOpen = () => setOpen(true);
    window.addEventListener('admin:open-search', onOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('admin:open-search', onOpen);
    };
  }, [handleKeyDown]);

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 9999,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '70vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Search size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
          <input
            type="text"
            placeholder="Quick search... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {filtered.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => handleSelect(link.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={20} style={{ color: '#818cf8' }} />
                {link.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
