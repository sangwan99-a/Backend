import { create } from 'zustand';
import { TypingIndicator, PresenceUpdate } from '@/types/chat';

interface ChatStoreState {
  selectedChannelId: string | null;
  selectedUserId: string | null;
  selectedThreadId: string | null;
  typingUsers: Map<string, TypingIndicator>;
  userPresence: Map<string, PresenceUpdate>;
  wsConnected: boolean;
  isSearching: boolean;
  searchQuery: string;
  showMemberList: boolean;
  showThreadDetails: boolean;

  setSelectedChannel: (channelId: string | null) => void;
  setSelectedUser: (userId: string | null) => void;
  setSelectedThread: (threadId: string | null) => void;
  addTypingUser: (indicator: TypingIndicator) => void;
  removeTypingUser: (userId: string, channelId: string) => void;
  updateUserPresence: (update: PresenceUpdate) => void;
  setWsConnected: (connected: boolean) => void;
  setSearching: (searching: boolean, query?: string) => void;
  toggleMemberList: () => void;
  toggleThreadDetails: () => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStoreState>((set) => ({
  selectedChannelId: null,
  selectedUserId: null,
  selectedThreadId: null,
  typingUsers: new Map(),
  userPresence: new Map(),
  wsConnected: false,
  isSearching: false,
  searchQuery: '',
  showMemberList: false,
  showThreadDetails: false,

  setSelectedChannel: (channelId) =>
    set({ selectedChannelId: channelId, selectedUserId: null, selectedThreadId: null }),

  setSelectedUser: (userId) =>
    set({ selectedUserId: userId, selectedChannelId: null, selectedThreadId: null }),

  setSelectedThread: (threadId) =>
    set({ selectedThreadId: threadId }),

  addTypingUser: (indicator) =>
    set((state) => {
      const newTyping = new Map(state.typingUsers);
      newTyping.set(indicator.userId, indicator);
      return { typingUsers: newTyping };
    }),

  removeTypingUser: (userId, channelId) =>
    set((state) => {
      const newTyping = new Map(state.typingUsers);
      newTyping.delete(userId);
      return { typingUsers: newTyping };
    }),

  updateUserPresence: (update) =>
    set((state) => {
      const newPresence = new Map(state.userPresence);
      newPresence.set(update.userId, update);
      return { userPresence: newPresence };
    }),

  setWsConnected: (connected) =>
    set({ wsConnected: connected }),

  setSearching: (searching, query = '') =>
    set({ isSearching: searching, searchQuery: query }),

  toggleMemberList: () =>
    set((state) => ({ showMemberList: !state.showMemberList })),

  toggleThreadDetails: () =>
    set((state) => ({ showThreadDetails: !state.showThreadDetails })),

  clearChat: () =>
    set({
      selectedChannelId: null,
      selectedUserId: null,
      selectedThreadId: null,
      typingUsers: new Map(),
      userPresence: new Map(),
      isSearching: false,
      searchQuery: '',
      showMemberList: false,
      showThreadDetails: false,
    }),
}));

