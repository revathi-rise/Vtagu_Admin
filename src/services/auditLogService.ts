import apiClient from '@/lib/api-client';

export interface AuditLog {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  module: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export const auditLogService = {
  getAll: async (limit = 50, offset = 0): Promise<{ data: AuditLog[]; total: number }> => {
    try {
      const response = await apiClient.get<{ status: boolean; data: AuditLog[]; total: number }>(
        `/audit-logs?limit=${limit}&offset=${offset}`
      );
      return {
        data: response.data?.data || [],
        total: response.data?.total || 0,
      };
    } catch (error) {
      console.warn('GET /audit-logs failed or empty', error);
      return { data: [], total: 0 };
    }
  },
};
