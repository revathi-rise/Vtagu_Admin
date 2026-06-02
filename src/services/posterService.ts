import apiClient from '@/lib/api-client';

export interface Poster {
  poster_id: number;
  poster_title: string;
  description: string;
  genres_list: string;
  path: string;
  trailer_url?: string;
  link?: string;
  languages: string;
  page_type: 'home' | 'movies' | 'series' | 'interactive' | 'language';
  reference_id?: number;
  reference_type?: 'movie' | 'series' | 'interactive' | 'none';
  status: 'A' | 'I'; // 'A' for active, 'I' for inactive
  createdon?: string;
}

export const posterService = {
  getAll: async (filters?: { limit?: number; page_type?: string; language?: string }): Promise<Poster[]> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.page_type) params.append('page_type', filters.page_type);
      if (filters.language) params.append('language', filters.language);
    }
    const queryString = params.toString();
    const url = queryString ? `/posters?${queryString}` : '/posters';
    
    const response = await apiClient.get<{ status: boolean; message: string; data: Poster[] }>(url);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Poster> => {
    const response = await apiClient.get<{ status: boolean; message: string; data: Poster }>(`/posters/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<Poster>): Promise<Poster> => {
    const response = await apiClient.post<{ status: boolean; message: string; data: Poster }>('/posters', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Poster>): Promise<Poster> => {
    const response = await apiClient.put<{ status: boolean; message: string; data: Poster }>(`/posters/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/posters/${id}`);
  }
};
