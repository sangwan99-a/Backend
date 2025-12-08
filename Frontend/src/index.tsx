import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initializeTheme } from './utils/theme';
import { registerKeyboardShortcuts } from './utils/keyboard';

// Initialize theme
initializeTheme();

// Register keyboard shortcuts
registerKeyboardShortcuts({
  openSearch: () => console.log('Search'),
  newChat: () => console.log('New chat'),
  openSettings: () => console.log('Settings'),
  toggleSidebar: () => {
    // Toggle sidebar logic
  },
  sendMessage: () => {
    // Send message logic
  },
  escape: () => {
    // Close any open dialogs
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
