import apiClient from '@/lib/api-client';

export interface Genre {
  genre_id: number | string;
  genre_name: string;
  in_home: string;
  path?: string;
  name?: string; // fallback
  slug?: string;
  status?: string;
}

export const genreService = {
  getAll: async (limit?: number) => {
    const url = limit ? `/genres?limit=${limit}` : '/genres';
    const response = await apiClient.get<{ status: boolean; data: Genre[] }>(url);
    return response.data.data;
  },

  getHomeGenres: async (limit: number = 10) => {
    const response = await apiClient.get<{ status: boolean; data: Genre[] }>(`/genres/home?limit=${limit}`);
    return response.data.data;
  }
};
