/**
 * Notification System Integration Examples
 * How to use the notifications system across FusionDesk
 * 
 * IMPORTANT: These are pseudocode examples for documentation purposes.
 * For actual implementations, import from the appropriate modules in your project.
 * This file should not be imported directly into your application code.
 */

export const INTEGRATION_EXAMPLES = {
  /**
   * EXAMPLE 1: Initialize WebSocket on Login
   * 
   * In your login/auth handler:
   * 
   * ```typescript
   * import { notificationWebSocket } from '@/services/notificationWebSocket';
   * import useNotificationStore from '@/store/notificationStore';
   * 
   * export function initializeNotifications(user: User, authToken: string) {
   *   notificationWebSocket.connect(user.id, authToken).then(() => {
   *     console.log('Notifications initialized');
   *   });
   *   
   *   const unsubscribe = notificationWebSocket.subscribe((notification) => {
   *     const store = useNotificationStore.getState();
   *     store.addNotification(notification);
   *     
   *     if (notification.priority === 'critical' || notification.priority === 'high') {
   *       store.addToast({...});
   *     }
   *   });
   * }
   * ```
   */
  INIT_WEBSOCKET: `Initialize notifications on login`,

  /**
   * EXAMPLE 2: Send @mention Notification
   */
  CHAT_MENTION: `Send @mention notification with high priority`,

  /**
   * EXAMPLE 3: Send Task Assignment
   */
  TASK_ASSIGNMENT: `Send task assignment notification`,

  /**
   * EXAMPLE 4: Send Calendar Reminder
   */
  CALENDAR_REMINDER: `Send calendar event reminder`,

  /**
   * EXAMPLE 5: Send System Alert (Admin)
   */
  SYSTEM_ALERT: `Send system status alert to admins`,

  /**
   * EXAMPLE 6: Use Notification Hooks in Components
   */
  NOTIFICATION_BELL: `Display notification bell with unread count`,

  /**
   * EXAMPLE 7: Do Not Disturb Settings
   */
  DO_NOT_DISTURB: `Schedule Do Not Disturb for specified duration`,

  /**
   * EXAMPLE 8: Search Notifications
   */
  SEARCH_NOTIFICATIONS: `Search through notifications`,

  /**
   * EXAMPLE 9: Notification Preferences
   */
  NOTIFICATION_PREFERENCES: `Manage notification preferences`,

  /**
   * EXAMPLE 10: Export Notifications
   */
  EXPORT_NOTIFICATIONS: `Export notifications to CSV`,

  /**
   * EXAMPLE 11: Snooze Notification
   */
  SNOOZE_NOTIFICATION: `Snooze notification for specified time`,

  /**
   * EXAMPLE 12: Mute User or Conversation
   */
  MUTE_USER_CONVERSATION: `Mute notifications from specific user or conversation`,
};

export default INTEGRATION_EXAMPLES;
