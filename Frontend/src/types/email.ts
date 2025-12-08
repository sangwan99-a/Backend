/**
 * Email Module Type Definitions
 * Complete type safety for email operations
 */

// ==================== Basic Email Types ====================

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number; // bytes
  url: string;
  isInline?: boolean;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  folderId: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  timestamp: Date;
  receivedAt: Date;
  sentAt?: Date;
  isRead: boolean;
  isStarred: boolean;
  isSpam: boolean;
  isArchived: boolean;
  isDraft: boolean;
  labels: string[]; // label IDs
  attachments: Attachment[];
  threadCount: number; // messages in this thread
  replyCount: number;
  forwardCount: number;
  priority: 'low' | 'normal' | 'high';
  size: number; // bytes
  hasAttachments: boolean;
  hasImages: boolean;
  isScheduled?: boolean;
  scheduledTime?: Date;
  reminderTime?: Date;
  showReminder?: boolean;
}

export interface EmailThread {
  id: string;
  subject: string;
  snippet: string; // preview text
  participants: EmailAddress[];
  messageCount: number;
  unreadCount: number;
  isSpam: boolean;
  isArchived: boolean;
  labels: string[];
  lastMessageTime: Date;
  messages: EmailMessage[];
  starred: boolean;
  priority: boolean;
}

export interface EmailFolder {
  id: string;
  name: string;
  type: 'system' | 'custom';
  systemType?: 'inbox' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash' | 'all';
  unreadCount: number;
  totalCount: number;
  icon?: string;
  color?: string;
  children?: EmailFolder[];
  isExpanded?: boolean;
  nestLevel?: number;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string; // hex color
  messageCount: number;
  unreadCount: number;
  isVisible: boolean;
}

// ==================== Draft & Compose ====================

export interface DraftEmail {
  id: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments: Attachment[];
  labels: string[];
  templateId?: string;
  scheduledTime?: Date;
  isSending: boolean;
  lastSavedAt: Date;
  replyingToId?: string;
  forwardingFromId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  category: string;
  isDefault: boolean;
}

export interface ComposeState {
  draftId?: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments: File[];
  isComposing: boolean;
  isSending: boolean;
  templateId?: string;
  showCc: boolean;
  showBcc: boolean;
  showSchedule: boolean;
  scheduledTime?: Date;
}

// ==================== Search & Filter ====================

export interface EmailSearchParams {
  query: string;
  from?: string;
  to?: string;
  subject?: string;
  label?: string;
  folderId?: string;
  hasAttachments?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  beforeDate?: Date;
  afterDate?: Date;
}

export interface EmailFilter {
  id: string;
  name: string;
  criteria: {
    from?: string;
    to?: string;
    subject?: string;
    contains?: string;
    hasAttachments?: boolean;
  };
  actions: {
    applyLabels?: string[];
    moveToFolder?: string;
    markAsRead?: boolean;
    star?: boolean;
  };
  enabled: boolean;
}

// ==================== Actions & Operations ====================

export interface EmailAction {
  type:
    | 'mark-read'
    | 'mark-unread'
    | 'star'
    | 'unstar'
    | 'move'
    | 'delete'
    | 'archive'
    | 'spam'
    | 'add-label'
    | 'remove-label'
    | 'snooze'
    | 'remind';
  messageIds: string[];
  folderId?: string;
  labelId?: string;
  snoozeUntil?: Date;
  reminderTime?: Date;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors?: { messageId: string; error: string }[];
}

// ==================== UI State ====================

export interface EmailUIState {
  selectedFolderId: string;
  selectedMessageId?: string;
  selectedThreadId?: string;
  selectedLabelId?: string;
  selectedMessageIds: string[]; // for bulk actions
  isComposing: boolean;
  isSearching: boolean;
  searchQuery: string;
  filterParams: EmailSearchParams;
  sortBy: 'date' | 'from' | 'subject' | 'size';
  sortOrder: 'asc' | 'desc';
  showFolders: boolean;
  showPreview: boolean;
  showSpellCheck: boolean;
  syncProgress: number; // 0-100
  isSyncing: boolean;
  lastSyncTime?: Date;
  unreadCount: number;
  totalEmailCount: number;
}

// ==================== Offline Support ====================

export interface UnsentEmail {
  id: string;
  draftId: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments: {
    filename: string;
    mimeType: string;
    data: Blob;
  }[];
  createdAt: Date;
  attemptCount: number;
  lastAttemptAt?: Date;
  error?: string;
}

export interface EmailSyncStatus {
  isSyncing: boolean;
  syncedFolders: string[];
  totalFolders: number;
  lastSyncTime: Date;
  nextSyncTime: Date;
  pendingActions: number;
  unsentEmails: number;
}

// ==================== WebSocket Events ====================

export interface EmailNotification {
  type:
    | 'new-email'
    | 'email-read'
    | 'email-deleted'
    | 'folder-updated'
    | 'sync-started'
    | 'sync-completed'
    | 'send-failed';
  messageId?: string;
  folderId?: string;
  folderUnreadCount?: number;
  totalUnreadCount?: number;
  errorMessage?: string;
  timestamp: Date;
}

// ==================== API Response Types ====================

export interface EmailListResponse {
  messages: EmailMessage[];
  total: number;
  hasMore: boolean;
  cursor?: string; // for pagination
}

export interface FolderListResponse {
  folders: EmailFolder[];
  unreadCount: number;
  totalCount: number;
}

export interface SendEmailRequest {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: Attachment[];
  labels?: string[];
  scheduledTime?: Date;
  replyingToId?: string;
  forwardingFromId?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId: string;
  threadId: string;
  draftId?: string;
  error?: string;
}

// ==================== Statistics ====================

export interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  starredEmails: number;
  emailsWithAttachments: number;
  totalAttachmentSize: number;
  averageEmailSize: number;
  oldestEmail: Date;
  newestEmail: Date;
  totalStorage: number;
  usedStorage: number;
  folderStats: {
    [folderId: string]: {
      count: number;
      unreadCount: number;
      size: number;
    };
  };
}

// ==================== Priority Inbox ====================

export interface PriorityEmail {
  messageId: string;
  score: number; // 0-100
  reasons: string[]; // why it's important
  from: EmailAddress;
  subject: string;
  timestamp: Date;
}

// ==================== Read Receipts & Tracking ====================

export interface ReadReceipt {
  messageId: string;
  recipientEmail: string;
  readAt: Date;
  displayedAt?: Date;
}

export interface EmailTracking {
  messageId: string;
  opens: number;
  clicks: number;
  lastOpenedAt?: Date;
  lastClickedAt?: Date;
  recipients: ReadReceipt[];
}
