import { Notification, app } from 'electron';

export const initializeNotifications = (): void => {
  // Handle notification actions using IPC or other mechanisms
  // Note: 'notification-action-invoked' is not a standard Electron app event
  // Notification click handling should be done via the Notification object's click event

  // Enable notification support on Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.aiproductivity.desktop');
  }
};

export const sendNotification = (title: string, options?: any) => {
  const notification = new Notification({
    title,
    silent: false,
    ...options,
  });
  notification.show();
};
