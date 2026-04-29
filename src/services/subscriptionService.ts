import apiClient from '@/lib/api-client';

export interface Subscription {
  subscriptionId: number;
  userId: number;
  planId: number;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  payment_status: 'pending' | 'success' | 'failed';
  timestamp_from: string;
  timestamp_to: string;
  payment_method?: string;
  price_amount?: number;
  paid_amount?: number;
  currency?: string;
  txnId?: string;
}

export const subscriptionService = {
  getAll: async () => {
    const response = await apiClient.get<{ status: boolean; data: Subscription[] }>('/subscriptions');
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: Subscription }>(`/subscriptions/${id}`);
    return response.data.data;
  },

  getActiveByUser: async (userId: number) => {
    const response = await apiClient.get<{ status: boolean; data: Subscription | null }>(`/subscriptions/user/${userId}/active`);
    return response.data.data;
  },

  getHistoryByUser: async (userId: number) => {
    const response = await apiClient.get<{ status: boolean; data: Subscription[] }>(`/subscriptions/user/${userId}/history`);
    return response.data.data;
  },

  create: async (data: Partial<Subscription>) => {
    const response = await apiClient.post<{ status: boolean; data: Subscription }>('/subscriptions', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Subscription>) => {
    const response = await apiClient.patch<{ status: boolean; data: Subscription }>(`/subscriptions/${id}`, data);
    return response.data.data;
  },

  cancel: async (id: number) => {
    const response = await apiClient.delete<{ status: boolean; message: string }>(`/subscriptions/${id}`);
    return response.data;
  }
};
