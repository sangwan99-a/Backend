import { useQuery } from 'react-query';
import api from '@/services/api';
import useAuthStore from '@/store/authStore';

export interface ProductivityMetrics {
  completedTasks: number;
  meetingCount: number;
  focusTime: number; // minutes
  responseTime: number; // minutes
  date: string;
}

export interface ActivityItem {
  id: string;
  type: 'chat' | 'email' | 'document' | 'task';
  title: string;
  description: string;
  timestamp: string;
  avatar?: string;
  user?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  attendees?: string[];
  reminder?: boolean;
}

export interface AIInsight {
  id: string;
  type: 'suggestion' | 'bottleneck' | 'action';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'idle' | 'offline';
  currentTask?: string;
  availability: string;
}

// Fetch productivity metrics for today
export const useProductivityMetrics = () => {
  const userId = useAuthStore((state) => state.user?.id);
  
  return useQuery(
    ['productivity-metrics', userId],
    async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get<ProductivityMetrics>(
        `/api/v1/analytics/user/${userId}/productivity?period=day`
      );
      return response.data;
    },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    }
  );
};

// Fetch recent activity
export const useRecentActivity = (limit = 10) => {
  const userId = useAuthStore((state) => state.user?.id);
  
  return useQuery(
    ['recent-activity', userId, limit],
    async () => {
      const response = await api.get<ActivityItem[]>(
        `/api/v1/activity/recent?limit=${limit}`
      );
      return response.data;
    },
    {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
};

// Fetch upcoming calendar events
export const useUpcomingEvents = (hours = 24) => {
  const userId = useAuthStore((state) => state.user?.id);
  
  return useQuery(
    ['upcoming-events', userId, hours],
    async () => {
      const response = await api.get<CalendarEvent[]>(
        `/api/v1/calendar/events/upcoming?hours=${hours}`
      );
      return response.data;
    },
    {
      enabled: !!userId,
      staleTime: 3 * 60 * 1000, // 3 minutes
      refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    }
  );
};

// Fetch AI insights
export const useAIInsights = () => {
  const userId = useAuthStore((state) => state.user?.id);
  
  return useQuery(
    ['ai-insights', userId],
    async () => {
      const response = await api.get<AIInsight[]>(`/api/v1/ai/insights/active`);
      return response.data;
    },
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
    }
  );
};

// Fetch team status
export const useTeamStatus = () => {
  const userId = useAuthStore((state) => state.user?.id);
  
  return useQuery(
    ['team-status', userId],
    async () => {
      const response = await api.get<TeamMember[]>(`/api/v1/team/status`);
      return response.data;
    },
    {
      enabled: !!userId,
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
};

// Fetch recent tasks
export const useRecentTasks = (limit = 5) => {
  const userId = useAuthStore((state) => state.user?.id);
  
  return useQuery(
    ['recent-tasks', userId, limit],
    async () => {
      const response = await api.get(
        `/api/v1/tasks/recent?limit=${limit}`
      );
      return response.data;
    },
    {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
};
