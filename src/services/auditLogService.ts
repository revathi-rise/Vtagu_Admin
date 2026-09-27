import apiClient from '@/lib/api-client';

export interface AuditLog {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  module: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export const auditLogService = {
  getAll: async (limit = 50, offset = 0): Promise<{ data: AuditLog[]; total: number }> => {
    try {
      const response = await apiClient.get<any>(
        `/audit-logs?limit=${limit}&offset=${offset}`
      );
      
      const resData = response.data;
      const rawList = Array.isArray(resData) 
        ? resData 
        : (Array.isArray(resData?.data) ? resData.data : []);

      const mappedList: AuditLog[] = rawList.map((item: any) => ({
        id: item.id || item.ID || 0,
        userId: item.userId ?? item.user_id ?? undefined,
        userEmail: item.userEmail ?? item.user_email ?? 'admin@vtagu.com',
        action: item.action || 'UNKNOWN',
        module: item.module || 'GENERAL',
        resourceId: String(item.resourceId ?? item.resource_id ?? ''),
        details: item.details,
        ipAddress: item.ipAddress ?? item.ip_address ?? '127.0.0.1',
        createdAt: item.createdAt ?? item.created_at ?? item.timestamp ?? new Date().toISOString(),
      }));

      const total = resData?.total || mappedList.length || 0;

      return {
        data: mappedList,
        total,
      };
    } catch (error) {
      console.warn('GET /audit-logs failed or empty', error);
      return { data: [], total: 0 };
    }
  },

  create: async (log: Partial<AuditLog>): Promise<boolean> => {
    try {
      await apiClient.post('/audit-logs', log);
      return true;
    } catch (error) {
      console.warn('POST /audit-logs failed', error);
      return false;
    }
  },
};

