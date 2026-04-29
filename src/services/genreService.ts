import apiClient from '@/lib/api-client';

export interface Genre {
  genre_id: string;
  name: string;
  slug: string;
  image?: string;
  status?: string;
}

export const genreService = {
  getAll: async () => {
    const response = await apiClient.get<{ status: boolean; data: Genre[] }>('/genres');
    return response.data.data;
  },

  getHomeGenres: async (limit: number = 10) => {
    const response = await apiClient.get<{ status: boolean; data: Genre[] }>(`/genres/home?limit=${limit}`);
    return response.data.data;
  }
};
