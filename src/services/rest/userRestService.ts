import { IUserService } from '../api/interfaces';
import { User } from '@/models/types';
import { apiFetch } from './apiClient';

export class UserRestService implements IUserService {
  async getUsers(): Promise<User[]> {
    return apiFetch<User[]>('/users');
  }

  async getUserById(id: number): Promise<User | null> {
    return apiFetch<User>(`/users/${id}`);
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    return apiFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return apiFetch<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number): Promise<boolean> {
    await apiFetch(`/users/${id}`, { method: 'DELETE' });
    return true;
  }
}

export const userService = new UserRestService();
