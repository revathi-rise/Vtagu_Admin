import apiClient from '@/lib/api-client';

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export const planService = {
  getAll: async () => {
    const response = await apiClient.get<{ status: boolean; data: Plan[] }>('/plans');
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: Plan }>(`/plans/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Plan>) => {
    const response = await apiClient.post<{ status: boolean; data: Plan }>('/plans', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Plan>) => {
    const response = await apiClient.patch<{ status: boolean; data: Plan }>(`/plans/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/plans/${id}`);
  },
};
