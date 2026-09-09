import apiClient from '@/lib/api-client';

export interface Actor {
  actor_id?: number;
  id?: number;
  name: string;
  country?: string;
  dob?: string;
  bio?: string;
  image?: string;
  actor_image?: string;
  created_at?: string;
}

export const actorService = {
  getAll: async (): Promise<Actor[]> => {
    try {
      const response = await apiClient.get('/actors');
      const res = response.data;
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.actors)) return res.actors;
      if (Array.isArray(res?.result)) return res.result;
      return [];
    } catch (e) {
      try {
        const altResponse = await apiClient.get('/actor');
        const res = altResponse.data;
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.actors)) return res.actors;
        return [];
      } catch (err) {
        console.error('Failed to fetch actors:', e, err);
        return [];
      }
    }
  },

  getById: async (id: number): Promise<Actor | null> => {
    try {
      const response = await apiClient.get(`/actors/${id}`);
      return response.data?.data || response.data;
    } catch (e) {
      const response = await apiClient.get(`/actor/${id}`);
      return response.data?.data || response.data;
    }
  },

  create: async (data: Partial<Actor>): Promise<Actor> => {
    try {
      const response = await apiClient.post('/actors', data);
      return response.data?.data || response.data;
    } catch (e) {
      const response = await apiClient.post('/actor', data);
      return response.data?.data || response.data;
    }
  },

  update: async (id: number, data: Partial<Actor>): Promise<Actor> => {
    try {
      const response = await apiClient.put(`/actors/${id}`, data);
      return response.data?.data || response.data;
    } catch (e) {
      const response = await apiClient.put(`/actor/${id}`, data);
      return response.data?.data || response.data;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/actors/${id}`);
    } catch (e) {
      await apiClient.delete(`/actor/${id}`);
    }
  }
};
