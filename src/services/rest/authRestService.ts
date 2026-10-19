import { IAuthService } from '../api/interfaces';
import { User } from '@/models/types';
import { apiFetch, saveToken, clearToken, AuthError, NetworkError, ServerError } from './apiClient';
import { db } from '../offline/db';

const USER_CACHE_KEY = 'alince_user';

function saveUserCache(user: User) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

function loadUserCache(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function clearUserCache() {
  localStorage.removeItem(USER_CACHE_KEY);
}

export class AuthRestService implements IAuthService {
  async login(username: string, password: string): Promise<User> {
    // Backend returns { token, user }
    const data = await apiFetch<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Persist the token so all subsequent requests send Authorization: Bearer <token>
    saveToken(data.token);
    saveUserCache(data.user);

    return data.user;
  }

  async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore errors on logout
    } finally {
      clearToken();
      clearUserCache();
      try {
        await db.cache.clear();
      } catch {
        // ignore cache clear errors
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('alince_jwt');
    if (!token) {
      // No token — definitely not logged in
      return null;
    }

    try {
      const result = await apiFetch<User & { freshToken?: string }>('/auth/me');
      // If the backend issued a refreshed token, save it
      if (result.freshToken) {
        saveToken(result.freshToken);
      }
      const user: User = { ...result };
      delete (user as User & { freshToken?: string }).freshToken;
      saveUserCache(user);
      return user;
    } catch (err) {
      if (err instanceof AuthError) {
        // Real 401 — token is invalid/expired. Clear everything.
        clearToken();
        clearUserCache();
        return null;
      }
      if (err instanceof NetworkError || err instanceof ServerError) {
        // Transient problem — return the cached user so the app stays open
        return loadUserCache();
      }
      // Other unexpected errors — treat as network issue, keep user
      return loadUserCache();
    }
  }

  // No-op in REST mode — demo data reset only makes sense for localStorage mock
  async resetDemoData(): Promise<void> {
    return Promise.resolve();
  }
}

export const authService = new AuthRestService();
