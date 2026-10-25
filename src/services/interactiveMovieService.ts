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
  is_free?: number;
  kids_restriction?: number | boolean;
  price?: number;
  currency?: string;
  is_revenue_managed?: number | boolean;
  isRevenueManaged?: number | boolean;
  certificate_id?: number | null;
  certificateId?: number | null;
  quality?: string | null;
  play_quality?: string | null;
  director?: string | null;
  actors?: string | null;
  duration?: string | null;
  year?: number | null;
  genre_id?: string | null;
  genres?: string | null;
  total_endings?: number | null;
  certificate?: {
    id: number;
    code: string;
    name: string;
    certification_system: string;
    maturity_level?: string;
    badge_color?: string;
  } | null;
  is_svod_eligible?: number;
  revenue_share_percent?: number;
}

export const interactiveMovieService = {
  getAll: async (limit?: number): Promise<InteractiveMovie[]> => {
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
