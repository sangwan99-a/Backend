import { app, BrowserWindow, ipcMain, Menu, Tray, systemPreferences } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { createTrayMenu, createAppMenu } from './menu';
import { setupIpcHandlers } from './ipc';
import { initializeNotifications } from './utils/notifications';

const store = new Store();
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const createWindow = (): BrowserWindow => {
  const windowState = store.get('windowState', {
    width: 1400,
    height: 900,
    x: undefined,
    y: undefined,
  }) as any;

  mainWindow = new BrowserWindow({
    width: windowState.width || 1400,
    height: windowState.height || 900,
    x: windowState.x,
    y: windowState.y,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    // Prevent window from closing, minimize to tray instead
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('resized', () => {
    const bounds = mainWindow!.getBounds();
    store.set('windowState', bounds);
  });

  return mainWindow;
};

const createTrayIcon = (): void => {
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('FusionDesk');
  tray.setContextMenu(createTrayMenu(mainWindow));

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
};

const setupAutoStart = (): void => {
  const autoStartEnabled = store.get('settings.autoStart', false);
  if (autoStartEnabled) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      path: app.getPath('exe'),
    });
  }
};

app.on('ready', () => {
  createWindow();
  createTrayIcon();
  setupAutoStart();
  initializeNotifications();
  setupIpcHandlers();
  Menu.setApplicationMenu(createAppMenu(mainWindow));

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Windows-specific: Handle window resize events
if (process.platform === 'win32') {
  app.on('ready', () => {
    // Window snap layout support - will be handled by Windows natively
    if (mainWindow) {
      mainWindow.on('will-resize', (event: any) => {
        // Optional: Add custom snap layout logic here
      });
    }
  });
}

export { mainWindow, tray };
