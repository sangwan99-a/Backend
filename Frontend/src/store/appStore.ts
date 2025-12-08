import { create } from 'zustand';
import type { AppState } from '@/types/index';

interface AppStoreType extends AppState {
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
}

export const useAppStore = create<AppStoreType>((set) => ({
  theme: 'system',
  language: 'en',
  sidebarCollapsed: false,

  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
  setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
  setLanguage: (language: string) => set({ language }),
}));
