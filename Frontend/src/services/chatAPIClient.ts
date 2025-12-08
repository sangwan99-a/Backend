/**
 * Chat API Integration
 * Real-time messaging microservice with WebSocket support
 */

import { getApiClient, useInfiniteApi, useMutateApi } from '@/lib/api-client';
import { useApi } from '@/lib/api-client';

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: 'direct' | 'group' | 'public';
  members: string[];
  createdAt: string;
  lastMessageAt?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  attachments?: ChatAttachment[];
  reactions?: Record<string, string[]>; // emoji -> [userIds]
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  channelId: string;
  timestamp: string;
}

/**
 * Chat API Client
 */
export class ChatAPIClient {
  private api = getApiClient();
  private ws: Map<string, WebSocket> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Get all channels for user
   */
  async getChannels(): Promise<ChatChannel[]> {
    return this.api.get('/api/v1/chat/channels');
  }

  /**
   * Get channel details
   */
  async getChannel(channelId: string): Promise<ChatChannel> {
    return this.api.get(`/api/v1/chat/channels/${channelId}`);
  }

  /**
   * Create a new channel
   */
  async createChannel(data: {
    name: string;
    description?: string;
    type: 'direct' | 'group' | 'public';
    members?: string[];
  }): Promise<ChatChannel> {
    return this.api.post('/api/v1/chat/channels', data);
  }

  /**
   * Get message history (paginated, infinite scroll)
   */
  async getMessages(channelId: string, page: number = 1, pageSize: number = 50) {
    return this.api.get(`/api/v1/chat/${channelId}/messages?page=${page}&pageSize=${pageSize}`);
  }

  /**
   * Send message
   */
  async sendMessage(
    channelId: string,
    content: string,
    attachments?: File[]
  ): Promise<ChatMessage> {
    const data = new FormData();
    data.append('content', content);

    if (attachments) {
      attachments.forEach((file) => {
        data.append('attachments', file);
      });
    }

    const response = await this.api.getClient().post(`/api/v1/chat/${channelId}/messages`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Edit message
   */
  async editMessage(messageId: string, content: string): Promise<ChatMessage> {
    return this.api.patch(`/api/v1/chat/messages/${messageId}`, { content });
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<void> {
    return this.api.delete(`/api/v1/chat/messages/${messageId}`);
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId: string, emoji: string): Promise<ChatMessage> {
    return this.api.post(`/api/v1/chat/messages/${messageId}/reactions`, { emoji });
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId: string, emoji: string): Promise<ChatMessage> {
    return this.api.delete(`/api/v1/chat/messages/${messageId}/reactions/${emoji}`);
  }

  /**
   * Subscribe to channel messages via WebSocket
   */
  subscribeToChannel(
    channelId: string,
    onMessage: (message: ChatMessage) => void,
    onTyping?: (indicator: TypingIndicator) => void,
    onError?: (error: Error) => void
  ): () => void {
    const wsUrl = `${this.api.getClient().defaults.baseURL?.replace(/^http/, 'ws')}/ws/chat/${channelId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`✅ Connected to chat channel: ${channelId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          onMessage(data.payload);
        } else if (data.type === 'typing' && onTyping) {
          onTyping(data.payload);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
      if (onError) {
        onError(new Error('WebSocket connection failed'));
      }
    };

    ws.onclose = () => {
      console.log(`❌ Disconnected from chat channel: ${channelId}`);
      this.ws.delete(channelId);
    };

    this.ws.set(channelId, ws);

    // Return unsubscribe function
    return () => {
      ws.close();
      this.ws.delete(channelId);
    };
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(channelId: string): void {
    const ws = this.ws.get(channelId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing' }));
    }

    // Clear previous timeout
    const timeout = this.typingTimeouts.get(channelId);
    if (timeout) {
      clearTimeout(timeout);
    }

    // Auto-clear after 3 seconds
    this.typingTimeouts.set(
      channelId,
      setTimeout(() => {
        this.typingTimeouts.delete(channelId);
      }, 3000)
    );
  }

  /**
   * Cleanup subscriptions
   */
  unsubscribeAll(): void {
    this.ws.forEach((ws) => {
      ws.close();
    });
    this.ws.clear();

    this.typingTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.typingTimeouts.clear();
  }
}

/**
 * Export singleton instance
 */
export const chatAPI = new ChatAPIClient();

/**
 * React hooks for chat data
 */

/**
 * Hook to fetch channels
 */
export function useChatChannels() {
  return useApi(['chat-channels'], () => chatAPI.getChannels(), {
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch channel details
 */
export function useChatChannel(channelId: string) {
  return useApi(['chat-channel', channelId], () => chatAPI.getChannel(channelId), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for infinite scroll message history
 */
export function useChatMessages(channelId: string) {
  return useInfiniteApi(
    ['chat-messages', channelId],
    ({ pageParam = 1 }) => chatAPI.getMessages(channelId, pageParam),
    {
      staleTime: 0, // Always fresh
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );
}

/**
 * Hook to send message
 */
export function useSendMessage() {
  return useMutateApi(
    ({ channelId, content, attachments }: {
      channelId: string;
      content: string;
      attachments?: File[];
    }) => chatAPI.sendMessage(channelId, content, attachments)
  );
}

/**
 * Hook to edit message
 */
export function useEditMessage() {
  return useMutateApi(
    ({ messageId, content }: { messageId: string; content: string }) =>
      chatAPI.editMessage(messageId, content)
  );
}

/**
 * Hook to delete message
 */
export function useDeleteMessage() {
  return useMutateApi((messageId: string) => chatAPI.deleteMessage(messageId));
}

/**
 * Hook to add reaction
 */
export function useAddReaction() {
  return useMutateApi(
    ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      chatAPI.addReaction(messageId, emoji)
  );
}

/**
 * Hook to remove reaction
 */
export function useRemoveReaction() {
  return useMutateApi(
    ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      chatAPI.removeReaction(messageId, emoji)
  );
}
