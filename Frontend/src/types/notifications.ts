/**
 * Notifications Type Definitions
 * Comprehensive types for real-time notification system across FusionDesk
 */

/* ============================================================================
   NOTIFICATION TYPES & ENUMS
   ============================================================================ */

export type NotificationType =
  | 'chat_message'
  | 'chat_mention'
  | 'email_received'
  | 'email_high_priority'
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue'
  | 'task_mention'
  | 'calendar_reminder'
  | 'calendar_conflict'
  | 'system_alert'
  | 'system_status'
  | 'service_down'
  | 'service_recovered'
  | 'quota_exceeded'
  | 'quota_warning'
  | 'user_joined'
  | 'user_left'
  | 'user_mention'
  | 'billing_payment_failed'
  | 'billing_payment_success'
  | 'billing_plan_upgrade'
  | 'billing_plan_downgrade'
  | 'billing_invoice'
  | 'document_shared'
  | 'document_commented'
  | 'knowledge_base_updated'
  | 'admin_impersonation';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export type NotificationCategory =
  | 'chat'
  | 'email'
  | 'tasks'
  | 'calendar'
  | 'system'
  | 'billing'
  | 'documents'
  | 'knowledge'
  | 'admin';

export type NotificationChannel = 'in_app' | 'email' | 'desktop' | 'mobile_push';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export type NotificationGroupAction =
  | 'mentions'
  | 'task_updates'
  | 'system_alerts'
  | 'chat_messages'
  | 'email_messages';

/* ============================================================================
   CORE NOTIFICATION INTERFACES
   ============================================================================ */

/**
 * Main Notification Entity
 */
export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  description?: string;
  icon?: string; // Emoji or icon identifier
  avatar?: string; // Avatar URL for sender
  sender?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  // Action & Navigation
  actionUrl?: string; // Deep link to relevant resource
  actionLabel?: string;
  secondaryAction?: {
    label: string;
    url: string;
  };
  // Rich Content
  metadata?: Record<string, any>; // Type-specific metadata
  imageUrl?: string; // For rich notifications
  attachments?: NotificationAttachment[];
  // Status & Tracking
  status: NotificationStatus;
  isRead: boolean;
  readAt?: Date;
  isDismissed: boolean;
  dismissedAt?: Date;
  // Display Control
  groupId?: string; // For grouping related notifications
  threadId?: string; // For threaded notifications
  repliedTo?: string; // ID of notification being replied to
  // Delivery Tracking
  deliveryStatus: NotificationDeliveryStatus;
  deliveryChannels: NotificationChannel[];
  deliveryAttempts?: number;
  lastDeliveryAttempt?: Date;
  // Timestamps
  createdAt: Date;
  expiresAt?: Date;
  // Interaction Tracking
  viewedAt?: Date;
  clickedAt?: Date;
  snoozedUntil?: Date;
}

/**
 * Notification Attachment
 */
export interface NotificationAttachment {
  id: string;
  type: 'image' | 'file' | 'document';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

/**
 * Grouped Notifications
 */
export interface NotificationGroup {
  id: string;
  userId: string;
  groupAction: NotificationGroupAction;
  count: number;
  title: string;
  description?: string;
  notifications: Notification[];
  firstNotificationTime: Date;
  lastNotificationTime: Date;
  unreadCount: number;
  isExpanded: boolean;
}

/**
 * Notification Preferences
 */
export interface NotificationPreferences {
  userId: string;
  tenantId: string;

  // Channel-specific settings
  channels: {
    [key in NotificationChannel]: {
      enabled: boolean;
      categories?: NotificationCategory[];
      minPriority?: NotificationPriority;
    };
  };

  // Category-specific settings
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      channels?: NotificationChannel[];
      minPriority?: NotificationPriority;
      sound?: boolean;
      badge?: boolean;
      groupSimilar?: boolean;
      autoExpand?: boolean;
    };
  };

  // Do Not Disturb Settings
  doNotDisturb: {
    enabled: boolean;
    startTime?: string; // HH:mm format
    endTime?: string;
    allowCritical: boolean;
    allowMentions: boolean;
    allDaySchedule?: boolean;
    days?: string[]; // ['monday', 'tuesday', ...]
  };

  // Auto-dismiss Settings
  autoDismiss: {
    enabled: boolean;
    delayMs: number; // Default 10000ms for low-priority
    excludeTypes: NotificationType[];
  };

  // Sound & Vibration
  sound: {
    enabled: boolean;
    customSounds?: Record<NotificationType, string>; // Sound file URLs
  };

  vibration: {
    enabled: boolean;
    pattern?: number[];
  };

  // Advanced Settings
  groupSimilar: boolean;
  showPreview: boolean; // Show content preview
  retentionDays: number; // How long to keep notifications (default 30)
  batchEmail: boolean;
  batchEmailTime?: string; // HH:mm format
  disableOnMobile: boolean;

  // Cross-device Settings
  syncReadStatus: boolean;
  dismissAcrossDevices: boolean;

  // Timestamps
  updatedAt: Date;
}

/**
 * Notification Settings - User-facing preferences
 */
export interface NotificationSettings {
  userId: string;
  tenantId: string;
  preferences: NotificationPreferences;
  muteList: {
    userId?: string;
    conversationId?: string;
    channelId?: string;
    projectId?: string;
    mutedUntil: Date;
  }[];
}

/* ============================================================================
   NOTIFICATION UI & DISPLAY TYPES
   ============================================================================ */

/**
 * Notification Item for UI display
 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  avatar?: string;
  senderName?: string;
  timestamp: Date;
  timeAgo: string;
  isUnread: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon: string;
  backgroundColor?: string;
  textColor?: string;
  groupedCount?: number;
  thread?: NotificationItem[];
}

/**
 * Notification Toast (inline notification)
 */
export interface NotificationToast {
  id: string;
  notification: Notification;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  icon?: string;
  duration?: number; // ms, null = persist
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible: boolean;
}

/**
 * Notification Filter
 */
export interface NotificationFilter {
  categories?: NotificationCategory[];
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  status?: NotificationStatus[];
  senderUserId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
  unreadOnly?: boolean;
}

/**
 * Notification Statistics
 */
export interface NotificationStats {
  userId: string;
  totalCount: number;
  unreadCount: number;
  byPriority: {
    critical: number;
    high: number;
    normal: number;
    low: number;
  };
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
  lastNotificationTime?: Date;
  oldestUnreadTime?: Date;
}

/* ============================================================================
   WEBSOCKET & REALTIME TYPES
   ============================================================================ */

/**
 * WebSocket Message for Notifications
 */
export interface NotificationWSMessage {
  type:
    | 'notification'
    | 'bulk_notification'
    | 'read'
    | 'dismiss'
    | 'notification_update'
    | 'notification_delete'
    | 'preferences_update'
    | 'sync_request'
    | 'pong';
  payload: any;
  timestamp: number;
  messageId?: string;
}

/**
 * WebSocket Notification Payload
 */
export interface WSNotificationPayload {
  notification: Notification;
  clientId?: string;
  dedupKey?: string; // For deduplication
}

/**
 * WebSocket Bulk Notification Payload
 */
export interface WSBulkNotificationPayload {
  notifications: Notification[];
  isDelta?: boolean; // Only new since last sync
}

/**
 * WebSocket Read Status Update
 */
export interface WSReadStatusPayload {
  notificationIds: string[];
  readAt: Date;
  syncKey?: string;
}

/**
 * WebSocket Dismiss Payload
 */
export interface WSDismissPayload {
  notificationIds: string[];
  dismissedAt: Date;
  dismissReason?: string;
}

/**
 * WebSocket Preferences Update
 */
export interface WSPreferencesUpdatePayload {
  preferences: NotificationPreferences;
  timestamp: Date;
}

/* ============================================================================
   API REQUEST/RESPONSE TYPES
   ============================================================================ */

/**
 * Notification List Request
 */
export interface NotificationListRequest {
  limit?: number;
  offset?: number;
  status?: NotificationStatus[];
  categories?: NotificationCategory[];
  priority?: NotificationPriority[];
  unreadOnly?: boolean;
  markSeen?: boolean; // Mark as seen when fetching
  searchTerm?: string;
  sortBy?: 'recent' | 'priority' | 'oldest';
}

/**
 * Notification List Response
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
  cursor?: string;
}

/**
 * Bulk Mark Read Request
 */
export interface BulkMarkReadRequest {
  notificationIds?: string[]; // If empty, mark all as read
  before?: Date; // Mark all before this date
  categories?: NotificationCategory[];
}

/**
 * Bulk Mark Read Response
 */
export interface BulkMarkReadResponse {
  markedCount: number;
  updatedAt: Date;
}

/**
 * Snooze Notification Request
 */
export interface SnoozeRequest {
  notificationId: string;
  snoozeUntil: Date;
  snoozeDuration?: number; // In ms (alternative to snoozeUntil)
}

/**
 * Export Notifications Request
 */
export interface ExportNotificationsRequest {
  format: 'json' | 'csv';
  status?: NotificationStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: NotificationCategory[];
}

/* ============================================================================
   NOTIFICATION UI STATE
   ============================================================================ */

/**
 * Notification Center UI State
 */
export interface NotificationCenterState {
  // Panel State
  isPanelOpen: boolean;
  activeTab: 'all' | 'unread' | 'mentions' | 'tasks' | 'calendar';
  panelPosition: 'right' | 'left';

  // Notifications
  notifications: Notification[];
  groups: NotificationGroup[];
  isLoading: boolean;
  error?: string;

  // Filtering & Search
  filters: NotificationFilter;
  searchTerm: string;
  sortBy: 'recent' | 'priority' | 'oldest';

  // Pagination
  limit: number;
  offset: number;
  hasMore: boolean;
  cursor?: string;

  // Selection
  selectedNotificationIds: string[];
  bulkActionInProgress: boolean;

  // Preferences
  preferences?: NotificationPreferences;
  showSettings: boolean;

  // Stats
  stats: NotificationStats;

  // Toasts
  activeToasts: NotificationToast[];

  // Last synced timestamp
  lastSyncTime?: Date;
}

/**
 * Notification Action for notifications
 */
export type NotificationAction =
  | { type: 'OPEN_PANEL' }
  | { type: 'CLOSE_PANEL' }
  | { type: 'SET_TAB'; tab: string }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'ADD_NOTIFICATIONS'; notifications: Notification[] }
  | { type: 'UPDATE_NOTIFICATION'; id: string; updates: Partial<Notification> }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'MARK_AS_READ'; id: string }
  | { type: 'MARK_AS_READ_BULK'; ids: string[] }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DISMISS_NOTIFICATION'; id: string }
  | { type: 'DISMISS_NOTIFICATION_BULK'; ids: string[] }
  | { type: 'SNOOZE_NOTIFICATION'; id: string; until: Date }
  | { type: 'SET_FILTER'; filter: NotificationFilter }
  | { type: 'SET_SEARCH'; searchTerm: string }
  | { type: 'SET_PREFERENCES'; preferences: NotificationPreferences }
  | { type: 'TOGGLE_SELECTION'; id: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'ADD_TOAST'; toast: NotificationToast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error?: string }
  | { type: 'UPDATE_STATS'; stats: NotificationStats }
  | { type: 'SYNC'; notifications: Notification[] }
  | { type: 'CLEAR_ALL' };

/* ============================================================================
   NOTIFICATION CATEGORY METADATA
   ============================================================================ */

/**
 * Notification Metadata by Type
 */
export interface ChatMentionMetadata {
  channelId: string;
  channelName: string;
  messageId: string;
  threadId?: string;
  context?: string; // Surrounding message context
}

export interface TaskMetadata {
  projectId: string;
  projectName: string;
  taskId: string;
  taskTitle: string;
  assignee?: { id: string; name: string };
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CalendarMetadata {
  eventId: string;
  eventTitle: string;
  startTime: Date;
  location?: string;
  attendees?: { id: string; name: string; status: 'accepted' | 'declined' | 'tentative' }[];
}

export interface SystemAlertMetadata {
  serviceId: string;
  serviceName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedUsers?: number;
  estimatedResolution?: Date;
  statusPageUrl?: string;
}

export interface BillingMetadata {
  invoiceId?: string;
  amount?: number;
  currency?: string;
  planName?: string;
  renewalDate?: Date;
  cardLastFour?: string;
}

/* ============================================================================
   HELPER TYPES
   ============================================================================ */

/**
 * Notification Icon Mapping
 */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  chat_message: '💬',
  chat_mention: '👤',
  email_received: '📧',
  email_high_priority: '⚡',
  task_assigned: '✅',
  task_completed: '🎉',
  task_overdue: '⏰',
  task_mention: '🏷️',
  calendar_reminder: '📅',
  calendar_conflict: '⚠️',
  system_alert: '🔴',
  system_status: '🟢',
  service_down: '❌',
  service_recovered: '✓',
  quota_exceeded: '📊',
  quota_warning: '⚠️',
  user_joined: '👋',
  user_left: '👋',
  user_mention: '👤',
  billing_payment_failed: '💳',
  billing_payment_success: '💰',
  billing_plan_upgrade: '⬆️',
  billing_plan_downgrade: '⬇️',
  billing_invoice: '📄',
  document_shared: '📄',
  document_commented: '💬',
  knowledge_base_updated: '📚',
  admin_impersonation: '🔐',
};

/**
 * Notification Priority Colors
 */
export const PRIORITY_COLORS: Record<NotificationPriority, { bg: string; text: string }> = {
  critical: { bg: '#fde7e7', text: '#d13438' },
  high: { bg: '#fff4ce', text: '#ffb900' },
  normal: { bg: '#e7f3ff', text: '#0078d4' },
  low: { bg: '#f0f0f0', text: '#666666' },
};

/**
 * Category to Icon Mapping
 */
export const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  chat: '💬',
  email: '📧',
  tasks: '✅',
  calendar: '📅',
  system: '⚙️',
  billing: '💰',
  documents: '📄',
  knowledge: '📚',
  admin: '🔐',
};
