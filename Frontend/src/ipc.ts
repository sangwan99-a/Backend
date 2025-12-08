import { ipcMain, Notification, app } from 'electron';
import Store from 'electron-store';
import * as path from 'path';

const store = new Store();

export const setupIpcHandlers = (): void => {
  // App info handlers
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:get-path', (_, name: string) => app.getPath(name as any));

  // Store handlers
  ipcMain.handle('store:get', (_, key: string) => store.get(key));
  ipcMain.handle('store:set', (_, key: string, value: any) => {
    store.set(key, value);
    return true;
  });

  // Notification handlers
  ipcMain.handle('notification:send', (_, { title, options }) => {
    const notification = new Notification({
      title,
      ...options,
      icon: path.join(__dirname, '../assets/icon.png'),
    });
    notification.show();
    return true;
  });

  // Theme handlers
  ipcMain.handle('theme:get-system', () => {
    const isDarkMode = require('electron').nativeTheme.shouldUseDarkColors;
    return isDarkMode ? 'dark' : 'light';
  });

  ipcMain.on('theme:update', (event, theme: string) => {
    store.set('theme', theme);
    event.reply('theme:updated', theme);
  });
};
