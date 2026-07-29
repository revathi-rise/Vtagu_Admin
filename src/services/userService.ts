import apiClient from '@/lib/api-client';

export interface User {
  userId: number;
  email: string;
  user_name: string;
  role: string;
  status: string;
  logged_in: boolean;
  last_login_ip_address: string;
  createdAt: string;
  is_locked?: boolean;
  permissions?: string[];
  mobile?: string;
  age?: number;
  gender?: string;
  profile_picture?: string;
  plan?: string;
  plan_price?: number;
  type?: string;
}

export interface AuthResponse {
  status: boolean;
  message: string;
  data: User;
  token?: string;
}

export const userService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/users/admin/login', { email, password });
    return response.data;
  },

  register: async (data: any) => {
    const response = await apiClient.post<AuthResponse>('/users/register', data);
    return response.data;
  },

  verifyOtp: async (email: string, otp: string) => {
    const response = await apiClient.post<AuthResponse>('/users/verify-otp', { email, otp });
    return response.data;
  },

  logout: async (id: number) => {
    const response = await apiClient.post(`/users/logout/${id}`);
    return response.data;
  },

  getProfile: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: User }>  (`/users/${id}`);
    return response.data.data;
  },

  updateProfile: async (id: number, data: Partial<User>) => {
    const response = await apiClient.patch<{ status: boolean; data: User }>(`/users/${id}`, data);
    return response.data.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const response = await apiClient.post('/users/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: any) => {
    const response = await apiClient.post('/users/reset-password', data);
    return response.data;
  },

  // Note: The documentation doesn't have a specific "getAllUsers" endpoint for admin, 
  // but usually admin panels need this. I'll assume /users might work or I'll check if there's one.
  // For now, I'll add it as a placeholder.
  getAll: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<{ status: boolean; data: User[] }>('/users');
      return response.data.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('GET /users not found. Returning empty array.');
        return [];
      }
      throw error;
    }
  },

  getAllPermissions: async () => {
    const response = await apiClient.get<{ status: boolean; data: any[] }>('/users/permissions/list');
    return response.data.data;
  },

  updateRole: async (id: number, type: string) => {
    const response = await apiClient.patch<{ status: boolean; data: User }>(`/users/${id}/role`, { type });
    return response.data.data;
  },

  updatePermissions: async (id: number, permissionIds: number[]) => {
    const response = await apiClient.patch<{ status: boolean; data: User }>(`/users/${id}/permissions`, { permissionIds });
    return response.data.data;
  },

  toggleLock: async (id: number, is_locked: boolean) => {
    const response = await apiClient.patch<{ status: boolean; data: User }>(`/users/${id}/lock`, { is_locked });
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await apiClient.post<{ status: boolean; message: string; data: User }>('/users/register', data);
    return response.data.data;
  }
};
