import { PageKey, User } from '@/models/types';

/** The only page that can NEVER be handed out to a normal user. */
export const ADMIN_ONLY_PAGE: PageKey = 'users-management';

/** Administrator = the protected default account (or the built-in "admin" username). */
export function isAdminUser(user: Pick<User, 'username' | 'protected'> | null | undefined): boolean {
  if (!user) return false;
  return !!user.protected || user.username === 'admin';
}

/** Can this user open this page? Admin sees everything; the Users page is admin-only. */
export function canAccessPage(user: User | null | undefined, page: PageKey): boolean {
  if (!user) return false;
  if (isAdminUser(user)) return true;
  if (page === ADMIN_ONLY_PAGE) return false;
  return user.permissions.includes(page);
}
