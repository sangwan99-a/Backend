// Email store reference - will be set on initialization
let emailStore: any = null;

/**
 * Initialize email store reference
 */
export function initializeEmailStore(store: any) {
  emailStore = store;
}

/**
 * Email Keyboard Shortcuts Handler
 * 
 * Shortcuts:
 * - Ctrl/Cmd + E: Open compose
 * - Ctrl/Cmd + .: Focus search
 * - Ctrl/Cmd + Shift + D: Mark as deleted/trash
 * - Ctrl/Cmd + Shift + A: Archive selected
 * - Ctrl/Cmd + Shift + L: Add label
 * - Ctrl/Cmd + Shift + U: Mark unread
 * - Ctrl/Cmd + Shift + R: Mark as read
 * - Shift + *: Select all
 * - Escape: Deselect all / Close compose
 * - R: Reply to focused email
 * - A: Reply all
 * - F: Forward
 * - J: Next email
 * - K: Previous email
 */

type KeyboardHandler = (event: KeyboardEvent) => void;

const handlers: Map<string, KeyboardHandler> = new Map();

/**
 * Register keyboard shortcut handler
 */
const registerShortcut = (keys: string, handler: KeyboardHandler) => {
  handlers.set(keys, handler);
};

/**
 * Parse keyboard combination into normalized string
 */
const normalizeKeyCombo = (event: KeyboardEvent): string => {
  const parts: string[] = [];

  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.shiftKey) parts.push('shift');
  if (event.altKey) parts.push('alt');

  // Add the actual key
  const key = event.key.toLowerCase();
  if (key.length === 1 && /^[a-z0-9]$/.test(key)) {
    parts.push(key);
  } else {
    parts.push(key.replace(/^Key/, '').toLowerCase());
  }

  return parts.join('+');
};

/**
 * Initialize email keyboard shortcuts
 */
export const initializeEmailKeyboardShortcuts = () => {
  // Ctrl/Cmd + E: Open compose
  registerShortcut('ctrl+e', (event) => {
    event.preventDefault();
    emailStore.setState({ isComposing: true });
  });

  // Ctrl/Cmd + .: Focus search
  registerShortcut('ctrl+.', (event) => {
    event.preventDefault();
    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    searchInput?.focus();
  });

  // Escape: Close compose or deselect
  registerShortcut('escape', (event) => {
    const state = emailStore.getState();
    if (state.isComposing) {
      event.preventDefault();
      emailStore.setState({ isComposing: false });
    } else if (state.selectedMessageIds.length > 0) {
      event.preventDefault();
      emailStore.setState({ selectedMessageIds: [] });
    }
  });

  // Ctrl/Cmd + Shift + D: Delete selected
  registerShortcut('ctrl+shift+d', (event) => {
    event.preventDefault();
    const state = emailStore.getState();
    if (state.selectedMessageIds.length > 0) {
      // Show delete confirmation
      // onDeleteSelected();
    }
  });

  // Ctrl/Cmd + Shift + A: Archive selected
  registerShortcut('ctrl+shift+a', (event) => {
    event.preventDefault();
    const state = emailStore.getState();
    if (state.selectedMessageIds.length > 0) {
      // Archive selected emails
      // onArchiveSelected();
    }
  });

  // Ctrl/Cmd + Shift + L: Add label
  registerShortcut('ctrl+shift+l', (event) => {
    event.preventDefault();
    const state = emailStore.getState();
    if (state.selectedMessageIds.length > 0) {
      // Show label picker
      // onShowLabelPicker();
    }
  });

  // Ctrl/Cmd + Shift + U: Mark unread
  registerShortcut('ctrl+shift+u', (event) => {
    event.preventDefault();
    const state = emailStore.getState();
    if (state.selectedMessageIds.length > 0) {
      // Mark selected as unread
      // onMarkUnread();
    }
  });

  // Ctrl/Cmd + Shift + R: Mark as read
  registerShortcut('ctrl+shift+r', (event) => {
    event.preventDefault();
    const state = emailStore.getState();
    if (state.selectedMessageIds.length > 0) {
      // Mark selected as read
      // onMarkRead();
    }
  });

  // R: Reply to focused email
  registerShortcut('r', (event) => {
    // Only if not in an input field
    if (isInInputField(event.target as HTMLElement)) {
      return;
    }

    event.preventDefault();
    const state = emailStore.getState();
    if (state.selectedMessageIds.length === 1) {
      // Open reply composer
      // onReply();
    }
  });

  // A: Reply all
  registerShortcut('a', (event) => {
    if (isInInputField(event.target as HTMLElement)) {
      return;
    }

    event.preventDefault();
    const state = emailStore.getState();
    if (state.selectedMessageIds.length === 1) {
      // Open reply all composer
      // onReplyAll();
    }
  });

  // F: Forward
  registerShortcut('f', (event) => {
    if (isInInputField(event.target as HTMLElement)) {
      return;
    }

    event.preventDefault();
    const state = emailStore.getState();
    if (state.selectedMessageIds.length === 1) {
      // Open forward composer
      // onForward();
    }
  });

  // J: Next email
  registerShortcut('j', (event) => {
    if (isInInputField(event.target as HTMLElement)) {
      return;
    }

    event.preventDefault();
    // Move to next email in list
    // onNextEmail();
  });

  // K: Previous email
  registerShortcut('k', (event) => {
    if (isInInputField(event.target as HTMLElement)) {
      return;
    }

    event.preventDefault();
    // Move to previous email in list
    // onPreviousEmail();
  });

  // Shift + *: Select all
  registerShortcut('shift+*', (event) => {
    event.preventDefault();
    emailStore.getState().selectAll();
  });
};

/**
 * Global keyboard event listener
 */
export const attachEmailKeyboardListener = () => {
  const handleKeyDown = (event: KeyboardEvent) => {
    const combo = normalizeKeyCombo(event);
    const handler = handlers.get(combo);

    if (handler) {
      handler(event);
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Check if element is an input field
 */
const isInInputField = (element: HTMLElement | null): boolean => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    (tagName === 'div' && element.contentEditable === 'true')
  );
};

/**
 * Show keyboard shortcuts help dialog
 */
export const getEmailKeyboardShortcuts = (): Array<{
  keys: string;
  description: string;
  category: string;
}> => [
  // Compose
  { keys: 'Ctrl + E', description: 'Open compose', category: 'Compose' },
  { keys: 'Escape', description: 'Close compose', category: 'Compose' },

  // Navigation
  { keys: 'Ctrl + .', description: 'Focus search', category: 'Navigation' },
  { keys: 'J', description: 'Next email', category: 'Navigation' },
  { keys: 'K', description: 'Previous email', category: 'Navigation' },
  { keys: 'Escape', description: 'Clear selection', category: 'Navigation' },

  // Actions
  { keys: 'R', description: 'Reply', category: 'Actions' },
  { keys: 'A', description: 'Reply all', category: 'Actions' },
  { keys: 'F', description: 'Forward', category: 'Actions' },
  { keys: 'Ctrl + Shift + D', description: 'Delete', category: 'Actions' },
  { keys: 'Ctrl + Shift + A', description: 'Archive', category: 'Actions' },

  // Labels & Filters
  { keys: 'Ctrl + Shift + L', description: 'Add label', category: 'Labels' },
  { keys: 'Ctrl + Shift + U', description: 'Mark unread', category: 'Labels' },
  { keys: 'Ctrl + Shift + R', description: 'Mark read', category: 'Labels' },

  // Selection
  { keys: 'Shift + *', description: 'Select all', category: 'Selection' },
];
