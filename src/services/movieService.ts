import apiClient from '@/lib/api-client';

export interface Movie {
  id: number;
  title: string;
  slug: string;
  description_short: string;
  description_long: string;
  year: number;
  country_id?: string;
  rating: string;
  genre_id?: string;
  age_group?: string;
  actors?: string;
  director?: string;
  featured: boolean;
  free: boolean;
  movie_type: string;
  type: string;
  age_restriction?: string;
  kids_restriction?: string;
  url: string;
  trailer_url?: string;
  movie_image: string;
  duration: string;
  languages?: string;
  view_count: number;
  is_interactive: boolean;
  created_at: string;
  updated_at: string;
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
