/**
 * Admin RBAC: which areas each admin role can access.
 * Must match backend AdminAccessService.
 */
export const ADMIN_ROLES = ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT_AGENT', 'FINANCE_MANAGER'];

/** Human-readable labels for UI */
export const ADMIN_ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  MODERATOR: 'Moderator',
  SUPPORT_AGENT: 'Support',
  FINANCE_MANAGER: 'Finance',
};

export function getAdminRoleLabel(adminRole) {
  return ADMIN_ROLE_LABELS[adminRole || 'SUPER_ADMIN'] || adminRole || 'Super Admin';
}

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
  roles: 'ROLES_ACCESS',
};

/** Human-readable labels for areas (for Roles & Access page). Must match backend AdminArea. */
export const AREA_LABELS = {
  DASHBOARD: 'Dashboard',
  DASHBOARD_CHARTS: 'Dashboard Charts',
  MAP: 'Map',
  MEDIA_STATS: 'Media Stats',
  TRANSACTION_REPORTS: 'Transaction Reports',
  ANALYTICS: 'Analytics',
  EXPORT_USERS: 'Export Users',
  EXPORT_BUSINESSES: 'Export Businesses',
  USERS: 'Users',
  AGENTS: 'Agents',
  BUSINESSES: 'Businesses',
  PRODUCTS: 'Products',
  ORDERS: 'Orders',
  PAYMENTS: 'Payments',
  WITHDRAWALS: 'Withdrawals',
  USER_WITHDRAWALS: 'User Withdrawals',
  PROMOTIONS: 'Promotions',
  REPORTS: 'Reports',
  AUDIT_LOGS: 'Audit Logs',
  SETTINGS: 'Settings',
  AGENT_PACKAGES: 'Agent Packages',
  IMPERSONATE: 'Impersonate',
  ROLE_DEFINITIONS: 'Role Definitions',
  ROLES_ACCESS: 'Roles & Access',
};

/** All area keys from backend (for add/edit role form) */
export const ALL_AREA_KEYS = Object.keys(AREA_LABELS).filter((k) => k !== 'ROLES_ACCESS');

/** Get list of area keys this role can access. When roleDefs from API: use def.areas; else fallback. */
export function getAreasForRole(adminRole, roleDefs = null) {
  const allAreas = Object.keys(AREA_LABELS).filter((k) => k !== 'ROLES_ACCESS');
  if (!adminRole) return [];
  if (adminRole === 'SUPER_ADMIN') return [...allAreas];
  if (roleDefs) {
    const def = roleDefs.find((r) => r.code === adminRole);
    return def?.areas || [];
  }
  const fallback = { MODERATOR: ['DASHBOARD', 'REPORTS', 'PROMOTIONS'], SUPPORT_AGENT: ['DASHBOARD', 'USERS', 'ORDERS', 'AGENTS', 'BUSINESSES', 'PRODUCTS'], FINANCE_MANAGER: ['DASHBOARD', 'PAYMENTS', 'WITHDRAWALS', 'USER_WITHDRAWALS'] };
  return fallback[adminRole] || [];
}

/** Build ADMIN_ROLES and ADMIN_ROLE_LABELS from API role definitions */
export function buildRoleMaps(roleDefs) {
  const roles = roleDefs?.map((r) => r.code) || ['SUPER_ADMIN', 'MODERATOR', 'SUPPORT_AGENT', 'FINANCE_MANAGER'];
  const labels = {};
  roleDefs?.forEach((r) => { labels[r.code] = r.displayName || r.code; });
  return { roles, labels };
}

export function getEffectiveAdminRole(user) {
  if (!user || user.role !== 'ADMIN') return null;
  return user.adminRole || 'SUPER_ADMIN';
}

export function canAccessArea(adminRole, area, roleDefs = null) {
  if (!adminRole || !area) return false;
  if (adminRole === 'SUPER_ADMIN') return true;
  const allowed = getAreasForRole(adminRole, roleDefs);
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
export function filterNavGroupsByRole(navGroups, adminRole, roleDefs = null) {
  if (!adminRole || adminRole === 'SUPER_ADMIN') return navGroups;
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const path = item.to.replace(/^\/admin\/?/, '').split('/')[0] || '';
        const area = PATH_TO_AREA[path];
        return area ? canAccessArea(adminRole, area, roleDefs) : true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
