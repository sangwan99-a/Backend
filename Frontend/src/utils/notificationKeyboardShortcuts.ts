/**
 * Notification Keyboard Shortcuts
 * Keyboard navigation for notification center
 */

import React, { useEffect, FC, ReactNode } from 'react';
import useNotificationStore from '../store/notificationStore';

/**
 * Hook for notification keyboard shortcuts
 * Ctrl+Shift+N → Toggle notification panel
 * Escape → Close notification panel
 * Tab → Navigate between tabs
 */
export function useNotificationKeyboardShortcuts() {
  const { isPanelOpen, togglePanel, closePanel, activeTab, setActiveTab } =
    useNotificationStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      const isTyping = ['INPUT', 'TEXTAREA'].includes(
        (event.target as HTMLElement).tagName
      );

      if (isTyping) return;

      // Ctrl+Shift+N → Toggle notification panel
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyN') {
        event.preventDefault();
        togglePanel();
      }

      // Escape → Close notification panel
      if (event.key === 'Escape' && isPanelOpen) {
        event.preventDefault();
        closePanel();
      }

      // Number keys for tab navigation (when panel is open)
      if (isPanelOpen) {
        const tabs = ['all', 'unread', 'mentions', 'tasks', 'calendar'] as const;
        const keyMap: Record<string, typeof tabs[number]> = {
          '1': 'all',
          '2': 'unread',
          '3': 'mentions',
          '4': 'tasks',
          '5': 'calendar',
        };

        if (keyMap[event.key]) {
          event.preventDefault();
          setActiveTab(keyMap[event.key]);
        }

        // Arrow keys for scrolling within list
        if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !event.ctrlKey) {
          // Let the browser handle natural scrolling
          // This ensures accessibility for users navigating the list
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, togglePanel, closePanel, setActiveTab]);
}

/**
 * Keyboard shortcuts information
 */
export const NOTIFICATION_SHORTCUTS = [
  {
    keys: 'Ctrl+Shift+N',
    description: 'Open/Close notification center',
  },
  {
    keys: 'Escape',
    description: 'Close notification center',
  },
  {
    keys: '1',
    description: 'Show all notifications',
  },
  {
    keys: '2',
    description: 'Show unread only',
  },
  {
    keys: '3',
    description: 'Show mentions',
  },
  {
    keys: '4',
    description: 'Show tasks',
  },
  {
    keys: '5',
    description: 'Show calendar events',
  },
  {
    keys: '↑/↓',
    description: 'Navigate notification list',
  },
];

/**
 * Hook to show help dialog with shortcuts
 */
export function useShowShortcutsHelp() {
  return () => {
    const helpText = NOTIFICATION_SHORTCUTS
      .map((s) => `${s.keys.padEnd(12)} - ${s.description}`)
      .join('\n');

    console.info('Notification Shortcuts:\n' + helpText);

    // In a real app, this would open a help dialog
    // For now, we just log to console
  };
}

/**
 * Global keyboard shortcut handler component
 * Wrap your app with this to enable keyboard shortcuts
 */
export const NotificationKeyboardShortcutsProvider: FC<{
  children: ReactNode;
}> = ({ children }) => {
  useNotificationKeyboardShortcuts();

  return React.createElement(React.Fragment, null, children);
};
