/**
 * Email Store
 * Zustand store for email UI state (not server state - that's React Query)
 */

import { create } from 'zustand';
import { EmailUIState, EmailSearchParams, ComposeState } from '@/types/email';

interface EmailStore extends EmailUIState {
  // Folder & Selection
  setSelectedFolder: (folderId: string) => void;
  setSelectedMessage: (messageId?: string) => void;
  setSelectedThread: (threadId?: string) => void;
  setSelectedMessages: (messageIds: string[]) => void;
  addSelectedMessage: (messageId: string) => void;
  removeSelectedMessage: (messageId: string) => void;
  clearSelection: () => void;

  // Compose
  openCompose: () => void;
  closeCompose: () => void;
  setComposeState: (state: Partial<ComposeState>) => void;

  // Search & Filter
  setSearchQuery: (query: string) => void;
  setFilterParams: (params: Partial<EmailSearchParams>) => void;
  clearSearch: () => void;

  // Sorting
  setSortBy: (sortBy: 'date' | 'from' | 'subject' | 'size') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  // UI Visibility
  setShowFolders: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  toggleFolders: () => void;
  togglePreview: () => void;

  // Sync & Status
  setIsSyncing: (isSyncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  setLastSyncTime: (time: Date) => void;
  setUnreadCount: (count: number) => void;
  setTotalEmailCount: (count: number) => void;

  // Bulk Operations
  selectAll: () => void;
  deselectAll: () => void;
  invertSelection: () => void;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  // Initial State
  selectedFolderId: 'inbox',
  selectedMessageId: undefined,
  selectedThreadId: undefined,
  selectedLabelId: undefined,
  selectedMessageIds: [],
  isComposing: false,
  isSearching: false,
  searchQuery: '',
  filterParams: { query: '' },
  sortBy: 'date',
  sortOrder: 'desc',
  showFolders: true,
  showPreview: true,
  showSpellCheck: true,
  syncProgress: 0,
  isSyncing: false,
  lastSyncTime: undefined,
  unreadCount: 0,
  totalEmailCount: 0,

  // Folder & Selection
  setSelectedFolder: (folderId: string) => {
    set({
      selectedFolderId: folderId,
      selectedMessageId: undefined,
      selectedMessageIds: [],
    });
  },

  setSelectedMessage: (messageId?: string) => {
    set({ selectedMessageId: messageId });
  },

  setSelectedThread: (threadId?: string) => {
    set({ selectedThreadId: threadId });
  },

  setSelectedMessages: (messageIds: string[]) => {
    set({ selectedMessageIds: messageIds });
  },

  addSelectedMessage: (messageId: string) => {
    const current = get().selectedMessageIds;
    if (!current.includes(messageId)) {
      set({ selectedMessageIds: [...current, messageId] });
    }
  },

  removeSelectedMessage: (messageId: string) => {
    set({
      selectedMessageIds: get().selectedMessageIds.filter((id) => id !== messageId),
    });
  },

  clearSelection: () => {
    set({
      selectedMessageIds: [],
      selectedMessageId: undefined,
      selectedThreadId: undefined,
    });
  },

  // Compose
  openCompose: () => {
    set({ isComposing: true });
  },

  closeCompose: () => {
    set({ isComposing: false });
  },

  setComposeState: (composeState: Partial<ComposeState>) => {
    // Note: Full compose state could be stored here if needed
    // For now, ComposeDiag handles its own state
  },

  // Search & Filter
  setSearchQuery: (query: string) => {
    set({
      searchQuery: query,
      isSearching: query.length > 0,
    });
  },

  setFilterParams: (params: Partial<EmailSearchParams>) => {
    const current = get().filterParams;
    set({ filterParams: { ...current, ...params } });
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      filterParams: { query: '' },
      isSearching: false,
    });
  },

  // Sorting
  setSortBy: (sortBy: 'date' | 'from' | 'subject' | 'size') => {
    set({ sortBy });
  },

  setSortOrder: (order: 'asc' | 'desc') => {
    set({ sortOrder: order });
  },

  // UI Visibility
  setShowFolders: (show: boolean) => {
    set({ showFolders: show });
  },

  setShowPreview: (show: boolean) => {
    set({ showPreview: show });
  },

  toggleFolders: () => {
    set({ showFolders: !get().showFolders });
  },

  togglePreview: () => {
    set({ showPreview: !get().showPreview });
  },

  // Sync & Status
  setIsSyncing: (isSyncing: boolean) => {
    set({ isSyncing });
  },

  setSyncProgress: (progress: number) => {
    set({ syncProgress: Math.min(100, Math.max(0, progress)) });
  },

  setLastSyncTime: (time: Date) => {
    set({ lastSyncTime: time });
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: Math.max(0, count) });
  },

  setTotalEmailCount: (count: number) => {
    set({ totalEmailCount: Math.max(0, count) });
  },

  // Bulk Operations
  selectAll: () => {
    // This would be called with all message IDs from the current folder
    // Implementation depends on context
  },

  deselectAll: () => {
    set({ selectedMessageIds: [] });
  },

  invertSelection: () => {
    // This would invert selection based on visible messages
    // Implementation depends on context
  },
}));
