export const KEYBOARD_SHORTCUTS = {
  openSearch: 'Ctrl+K',
  newChat: 'Ctrl+N',
  openSettings: 'Ctrl+,',
  toggleSidebar: 'Ctrl+B',
  sendMessage: 'Ctrl+Enter',
  escape: 'Escape',
};

export const registerKeyboardShortcuts = (handlers: Record<string, () => void>) => {
  window.addEventListener('keydown', (event) => {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    if (modifier && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      handlers.openSearch?.();
    }

    if (modifier && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      handlers.newChat?.();
    }

    if (modifier && event.key === ',') {
      event.preventDefault();
      handlers.openSettings?.();
    }

    if (modifier && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      handlers.toggleSidebar?.();
    }

    if (modifier && event.key === 'Enter') {
      event.preventDefault();
      handlers.sendMessage?.();
    }

    if (event.key === 'Escape') {
      handlers.escape?.();
    }
  });
};
