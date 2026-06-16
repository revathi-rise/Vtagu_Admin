import apiClient from '@/lib/api-client';

export interface MovieMedia {
  url: string;
  alt: string;
}

export interface Movie {
  id: number;
  title: string;
  movie_name: string;
  slug: string;
  shortDescription?: string;
  movie_desc?: string;
  description_short?: string;
  longDescription?: string;
  description_long?: string;
  releaseYear?: number;
  year?: number;
  release_date?: string;
  countryId?: number;
  country_id?: number;
  rating?: number;
  genreId?: number;
  genre_id?: number;
  genre_name?: string;
  ageGroup?: string | null;
  actors?: string;
  cast_name?: string;
  director?: string;
  director_name?: string;
  isFeatured?: boolean;
  featured?: boolean;
  isFree?: boolean;
  free?: boolean;
  movieType?: string | null;
  contentType?: string | null;
  ageRestriction?: string | null;
  kidsRestriction?: boolean;
  duration?: string;
  languages?: string;
  viewCount?: number;
  isInteractive?: boolean;
  is_interactive?: boolean;
  interactiveMap?: unknown;
  media?: {
    image?: MovieMedia;
    card_image?: MovieMedia;
    video?: MovieMedia;
    trailer?: MovieMedia;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Payload shape for creating / updating movies
export interface MoviePayload {
  title: string;
  movie_name?: string;
  slug?: string;
  description_short?: string;
  description_long?: string;
  movie_desc?: string;
  year?: number;
  release_date?: string;
  duration?: string;
  rating?: number;
  genre_id?: number;
  genre?: string;
  country_id?: number;
  languages?: string;
  actors?: string;
  cast_name?: string;
  director?: string;
  director_name?: string;
  featured?: boolean;
  free?: boolean;
  age_restriction?: string;
  kids_restriction?: boolean;
  is_interactive?: boolean;
  media?: {
    image?: { url: string; alt?: string };
    card_image?: { url: string; alt?: string };
    video?: { url: string; alt?: string };
    trailer?: { url: string; alt?: string };
  };
}


export const movieService = {
  getAll: async () => {
    const response = await apiClient.get<{ status: boolean; data: Movie[] }>('/movies');
    return response.data?.data || response.data || [];
  },
  
  getById: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: Movie }>(`/movies/${id}`);
    return response.data?.data || response.data;
  },

  getBySlug: async (slug: string) => {
    const response = await apiClient.get<{ status: boolean; data: Movie }>(`/movies/${slug}`);
    return response.data?.data || response.data;
  },
  
  create: async (data: Partial<MoviePayload>) => {
    const response = await apiClient.post<{ status: boolean; data: Movie }>('/movies', data);
    return response.data?.data || response.data;
  },
  
  update: async (id: number, data: Partial<MoviePayload>) => {
    const response = await apiClient.put<{ status: boolean; data: Movie }>(`/movies/${id}`, data);
    return response.data?.data || response.data;
  },
  
  delete: async (id: number) => {
    await apiClient.delete(`/movies/${id}`);
  },

  toggleFeatured: async (id: number, featured: boolean) => {
    const response = await apiClient.patch<{ status: boolean; data: Movie }>(`/movies/${id}/featured`, { featured });
    return response.data?.data || response.data;
  },

  getTrending: async (limit: number = 10) => {
    const response = await apiClient.get<{ status: boolean; data: Movie[] }>(`/movies/trending?limit=${limit}`);
    return response.data?.data || response.data || [];
  }
};
