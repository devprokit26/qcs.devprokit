import { IUserService } from '../api/interfaces';
import { User } from '@/models/types';
import { storage } from './storage';

export class UserMockService implements IUserService {
  async getUsers(): Promise<User[]> {
    await new Promise(r => setTimeout(r, 40));
    return storage.getUsers();
  }

  async getUserById(id: number): Promise<User | null> {
    await new Promise(r => setTimeout(r, 20));
    return storage.getUsers().find(u => u.id === id) || null;
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    await new Promise(r => setTimeout(r, 70));
    const users = storage.getUsers();

    if (users.some(u => u.username.toLowerCase() === data.username.trim().toLowerCase())) {
      throw new Error('Username is already taken');
    }

    const nextId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser: User = {
      id: nextId,
      ...data,
      permissions: (data.permissions || []).filter(k => k !== 'users-management'),
      username: data.username.trim().toLowerCase(),
      protected: false,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    storage.setUsers(users);
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    await new Promise(r => setTimeout(r, 60));
    const users = storage.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    const target = users[idx];

    if (data.username && data.username.trim().toLowerCase() !== target.username.toLowerCase()) {
      if (target.protected) {
        throw new Error('Protected administrator username cannot be changed');
      }
      const conflict = users.some(
        u => u.id !== id && u.username.toLowerCase() === data.username!.trim().toLowerCase()
      );
      if (conflict) throw new Error('Username is already taken');
    }

    const updated: User = {
      ...target,
      ...data,
      username: target.protected ? target.username : (data.username ? data.username.trim().toLowerCase() : target.username),
      permissions: target.protected
        ? ['dashboard', 'shipments', 'weightproforma', 'ledger', 'alerts', 'reports', 'cartons', 'expenses', 'users-management']
        : (data.permissions || target.permissions).filter(k => k !== 'users-management'),
      password: data.password ? data.password : target.password,
    };

    users[idx] = updated;
    storage.setUsers(users);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    await new Promise(r => setTimeout(r, 60));
    const users = storage.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) throw new Error('User not found');
    if (target.protected) {
      throw new Error('Default administrator account cannot be deleted');
    }

    const filtered = users.filter(u => u.id !== id);
    storage.setUsers(filtered);
    return true;
  }
}

export const userService = new UserMockService();
