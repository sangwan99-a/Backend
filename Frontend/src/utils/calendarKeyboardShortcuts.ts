/**
 * Calendar Keyboard Shortcuts - Power user shortcuts for calendar operations
 *
 * Shortcuts:
 * - C: Create new event
 * - D: Duplicate selected event
 * - Delete: Delete selected event
 * - Shift+A: Add attendees to selected event
 * - Shift+R: Open event recurrence editor
 * - Arrow Left/Right: Navigate to previous/next period
 * - Arrow Up/Down: Navigate to previous/next day in day view
 * - G: Go to date picker
 * - T: Go to today
 * - M/W/D/A/L: Switch to Month/Week/Day/Agenda/List view
 * - S: Open search
 * - /: Focus search input
 * - Escape: Deselect event, close dialogs
 */

import { calendarStore } from '../store/calendarStore';
import type { CalendarEvent } from '../types/calendar';

interface KeyboardShortcutHandler {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
}

const shortcuts: KeyboardShortcutHandler[] = [];

/**
 * Check if element is an input field
 */
const isInputField = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase();
  const inputTypes = ['input', 'textarea', 'select'];

  if (inputTypes.includes(tagName)) {
    return true;
  }

  if (tagName === 'input') {
    const type = element.getAttribute('type');
    return !['button', 'checkbox', 'radio', 'submit', 'reset'].includes(type || '');
  }

  return element.contentEditable === 'true';
};

/**
 * Initialize calendar keyboard shortcuts
 */
export const initializeCalendarKeyboardShortcuts = () => {
  document.addEventListener('keydown', handleKeyboardEvent);

  setupShortcuts();
};

/**
 * Setup all keyboard shortcuts
 */
const setupShortcuts = () => {
  shortcuts.push(
    // Create new event
    {
      key: 'c',
      handler: () => {
        calendarStore.setState({ isCreatingEvent: true });
      },
    },

    // Duplicate selected event
    {
      key: 'd',
      handler: () => {
        const state = calendarStore.getState();
        if (state.selectedEventId) {
          // In a real implementation, fetch the event, clone it, and open create dialog
          console.log('Duplicate event:', state.selectedEventId);
        }
      },
    },

    // Delete selected event
    {
      key: 'Delete',
      handler: () => {
        const state = calendarStore.getState();
        if (state.selectedEventId) {
          // In a real implementation, call useDeleteEvent mutation
          console.log('Delete event:', state.selectedEventId);
        }
      },
    },

    // Add attendees to event
    {
      key: 'a',
      shiftKey: true,
      handler: () => {
        const state = calendarStore.getState();
        if (state.selectedEventId) {
          calendarStore.setState({ showAttendees: !state.showAttendees });
        }
      },
    },

    // Open recurrence editor
    {
      key: 'r',
      shiftKey: true,
      handler: () => {
        const state = calendarStore.getState();
        if (state.selectedEventId) {
          calendarStore.setState({ editingEventId: state.selectedEventId });
        }
      },
    },

    // Navigate to previous period
    {
      key: 'ArrowLeft',
      handler: () => {
        calendarStore.getState().goToPreviousPeriod();
      },
    },

    // Navigate to next period
    {
      key: 'ArrowRight',
      handler: () => {
        calendarStore.getState().goToNextPeriod();
      },
    },

    // Navigate to previous day (in day view)
    {
      key: 'ArrowUp',
      handler: () => {
        const state = calendarStore.getState();
        if (state.viewMode === 'day') {
          const prevDay = new Date(state.currentDate);
          prevDay.setDate(prevDay.getDate() - 1);
          state.setCurrentDate(prevDay.toISOString());
        }
      },
    },

    // Navigate to next day (in day view)
    {
      key: 'ArrowDown',
      handler: () => {
        const state = calendarStore.getState();
        if (state.viewMode === 'day') {
          const nextDay = new Date(state.currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          state.setCurrentDate(nextDay.toISOString());
        }
      },
    },

    // Go to today
    {
      key: 't',
      handler: () => {
        calendarStore.getState().goToToday();
      },
    },

    // Switch to month view
    {
      key: 'm',
      handler: () => {
        calendarStore.setState({ viewMode: 'month' });
      },
    },

    // Switch to week view
    {
      key: 'w',
      handler: () => {
        calendarStore.setState({ viewMode: 'week' });
      },
    },

    // Switch to day view
    {
      key: 'd',
      handler: () => {
        calendarStore.setState({ viewMode: 'day' });
      },
    },

    // Switch to agenda view
    {
      key: 'a',
      handler: () => {
        calendarStore.setState({ viewMode: 'agenda' });
      },
    },

    // Switch to list view
    {
      key: 'l',
      handler: () => {
        calendarStore.setState({ viewMode: 'list' });
      },
    },

    // Open search
    {
      key: 's',
      handler: () => {
        const searchInput = document.querySelector('[data-calendar-search]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
    },

    // Focus search input
    {
      key: '/',
      handler: () => {
        const searchInput = document.querySelector('[data-calendar-search]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
    },

    // Deselect event / close dialogs
    {
      key: 'Escape',
      handler: () => {
        const state = calendarStore.getState();
        calendarStore.setState({
          selectedEventId: undefined,
          isCreatingEvent: false,
          editingEventId: undefined,
          showAttendees: false,
          showDetails: false,
        });
      },
    },

    // Go to date picker
    {
      key: 'g',
      handler: () => {
        const dateInput = document.querySelector('[data-calendar-date-picker]') as HTMLInputElement;
        if (dateInput) {
          dateInput.focus();
        }
      },
    }
  );
};

/**
 * Handle keyboard events
 */
const handleKeyboardEvent = (event: KeyboardEvent) => {
  // Don't trigger shortcuts in input fields
  if (isInputField(event.target as HTMLElement)) {
    return;
  }

  // Find matching shortcut
  const matchingShortcut = shortcuts.find((shortcut) => {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatch = (event.ctrlKey || event.metaKey) === (shortcut.ctrlKey || false);
    const shiftMatch = event.shiftKey === (shortcut.shiftKey || false);
    const altMatch = event.altKey === (shortcut.altKey || false);

    return keyMatch && ctrlMatch && shiftMatch && altMatch;
  });

  if (matchingShortcut) {
    event.preventDefault();
    matchingShortcut.handler();
  }
};

/**
 * Cleanup keyboard shortcuts
 */
export const cleanupCalendarKeyboardShortcuts = () => {
  document.removeEventListener('keydown', handleKeyboardEvent);
  shortcuts.length = 0;
};

/**
 * Get list of available shortcuts
 */
export const getCalendarKeyboardShortcuts = (): Array<{
  keys: string;
  description: string;
}> => {
  return [
    { keys: 'C', description: 'Create new event' },
    { keys: 'D', description: 'Duplicate selected event' },
    { keys: 'Delete', description: 'Delete selected event' },
    { keys: 'Shift+A', description: 'Add attendees to selected event' },
    { keys: 'Shift+R', description: 'Open event recurrence editor' },
    { keys: 'Arrow Left/Right', description: 'Navigate to previous/next period' },
    { keys: 'Arrow Up/Down', description: 'Navigate to previous/next day (in day view)' },
    { keys: 'G', description: 'Open go to date picker' },
    { keys: 'T', description: 'Go to today' },
    { keys: 'M/W/D/A/L', description: 'Switch to Month/Week/Day/Agenda/List view' },
    { keys: 'S or /', description: 'Focus search input' },
    { keys: 'Escape', description: 'Deselect event and close dialogs' },
  ];
};

/**
 * Show keyboard shortcuts help dialog
 */
export const showCalendarKeyboardShortcutsHelp = () => {
  const shortcuts = getCalendarKeyboardShortcuts();
  const shortcutList = shortcuts.map((s) => `${s.keys.padEnd(20)} - ${s.description}`).join('\n');

  alert(`Calendar Keyboard Shortcuts:\n\n${shortcutList}`);
};
