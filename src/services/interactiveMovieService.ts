import apiClient from '@/lib/api-client';

export interface InteractiveMovie {
  interactive_movie_id: number;
  title: string;
  description?: string;
  banner_image?: string | null;
  card_image?: string | null;
  trailer_video_url?: string | null;
  languages?: string | null;
  created_at?: string;
}

export const interactiveMovieService = {
  getAll: async (): Promise<InteractiveMovie[]> => {
    const response = await apiClient.get<{ status: string; total_count: number; data: InteractiveMovie[] }>('/interactive-movies');
    if (response.data.status === 'success' || (response.data as any).status === true) {
      return response.data.data;
    }
    return [];
  },

  getById: async (id: number): Promise<InteractiveMovie> => {
    const response = await apiClient.get<{ status: string; data: InteractiveMovie }>(`/interactive-movies/${id}`);
    return response.data.data;
  },

  create: async (data: Partial<InteractiveMovie>): Promise<InteractiveMovie> => {
    const response = await apiClient.post<{ status: string; data: InteractiveMovie }>('/interactive-movies', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<InteractiveMovie>): Promise<InteractiveMovie> => {
    const response = await apiClient.put<{ status: string; data: InteractiveMovie }>(`/interactive-movies/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/interactive-movies/${id}`);
  }
};
