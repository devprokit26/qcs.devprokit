import { useState, useEffect, useCallback } from 'react';
import { User } from '@/models/types';
import { userService, authService } from '@/services';
import toast from 'react-hot-toast';

export function useUsersController() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [userList, cur] = await Promise.all([
        userService.getUsers(),
        authService.getCurrentUser(),
      ]);
      setUsers(userList);
      setCurrentUser(cur);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createUser = async (data: Omit<User, 'id'>) => {
    try {
      const created = await userService.createUser(data);
      toast.success(`User "${created.name}" created!`);
      await loadData();
      return created;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
      return null;
    }
  };

  const updateUser = async (id: number, data: Partial<User>) => {
    try {
      const updated = await userService.updateUser(id, data);
      toast.success(`User "${updated.name}" updated!`);
      await loadData();
      return updated;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
      return null;
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await userService.deleteUser(id);
      toast.success('User removed');
      await loadData();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
      return false;
    }
  };

  return {
    users,
    currentUser,
    loading,
    createUser,
    updateUser,
    deleteUser,
    refresh: loadData,
  };
}
