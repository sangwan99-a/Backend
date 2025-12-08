/**
 * Dashboard API Integration
 * Analytics and AI insights microservice
 */

import { getApiClient } from '@/lib/api-client';
import { useApi, useMutateApi } from '@/lib/api-client';

export interface ProductivityMetrics {
  date: string;
  tasksCompleted: number;
  messagesCount: number;
  focusTime: number; // in minutes
  productivity: number; // 0-100 score
  trend: 'up' | 'down' | 'stable';
}

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'pattern' | 'warning';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  timestamp: string;
}

export interface DashboardStats {
  tasksCompleted: number;
  messagesUnread: number;
  upcomingEvents: number;
  documentsShared: number;
  teamActivityScore: number;
  focusTimeThisWeek: number; // in minutes
}

/**
 * Dashboard API Client
 */
export class DashboardAPIClient {
  private api = getApiClient();

  /**
   * Get productivity metrics for a specific period
   */
  async getProductivityMetrics(period: 'day' | 'week' | 'month' = 'day'): Promise<ProductivityMetrics[]> {
    return this.api.get(`/api/v1/analytics/productivity?period=${period}`);
  }

  /**
   * Get AI-powered insights
   */
  async getAIInsights(limit: number = 5): Promise<AIInsight[]> {
    return this.api.get(`/api/v1/ai/insights/active?limit=${limit}`);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.api.get('/api/v1/dashboard/stats');
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10) {
    return this.api.get(`/api/v1/dashboard/activity?limit=${limit}`);
  }

  /**
   * Get team productivity comparison
   */
  async getTeamComparison(period: 'week' | 'month') {
    return this.api.get(`/api/v1/analytics/team-comparison?period=${period}`);
  }

  /**
   * Dismiss an insight
   */
  async dismissInsight(insightId: string) {
    return this.api.post(`/api/v1/ai/insights/${insightId}/dismiss`);
  }

  /**
   * Get real-time analytics via WebSocket
   */
  subscribeToAnalytics(userId: string, onData: (data: any) => void): void {
    const wsUrl = `${this.api.getClient().defaults.baseURL?.replace('http', 'ws')}/ws/analytics/${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onData(data);
    };

    ws.onerror = (error) => {
      console.error('Analytics WebSocket error:', error);
    };
  }
}

/**
 * Export singleton instance
 */
export const dashboardAPI = new DashboardAPIClient();

/**
 * React hooks for dashboard data
 */

/**
 * Hook to fetch productivity metrics
 */
export function useProductivityMetrics(period: 'day' | 'week' | 'month' = 'day') {
  return useApi(
    ['productivity-metrics', period],
    () => dashboardAPI.getProductivityMetrics(period),
    {
      staleTime: 1 * 60 * 1000, // 1 minute - real-time data
    }
  );
}

/**
 * Hook to fetch AI insights
 */
export function useAIInsights() {
  return useApi(['ai-insights'], () => dashboardAPI.getAIInsights(), {
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch dashboard stats
 */
export function useDashboardStats() {
  return useApi(['dashboard-stats'], () => dashboardAPI.getDashboardStats(), {
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 1 * 60 * 1000, // Auto-refresh every minute
  });
}

/**
 * Hook to fetch recent activity
 */
export function useRecentActivity() {
  return useApi(['recent-activity'], () => dashboardAPI.getRecentActivity(), {
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch team comparison
 */
export function useTeamComparison(period: 'week' | 'month') {
  return useApi(
    ['team-comparison', period],
    () => dashboardAPI.getTeamComparison(period),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to dismiss an insight
 */
export function useDismissInsight() {
  return useMutateApi((insightId: string) => dashboardAPI.dismissInsight(insightId));
}
