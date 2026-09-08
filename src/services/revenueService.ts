import apiClient from '@/lib/api-client';

export interface TitleLedgerRecord {
  id: number;
  film_id: string;
  month_year: string;
  total_allocated_revenue: number;
  updated_at: string;
  // Optional enriched fields from calculation
  total_seconds_watched?: number;
  watch_percentage?: string;
  title_name?: string;
}

export interface RunMonthlySplitResult {
  month_year: string;
  users_processed_count: number;
  total_platform_seconds_watched: number;
  total_revenue_allocated: number;
  titles_ledger: {
    film_id: string;
    total_seconds_watched: number;
    watch_percentage: string;
    total_allocated_revenue: number;
  }[];
}

export interface CreateUserSubscriptionPayload {
  user_id: string;
  subscription_fee: number;
  gateway_fee?: number;
  month_year?: string;
}

export const revenueService = {
  /**
   * Fetch Title Ledger for a given month (format: MM-YYYY, e.g. '09-2026')
   */
  getTitleLedger: async (monthYear?: string): Promise<TitleLedgerRecord[]> => {
    const query = monthYear ? `?month_year=${encodeURIComponent(monthYear)}` : '';
    const response = await apiClient.get<{ status: boolean; message: string; data: TitleLedgerRecord[] }>(
      `/v1/revenue/title-ledger${query}`
    );
    return response.data.data;
  },

  /**
   * Trigger Pro-Rata Monthly Revenue Split calculation
   */
  runMonthlySplit: async (monthYear: string): Promise<RunMonthlySplitResult> => {
    const response = await apiClient.post<{ status: boolean; message: string; data: RunMonthlySplitResult }>(
      '/v1/revenue/run-monthly-split',
      { month_year: monthYear }
    );
    return response.data.data;
  },

  /**
   * Seed/Record User Subscription Revenue Pool entry
   */
  recordUserSubscription: async (payload: CreateUserSubscriptionPayload) => {
    const response = await apiClient.post<{ status: boolean; message: string; data: Record<string, unknown> }>(
      '/v1/revenue/user-subscriptions',
      payload
    );
    return response.data;
  },
};
