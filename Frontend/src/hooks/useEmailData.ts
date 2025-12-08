/**
 * Email Data Hooks
 * React Query hooks for all email API operations
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { EmailMessage, EmailFolder, EmailLabel, DraftEmail, SendEmailRequest, EmailListResponse } from '@/types/email';
import useAuthStore from '@/store/authStore';
import { 
  emailDB,
  saveMessages,
  getMessagesByFolder,
  getMessagesByThread,
  searchMessages,
  saveFolders,
  getFolders,
  getFolder,
  saveLabels,
  getLabels,
  queueUnsentEmail,
  saveDraft,
  deleteDraft,
  getDrafts,
  markMessagesAsRead,
  starMessages,
  unstarMessages,
  moveMessagesToFolder,
  addLabelToMessages,
} from '@/services/emailDatabase';

const API_BASE = '/api/v1/email';

// ==================== Queries ====================

/**
 * Fetch folders and labels
 */
export const useFolders = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['folders', userId],
    async () => {
      const response = await axios.get(`${API_BASE}/folders?userId=${userId}`);
      
      // Cache in IndexedDB
      if (response.data.folders && response.data.folders.length > 0) {
        await saveFolders(response.data.folders);
      }
      
      return response.data.folders as EmailFolder[];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!userId,
      onError: async () => {
        // Fall back to cached folders
        const cached = await getFolders();
        return cached;
      },
    }
  );
};

/**
 * Fetch emails for a specific folder with pagination
 */
export const useEmails = (folderId: string, limit: number = 50) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['emails', folderId, userId, limit],
    async () => {
      const response = await axios.get<EmailListResponse>(
        `${API_BASE}/messages?userId=${userId}&folder=${folderId}&limit=${limit}`
      );

      // Cache in IndexedDB
      if (response.data.messages) {
        await saveMessages(response.data.messages);
      }

      return response.data.messages;
    },
    {
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!userId && !!folderId,
      onError: async () => {
        // Fall back to cached emails
        const cached = await getMessagesByFolder(folderId, limit);
        return cached;
      },
    }
  );
};

/**
 * Fetch a single email thread
 */
export const useEmailThread = (threadId: string) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['email-thread', threadId, userId],
    async () => {
      const response = await axios.get<{ messages: EmailMessage[] }>(
        `${API_BASE}/threads/${threadId}?userId=${userId}`
      );

      // Cache in IndexedDB
      if (response.data.messages) {
        await saveMessages(response.data.messages);
      }

      return response.data.messages;
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000,
      enabled: !!userId && !!threadId,
      onError: async () => {
        const cached = await getMessagesByThread(threadId);
        return cached;
      },
    }
  );
};

/**
 * Search emails
 */
export const useSearchEmails = (query: string, folderId?: string) => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['search-emails', query, folderId, userId],
    async () => {
      if (!query.trim()) return [];

      const response = await axios.get<EmailListResponse>(
        `${API_BASE}/search?q=${encodeURIComponent(query)}&folder=${folderId || ''}&userId=${userId}`
      );

      return response.data.messages;
    },
    {
      staleTime: 2 * 60 * 1000,
      enabled: !!userId && !!query.trim(),
      // Fall back to local search if offline
      onError: async () => {
        return await searchMessages(query, folderId);
      },
    }
  );
};

/**
 * Get labels
 */
export const useLabels = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['labels', userId],
    async () => {
      const response = await axios.get<{ labels: EmailLabel[] }>(`${API_BASE}/labels?userId=${userId}`);
      
      if (response.data.labels) {
        await saveLabels(response.data.labels);
      }

      return response.data.labels;
    },
    {
      staleTime: 10 * 60 * 1000,
      enabled: !!userId,
      onError: async () => {
        return await getLabels();
      },
    }
  );
};

/**
 * Get drafts
 */
export const useDrafts = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['drafts', userId],
    async () => {
      const response = await axios.get<{ drafts: DraftEmail[] }>(`${API_BASE}/drafts?userId=${userId}`);
      
      if (response.data.drafts && response.data.drafts.length > 0) {
        await emailDB.drafts.bulkPut(response.data.drafts);
      }

      return response.data.drafts;
    },
    {
      staleTime: 1 * 60 * 1000,
      enabled: !!userId,
      onError: async () => {
        return await getDrafts();
      },
    }
  );
};

// ==================== Mutations ====================

/**
 * Send email
 */
export const useSendEmail = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (email: SendEmailRequest) => {
      const response = await axios.post(`${API_BASE}/messages?userId=${userId}`, email);
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate related queries
        queryClient.invalidateQueries(['emails']);
        queryClient.invalidateQueries(['drafts']);
      },
      onError: async (error: any, email) => {
        // Queue unsent email for later retry
        const unsentEmail = {
          id: `unsent-${Date.now()}`,
          draftId: `draft-${Date.now()}`,
          to: email.to,
          cc: email.cc || [],
          bcc: email.bcc || [],
          subject: email.subject,
          body: email.body,
          attachments: [],
          createdAt: new Date(),
          attemptCount: 0,
        };
        
        await queueUnsentEmail(unsentEmail);
      },
    }
  );
};

/**
 * Save draft
 */
export const useSaveDraft = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (draft: DraftEmail) => {
      // Save to local DB first for instant feedback
      const id = await saveDraft(draft);

      // Then sync to server
      const response = await axios.post(`${API_BASE}/drafts`, draft);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['drafts']);
      },
    }
  );
};

/**
 * Delete draft
 */
export const useDeleteDraft = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (draftId: string) => {
      await axios.delete(`${API_BASE}/drafts/${draftId}?userId=${userId}`);
      // Also delete from local DB
      await deleteDraft(draftId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['drafts']);
      },
    }
  );
};

/**
 * Mark email(s) as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (messageIds: string[]) => {
      // Optimistic update - update local DB immediately
      await markMessagesAsRead(messageIds);

      // Then sync to server
      await axios.put(`${API_BASE}/messages/read?userId=${userId}`, { messageIds });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emails']);
      },
    }
  );
};

/**
 * Star/unstar emails
 */
export const useStarEmail = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async ({ messageIds, starred }: { messageIds: string[]; starred: boolean }) => {
      // Optimistic update
      if (starred) {
        await starMessages(messageIds);
      } else {
        await unstarMessages(messageIds);
      }

      // Then sync to server
      await axios.put(`${API_BASE}/messages/star?userId=${userId}`, { messageIds, starred });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emails']);
      },
    }
  );
};

/**
 * Move emails to folder
 */
export const useMoveEmail = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async ({ messageIds, folderId }: { messageIds: string[]; folderId: string }) => {
      // Optimistic update
      await moveMessagesToFolder(messageIds, folderId);

      // Then sync to server
      await axios.post(`${API_BASE}/messages/move?userId=${userId}`, { messageIds, folderId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emails']);
        queryClient.invalidateQueries(['folders']);
      },
    }
  );
};

/**
 * Add label to emails
 */
export const useAddLabel = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async ({ messageIds, labelId }: { messageIds: string[]; labelId: string }) => {
      // Optimistic update
      await addLabelToMessages(messageIds, labelId);

      // Then sync to server
      await axios.post(`${API_BASE}/messages/labels?userId=${userId}`, { messageIds, labelId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emails']);
        queryClient.invalidateQueries(['labels']);
      },
    }
  );
};

/**
 * Delete emails (soft delete / move to trash)
 */
export const useDeleteEmail = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (messageIds: string[]) => {
      // Optimistic update - move to trash folder
      const trashFolder = await getFolder('trash');
      if (trashFolder) {
        await moveMessagesToFolder(messageIds, trashFolder.id);
      }

      // Then sync to server
      await axios.delete(`${API_BASE}/messages?userId=${userId}`, { data: { messageIds } });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emails']);
        queryClient.invalidateQueries(['folders']);
      },
    }
  );
};

/**
 * Upload attachment
 */
export const useUploadAttachment = () => {
  return useMutation(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  });
};

/**
 * Undo send (5 second grace period)
 */
export const useUndoSend = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (messageId: string) => {
      const response = await axios.post(
        `${API_BASE}/messages/${messageId}/undo?userId=${userId}`
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emails']);
      },
    }
  );
};

/**
 * Schedule send
 */
export const useScheduleSend = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (email: SendEmailRequest & { scheduledTime: Date }) => {
      const response = await axios.post(
        `${API_BASE}/messages/schedule?userId=${userId}`,
        email
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['emails']);
        queryClient.invalidateQueries(['drafts']);
      },
    }
  );
};

/**
 * Create label
 */
export const useCreateLabel = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (label: { name: string; color: string }) => {
      const response = await axios.post(`${API_BASE}/labels?userId=${userId}`, label);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['labels']);
      },
    }
  );
};

/**
 * Get email statistics
 */
export const useEmailStats = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['email-stats', userId],
    async () => {
      const response = await axios.get(`${API_BASE}/stats?userId=${userId}`);
      return response.data;
    },
    {
      staleTime: 10 * 60 * 1000,
      enabled: !!userId,
    }
  );
};
