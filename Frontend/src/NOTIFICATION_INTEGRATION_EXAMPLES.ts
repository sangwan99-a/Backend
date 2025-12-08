/**
 * Notification System Integration Examples
 * How to use the notifications system across FusionDesk
 * 
 * NOTE: These are code examples. The imports and function signatures shown
 * are illustrative and should be adapted to your actual implementation.
 * This file is for documentation purposes and should not be imported directly.
 */

// @ts-nocheck
// The following code is pseudocode documentation that should not be imported

/* ============================================================================
   EXAMPLE 1: Initialize WebSocket on Login
   ============================================================================ */

// In your login/auth handler:

export function initializeNotifications(user: any, authToken: string) {
  // const notificationWebSocket = ...; // import your websocket service
  // const notificationAPIClient = ...; // import your API client
  // const useNotificationStore = ...; // import your store
  
  // Set auth token for API client
  // notificationAPIClient.setAuthToken(authToken);

  // Connect WebSocket
  // notificationWebSocket.connect(user.id, authToken).then(() => {
  //   console.log('Notifications initialized');
  // });

  // Subscribe to notifications
  const unsubscribe = (notification: any) => {
    // const store = useNotificationStore.getState();
    // store.addNotification(notification);
    // Show toast for high-priority notifications
    if (notification && notification.priority === 'critical' || notification.priority === 'high') {
      // store.addToast({...})
    }
  };

  // Subscribe to connection status
  const subscribeToStatus = (status: any) => {
    console.log('Notification WS Status:', status);
  };

  return { unsubscribe, subscribeToStatus };
}

/* ============================================================================
   EXAMPLE 2: Chat Module - Send @mention Notification
   ============================================================================ */

// In Chat service when someone sends a message with @mention:
// import { Notification } from '@/types/notifications';
// import { notificationAPIClient } from '@/services/notificationAPIClient';

export async function notifyMention(params: {
  mentionedUserId: string;
  mentionedUserEmail: string;
  channelId: string;
  channelName: string;
  messageId: string;
  senderName: string;
  senderAvatar?: string;
  messagePreview: string;
  threadId?: string;
}) {
  const notification = {
    id: `mention-${params.messageId}-${Date.now()}`,
    userId: params.mentionedUserId,
    tenantId: 'current-tenant-id',
    type: 'chat_mention',
    category: 'chat',
    priority: 'high',
    title: `${params.senderName} mentioned you`,
    message: params.messagePreview,
    icon: '💬',
    avatar: params.senderAvatar,
    sender: {
      id: 'sender-id',
      name: params.senderName,
      email: params.mentionedUserEmail,
      avatar: params.senderAvatar,
    },
    actionUrl: `/chat/${params.channelId}/${params.messageId}`,
    actionLabel: 'View Message',
    metadata: {
      channelId: params.channelId,
      channelName: params.channelName,
      messageId: params.messageId,
      threadId: params.threadId,
      context: params.messagePreview,
    } as any,
    status: 'unread',
    isRead: false,
    isDismissed: false,
    deliveryStatus: 'pending',
    deliveryChannels: ['in_app', 'email', 'desktop'],
    createdAt: new Date(),
  };

  try {
    // Send to backend (which will broadcast via WebSocket)
    // const apiClient = await import('@/services/notificationAPIClient');
    // await apiClient.notificationAPIClient.request('POST', '/notifications', notification);
    console.log('Mention notification would be sent:', notification);
  } catch (error) {
    console.error('Failed to send mention notification:', error);
  }
}

/* ============================================================================
   EXAMPLE 3: Tasks Module - Send Task Assignment
   ============================================================================ */

import { Task } from '@/types/tasks';

export async function notifyTaskAssignment(task: Task, assigneeId: string, assigneeName: string) {
  const notification: any = {
    type: 'task_assigned',
    category: 'tasks',
    priority: task.priority as any,
    title: `Task assigned: ${task.title}`,
    message: `${(task.createdBy as any)?.name || 'Someone'} assigned you a task`,
    icon: '✅',
    actionUrl: `/tasks/${task.projectId}/${task.id}`,
    actionLabel: 'View Task',
    metadata: {
      projectId: task.projectId,
      taskId: task.id,
      taskTitle: task.title,
      assignee: { id: assigneeId, name: assigneeName },
      dueDate: task.dueDate,
      priority: task.priority,
    } as any,
    status: 'unread',
    isRead: false,
    isDismissed: false,
    deliveryStatus: 'pending',
    deliveryChannels: ['in_app', 'email'],
    createdAt: new Date(),
  };

  try {
    // await notificationAPIClient.request('POST', '/notifications', notification);
    console.log('Task notification would be sent:', notification);
  } catch (error) {
    console.error('Failed to send task notification:', error);
  }
}

/* ============================================================================
   EXAMPLE 4: Calendar Module - Send Event Reminder
   ============================================================================ */

// import { CalendarEvent } from '@/types/calendar';

export async function notifyEventReminder(
  event: any,
  attendeeId: string,
  minutesBefore: number = 15
) {
  const notification: any = {
    type: 'calendar_reminder',
    category: 'calendar',
    priority: 'high',
    title: `Reminder: ${event.title}`,
    message: `Your event starts in ${minutesBefore} minutes`,
    icon: '📅',
    actionUrl: `/calendar/${event.id}`,
    actionLabel: 'View Event',
    metadata: {
      eventId: event.id,
      eventTitle: event.title,
      startTime: event.startTime,
      location: event.location,
      attendees: (event.attendees as any[])?.map((a: any = {}) => ({ id: a.id, name: a.name, status: a.status })),
    } as any,
    status: 'unread',
    isRead: false,
    isDismissed: false,
    deliveryStatus: 'pending',
    deliveryChannels: ['in_app', 'desktop'],
    expiresAt: new Date(event.startTime as any), // Auto-expire reminder at event start
    createdAt: new Date(),
  };

  try {
    // await notificationAPIClient.request('POST', '/notifications', notification);
    console.log('Calendar notification would be sent:', notification);
  } catch (error) {
    console.error('Failed to send calendar reminder:', error);
  }
}

/* ============================================================================
   EXAMPLE 5: Admin Module - Send System Alert
   ============================================================================ */

export async function notifySystemAlert(params: {
  serviceId: string;
  serviceName: string;
  status: 'down' | 'degraded' | 'recovered';
  affectedUsers?: number;
  estimatedResolution?: Date;
}) {
  const adminUserId = 'admin-user-id'; // Notify all admins

  const notification: any = {
    type: params.status === 'recovered' ? 'service_recovered' : 'service_down',
    category: 'system',
    priority: params.status === 'recovered' ? 'normal' : 'critical',
    title: `${params.serviceName} is ${params.status === 'recovered' ? 'back online' : 'down'}`,
    message:
      params.status === 'recovered'
        ? `${params.serviceName} service is now operational`
        : `${params.serviceName} is currently unavailable. ${params.affectedUsers ? `Affecting ${params.affectedUsers} users.` : ''}`,
    icon: params.status === 'recovered' ? '✓' : '🔴',
    actionUrl: '/admin/system',
    actionLabel: 'View Details',
    metadata: {
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      severity: params.status === 'recovered' ? 'low' : 'critical',
      affectedUsers: params.affectedUsers,
      estimatedResolution: params.estimatedResolution,
      statusPageUrl: 'https://status.fusiondesk.com',
    } as any,
    status: 'unread',
    isRead: false,
    isDismissed: false,
    deliveryStatus: 'pending',
    deliveryChannels: ['in_app', 'email', 'mobile_push'],
    createdAt: new Date(),
  };

  try {
    // await notificationAPIClient.request('POST', '/notifications', notification);
    console.log('System alert notification would be sent:', notification);
  } catch (error) {
    console.error('Failed to send system alert:', error);
  }
}

/* ============================================================================
   EXAMPLE 6: Use Notification Hooks in Components
   ============================================================================ */

export const NotificationBell: any = ({ userId }: any) => {
  const { data: unreadCount, isLoading } = { data: 0, isLoading: false }; // useUnreadCount(userId);
  const { mutate: markAllAsRead } = { mutate: () => {} }; // useBulkMarkAsRead(userId);
  const openPanel = () => {}; // useNotificationStore((s: any) => s.openPanel);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({});
  };

  // JSX Example - return JSX element:
  // return (
  //   <div>
  //     <button onClick={openPanel} aria-label="Open notifications">
  //       🔔 {unreadCount && unreadCount > 0 && <span>{unreadCount}</span>}
  //     </button>
  //     {unreadCount && unreadCount > 0 && (
  //       <button onClick={handleMarkAllAsRead} disabled={isLoading}>
  //         Mark All as Read
  //       </button>
  //     )}
  //   </div>
  // );
  return null; // Implement JSX in actual component
};

/* ============================================================================
   EXAMPLE 7: Do Not Disturb Settings
   ============================================================================ */

// import { useSetDoNotDisturb } from '@/hooks/useNotificationData';

export function DNDScheduleExample(userId: string) {
  // Enable DND from 9 PM to 7 AM
  const setDND = { mutateAsync: async () => {} }; // useSetDoNotDisturb(userId);

  const handleScheduleDND = async () => {
    await setDND.mutateAsync({
      enabled: true,
      endTime: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
    });
  };

  // JSX Example:
  // return (
  //   <button onClick={handleScheduleDND}>
  //     Enable Do Not Disturb for 10 hours
  //   </button>
  // );
  
  // For now, just return the function
  return { handleScheduleDND };
}

/* ============================================================================
   EXAMPLE 8: Search & Filter Notifications
   ============================================================================ */

// import { useSearchNotifications } from '@/hooks/useNotificationData';

export function SearchNotifications(userId: string) {
  const searchTerm = ''; // const [searchTerm, setSearchTerm] = React.useState('');
  const setSearchTerm = (term: string) => {}; // setState
  const { mutate: search, data: results } = { mutate: () => {}, data: [] }; // useSearchNotifications(userId);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      search(term);
    }
  };

  // JSX Example:
  // return (
  //   <div>
  //     <input
  //       type="text"
  //       placeholder="Search notifications..."
  //       value={searchTerm}
  //       onChange={(e) => handleSearch(e.target.value)}
  //     />
  //     {results && (
  //       <ul>
  //         {results.map((n) => (
  //           <li key={n.id}>{n.title}</li>
  //         ))}
  //       </ul>
  //     )}
  //   </div>
  // );
  
  return { searchTerm, handleSearch, results };
}

/* ============================================================================
   EXAMPLE 9: Notification Preferences
   ============================================================================ */

// import { useUpdatePreferences } from '@/hooks/useNotificationData';

export function NotificationPreferencesForm(userId: string) {
  const updatePrefs = { mutateAsync: async () => {} }; // useUpdatePreferences(userId);

  const handleMuteCategory = async (category: string) => {
    await updatePrefs.mutateAsync({
      categories: {
        [category]: {
          enabled: false,
        },
      } as any,
    });
  };

  // JSX Example:
  // return (
  //   <div>
  //     <button onClick={() => handleMuteCategory('chat')}>Mute Chat Notifications</button>
  //     <button onClick={() => handleMuteCategory('email')}>Mute Email Notifications</button>
  //     <button onClick={() => handleMuteCategory('tasks')}>Mute Task Notifications</button>
  //   </div>
  // );
  
  return { handleMuteCategory };
}

/* ============================================================================
   EXAMPLE 10: Export Notifications
   ============================================================================ */

// import { useExportNotifications } from '@/hooks/useNotificationData';

export function ExportNotificationsButton(userId: string) {
  const { mutate: exportNotifications } = { mutate: async () => {} }; // useExportNotifications(userId);

  const handleExport = async () => {
    const result = await exportNotifications({
      format: 'csv',
      dateRange: {
        start: new Date('2025-01-01'),
        end: new Date(),
      },
    });

    if (result && (result as any) instanceof Blob) {
      // Trigger download
      const url = window.URL.createObjectURL(result as any);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications-export-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // JSX Example:
  // return <button onClick={handleExport}>Export as CSV</button>;
  
  return { handleExport };
}

/* ============================================================================
   EXAMPLE 11: Snooze Notification
   ============================================================================ */

// import { useSnoozeNotification } from '@/hooks/useNotificationData';

export function SnoozeExample(userId: string, notificationId: string) {
  const snooze = { mutateAsync: async () => {} }; // useSnoozeNotification(userId);

  const handleSnooze = async (minutes: number) => {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    await snooze.mutateAsync({
      notificationId,
      request: { snoozeUntil } as any,
    });
  };

  // JSX Example:
  // return (
  //   <div>
  //     <button onClick={() => handleSnooze(15)}>Snooze 15 min</button>
  //     <button onClick={() => handleSnooze(60)}>Snooze 1 hour</button>
  //     <button onClick={() => handleSnooze(480)}>Snooze 8 hours</button>
  //   </div>
  // );
  
  return { handleSnooze };
}

/* ============================================================================
   EXAMPLE 12: Mute User/Conversation
   ============================================================================ */

// import { useMuteUser, useMuteConversation } from '@/hooks/useNotificationData';

export function MuteExample(userId: string) {
  const muteUser = { mutateAsync: async () => {} }; // useMuteUser(userId);
  const muteConversation = { mutateAsync: async () => {} }; // useMuteConversation(userId);

  const handleMuteUser = async (targetUserId: string) => {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await muteUser.mutateAsync({
      targetUserId,
      until,
    });
  };

  const handleMuteChat = async (conversationId: string) => {
    const until = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
    await muteConversation.mutateAsync({
      conversationId,
      until,
    });
  };

  // JSX Example:
  // return (
  //   <div>
  //     <button onClick={() => handleMuteUser('user-123')}>Mute John for 24h</button>
  //     <button onClick={() => handleMuteChat('conv-456')}>Mute this conversation</button>
  //   </div>
  // );
  
  return { handleMuteUser, handleMuteChat };
}

export default {}
