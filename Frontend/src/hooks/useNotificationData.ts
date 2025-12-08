/**
 * Notification React Query Hooks
 * Data fetching and mutations for notification management
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import notificationAPIClient from '../services/notificationAPIClient';
import { notificationDatabase } from '../services/notificationDatabase';
import {
  Notification,
  NotificationListRequest,
  NotificationListResponse,
  NotificationPreferences,
  BulkMarkReadRequest,
  BulkMarkReadResponse,
  SnoozeRequest,
  ExportNotificationsRequest,
  NotificationSettings,
  NotificationStats,
} from '../types/notifications';

const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_QUERY_KEYS.all, 'list'] as const,
  list: (userId: string, request: NotificationListRequest) =>
    [...NOTIFICATION_QUERY_KEYS.lists(), userId, request] as const,
  details: () => [...NOTIFICATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...NOTIFICATION_QUERY_KEYS.details(), id] as const,
  unreadCount: (userId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'unread', userId] as const,
  preferences: (userId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'preferences', userId] as const,
  settings: (userId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'settings', userId] as const,
  stats: (userId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'stats', userId] as const,
  mentions: (userId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'mentions', userId] as const,
  tasks: (userId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'tasks', userId] as const,
  calendar: (userId: string) => [...NOTIFICATION_QUERY_KEYS.all, 'calendar', userId] as const,
};

/**
 * Query Hooks
 */

export function useNotifications(
  userId: string,
  request: NotificationListRequest = {},
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.list(userId, request),
    () => notificationAPIClient.listNotifications(userId, request),
    {
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: request.unreadOnly ? 30 * 1000 : undefined, // 30s for unread
    }
  );
}

export function useNotification(
  notificationId: string,
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.detail(notificationId),
    () => notificationAPIClient.getNotification(notificationId),
    {
      enabled,
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 20 * 60 * 1000,
    }
  );
}

export function useUnreadCount(
  userId: string,
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.unreadCount(userId),
    () => notificationAPIClient.getUnreadCount(userId),
    {
      enabled,
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 30 * 1000, // 30 seconds
    }
  );
}

export function useNotificationPreferences(
  userId: string,
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.preferences(userId),
    () => notificationAPIClient.getPreferences(userId),
    {
      enabled,
      staleTime: 15 * 60 * 1000, // 15 minutes
      cacheTime: 30 * 60 * 1000,
    }
  );
}

export function useNotificationSettings(
  userId: string,
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.settings(userId),
    () => notificationAPIClient.getSettings(userId),
    {
      enabled,
      staleTime: 15 * 60 * 1000, // 15 minutes
      cacheTime: 30 * 60 * 1000,
    }
  );
}

export function useNotificationStats(
  userId: string,
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.stats(userId),
    () => notificationAPIClient.getStats(userId),
    {
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30 * 1000, // 30 seconds
    }
  );
}

export function useMentions(
  userId: string,
  limit: number = 50,
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.mentions(userId),
    () => notificationAPIClient.getMentions(userId, limit),
    {
      enabled,
      staleTime: 3 * 60 * 1000, // 3 minutes
      refetchInterval: 30 * 1000, // 30 seconds
    }
  );
}

export function useTaskNotifications(
  userId: string,
  limit: number = 50,
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.tasks(userId),
    () => notificationAPIClient.getTaskNotifications(userId, limit),
    {
      enabled,
      staleTime: 3 * 60 * 1000,
      refetchInterval: 30 * 1000,
    }
  );
}

export function useCalendarNotifications(
  userId: string,
  limit: number = 50,
  enabled: boolean = true
) {
  return useQuery(
    NOTIFICATION_QUERY_KEYS.calendar(userId),
    () => notificationAPIClient.getCalendarNotifications(userId, limit),
    {
      enabled,
      staleTime: 3 * 60 * 1000,
      refetchInterval: 60 * 1000, // 1 minute
    }
  );
}

/**
 * Mutation Hooks
 */

export function useMarkAsRead(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (notificationId: string) => notificationAPIClient.markAsRead(notificationId),
    {
      onSuccess: (_: any) => {
        // Invalidate related queries
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.unreadCount(userId));
      },
    }
  );
}

export function useBulkMarkAsRead(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (request: BulkMarkReadRequest) => notificationAPIClient.bulkMarkAsRead(request),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.unreadCount(userId));
      },
    }
  );
}

export function useMarkAllAsRead(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    () => notificationAPIClient.markAllAsRead(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.unreadCount(userId));
      },
    }
  );
}

export function useDismissNotification(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (notificationId: string) => notificationAPIClient.dismiss(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.unreadCount(userId));
      },
    }
  );
}

export function useBulkDismiss(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (notificationIds: string[]) => notificationAPIClient.bulkDismiss(notificationIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
      },
    }
  );
}

export function useDismissAll(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    () => notificationAPIClient.dismissAll(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
      },
    }
  );
}

export function useSnoozeNotification(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    ({ notificationId, request }: { notificationId: string; request: SnoozeRequest }) =>
      notificationAPIClient.snooze(notificationId, request),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
      },
    }
  );
}

export function useBulkSnooze(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    ({ notificationIds, snoozeUntil }: { notificationIds: string[]; snoozeUntil: Date }) =>
      notificationAPIClient.bulkSnooze(notificationIds, snoozeUntil),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
      },
    }
  );
}

export function useDeleteNotification(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (notificationId: string) => notificationAPIClient.delete(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.unreadCount(userId));
      },
    }
  );
}

export function useBulkDelete(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (notificationIds: string[]) => notificationAPIClient.bulkDelete(notificationIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.unreadCount(userId));
      },
    }
  );
}

export function useUpdatePreferences(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (preferences: Partial<NotificationPreferences>) => notificationAPIClient.updatePreferences(userId, preferences),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.preferences(userId));
      },
    }
  );
}

export function useUpdateSettings(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (settings: Partial<NotificationSettings>) => notificationAPIClient.updateSettings(userId, settings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.settings(userId));
      },
    }
  );
}

export function useSetDoNotDisturb(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    ({ enabled, endTime }: { enabled: boolean; endTime?: Date }) =>
      notificationAPIClient.setDoNotDisturb(userId, enabled, endTime),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.preferences(userId));
      },
    }
  );
}

export function useMuteUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    ({ targetUserId, until }: { targetUserId: string; until?: Date }) =>
      notificationAPIClient.muteUser(userId, targetUserId, until),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.settings(userId));
      },
    }
  );
}

export function useMuteConversation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    ({ conversationId, until }: { conversationId: string; until?: Date }) =>
      notificationAPIClient.muteConversation(userId, conversationId, until),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.settings(userId));
      },
    }
  );
}

export function useExportNotifications(userId: string) {
  return useMutation(
    (request: ExportNotificationsRequest) => notificationAPIClient.export(userId, request)
  );
}

export function useSearchNotifications(userId: string) {
  return useMutation(
    (searchTerm: string) => notificationAPIClient.search(userId, searchTerm)
  );
}

export function useArchiveNotification(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (notificationId: string) => notificationAPIClient.archive(notificationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
      },
    }
  );
}

export function useBulkArchive(userId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    (notificationIds: string[]) => notificationAPIClient.bulkArchive(notificationIds),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(NOTIFICATION_QUERY_KEYS.lists());
      },
    }
  );
}
