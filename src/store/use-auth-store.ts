import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/services/userService';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token);
        }
        set({ user, token });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
        }
        set({ user: null, token: null });
      },
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        // Super Master (type '1') has all permissions
        if (String(user.type) === '1') return true;
        // Admins check their specific permissions
        return user.permissions?.includes(permission) ?? false;
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
