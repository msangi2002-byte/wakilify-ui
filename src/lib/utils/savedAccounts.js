/**
 * Saved login accounts – store user identifiers (no password) for quick re-login.
 * Similar to Facebook: tap account to pre-fill email/phone, user enters password.
 */

const STORAGE_KEY = 'wakilify_saved_accounts';
const MAX_ACCOUNTS = 5;

/** @typedef {{ id: string, name: string, profilePic?: string, emailOrPhone: string }} SavedAccount */

/**
 * Get saved accounts from localStorage.
 * @returns {SavedAccount[]}
 */
export function getSavedAccounts() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_ACCOUNTS) : [];
  } catch {
    return [];
  }
}

/**
 * Add or update a saved account. Keeps most recent first, max MAX_ACCOUNTS.
 * @param {SavedAccount} account
 */
export function addSavedAccount(account) {
  if (!account?.id || !account?.emailOrPhone) return;
  let list = getSavedAccounts();
  list = list.filter((a) => a.id !== account.id && a.emailOrPhone !== account.emailOrPhone);
  list.unshift({
    id: account.id,
    name: account.name || 'User',
    profilePic: account.profilePic ?? null,
    emailOrPhone: account.emailOrPhone,
  });
  list = list.slice(0, MAX_ACCOUNTS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

/**
 * Remove a saved account by id or emailOrPhone.
 * @param {{ id?: string, emailOrPhone?: string }} criteria
 */
export function removeSavedAccount(criteria) {
  let list = getSavedAccounts();
  if (criteria?.id) list = list.filter((a) => a.id !== criteria.id);
  else if (criteria?.emailOrPhone)
    list = list.filter((a) => a.emailOrPhone !== criteria.emailOrPhone);
  else return;
  try {
    if (list.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}
