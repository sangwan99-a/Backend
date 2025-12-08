// Types for Chat Module

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'channel' | 'dm' | 'group';
  members: ChatUser[];
  unreadCount: number;
  lastMessage?: Message;
  createdAt: string;
  isPinned?: boolean;
  topic?: string;
  isArchived?: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  user: ChatUser;
  content: string;
  formattedContent?: string;
  timestamp: string;
  editedAt?: string;
  reactions: Reaction[];
  replies?: Message[];
  replyTo?: {
    id: string;
    userId: string;
    content: string;
  };
  attachments: Attachment[];
  readBy: string[];
  pinned?: boolean;
}

export interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  channelId: string;
  timestamp: string;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'away' | 'offline';
  timestamp: string;
}

export interface ChatSettings {
  muteNotifications: boolean;
  notificationSound: boolean;
  desktopNotifications: boolean;
}

export interface UnsentMessage {
  tempId: string;
  channelId: string;
  content: string;
  attachments: File[];
  createdAt: string;
  status: 'pending' | 'failed';
}
