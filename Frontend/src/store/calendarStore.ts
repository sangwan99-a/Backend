/**
 * Calendar Module - Zustand Store
 * 
 * Manages UI state for calendar:
 * - View mode and date navigation
 * - Calendar selection
 * - Event selection
 * - Drag-drop operations
 * - Compose state
 * - Search and filtering
 */

import { create } from 'zustand';
import type { CalendarUIState, EventDragAction } from '../types/calendar';

interface CalendarStore extends CalendarUIState {
  // View and navigation
  setViewMode: (mode: CalendarUIState['viewMode']) => void;
  setCurrentDate: (date: string) => void;
  setSelectedDate: (date?: string) => void;
  goToToday: () => void;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;

  // Calendar selection
  setSelectedCalendars: (calendarIds: string[]) => void;
  toggleCalendarSelection: (calendarId: string) => void;
  selectAllCalendars: () => void;
  deselectAllCalendars: () => void;

  // Event selection
  setSelectedEvent: (eventId?: string) => void;

  // Event creation/editing
  openCreateEvent: (date?: string) => void;
  closeCreateEvent: () => void;
  openEditEvent: (eventId: string) => void;
  closeEditEvent: () => void;

  // Search and filtering
  setSearchQuery: (query?: string) => void;
  setFilterTags: (tags?: string[]) => void;

  // Drag-drop state
  setDragState: (drag?: CalendarUIState['dragState']) => void;
  clearDragState: () => void;

  // UI panels
  setShowAttendees: (show: boolean) => void;
  setShowDetails: (show: boolean) => void;
  toggleSidebar: () => void;

  // Timezone
  setTimezone: (timezone: string) => void;
}

const getToday = (): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
};

export const calendarStore = create<CalendarStore>((set) => ({
  // Initial state
  viewMode: 'month',
  currentDate: getToday(),
  selectedCalendarIds: [],
  isCreatingEvent: false,
  showAttendees: true,
  showDetails: true,
  sidebarCollapsed: false,

  // View and navigation
  setViewMode: (mode) => set({ viewMode: mode }),

  setCurrentDate: (date) => set({ currentDate: date }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  goToToday: () => set({ currentDate: getToday() }),

  goToNextPeriod: () =>
    set((state) => {
      const date = new Date(state.currentDate);

      switch (state.viewMode) {
        case 'day':
          date.setDate(date.getDate() + 1);
          break;
        case 'week':
          date.setDate(date.getDate() + 7);
          break;
        case 'month':
          date.setMonth(date.getMonth() + 1);
          break;
        case 'agenda':
          date.setDate(date.getDate() + 14);
          break;
        default:
          date.setMonth(date.getMonth() + 1);
      }

      date.setHours(0, 0, 0, 0);
      return { currentDate: date.toISOString().split('T')[0] };
    }),

  goToPreviousPeriod: () =>
    set((state) => {
      const date = new Date(state.currentDate);

      switch (state.viewMode) {
        case 'day':
          date.setDate(date.getDate() - 1);
          break;
        case 'week':
          date.setDate(date.getDate() - 7);
          break;
        case 'month':
          date.setMonth(date.getMonth() - 1);
          break;
        case 'agenda':
          date.setDate(date.getDate() - 14);
          break;
        default:
          date.setMonth(date.getMonth() - 1);
      }

      date.setHours(0, 0, 0, 0);
      return { currentDate: date.toISOString().split('T')[0] };
    }),

  // Calendar selection
  setSelectedCalendars: (calendarIds) => set({ selectedCalendarIds: calendarIds }),

  toggleCalendarSelection: (calendarId) =>
    set((state) => {
      const selected = state.selectedCalendarIds;
      const index = selected.indexOf(calendarId);

      if (index > -1) {
        // Remove if already selected
        return {
          selectedCalendarIds: selected.filter((id) => id !== calendarId),
        };
      } else {
        // Add if not selected
        return {
          selectedCalendarIds: [...selected, calendarId],
        };
      }
    }),

  selectAllCalendars: () => {
    // This will be called with available calendars from parent
    // For now, just a placeholder
  },

  deselectAllCalendars: () => set({ selectedCalendarIds: [] }),

  // Event selection
  setSelectedEvent: (eventId) => set({ selectedEventId: eventId }),

  // Event creation/editing
  openCreateEvent: (date) =>
    set({
      isCreatingEvent: true,
      selectedDate: date,
      editingEventId: undefined,
    }),

  closeCreateEvent: () =>
    set({
      isCreatingEvent: false,
      selectedDate: undefined,
    }),

  openEditEvent: (eventId) =>
    set({
      editingEventId: eventId,
      isCreatingEvent: true,
    }),

  closeEditEvent: () =>
    set({
      editingEventId: undefined,
      isCreatingEvent: false,
    }),

  // Search and filtering
  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterTags: (tags) => set({ filterTags: tags }),

  // Drag-drop state
  setDragState: (drag) => set({ dragState: drag }),

  clearDragState: () => set({ dragState: undefined }),

  // UI panels
  setShowAttendees: (show) => set({ showAttendees: show }),

  setShowDetails: (show) => set({ showDetails: show }),

  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed,
    })),

  // Timezone
  setTimezone: (timezone) => set({ timezone }),
}));

export default calendarStore;
