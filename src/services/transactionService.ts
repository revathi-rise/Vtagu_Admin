import apiClient from '@/lib/api-client';

export interface Transaction {
  id: number;
  txn_id: string;
  user_id: number;
  amount: string | number;
  status: string; // 'P' | 'C' | 'F'
  created_at: string;
}

export const transactionService = {
  getAll: async () => {
    const response = await apiClient.get<{ status: boolean; data: Transaction[] }>('/transactions');
    return response.data?.data || response.data || [];
  },

  getById: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: Transaction }>(`/transactions/${id}`);
    return response.data?.data || response.data;
  },

  create: async (data: Partial<Transaction>) => {
    const response = await apiClient.post<{ status: boolean; data: Transaction }>('/transactions', data);
    return response.data?.data || response.data;
  },

  update: async (id: number, data: Partial<Transaction>) => {
    const response = await apiClient.put<{ status: boolean; data: Transaction }>(`/transactions/${id}`, data);
    return response.data?.data || response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<{ status: boolean; message: string }>(`/transactions/${id}`);
    return response.data;
  }
};
