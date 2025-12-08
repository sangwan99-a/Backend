/**
 * Calendar Notifications Service - WebSocket handler for real-time calendar updates
 *
 * Handles:
 * - Event creation/update/deletion notifications
 * - Attendee RSVP updates
 * - Calendar sharing notifications
 * - Meeting time suggestions
 * - Recurring event exceptions
 * - Real-time sync with exponential backoff reconnection
 */

import { calendarStore } from '../store/calendarStore';
import { saveEvent, updateEvent, deleteEvent } from '../services/calendarDatabase';
import type { CalendarEvent, CalendarNotification } from '../types/calendar';

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;

export interface CalendarNotificationPayload {
  type:
    | 'event-created'
    | 'event-updated'
    | 'event-deleted'
    | 'attendee-responded'
    | 'calendar-shared'
    | 'meeting-suggestion'
    | 'sync-completed';
  payload: any;
}

/**
 * Initialize WebSocket connection for calendar notifications
 */
export const initializeCalendarNotifications = (userId: string, authToken: string) => {
  if (ws?.readyState === WebSocket.OPEN) {
    console.warn('Calendar WebSocket already connected');
    return;
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/calendar/${userId}?token=${authToken}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Calendar notifications WebSocket connected');
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const notification: CalendarNotificationPayload = JSON.parse(event.data);
        handleCalendarNotification(notification);
      } catch (error) {
        console.error('Error parsing calendar notification:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Calendar WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Calendar notifications WebSocket disconnected');
      ws = null;
      attemptReconnect(userId, authToken);
    };
  } catch (error) {
    console.error('Failed to initialize calendar notifications:', error);
  }
};

/**
 * Handle incoming calendar notifications
 */
const handleCalendarNotification = async (notification: CalendarNotificationPayload) => {
  try {
    switch (notification.type) {
      case 'event-created':
        await handleEventCreated(notification.payload);
        break;

      case 'event-updated':
        await handleEventUpdated(notification.payload);
        break;

      case 'event-deleted':
        await handleEventDeleted(notification.payload);
        break;

      case 'attendee-responded':
        await handleAttendeeResponse(notification.payload);
        break;

      case 'calendar-shared':
        await handleCalendarShared(notification.payload);
        break;

      case 'meeting-suggestion':
        handleMeetingSuggestion(notification.payload);
        break;

      case 'sync-completed':
        handleSyncCompleted(notification.payload);
        break;

      default:
        console.warn('Unknown calendar notification type:', notification.type);
    }
  } catch (error) {
    console.error('Error handling calendar notification:', error);
  }
};

/**
 * Handle new event creation
 */
const handleEventCreated = async (payload: { event: CalendarEvent }) => {
  try {
    const { event } = payload;
    await saveEvent(event);

    // Show browser notification
    showBrowserNotification({
      title: 'New Event',
      body: `${event.title} at ${new Date(event.startTime).toLocaleTimeString()}`,
      tag: 'event-created',
    });

    // Play sound
    playNotificationSound();
  } catch (error) {
    console.error('Error handling event created:', error);
  }
};

/**
 * Handle event update
 */
const handleEventUpdated = async (payload: { eventId: string; updates: Partial<CalendarEvent> }) => {
  try {
    const { eventId, updates } = payload;
    await updateEvent(eventId, updates);
  } catch (error) {
    console.error('Error handling event updated:', error);
  }
};

/**
 * Handle event deletion
 */
const handleEventDeleted = async (payload: { eventId: string }) => {
  try {
    const { eventId } = payload;
    await deleteEvent(eventId);
  } catch (error) {
    console.error('Error handling event deleted:', error);
  }
};

/**
 * Handle attendee RSVP response
 */
const handleAttendeeResponse = async (payload: {
  eventId: string;
  attendeeEmail: string;
  status: string;
}) => {
  try {
    const { eventId, attendeeEmail, status } = payload;

    // Update attendee in IndexedDB
    // await updateAttendeeStatus(eventId, attendeeEmail, status);

    console.log(`Attendee ${attendeeEmail} responded to event ${eventId}: ${status}`);
  } catch (error) {
    console.error('Error handling attendee response:', error);
  }
};

/**
 * Handle calendar sharing
 */
const handleCalendarShared = async (payload: { calendarId: string; sharedWith: string; permission: string }) => {
  try {
    const { calendarId, sharedWith, permission } = payload;

    showBrowserNotification({
      title: 'Calendar Shared',
      body: `Calendar shared with ${sharedWith} (${permission} access)`,
      tag: 'calendar-shared',
    });
  } catch (error) {
    console.error('Error handling calendar shared:', error);
  }
};

/**
 * Handle meeting time suggestions
 */
const handleMeetingSuggestion = (payload: { suggestions: any[] }) => {
  try {
    const { suggestions } = payload;

    showBrowserNotification({
      title: 'Meeting Time Suggestions',
      body: `${suggestions.length} available time slots for your meeting`,
      tag: 'meeting-suggestion',
    });
  } catch (error) {
    console.error('Error handling meeting suggestion:', error);
  }
};

/**
 * Handle sync completion
 */
const handleSyncCompleted = (payload: { syncedCount: number; totalCount: number }) => {
  try {
    const { syncedCount, totalCount } = payload;
    console.log(`Calendar sync completed: ${syncedCount}/${totalCount} events synced`);
  } catch (error) {
    console.error('Error handling sync completed:', error);
  }
};

/**
 * Attempt to reconnect WebSocket with exponential backoff
 */
const attemptReconnect = (userId: string, authToken: string) => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max calendar WebSocket reconnection attempts reached');
    return;
  }

  reconnectAttempts++;
  const delay = RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts - 1);

  console.log(`Attempting calendar WebSocket reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);

  setTimeout(() => {
    initializeCalendarNotifications(userId, authToken);
  }, delay);
};

/**
 * Disconnect calendar notifications
 */
export const disconnectCalendarNotifications = () => {
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
      icon: '/calendar-icon.png',
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
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
    audio.play().catch((error) => {
      console.debug('Could not play notification sound:', error);
    });
  } catch (error) {
    console.debug('Error playing notification sound:', error);
  }
};

/**
 * Send message through WebSocket
 */
export const sendCalendarNotification = (notification: CalendarNotificationPayload) => {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(notification));
  } else {
    console.warn('Calendar WebSocket not connected');
  }
};

/**
 * Get WebSocket connection status
 */
export const isCalendarNotificationsConnected = (): boolean => {
  return ws?.readyState === WebSocket.OPEN;
};

/**
 * Get reconnection attempt count
 */
export const getCalendarReconnectAttempts = (): number => {
  return reconnectAttempts;
};
