import apiClient from '@/lib/api-client';

export interface Device {
  id: number;
  userId?: number;
  user_id?: number;
  device_id: string;
  device_name?: string;
  device_type?: string;
  os?: string;
  os_version?: string;
  app_version?: string;
  is_active: boolean | number;
  last_active?: string;
  created_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export const deviceService = {
  getAll: async (): Promise<Device[]> => {
    try {
      const response = await apiClient.get('/user-devices');
      const res = response.data;
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.devices)) return res.devices;
      if (Array.isArray(res?.result)) return res.result;
      return [];
    } catch (e) {
      try {
        const altResponse = await apiClient.get('/user_devices');
        const res = altResponse.data;
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.devices)) return res.devices;
        return [];
      } catch (err) {
        console.error('Failed to fetch user devices:', e, err);
        return [];
      }
    }
  },

  getByUser: async (userId: number) => {
    try {
      const response = await apiClient.get(`/user-devices/user/${userId}`);
      const res = response.data;
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    } catch (e) {
      return [];
    }
  },

  getActiveByUser: async (userId: number) => {
    try {
      const response = await apiClient.get(`/user-devices/user/${userId}/active`);
      const res = response.data;
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    } catch (e) {
      return [];
    }
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/user-devices/${id}`);
    return response.data?.data || response.data;
  },

  register: async (data: Partial<Device>) => {
    const response = await apiClient.post('/user-devices/register', data);
    return response.data?.data || response.data;
  },

  update: async (id: number, data: Partial<Device>) => {
    const response = await apiClient.patch(`/user-devices/${id}`, data);
    return response.data?.data || response.data;
  },

  deactivate: async (id: number) => {
    const response = await apiClient.post(`/user-devices/${id}/deactivate`);
    return response.data;
  },

  remove: async (id: number) => {
    try {
      const response = await apiClient.delete(`/user-devices/${id}`);
      return response.data;
    } catch (e) {
      const response = await apiClient.delete(`/user_devices/${id}`);
      return response.data;
    }
  },

  logoutOthers: async (userId: number, deviceId: string) => {
    const response = await apiClient.post(`/user-devices/user/${userId}/logout-others/${deviceId}`);
    return response.data;
  }
};
