import apiClient from '@/lib/api-client';

export interface Choice {
  choice_id: number;
  scene_id: number;
  choice_text: string;
  next_scene_id: number;
}

export interface Scene {
  scene_id: number;
  movie_id: number;
  scene_text: string;
  poster_url: string;
  choices: Choice[];
}

export const sceneService = {
  getByMovieId: async (movieId: number) => {
    const response = await apiClient.get<{ status: boolean; data: Scene[] }>(`/scenes?id=${movieId}`);
    return response.data.data;
  },

  // Choices CRUD
  createChoice: async (data: Partial<Choice>) => {
    const response = await apiClient.post<{ status: boolean; data: Choice }>('/choices', data);
    return response.data.data;
  },

  updateChoice: async (data: Partial<Choice>) => {
    const response = await apiClient.put<{ status: boolean; data: Choice }>('/choices', data);
    return response.data.data;
  },

  deleteChoice: async (id: number) => {
    const response = await apiClient.delete<{ status: boolean; message: string }>(`/choices/${id}`);
    return response.data;
  }
};
