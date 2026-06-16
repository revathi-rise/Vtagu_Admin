import apiClient from '@/lib/api-client';

export interface DashboardStats {
  totalUsers: number;
  totalMovies: number;
  totalSeries: number;
  activeSubs: number;
  revenue: number;
  totalViews: number;
  trendingMovies: any[];
  revenueData: Array<{ name: string; revenue: number; users: number }>;
  topGenres: Array<{ name: string; count: number }>;
  recentActivities: Array<{ id: string; type: string; message: string; time: string }>;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<{ status: boolean; data: DashboardStats }>('/dashboard/stats');
    return response.data?.data || (response.data as any);
  },
};
