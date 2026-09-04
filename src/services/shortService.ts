import apiClient from '@/lib/api-client';

export interface Short {
  id: number;
  title: string;
  slug: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  languages: string;
  genre_id: string;
  is_free: boolean;
  is_featured: boolean;
  is_active: boolean;
  view_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ShortPayload {
  title: string;
  slug?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  languages?: string;
  genre_id?: string;
  is_free?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export const shortService = {
  getAll: async (): Promise<Short[]> => {
    const response = await apiClient.get<{ status: boolean; data: Short[] }>('/shorts');
    return response.data?.data || [];
  },

  getById: async (id: number): Promise<Short> => {
    const response = await apiClient.get<{ status: boolean; data: Short }>(`/shorts/${id}?isAdmin=true`);
    return response.data?.data || response.data as any;
  },

  create: async (data: ShortPayload): Promise<Short> => {
    const response = await apiClient.post<{ status: boolean; data: Short }>('/shorts', data);
    return response.data?.data || response.data as any;
  },

  update: async (id: number, data: Partial<ShortPayload>): Promise<Short> => {
    const response = await apiClient.put<{ status: boolean; data: Short }>(`/shorts/${id}`, data);
    return response.data?.data || response.data as any;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/shorts/${id}`);
  },

  toggleActive: async (id: number, is_active: boolean): Promise<Short> => {
    const response = await apiClient.put<{ status: boolean; data: Short }>(`/shorts/${id}`, { is_active });
    return response.data?.data || response.data as any;
  },
};
