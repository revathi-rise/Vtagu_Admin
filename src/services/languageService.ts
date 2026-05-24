import apiClient from '@/lib/api-client';
import { Movie } from './movieService';

export interface Language {
  id: number;
  name: string;
  code: string;
  slug: string;
  is_visible: boolean;
}

export interface LanguageMoviesResponse {
  language: string;
  movies: Movie[];
}

export const languageService = {
  getAll: async (all = true): Promise<Language[]> => {
    const response = await apiClient.get<{ status: boolean; message: string; data: Language[] }>(
      `/languages?all=${all}`
    );
    return response.data.data;
  },

  getMoviesByLanguage: async (slug: string): Promise<LanguageMoviesResponse> => {
    const response = await apiClient.get<LanguageMoviesResponse>(`/languages/${slug}/movies`);
    return response.data;
  },

  create: async (data: { name: string; code: string; is_visible?: boolean }): Promise<Language> => {
    const response = await apiClient.post<{ status: boolean; data: Language }>('/languages', data);
    return response.data.data;
  },

  update: async (id: number, data: { name?: string; code?: string; is_visible?: boolean }): Promise<Language> => {
    const response = await apiClient.put<{ status: boolean; data: Language }>(`/languages/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/languages/${id}`);
  }
};
