/**
 * Trigger a toast from any admin page.
 * Usage: import { showAdminToast } from '@/lib/adminToast';
 *        showAdminToast('User banned', 'success');
 *        showAdminToast('Something failed', 'error');
 */
export function showAdminToast(message, type = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('admin:toast', { detail: { message, type } })
  );
}
