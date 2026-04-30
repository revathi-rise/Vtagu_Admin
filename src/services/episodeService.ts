import apiClient from '@/lib/api-client';

export interface Episode {
  episodeId: number;
  seasonId: number;
  title: string;
  url: string;
  image?: string;
  duration?: string;
  episode_number?: number;
  description?: string;
  created_at?: string;
}

export const episodeService = {
  getAll: async () => {
    try {
      const response = await apiClient.get<Episode[]>('/episodes');
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Episode>(`/episodes/${id}`);
    return response.data;
  },

  create: async (data: Partial<Episode>) => {
    const response = await apiClient.post<Episode>('/episodes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Episode>) => {
    const response = await apiClient.patch<Episode>(`/episodes/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<{ message: string }>(`/episodes/${id}`);
    return response.data;
  }
};
