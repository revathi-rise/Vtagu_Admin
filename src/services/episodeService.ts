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
    const response = await apiClient.get<{ status: boolean; data: Episode[] }>('/episodes');
    return response.data.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: Episode }>(`/episodes/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Episode>) => {
    const response = await apiClient.post<{ status: boolean; data: Episode }>('/episodes', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Episode>) => {
    const response = await apiClient.patch<{ status: boolean; data: Episode }>(`/episodes/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<{ status: boolean; message: string }>(`/episodes/${id}`);
    return response.data;
  }
};
