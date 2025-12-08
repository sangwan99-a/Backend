export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  tenantId: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'active' | 'inactive' | 'canceled';
  renewalDate?: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  participants: string[];
  lastMessage?: ChatMessage;
  lastMessageAt: Date;
  unreadCount: number;
}

export interface PresenceInfo {
  userId: string;
  status: 'online' | 'away' | 'offline' | 'dnd';
  lastActiveAt: Date;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignedTo?: string;
  createdBy: string;
  tags: string[];
}

export interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  htmlBody?: string;
  attachments: Attachment[];
  isRead: boolean;
  isFlagged: boolean;
  receivedAt: Date;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  sharedWith: string[];
  tags: string[];
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  resource: string;
  resourceId: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
}

export interface AppState {
  theme: 'light' | 'dark' | 'system';
  language: string;
  sidebarCollapsed: boolean;
}
