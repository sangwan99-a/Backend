/**
 * Documents Keyboard Shortcuts Utility
 * 
 * Shortcuts:
 * - U: Upload files
 * - N: Create new folder
 * - Del: Move to trash
 * - /: Focus search
 * - Ctrl+A: Select all files
 * - Ctrl+C: Copy selected
 * - Ctrl+V: Paste
 * - Ctrl+X: Cut selected
 * - Escape: Deselect/Close
 * - Arrow keys: Navigate files
 * - Enter: Open file/Open in new tab
 */

import { useEffect } from 'react';
import type { useDocumentsStore } from '../store/documentsStore';

interface KeyboardShortcutsConfig {
  store: ReturnType<typeof useDocumentsStore> & { clearSelection?: () => void };
  onUpload?: () => void;
  onCreateFolder?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onSelectAll?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onOpenFile?: () => void;
}

/**
 * Check if user is typing in an input/textarea
 */
function isInputActive(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea';
}

/**
 * Hook to register keyboard shortcuts
 */
export function useDocumentsKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const clearSelection = config.store.clearSelection || (() => {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (isInputActive() && !['Escape', 'Enter'].includes(e.key)) {
        return;
      }

      // Single key shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'u':
            e.preventDefault();
            config.onUpload?.();
            break;
          case 'n':
            e.preventDefault();
            config.onCreateFolder?.();
            break;
          case 'delete':
          case 'backspace':
            e.preventDefault();
            config.onDelete?.();
            break;
          case '/':
            e.preventDefault();
            config.onSearch?.();
            break;
          case 'escape':
            e.preventDefault();
            clearSelection?.();
            break;
          case 'arrowup':
            e.preventDefault();
            config.onNavigateUp?.();
            break;
          case 'arrowdown':
            e.preventDefault();
            config.onNavigateDown?.();
            break;
          case 'enter':
            e.preventDefault();
            config.onOpenFile?.();
            break;
        }
      }

      // Ctrl/Cmd key shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            e.preventDefault();
            config.onSelectAll?.();
            break;
          case 'c':
            e.preventDefault();
            config.onCopy?.();
            break;
          case 'v':
            e.preventDefault();
            config.onPaste?.();
            break;
          case 'x':
            e.preventDefault();
            config.onCut?.();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, clearSelection]);
}

/**
 * Create a keyboard shortcut map for display
 */
export const DOCUMENTS_SHORTCUTS = [
  {
    key: 'U',
    label: 'Upload files',
    description: 'Open upload dialog',
  },
  {
    key: 'N',
    label: 'New folder',
    description: 'Create a new folder',
  },
  {
    key: 'Del/Backspace',
    label: 'Delete',
    description: 'Move selected files to trash',
  },
  {
    key: '/',
    label: 'Search',
    description: 'Focus on search box',
  },
  {
    key: 'Ctrl+A',
    label: 'Select all',
    description: 'Select all files in current folder',
  },
  {
    key: 'Ctrl+C',
    label: 'Copy',
    description: 'Copy selected files',
  },
  {
    key: 'Ctrl+V',
    label: 'Paste',
    description: 'Paste copied files',
  },
  {
    key: 'Ctrl+X',
    label: 'Cut',
    description: 'Cut selected files',
  },
  {
    key: 'Escape',
    label: 'Deselect',
    description: 'Clear selection and close modals',
  },
  {
    key: '↑ / ↓',
    label: 'Navigate',
    description: 'Navigate between files',
  },
  {
    key: 'Enter',
    label: 'Open',
    description: 'Open selected file',
  },
];

/**
 * Format keyboard shortcut display
 */
export function formatShortcut(shortcut: string): string {
  return shortcut
    .replace(/Ctrl\+/g, 'Ctrl+')
    .replace(/Cmd\+/g, '⌘')
    .replace(/shift\+/i, '⇧+')
    .replace(/alt\+/i, '⌥+')
    .replace(/ArrowUp/i, '↑')
    .replace(/ArrowDown/i, '↓')
    .replace(/ArrowLeft/i, '←')
    .replace(/ArrowRight/i, '→')
    .replace(/Delete/i, 'Del')
    .replace(/Backspace/i, '⌫');
}

/**
 * Create help panel component data
 */
export function getKeyboardShortcutsHelp() {
  return DOCUMENTS_SHORTCUTS.map((shortcut) => ({
    ...shortcut,
    displayKey: formatShortcut(shortcut.key),
  }));
}
