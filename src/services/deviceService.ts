import apiClient from '@/lib/api-client';

export interface Device {
  id: number;
  userId: number;
  device_id: string;
  device_name: string;
  device_type: string;
  os: string;
  os_version?: string;
  app_version?: string;
  is_active: boolean;
  last_active: string;
  created_at: string;
}

export const deviceService = {
  getByUser: async (userId: number) => {
    const response = await apiClient.get<{ status: boolean; data: Device[] }>(`/user-devices/user/${userId}`);
    return response.data.data;
  },

  getActiveByUser: async (userId: number) => {
    const response = await apiClient.get<{ status: boolean; data: Device[] }>(`/user-devices/user/${userId}/active`);
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: Device }>(`/user-devices/${id}`);
    return response.data.data;
  },

  register: async (data: Partial<Device>) => {
    const response = await apiClient.post<{ status: boolean; data: Device }>('/user-devices/register', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Device>) => {
    const response = await apiClient.patch<{ status: boolean; data: Device }>(`/user-devices/${id}`, data);
    return response.data.data;
  },

  deactivate: async (id: number) => {
    const response = await apiClient.post<{ status: boolean; message: string }>(`/user-devices/${id}/deactivate`);
    return response.data;
  },

  remove: async (id: number) => {
    const response = await apiClient.delete<{ status: boolean; message: string }>(`/user-devices/${id}`);
    return response.data;
  },

  logoutOthers: async (userId: number, deviceId: string) => {
    const response = await apiClient.post<{ status: boolean; message: string }>(`/user-devices/user/${userId}/logout-others/${deviceId}`);
    return response.data;
  }
};
