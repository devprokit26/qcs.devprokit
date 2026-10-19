import { IAuthService } from '../api/interfaces';
import { User, PageKey } from '@/models/types';
import { storage } from './storage';

// All permissions the protected admin MUST always have.
// Add new PageKeys here when new modules are introduced.
const ADMIN_ALL_PERMISSIONS: PageKey[] = [
  'dashboard',
  'shipments',
  'weightproforma',
  'ledger',
  'alerts',
  'reports',
  'cartons',
  'expenses',
  'users-management',
];

/** Silently upgrade a stored user's permissions if new PageKeys have been added */
function migrateUser(user: User): User {
  if (!user.protected) return user;
  const missing = ADMIN_ALL_PERMISSIONS.filter(p => !user.permissions.includes(p));
  if (missing.length === 0) return user;
  const upgraded: User = { ...user, permissions: ADMIN_ALL_PERMISSIONS };
  // Persist the upgrade so it's picked up next time too
  const allUsers = storage.getUsers().map(u => u.id === upgraded.id ? upgraded : u);
  storage.setUsers(allUsers);
  return upgraded;
}

export class AuthMockService implements IAuthService {
  async login(username: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const users = storage.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const matched = users.find(
      u => u.username.toLowerCase() === cleanUsername && u.password === password
    );

    if (!matched) {
      throw new Error('Incorrect username or password. Please try again.');
    }

    const migrated = migrateUser(matched);
    storage.setCurrentUserId(migrated.id);
    return migrated;
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    storage.setCurrentUserId(null);
  }

  async getCurrentUser(): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const currentId = storage.getCurrentUserId();
    if (!currentId) return null;
    const users = storage.getUsers();
    const user = users.find(u => u.id === currentId) || null;
    if (!user) return null;
    return migrateUser(user);
  }

  async resetDemoData(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    storage.resetAllToSeed();
  }
}

export const authService = new AuthMockService();

