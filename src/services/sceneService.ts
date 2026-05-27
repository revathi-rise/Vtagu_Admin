import apiClient from '@/lib/api-client';

export interface Choice {
  choice_id: number;
  scene_id?: number;
  choice_text?: string;
  button_text?: string;
  next_scene_id?: number | null;
  target_scene?: number | null;
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
    const response = await apiClient.get<{ status: string; data: Scene[] }>(`/scenes?id=${movieId}`);
    return response.data.data;
  },

  // Choices CRUD
  createChoice: async (data: { scene_id: number; button_text: string; target_scene?: number | null }) => {
    const response = await apiClient.post<Choice>('/choices', data);
    return response.data;
  },

  updateChoice: async (data: { choice_id: number; button_text: string; target_scene?: number | null }) => {
    const response = await apiClient.put<Choice>('/choices', data);
    return response.data;
  },

  deleteChoice: async (id: number) => {
    const response = await apiClient.delete<{ deleted: boolean }>(`/choices/${id}`);
    return response.data;
  },

  // Scenes CRUD
  createScene: async (data: { movie_id: number; scene_name: string; scene_url: string }) => {
    const response = await apiClient.post<{ status: string; data: Scene }>('/scenes', data);
    return response.data.data;
  },

  updateScene: async (id: number, data: { scene_name?: string; scene_url?: string }) => {
    const response = await apiClient.put<{ status: string; data: Scene }>(`/scenes/${id}`, data);
    return response.data.data;
  },

  deleteScene: async (id: number) => {
    const response = await apiClient.delete<{ status: string; message: string }>(`/scenes/${id}`);
    return response.data;
  }
};
