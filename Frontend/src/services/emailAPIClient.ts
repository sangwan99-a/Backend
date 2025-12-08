/**
 * Email API Integration
 * Email microservice with IMAP/SMTP support and push notifications
 */

import { getApiClient, useApi, useInfiniteApi, useMutateApi } from '@/lib/api-client';

export interface EmailFolder {
  id: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'custom';
  unreadCount: number;
  totalCount: number;
}

export interface EmailMessage {
  id: string;
  folderId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  isRead: boolean;
  isStarred: boolean;
  labels?: string[];
  threadId?: string;
  createdAt: string;
  receivedAt: string;
}

export interface EmailAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  contentId?: string;
}

export interface EmailContact {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  frequency?: number;
}

export interface EmailDraft {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments: File[];
  savedAt: string;
}

export interface EmailNotification {
  id: string;
  type: 'new_message' | 'delivery_failure' | 'reply';
  from: string;
  subject: string;
  timestamp: string;
}

/**
 * Email API Client
 */
export class EmailAPIClient {
  private api = getApiClient();
  private notificationWs: WebSocket | null = null;

  /**
   * Get all email folders
   */
  async getFolders(): Promise<EmailFolder[]> {
    return this.api.get('/api/v1/email/folders');
  }

  /**
   * Get messages from folder (paginated)
   */
  async getMessages(folderId: string, page: number = 1, pageSize: number = 20) {
    return this.api.get(`/api/v1/email/folders/${folderId}/messages?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Search emails
   */
  async searchEmails(query: string, folderId?: string) {
    const params = new URLSearchParams({ q: query });
    if (folderId) params.append('folderId', folderId);
    return this.api.get(`/api/v1/email/search?${params}`);
  }

  /**
   * Get message details
   */
  async getMessage(messageId: string): Promise<EmailMessage> {
    return this.api.get(`/api/v1/email/messages/${messageId}`);
  }

  /**
   * Get message thread (conversation)
   */
  async getThread(threadId: string, page: number = 1) {
    return this.api.get(`/api/v1/email/threads/${threadId}?page=${page}`);
  }

  /**
   * Send email
   */
  async sendEmail(data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    htmlBody?: string;
    attachments?: File[];
  }): Promise<EmailMessage> {
    const formData = new FormData();
    formData.append('to', JSON.stringify(data.to));
    if (data.cc) formData.append('cc', JSON.stringify(data.cc));
    if (data.bcc) formData.append('bcc', JSON.stringify(data.bcc));
    formData.append('subject', data.subject);
    formData.append('body', data.body);
    if (data.htmlBody) formData.append('htmlBody', data.htmlBody);

    if (data.attachments) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await this.api.getClient().post('/api/v1/email/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Reply to email
   */
  async replyToEmail(messageId: string, content: string, attachments?: File[]): Promise<EmailMessage> {
    const formData = new FormData();
    formData.append('content', content);

    if (attachments) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await this.api.getClient().post(
      `/api/v1/email/messages/${messageId}/reply`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Forward email
   */
  async forwardEmail(
    messageId: string,
    to: string[],
    attachments?: File[]
  ): Promise<EmailMessage> {
    const formData = new FormData();
    formData.append('to', JSON.stringify(to));

    if (attachments) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await this.api.getClient().post(
      `/api/v1/email/messages/${messageId}/forward`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    return this.api.patch(`/api/v1/email/messages/${messageId}`, { isRead: true });
  }

  /**
   * Mark message as unread
   */
  async markAsUnread(messageId: string): Promise<void> {
    return this.api.patch(`/api/v1/email/messages/${messageId}`, { isRead: false });
  }

  /**
   * Star/unstar message
   */
  async toggleStar(messageId: string): Promise<EmailMessage> {
    return this.api.post(`/api/v1/email/messages/${messageId}/toggle-star`, {});
  }

  /**
   * Move message to folder
   */
  async moveToFolder(messageId: string, folderId: string): Promise<void> {
    return this.api.patch(`/api/v1/email/messages/${messageId}`, { folderId });
  }

  /**
   * Delete message permanently
   */
  async deleteMessage(messageId: string): Promise<void> {
    return this.api.delete(`/api/v1/email/messages/${messageId}`);
  }

  /**
   * Save draft
   */
  async saveDraft(data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
  }): Promise<EmailDraft> {
    return this.api.post('/api/v1/email/drafts', data);
  }

  /**
   * Update draft
   */
  async updateDraft(draftId: string, data: Partial<EmailDraft>): Promise<EmailDraft> {
    return this.api.patch(`/api/v1/email/drafts/${draftId}`, data);
  }

  /**
   * Get auto-complete suggestions
   */
  async getContactSuggestions(query: string): Promise<EmailContact[]> {
    return this.api.get(`/api/v1/email/contacts/suggestions?q=${query}`);
  }

  /**
   * Get upload URL for attachment
   */
  async getAttachmentUploadUrl(fileName: string, fileSize: number): Promise<{ url: string; uploadId: string }> {
    return this.api.post('/api/v1/email/attachments/upload-url', {
      fileName,
      fileSize,
    });
  }

  /**
   * Subscribe to email notifications via WebSocket
   */
  subscribeToNotifications(
    onNotification: (notification: EmailNotification) => void,
    onError?: (error: Error) => void
  ): () => void {
    const wsUrl = `${this.api.getClient().defaults.baseURL?.replace(/^http/, 'ws')}/ws/email/notifications`;
    this.notificationWs = new WebSocket(wsUrl);

    this.notificationWs.onopen = () => {
      console.log('✅ Connected to email notifications');
    };

    this.notificationWs.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as EmailNotification;
        onNotification(notification);
      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    this.notificationWs.onerror = (error) => {
      console.error('Email notification error:', error);
      if (onError) {
        onError(new Error('Notification WebSocket connection failed'));
      }
    };

    this.notificationWs.onclose = () => {
      console.log('❌ Disconnected from email notifications');
      this.notificationWs = null;
    };

    // Return unsubscribe function
    return () => {
      if (this.notificationWs) {
        this.notificationWs.close();
        this.notificationWs = null;
      }
    };
  }

  /**
   * Cleanup subscriptions
   */
  unsubscribe(): void {
    if (this.notificationWs) {
      this.notificationWs.close();
      this.notificationWs = null;
    }
  }
}

/**
 * Export singleton instance
 */
export const emailAPI = new EmailAPIClient();

/**
 * React hooks for email data
 */

/**
 * Hook to fetch folders
 */
export function useEmailFolders() {
  return useApi(['email-folders'], () => emailAPI.getFolders(), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch messages from folder
 */
export function useEmailMessages(folderId: string) {
  return useInfiniteApi(
    ['email-messages', folderId],
    ({ pageParam = 1 }) => emailAPI.getMessages(folderId, pageParam),
    {
      staleTime: 0, // Always fresh for new emails
      cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
    }
  );
}

/**
 * Hook to search emails
 */
export function useEmailSearch(query: string, folderId?: string) {
  return useApi(['email-search', query, folderId ?? 'all'] as const, () => emailAPI.searchEmails(query, folderId), {
    enabled: !!query,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch email thread
 */
export function useEmailThread(threadId: string) {
  return useInfiniteApi(
    ['email-thread', threadId],
    ({ pageParam = 1 }) => emailAPI.getThread(threadId, pageParam),
    {
      staleTime: 0,
      cacheTime: 10 * 60 * 1000,
    }
  );
}

/**
 * Hook to send email
 */
export function useSendEmail() {
  return useMutateApi(
    (data: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      htmlBody?: string;
      attachments?: File[];
    }) => emailAPI.sendEmail(data)
  );
}

/**
 * Hook to reply to email
 */
export function useReplyToEmail() {
  return useMutateApi(
    ({
      messageId,
      content,
      attachments,
    }: {
      messageId: string;
      content: string;
      attachments?: File[];
    }) => emailAPI.replyToEmail(messageId, content, attachments)
  );
}

/**
 * Hook to forward email
 */
export function useForwardEmail() {
  return useMutateApi(
    ({
      messageId,
      to,
      attachments,
    }: {
      messageId: string;
      to: string[];
      attachments?: File[];
    }) => emailAPI.forwardEmail(messageId, to, attachments)
  );
}

/**
 * Hook to toggle message star
 */
export function useToggleStar() {
  return useMutateApi((messageId: string) => emailAPI.toggleStar(messageId));
}

/**
 * Hook to move message to folder
 */
export function useMoveEmailToFolder() {
  return useMutateApi(
    ({ messageId, folderId }: { messageId: string; folderId: string }) =>
      emailAPI.moveToFolder(messageId, folderId)
  );
}

/**
 * Hook to delete email
 */
export function useDeleteEmail() {
  return useMutateApi((messageId: string) => emailAPI.deleteMessage(messageId));
}

/**
 * Hook to save draft
 */
export function useSaveDraft() {
  return useMutateApi(
    (data: {
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
    }) => emailAPI.saveDraft(data)
  );
}

/**
 * Hook to get contact suggestions
 */
export function useEmailContactSuggestions(query: string) {
  return useApi(['email-contacts', query], () => emailAPI.getContactSuggestions(query), {
    enabled: !!query,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
