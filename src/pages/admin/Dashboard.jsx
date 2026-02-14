import { Users, Building2, ShoppingBag, DollarSign, TrendingUp, Activity } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Total Users', value: '12,543', icon: Users, color: 'primary', change: '+12%' },
    { label: 'Businesses', value: '1,234', icon: Building2, color: 'secondary', change: '+8%' },
    { label: 'Orders', value: '5,678', icon: ShoppingBag, color: 'success', change: '+23%' },
    { label: 'Revenue', value: 'TZS 45.2M', icon: DollarSign, color: 'info', change: '+15%' },
  ];

  return (
    <div>
      <div className="admin-card" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
          Welcome to the Wakilfy Admin Portal. Manage users, businesses, orders, and more.
        </p>
      </div>

      <div className="admin-grid admin-grid-4" style={{ marginBottom: '32px' }}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `rgba(124, 58, 237, 0.2)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7c3aed'
                }}>
                  <Icon size={24} />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#22c55e',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}>
                  <TrendingUp size={16} />
                  {stat.change}
                </div>
              </div>
              <div className={`admin-stat-value ${stat.color}`} style={{ marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div className="admin-stat-label">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-grid admin-grid-2">
        <div className="admin-card">
          <h2 className="admin-card-title">Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'rgba(124, 58, 237, 0.1)',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: 'rgba(124, 58, 237, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7c3aed'
                }}>
                  <Activity size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>
                    Activity Item {i}
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                    Description of activity {i}
                  </div>
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                  {i}h ago
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="admin-card-title">Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="admin-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              View All Users
            </button>
            <button className="admin-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Manage Businesses
            </button>
            <button className="admin-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              Generate Report
            </button>
            <button className="admin-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
