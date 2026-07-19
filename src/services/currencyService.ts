import apiClient from '@/lib/api-client';

export interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  paypal_supported: boolean;
  stripe_supported: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const currencyService = {
  getAll: async (): Promise<Currency[]> => {
    const response = await apiClient.get<{ status: boolean; data: Currency[] }>('/currencies');
    const data = response.data?.data || response.data || [];
    return data.map(c => c.code.toUpperCase() === 'INR' ? { ...c, symbol: '₹' } : c);
  },

  getById: async (id: number): Promise<Currency> => {
    const response = await apiClient.get<{ status: boolean; data: Currency }>(`/currencies/${id}`);
    const data = response.data?.data || response.data;
    if (data && data.code && data.code.toUpperCase() === 'INR') {
      data.symbol = '₹';
    }
    return data;
  },

  create: async (data: Partial<Currency>): Promise<Currency> => {
    const response = await apiClient.post<{ status: boolean; data: Currency }>('/currencies', data);
    return response.data?.data || response.data;
  },

  update: async (id: number, data: Partial<Currency>): Promise<Currency> => {
    const response = await apiClient.put<{ status: boolean; data: Currency }>(`/currencies/${id}`, data);
    return response.data?.data || response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/currencies/${id}`);
  }
};
