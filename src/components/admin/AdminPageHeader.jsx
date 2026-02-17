export default function AdminPageHeader({ title, subtitle, icon: Icon, children }) {
  return (
    <div className="admin-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {Icon && (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}>
              <Icon size={24} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 4px 0' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0, fontSize: '0.875rem' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{children}</div>}
      </div>
    </div>
  );
}
