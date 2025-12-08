import { useEmailStore } from '../store/emailStore';
import { saveMessage, saveFolders as saveFolder, getFolders } from './emailDatabase';
import type { EmailMessage, EmailFolder, EmailNotification } from '../types/email';

/**
 * Email Notification Service - WebSocket handler for real-time email updates
 * 
 * Handles:
 * - New email notifications with sync to IndexedDB
 * - Folder update notifications (unread counts, etc.)
 * - Read receipt notifications
 * - Sync completion notifications
 * - Reconnection with exponential backoff
 */

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

export interface EmailNotificationPayload {
  type: 'new-email' | 'email-read' | 'folder-updated' | 'sync-completed' | 'label-updated';
  payload: any;
}

/**
 * Initialize WebSocket connection for email notifications
 */
export const initializeEmailNotifications = (userId: string, authToken: string) => {
  if (ws?.readyState === WebSocket.OPEN) {
    console.warn('WebSocket already connected');
    return;
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/api/email/notifications?userId=${userId}&token=${authToken}`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Email notifications WebSocket connected');
      reconnectAttempts = 0;
      // Store sync progress in component state
    };

    ws.onmessage = (event) => {
      try {
        const notification: EmailNotificationPayload = JSON.parse(event.data);
        handleEmailNotification(notification);
      } catch (error) {
        console.error('Error parsing email notification:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Email WebSocket error:', error);
      // Reset sync progress on error
    };

    ws.onclose = () => {
      console.log('Email notifications WebSocket disconnected');
      ws = null;
      attemptReconnect(userId, authToken);
    };
  } catch (error) {
    console.error('Failed to initialize email notifications:', error);
  }
};

/**
 * Handle incoming email notifications
 */
const handleEmailNotification = async (notification: EmailNotificationPayload) => {
  try {
    switch (notification.type) {
      case 'new-email':
        await handleNewEmailNotification(notification.payload);
        break;

      case 'email-read':
        await handleEmailReadNotification(notification.payload);
        break;

      case 'folder-updated':
        await handleFolderUpdateNotification(notification.payload);
        break;

      case 'sync-completed':
        handleSyncCompletedNotification(notification.payload);
        break;

      case 'label-updated':
        await handleLabelUpdateNotification(notification.payload);
        break;

      default:
        console.warn('Unknown email notification type:', notification.type);
    }
  } catch (error) {
    console.error('Error handling email notification:', error);
  }
};

/**
 * Handle new email notification
 */
const handleNewEmailNotification = async (payload: { message: EmailMessage; folderId: string }) => {
  try {
    const { message, folderId } = payload;

    // Save message to IndexedDB
    await saveMessage(message);

    // Update folder unread count
    const folders = await getFolders();
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      folder.unreadCount = (folder.unreadCount || 0) + 1;
      await saveFolder([folder]);
    }

    // Update store unread count
    // Note: Use component state management or context instead

    // Show browser notification
    showBrowserNotification({
      title: `New email from ${message.from.name}`,
      body: message.subject,
      tag: 'new-email',
    });

    // Play notification sound if enabled
    playNotificationSound();
  } catch (error) {
    console.error('Error handling new email notification:', error);
  }
};

/**
 * Handle email marked as read notification
 */
const handleEmailReadNotification = async (payload: { messageId: string; isRead: boolean }) => {
  try {
    const { messageId, isRead } = payload;

    // Update message in IndexedDB
    // await updateMessageReadStatus(messageId, isRead);

    // Invalidate email thread query to refresh
    // queryClient.invalidateQueries(['email-thread', messageId]);
  } catch (error) {
    console.error('Error handling email read notification:', error);
  }
};

/**
 * Handle folder update notification
 */
const handleFolderUpdateNotification = async (payload: { folder: EmailFolder }) => {
  try {
    const { folder } = payload;

    // Update folder in IndexedDB
    await saveFolder([folder]);

    // Invalidate folders query
    // queryClient.invalidateQueries('email-folders');
  } catch (error) {
    console.error('Error handling folder update notification:', error);
  }
};

/**
 * Handle sync completion notification
 */
const handleSyncCompletedNotification = (payload: { syncedCount: number; totalCount: number }) => {
  try {
    const { syncedCount, totalCount } = payload;

    console.log(`Email sync completed: ${syncedCount}/${totalCount}`);

    // Update sync progress in component state
    // Invalidate email queries to refresh
    // queryClient.invalidateQueries('emails');
    // queryClient.invalidateQueries('email-folders');
  } catch (error) {
    console.error('Error handling sync completion notification:', error);
  }
};

/**
 * Handle label update notification
 */
const handleLabelUpdateNotification = async (payload: { label: any }) => {
  try {
    const { label } = payload;

    // Update label in store or IndexedDB
    // await updateLabel(label);

    // Invalidate labels query
    // queryClient.invalidateQueries('email-labels');
  } catch (error) {
    console.error('Error handling label update notification:', error);
  }
};

/**
 * Attempt to reconnect WebSocket with exponential backoff
 */
const attemptReconnect = (userId: string, authToken: string) => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max email WebSocket reconnection attempts reached');
    return;
  }

  reconnectAttempts++;
  const delay = RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1);

  console.log(`Attempting email WebSocket reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);

  setTimeout(() => {
    initializeEmailNotifications(userId, authToken);
  }, delay);
};

/**
 * Disconnect email notifications
 */
export const disconnectEmailNotifications = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};

/**
 * Show browser notification
 */
const showBrowserNotification = (options: { title: string; body: string; tag: string }) => {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(options.title, {
      body: options.body,
      tag: options.tag,
      icon: '/email-icon.png',
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          tag: options.tag,
        });
      }
    });
  }
};

/**
 * Play notification sound
 */
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.debug('Could not play notification sound:', error);
    });
  } catch (error) {
    console.debug('Error playing notification sound:', error);
  }
};

/**
 * Send message through WebSocket
 */
export const sendEmailNotification = (notification: EmailNotificationPayload) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(notification));
  } else {
    console.warn('Email WebSocket not connected');
  }
};

/**
 * Get WebSocket connection status
 */
export const isEmailNotificationsConnected = (): boolean => {
  return ws?.readyState === WebSocket.OPEN;
};

/**
 * Get reconnection attempt count
 */
export const getEmailReconnectAttempts = (): number => {
  return reconnectAttempts;
};
