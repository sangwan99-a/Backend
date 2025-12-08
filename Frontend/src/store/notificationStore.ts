/**
 * Notification Store
 * Zustand state management for notifications UI
 */

import create from 'zustand';
import {
  Notification,
  NotificationCenterState,
  NotificationFilter,
  NotificationPreferences,
  NotificationStats,
  NotificationToast,
} from '../types/notifications';

/**
 * Notification Store
 */
export const useNotificationStore = create<
  NotificationCenterState & {
    // Panel Actions
    openPanel: () => void;
    closePanel: () => void;
    togglePanel: () => void;
    setActiveTab: (tab: 'all' | 'unread' | 'mentions' | 'tasks' | 'calendar') => void;

    // Notification Actions
    addNotification: (notification: Notification) => void;
    addNotifications: (notifications: Notification[]) => void;
    updateNotification: (id: string, updates: Partial<Notification>) => void;
    removeNotification: (id: string) => void;

    // Selection Actions
    toggleSelection: (id: string) => void;
    selectAll: (notificationIds: string[]) => void;
    clearSelection: () => void;

    // Bulk Action Actions
    setBulkActionInProgress: (inProgress: boolean) => void;
    setBulkActionProgress: (progress: number) => void;

    // Filter Actions
    setFilters: (filters: NotificationFilter) => void;
    resetFilters: () => void;
    setSearchTerm: (term: string) => void;
    setSortBy: (sortBy: 'recent' | 'priority' | 'oldest') => void;

    // Pagination Actions
    setLimit: (limit: number) => void;
    setOffset: (offset: number) => void;
    nextPage: () => void;
    previousPage: () => void;

    // Loading & Error
    setLoading: (isLoading: boolean) => void;
    setError: (error?: string) => void;

    // Stats Actions
    updateStats: (stats: NotificationStats) => void;

    // Toast Actions
    addToast: (toast: NotificationToast) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;

    // Preferences Actions
    setPreferences: (preferences: NotificationPreferences) => void;
    toggleSettingsPanel: () => void;

    // Sync
    syncNotifications: (notifications: Notification[]) => void;

    // Clear All
    clearAll: () => void;
  }
>((set) => ({
  // Initial State
  isPanelOpen: false,
  activeTab: 'all',
  panelPosition: 'right',
  notifications: [],
  groups: [],
  isLoading: false,
  error: undefined,
  filters: {},
  searchTerm: '',
  sortBy: 'recent',
  limit: 50,
  offset: 0,
  hasMore: true,
  selectedNotificationIds: [],
  bulkActionInProgress: false,
  showSettings: false,
  stats: {
    userId: '',
    totalCount: 0,
    unreadCount: 0,
    byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
    byCategory: {
      chat: 0,
      email: 0,
      tasks: 0,
      calendar: 0,
      system: 0,
      billing: 0,
      documents: 0,
      knowledge: 0,
      admin: 0,
    },
    byType: {
      chat_message: 0,
      chat_mention: 0,
      email_received: 0,
      email_high_priority: 0,
      task_assigned: 0,
      task_completed: 0,
      task_overdue: 0,
      task_mention: 0,
      calendar_reminder: 0,
      calendar_conflict: 0,
      system_alert: 0,
      system_status: 0,
      service_down: 0,
      service_recovered: 0,
      quota_exceeded: 0,
      quota_warning: 0,
      user_joined: 0,
      user_left: 0,
      user_mention: 0,
      billing_payment_failed: 0,
      billing_payment_success: 0,
      billing_plan_upgrade: 0,
      billing_plan_downgrade: 0,
      billing_invoice: 0,
      document_shared: 0,
      document_commented: 0,
      knowledge_base_updated: 0,
      admin_impersonation: 0,
    },
  },
  activeToasts: [],

  // Panel Actions
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Notification Actions
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      stats: {
        ...state.stats,
        totalCount: state.stats.totalCount + 1,
        unreadCount: !notification.isRead ? state.stats.unreadCount + 1 : state.stats.unreadCount,
      },
    })),

  addNotifications: (notifications) =>
    set((state) => {
      const unreadAdded = notifications.filter((n) => !n.isRead).length;
      return {
        notifications: [...notifications, ...state.notifications],
        stats: {
          ...state.stats,
          totalCount: state.stats.totalCount + notifications.length,
          unreadCount: state.stats.unreadCount + unreadAdded,
        },
      };
    }),

  updateNotification: (id, updates) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        stats: {
          ...state.stats,
          totalCount: Math.max(0, state.stats.totalCount - 1),
          unreadCount: notification && !notification.isRead
            ? Math.max(0, state.stats.unreadCount - 1)
            : state.stats.unreadCount,
        },
      };
    }),

  // Selection Actions
  toggleSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedNotificationIds.includes(id);
      return {
        selectedNotificationIds: isSelected
          ? state.selectedNotificationIds.filter((nid) => nid !== id)
          : [...state.selectedNotificationIds, id],
      };
    }),

  selectAll: (notificationIds) =>
    set({
      selectedNotificationIds: notificationIds,
    }),

  clearSelection: () =>
    set({
      selectedNotificationIds: [],
    }),

  // Bulk Action Actions
  setBulkActionInProgress: (inProgress) =>
    set({
      bulkActionInProgress: inProgress,
    }),

  setBulkActionProgress: (progress) =>
    set({
      // Progress tracking handled separately if needed
    }),

  // Filter Actions
  setFilters: (filters) =>
    set({
      filters,
      offset: 0, // Reset pagination on filter change
    }),

  resetFilters: () =>
    set({
      filters: {},
      offset: 0,
    }),

  setSearchTerm: (term) =>
    set({
      searchTerm: term,
      offset: 0,
    }),

  setSortBy: (sortBy) =>
    set({
      sortBy,
      offset: 0,
    }),

  // Pagination Actions
  setLimit: (limit) =>
    set({
      limit,
    }),

  setOffset: (offset) =>
    set({
      offset,
    }),

  nextPage: () =>
    set((state) => ({
      offset: state.offset + state.limit,
    })),

  previousPage: () =>
    set((state) => ({
      offset: Math.max(0, state.offset - state.limit),
    })),

  // Loading & Error
  setLoading: (isLoading) =>
    set({
      isLoading,
    }),

  setError: (error) =>
    set({
      error,
    }),

  // Stats Actions
  updateStats: (stats) =>
    set({
      stats,
    }),

  // Toast Actions
  addToast: (toast) =>
    set((state) => ({
      activeToasts: [...state.activeToasts, toast],
    })),

  removeToast: (id) =>
    set((state) => ({
      activeToasts: state.activeToasts.filter((t) => t.id !== id),
    })),

  clearToasts: () =>
    set({
      activeToasts: [],
    }),

  // Preferences Actions
  setPreferences: (preferences) =>
    set({
      preferences,
    }),

  toggleSettingsPanel: () =>
    set((state) => ({
      showSettings: !state.showSettings,
    })),

  // Sync
  syncNotifications: (notifications) =>
    set((state) => {
      const newNotifications = notifications.filter(
        (n) => !state.notifications.find((existing) => existing.id === n.id)
      );

      const unreadAdded = newNotifications.filter((n) => !n.isRead).length;

      return {
        notifications: [...newNotifications, ...state.notifications].slice(0, state.limit * 3),
        stats: {
          ...state.stats,
          totalCount: state.stats.totalCount + newNotifications.length,
          unreadCount: state.stats.unreadCount + unreadAdded,
        },
      };
    }),

  // Clear All
  clearAll: () =>
    set({
      notifications: [],
      selectedNotificationIds: [],
      filters: {},
      searchTerm: '',
      offset: 0,
      error: undefined,
      stats: {
        userId: '',
        totalCount: 0,
        unreadCount: 0,
        byPriority: { critical: 0, high: 0, normal: 0, low: 0 },
        byCategory: {
          chat: 0,
          email: 0,
          tasks: 0,
          calendar: 0,
          system: 0,
          billing: 0,
          documents: 0,
          knowledge: 0,
          admin: 0,
        },
        byType: {
          chat_message: 0,
          chat_mention: 0,
          email_received: 0,
          email_high_priority: 0,
          task_assigned: 0,
          task_completed: 0,
          task_overdue: 0,
          task_mention: 0,
          calendar_reminder: 0,
          calendar_conflict: 0,
          system_alert: 0,
          system_status: 0,
          service_down: 0,
          service_recovered: 0,
          quota_exceeded: 0,
          quota_warning: 0,
          user_joined: 0,
          user_left: 0,
          user_mention: 0,
          billing_payment_failed: 0,
          billing_payment_success: 0,
          billing_plan_upgrade: 0,
          billing_plan_downgrade: 0,
          billing_invoice: 0,
          document_shared: 0,
          document_commented: 0,
          knowledge_base_updated: 0,
          admin_impersonation: 0,
        },
      },
      activeToasts: [],
    }),
}));

export default useNotificationStore;
