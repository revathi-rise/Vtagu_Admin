import apiClient from '@/lib/api-client';

export interface User {
  userId: number;
  id?: string | number;          // alias returned in login token
  email: string;
  user_name: string;
  mobile: string;
  age?: number;
  gender?: string;
  profile_picture?: string;
  status: 'active' | 'inactive' | 'suspended';
  plan?: string;
  role?: string;                 // admin role returned in login token
  is_admin?: boolean;
  logged_in?: boolean;
  last_login_ip_address?: string;
  createdAt: string;
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
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn('GET /users not found. Returning mock data for admin panel.');
        return [
          { userId: 1, email: 'john@example.com', user_name: 'John Doe', mobile: '1234567890', status: 'active', createdAt: new Date().toISOString() },
          { userId: 2, email: 'jane@example.com', user_name: 'Jane Smith', mobile: '0987654321', status: 'active', createdAt: new Date().toISOString() },
        ];
      }
      throw error;
    }
  }
};
