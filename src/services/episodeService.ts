import apiClient from '@/lib/api-client';

export interface EpisodeMedia {
  url: string;
  alt: string;
}

export interface Episode {
  id: number;
  season_id: number;
  episode_number: number;
  title: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  duration?: string;
  languages?: string;
  rating?: number;
  isFeatured?: boolean;
  isFree?: boolean;
  viewCount?: number;
  media?: {
    poster_image?: EpisodeMedia;
    card_image?: EpisodeMedia;
    video?: EpisodeMedia;
    trailer?: EpisodeMedia;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface EpisodePayload {
  season_id: number;
  episode_number: number;
  title: string;
  slug: string;
  description_short: string;
  description_long: string;
  duration: string;
  languages?: string;
  url: string;
  trailer_url?: string;
  trailer_alt?: string;
  poster_image?: string;
  card_image?: string;
  poster_alt?: string;
  rating?: number;
  featured?: boolean;
  free?: boolean;
}

export const episodeService = {
  getAll: async (seasonId?: number) => {
    try {
      const url = seasonId ? `/episodes?season_id=${seasonId}` : '/episodes';
      const response = await apiClient.get<{ status: boolean; data: Episode[] }>(url);
      return response.data.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) return [];
      throw error;
    }
  },

  getById: async (id: number) => {
    const response = await apiClient.get<{ status: boolean; data: Episode }>(`/episodes/${id}`);
    return response.data.data;
  },

  create: async (data: EpisodePayload) => {
    const response = await apiClient.post<{ status: boolean; data: Episode }>('/episodes', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<EpisodePayload>) => {
    const response = await apiClient.patch<{ status: boolean; data: Episode }>(`/episodes/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete<{ status: boolean; message: string; data: null }>(`/episodes/${id}`);
    return response.data;
  },
};
