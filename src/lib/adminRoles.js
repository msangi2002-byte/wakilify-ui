/**
 * Admin RBAC: which areas each admin role can access.
 * Must match backend AdminAccessService.
 */
export const ADMIN_ROLES = ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT_AGENT', 'FINANCE_MANAGER'];

/** Path segment (or base path) -> area name for route guard */
export const PATH_TO_AREA = {
  '': 'DASHBOARD',
  map: 'MAP',
  users: 'USERS',
  agents: 'AGENTS',
  businesses: 'BUSINESSES',
  products: 'PRODUCTS',
  orders: 'ORDERS',
  payments: 'PAYMENTS',
  withdrawals: 'WITHDRAWALS',
  'user-withdrawals': 'USER_WITHDRAWALS',
  promotions: 'PROMOTIONS',
  reports: 'REPORTS',
  'audit-logs': 'AUDIT_LOGS',
  'agent-packages': 'AGENT_PACKAGES',
  settings: 'SETTINGS',
};

/** Areas each role can access. SUPER_ADMIN: all (use '*' or check path in list) */
const AREAS_BY_ROLE = {
  SUPER_ADMIN: null, // null = all
  MODERATOR: ['DASHBOARD', 'REPORTS', 'PROMOTIONS'],
  SUPPORT_AGENT: ['DASHBOARD', 'USERS', 'ORDERS', 'AGENTS', 'BUSINESSES', 'PRODUCTS'],
  FINANCE_MANAGER: ['DASHBOARD', 'PAYMENTS', 'WITHDRAWALS', 'USER_WITHDRAWALS'],
};

export function getEffectiveAdminRole(user) {
  if (!user || user.role !== 'ADMIN') return null;
  return user.adminRole || 'SUPER_ADMIN';
}

export function canAccessArea(adminRole, area) {
  if (!adminRole || !area) return false;
  if (adminRole === 'SUPER_ADMIN') return true;
  const allowed = AREAS_BY_ROLE[adminRole];
  if (!allowed) return false;
  return allowed.includes(area);
}

export function canAccessPath(adminRole, pathname) {
  if (!adminRole) return false;
  const base = pathname.replace(/^\/admin\/?/, '').split('/')[0] || '';
  const area = PATH_TO_AREA[base];
  if (!area) return true; // e.g. unknown path, allow and let backend decide
  return canAccessArea(adminRole, area);
}

/** Filter nav items to only those the role can access */
export function filterNavGroupsByRole(navGroups, adminRole) {
  if (!adminRole || adminRole === 'SUPER_ADMIN') return navGroups;
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const path = item.to.replace(/^\/admin\/?/, '').split('/')[0] || '';
        const area = PATH_TO_AREA[path];
        return area ? canAccessArea(adminRole, area) : true;
      });
    }))
    .filter((group) => group.items.length > 0);
}
