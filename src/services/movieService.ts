import apiClient from '@/lib/api-client';

export interface Movie {
  id: number;
  movie_name: string;
  slug: string;
  movie_poster: string;
  movie_desc?: string;
  movie_trailer?: string;
  movie_video?: string;
  genre?: string;
  cast_name?: string;
  director_name?: string;
  rating?: string;
  duration?: string;
  release_date?: string;
  title?: string; // fallback
  movie_image?: string; // fallback
  created_at?: string;
  updated_at?: string;
  featured?: boolean;
  view_count?: number;
  type?: string;
  movie_type?: string;
}

export const movieService = {
  getAll: async () => {
    const response = await apiClient.get<{ status: boolean; data: Movie[] }>('/movies');
    return response.data.data;
  },
  
  getById: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: Movie }>(`/movies/${id}`);
    return response.data.data;
  },
  
  create: async (data: Partial<Movie>) => {
    const response = await apiClient.post<{ status: boolean; data: Movie }>('/movies', data);
    return response.data.data;
  },
  
  update: async (id: number, data: Partial<Movie>) => {
    const response = await apiClient.put<{ status: boolean; data: Movie }>(`/movies/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: number) => {
    await apiClient.delete(`/movies/${id}`);
  },

  toggleFeatured: async (id: number, featured: boolean) => {
    const response = await apiClient.patch<{ status: boolean; data: Movie }>(`/movies/${id}/featured`, { featured });
    return response.data.data;
  },

  getTrending: async (limit: number = 10) => {
    const response = await apiClient.get<{ status: boolean; data: Movie[] }>(`/movies/trending?limit=${limit}`);
    return response.data.data;
  }
};
