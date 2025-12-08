import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '@/services/api';
import useAuthStore from '@/store/authStore';
import { Channel, Message, Attachment } from '@/types/chat';

// Fetch user's channels
export const useChannels = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['channels', userId],
    async () => {
      const response = await api.get<Channel[]>('/api/v1/chat/channels', {
        params: { userId },
      });
      return response.data;
    },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
    }
  );
};

// Fetch messages for a channel
export const useMessages = (channelId: string, enabled = true) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['messages', channelId, userId],
    async () => {
      const response = await api.get<Message[]>(
        `/api/v1/chat/${channelId}/messages`,
        {
          params: { limit: 50 },
        }
      );
      return response.data;
    },
    {
      enabled: enabled && !!channelId && !!userId,
      staleTime: 1 * 60 * 1000,
      refetchInterval: false,
    }
  );
};

// Load older messages (pagination)
export const useLoadOlderMessages = (channelId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (beforeTimestamp: string) => {
      const response = await api.get<Message[]>(
        `/api/v1/chat/${channelId}/messages`,
        {
          params: { before: beforeTimestamp, limit: 50 },
        }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['messages', channelId], (old: Message[] | undefined) => [
          ...data,
          ...(old || []),
        ]);
      },
    }
  );
};

// Send a message
export const useSendMessage = (channelId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (message: {
      content: string;
      attachments?: File[];
      replyTo?: string;
    }) => {
      const formData = new FormData();
      formData.append('content', message.content);
      if (message.replyTo) {
        formData.append('replyTo', message.replyTo);
      }
      if (message.attachments) {
        message.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      const response = await api.post<Message>(
        `/api/v1/chat/${channelId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['messages', channelId], (old: Message[] | undefined) => [
          ...(old || []),
          data,
        ]);
        queryClient.setQueryData(
          ['channels', userId],
          (old: Channel[] | undefined) =>
            old?.map((ch) =>
              ch.id === channelId ? { ...ch, lastMessage: data } : ch
            ) || []
        );
      },
    }
  );
};

// Update a message
export const useUpdateMessage = (channelId: string, messageId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (content: string) => {
      const response = await api.put<Message>(
        `/api/v1/chat/${channelId}/messages/${messageId}`,
        { content }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['messages', channelId], (old: Message[] | undefined) =>
          old?.map((m) => (m.id === messageId ? data : m)) || []
        );
      },
    }
  );
};

// Delete a message
export const useDeleteMessage = (channelId: string, messageId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async () => {
      await api.delete(`/api/v1/chat/${channelId}/messages/${messageId}`);
    },
    {
      onSuccess: () => {
        queryClient.setQueryData(['messages', channelId], (old: Message[] | undefined) =>
          old?.filter((m) => m.id !== messageId) || []
        );
      },
    }
  );
};

// Add reaction to message
export const useAddReaction = (channelId: string, messageId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (emoji: string) => {
      const response = await api.post<Message>(
        `/api/v1/chat/${channelId}/messages/${messageId}/reactions`,
        { emoji }
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['messages', channelId], (old: Message[] | undefined) =>
          old?.map((m) => (m.id === messageId ? data : m)) || []
        );
      },
    }
  );
};

// Remove reaction from message
export const useRemoveReaction = (channelId: string, messageId: string) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (emoji: string) => {
      const response = await api.delete<Message>(
        `/api/v1/chat/${channelId}/messages/${messageId}/reactions/${emoji}`
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['messages', channelId], (old: Message[] | undefined) =>
          old?.map((m) => (m.id === messageId ? data : m)) || []
        );
      },
    }
  );
};

// Get channel details
export const useChannelDetails = (channelId: string, enabled = true) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['channel-details', channelId, userId],
    async () => {
      const response = await api.get<Channel>(
        `/api/v1/chat/channels/${channelId}`
      );
      return response.data;
    },
    {
      enabled: enabled && !!channelId && !!userId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

// Create a new channel
export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (channel: { name: string; description?: string; type: string }) => {
      const response = await api.post<Channel>('/api/v1/chat/channels', channel);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(
          ['channels', userId],
          (old: Channel[] | undefined) => [...(old || []), data]
        );
      },
    }
  );
};

// Join a channel
export const useJoinChannel = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (channelId: string) => {
      const response = await api.post<Channel>(
        `/api/v1/chat/channels/${channelId}/join`
      );
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(
          ['channels', userId],
          (old: Channel[] | undefined) => [...(old || []), data]
        );
      },
    }
  );
};

// Search messages
export const useSearchMessages = (
  channelId: string,
  query: string,
  enabled = true
) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['message-search', channelId, query, userId],
    async () => {
      const response = await api.get<Message[]>(
        `/api/v1/chat/${channelId}/search`,
        {
          params: { q: query },
        }
      );
      return response.data;
    },
    {
      enabled: enabled && !!channelId && !!query && !!userId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

// Upload file
export const useUploadFile = () => {
  return useMutation(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Attachment>(
      '/api/v1/chat/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  });
};
