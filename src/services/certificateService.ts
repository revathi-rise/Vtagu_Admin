import apiClient from '@/lib/api-client';

export interface Certificate {
  id: number;
  code: string;
  name: string;
  certification_system: string;
  country: string;
  description?: string | null;
  maturity_level?: string | null;
  badge_color?: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  movie_count?: number;
  recent_movies?: Array<{
    movie_id: number;
    title: string;
    year?: number;
    movie_image?: string;
  }>;
}

export interface CertificatePayload {
  code: string;
  name: string;
  certification_system: string;
  country: string;
  description?: string;
  maturity_level?: string;
  badge_color?: string;
  status?: 'active' | 'inactive';
}

export interface CertificateFilters {
  search?: string;
  system?: string;
  status?: string;
  country?: string;
  page?: number;
  limit?: number;
  all?: boolean;
}

export interface CertificateListResponse {
  status: boolean;
  message: string;
  data: Certificate[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const certificateService = {
  /**
   * Get all certificates with optional filtering, search, and pagination
   */
  getAll: async (params?: CertificateFilters): Promise<{ items: Certificate[]; total: number; totalPages: number }> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.system && params.system !== 'all') query.append('system', params.system);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.country && params.country !== 'all') query.append('country', params.country);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.all) query.append('all', 'true');

    const url = `/certificates${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await apiClient.get<CertificateListResponse>(url);
    const items = response.data?.data || [];
    const total = response.data?.pagination?.total ?? items.length;
    const totalPages = response.data?.pagination?.totalPages ?? 1;

    return { items, total, totalPages };
  },

  /**
   * Fast list of active certificates for movie dropdowns
   */
  getActive: async (): Promise<Certificate[]> => {
    const response = await apiClient.get<{ status: boolean; data: Certificate[] }>('/certificates/active');
    return response.data?.data || [];
  },

  /**
   * Get distinct systems and countries for filter dropdowns
   */
  getFilters: async (): Promise<{ systems: string[]; countries: string[] }> => {
    const response = await apiClient.get<{ status: boolean; data: { systems: string[]; countries: string[] } }>('/certificates/filters');
    return response.data?.data || { systems: ['CBFC', 'MPA', 'BBFC'], countries: ['India', 'United States', 'United Kingdom'] };
  },

  /**
   * Get single certificate details by ID
   */
  getById: async (id: number): Promise<Certificate> => {
    const response = await apiClient.get<{ status: boolean; data: Certificate }>(`/certificates/${id}`);
    return response.data?.data;
  },

  /**
   * Create a new certificate
   */
  create: async (data: CertificatePayload): Promise<Certificate> => {
    const response = await apiClient.post<{ status: boolean; data: Certificate }>('/certificates', data);
    return response.data?.data;
  },

  /**
   * Update an existing certificate
   */
  update: async (id: number, data: Partial<CertificatePayload>): Promise<Certificate> => {
    const response = await apiClient.put<{ status: boolean; data: Certificate }>(`/certificates/${id}`, data);
    return response.data?.data;
  },

  /**
   * Toggle active/inactive status
   */
  toggleStatus: async (id: number): Promise<Certificate> => {
    const response = await apiClient.patch<{ status: boolean; data: Certificate }>(`/certificates/${id}/status`);
    return response.data?.data;
  },

  /**
   * Safe delete certificate (throws if referenced by movies)
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/certificates/${id}`);
  },
};
