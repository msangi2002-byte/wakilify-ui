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

export function getAdminRoleLabel(adminRole, roleDefs = null) {
  if (roleDefs?.length) {
    const def = roleDefs.find((r) => r.code === (adminRole || 'SUPER_ADMIN'));
    if (def?.displayName) return def.displayName;
  }
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
  'audience-analytics': 'AUDIENCE_ANALYTICS',
  reports: 'REPORTS',
  'audit-logs': 'AUDIT_LOGS',
  'agent-packages': 'AGENT_PACKAGES',
  'business-registration-plans': 'BUSINESS_REGISTRATION_PLANS',
  settings: 'SETTINGS',
  roles: 'ROLE_DEFINITIONS',  // Backend area; only Super Admin can manage roles
};

/** Human-readable labels for areas (for Roles & Access page). Must match backend AdminArea. */
export const AREA_LABELS = {
  DASHBOARD: 'Dashboard',
  DASHBOARD_CHARTS: 'Dashboard Charts',
  MAP: 'Map',
  MEDIA_STATS: 'Media Stats',
  TRANSACTION_REPORTS: 'Transaction Reports',
  ANALYTICS: 'Analytics',
  AUDIENCE_ANALYTICS: 'Audience Analytics',
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
  BUSINESS_REGISTRATION_PLANS: 'Business Registration Plans',
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
  const fallback = { MODERATOR: ['DASHBOARD', 'REPORTS', 'PROMOTIONS', 'AUDIENCE_ANALYTICS'], SUPPORT_AGENT: ['DASHBOARD', 'USERS', 'ORDERS', 'AGENTS', 'BUSINESSES', 'PRODUCTS'], FINANCE_MANAGER: ['DASHBOARD', 'PAYMENTS', 'WITHDRAWALS', 'USER_WITHDRAWALS', 'DASHBOARD_CHARTS', 'TRANSACTION_REPORTS', 'ANALYTICS', 'AUDIENCE_ANALYTICS'] };
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

export function canAccessPath(adminRole, pathname, roleDefs = null) {
  if (!adminRole) return false;
  const base = pathname.replace(/^\/admin\/?/, '').split('/')[0] || '';
  const area = PATH_TO_AREA[base];
  if (!area) return true; // e.g. unknown path, allow and let backend decide
  return canAccessArea(adminRole, area, roleDefs);
}

/** Returns first allowed admin path (e.g. /admin/map) for redirect when dashboard not allowed */
export function getFirstAllowedAdminPath(adminRole, roleDefs = null) {
  if (!adminRole || adminRole === 'SUPER_ADMIN') return '/admin';
  const allowed = getAreasForRole(adminRole, roleDefs);
  const areaToPath = Object.entries(PATH_TO_AREA);
  for (const [pathSeg, area] of areaToPath) {
    if (area && allowed.includes(area)) return pathSeg ? `/admin/${pathSeg}` : '/admin';
  }
  return '/admin';
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

/** Check if path is allowed given list of area names from GET /admin/me/allowed-areas */
export function canAccessPathByAreas(pathname, allowedAreas = []) {
  if (!allowedAreas || allowedAreas.length === 0) return false;
  const base = pathname.replace(/^\/admin\/?/, '').split('/')[0] || '';
  const area = PATH_TO_AREA[base];
  if (!area) return true;
  return allowedAreas.includes(area);
}

/** First allowed path given area list from API (for redirect) */
export function getFirstAllowedAdminPathByAreas(allowedAreas = []) {
  if (!allowedAreas || allowedAreas.length === 0) return '/admin';
  const areaToPath = Object.entries(PATH_TO_AREA);
  for (const [pathSeg, area] of areaToPath) {
    if (area && allowedAreas.includes(area)) return pathSeg ? `/admin/${pathSeg}` : '/admin';
  }
  return '/admin';
}

/** Filter nav by allowed areas from API */
export function filterNavGroupsByAreas(navGroups, allowedAreas = []) {
  if (!allowedAreas || allowedAreas.length === 0) return navGroups;
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const path = item.to.replace(/^\/admin\/?/, '').split('/')[0] || '';
        const area = PATH_TO_AREA[path];
        return area ? allowedAreas.includes(area) : true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}
