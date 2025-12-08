/**
 * Notification Components
 * NotificationCenter, NotificationList, NotificationToast, NotificationSettings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Notification,
  NotificationStats,
  NOTIFICATION_ICONS,
  PRIORITY_COLORS,
  CATEGORY_ICONS,
} from '../types/notifications';
import useNotificationStore from '../store/notificationStore';
import notificationAPIClient from '../services/notificationAPIClient';
import {
  useNotifications,
  useUnreadCount,
  useNotificationPreferences,
  useBulkMarkAsRead,
  useDismissNotification,
  useSnoozeNotification,
  useUpdatePreferences,
  useMarkAllAsRead,
} from '../hooks/useNotificationData';
import '../styles/notifications.css';

/**
 * Notification Toast Component
 */
export const NotificationToast: React.FC<{
  notification: Notification;
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}> = ({ notification, onClose, onAction, actionLabel }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification.priority === 'low') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose?.(), 300);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notification.priority, onClose]);

  const getPriorityColor = () => {
    const colors = PRIORITY_COLORS[notification.priority] || PRIORITY_COLORS['normal'];
    return colors;
  };

  const icon = NOTIFICATION_ICONS[notification.type] || '🔔';

  return (
    <div className={`notification-toast ${notification.priority} ${isExiting ? 'closing' : ''}`}>
      <div className="notification-toast-icon">{icon}</div>
      <div className="notification-toast-content">
        <div className="notification-toast-title">{notification.title}</div>
        <div className="notification-toast-message">{notification.message}</div>
      </div>
      {actionLabel && (
        <button className="notification-toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      <button className="notification-toast-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

/**
 * Notification Item Component
 */
const NotificationItemComponent: React.FC<{
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onClick?: () => void;
}> = ({ notification, onMarkAsRead, onDismiss, onSnooze, onClick }) => {
  const timeAgo = getTimeAgo(notification.createdAt);
  const icon = NOTIFICATION_ICONS[notification.type] || '🔔';

  return (
    <div
      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="notification-item-avatar">
        {notification.avatar ? <img src={notification.avatar} alt="" /> : icon}
      </div>

      <div className="notification-item-content">
        <div className="notification-item-header">
          <div>
            <div className="notification-item-title">
              {notification.title}
              {!notification.isRead && <span className="notification-unread-indicator" />}
            </div>
            {notification.sender && (
              <div className="notification-item-meta">
                <span className="notification-item-badge">{notification.sender.name}</span>
              </div>
            )}
          </div>
          <div className="notification-item-time">{timeAgo}</div>
        </div>

        <div className="notification-item-message">{notification.message}</div>

        {notification.description && (
          <div className="notification-item-meta">
            <span style={{ fontSize: '12px', color: 'var(--notification-text-tertiary)' }}>
              {notification.description}
            </span>
          </div>
        )}

        <div className="notification-item-meta">
          <div
            className={`notification-item-priority ${notification.priority}`}
            title={notification.priority}
          />
          <span className="notification-item-badge">
            {CATEGORY_ICONS[notification.category]} {notification.category}
          </span>
        </div>

        <div className="notification-item-actions">
          {!notification.isRead && (
            <button
              className="notification-item-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead?.(notification.id);
              }}
            >
              Mark as read
            </button>
          )}
          <button
            className="notification-item-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              const in1Hour = new Date(Date.now() + 60 * 60 * 1000);
              onSnooze?.(notification.id, in1Hour);
            }}
          >
            Snooze 1h
          </button>
          <button
            className="notification-item-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.(notification.id);
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Notification Skeleton Component
 */
const NotificationSkeleton: React.FC = () => {
  return (
    <div className="notification-skeleton">
      <div className="notification-skeleton-avatar" />
      <div className="notification-skeleton-content">
        <div className="notification-skeleton-line" />
        <div className="notification-skeleton-line short" />
      </div>
    </div>
  );
};

/**
 * Notification Settings Component
 */
const NotificationSettings: React.FC<{ userId: string; onClose?: () => void }> = ({
  userId,
  onClose,
}) => {
  const { data: preferences } = useNotificationPreferences(userId);
  const updatePreferences = useUpdatePreferences(userId);
  const setDoNotDisturb = useSetDoNotDisturb(userId);

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await updatePreferences.mutateAsync({
        [key]: value,
      } as any);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  return (
    <div className="notification-settings-panel">
      <div className="notification-settings-section">
        <h3 className="notification-settings-title">Channels</h3>
        <div className="notification-settings-item">
          <div>
            <div className="notification-settings-label">In-App Notifications</div>
            <div className="notification-settings-description">Show notifications in app</div>
          </div>
          <button
            className={`notification-settings-toggle ${preferences?.channels?.in_app?.enabled ? 'active' : ''}`}
            onClick={() =>
              handleToggle('channels.in_app.enabled', !preferences?.channels?.in_app?.enabled)
            }
          />
        </div>
        <div className="notification-settings-item">
          <div>
            <div className="notification-settings-label">Email Notifications</div>
            <div className="notification-settings-description">Send via email</div>
          </div>
          <button
            className={`notification-settings-toggle ${preferences?.channels?.email?.enabled ? 'active' : ''}`}
            onClick={() =>
              handleToggle('channels.email.enabled', !preferences?.channels?.email?.enabled)
            }
          />
        </div>
      </div>

      <div className="notification-settings-section">
        <h3 className="notification-settings-title">Do Not Disturb</h3>
        <div className="notification-settings-item">
          <div>
            <div className="notification-settings-label">Enable Schedule</div>
            <div className="notification-settings-description">Quiet hours (e.g., nights)</div>
          </div>
          <button
            className={`notification-settings-toggle ${preferences?.doNotDisturb?.enabled ? 'active' : ''}`}
            onClick={() =>
              handleToggle('doNotDisturb.enabled', !preferences?.doNotDisturb?.enabled)
            }
          />
        </div>
        {preferences?.doNotDisturb?.enabled && (
          <>
            <div className="notification-settings-item">
              <div>
                <div className="notification-settings-label">Allow Critical Alerts</div>
                <div className="notification-settings-description">
                  Still receive critical system alerts
                </div>
              </div>
              <button
                className={`notification-settings-toggle ${preferences?.doNotDisturb?.allowCritical ? 'active' : ''}`}
                onClick={() =>
                  handleToggle(
                    'doNotDisturb.allowCritical',
                    !preferences?.doNotDisturb?.allowCritical
                  )
                }
              />
            </div>
            <div className="notification-settings-item">
              <div>
                <div className="notification-settings-label">Allow Mentions</div>
                <div className="notification-settings-description">
                  Still notify if mentioned
                </div>
              </div>
              <button
                className={`notification-settings-toggle ${preferences?.doNotDisturb?.allowMentions ? 'active' : ''}`}
                onClick={() =>
                  handleToggle(
                    'doNotDisturb.allowMentions',
                    !preferences?.doNotDisturb?.allowMentions
                  )
                }
              />
            </div>
          </>
        )}
      </div>

      <div className="notification-settings-section">
        <h3 className="notification-settings-title">Categories</h3>
        {(['chat', 'tasks', 'calendar', 'system', 'billing'] as const).map((category) => (
          <div key={category} className="notification-settings-item">
            <div>
              <div className="notification-settings-label">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
            </div>
            <button
              className={`notification-settings-toggle ${preferences?.categories?.[category]?.enabled ? 'active' : ''}`}
              onClick={() =>
                handleToggle(`categories.${category}.enabled`, !preferences?.categories?.[category]?.enabled)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Notification List Component
 */
const NotificationList: React.FC<{ userId: string }> = ({ userId }) => {
  const { activeTab, isPanelOpen } = useNotificationStore();
  const { data, isLoading } = useNotifications(userId, {
    limit: 50,
    unreadOnly: activeTab === 'unread',
    categories:
      activeTab === 'mentions'
        ? ['chat', 'tasks']
        : activeTab === 'tasks'
          ? ['tasks']
          : activeTab === 'calendar'
            ? ['calendar']
            : undefined,
  });

  const { mutate: markAsRead } = useDismissNotification(userId);
  const { mutate: snooze } = useSnoozeNotification(userId);

  if (!isPanelOpen) return null;

  if (isLoading) {
    return (
      <div className="notification-panel-content">
        {[...Array(5)].map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data?.notifications || data.notifications.length === 0) {
    return (
      <div className="notification-list-empty">
        <div className="notification-list-empty-icon">✨</div>
        <div className="notification-list-empty-text">
          {activeTab === 'unread' ? 'All caught up!' : 'No notifications'}
        </div>
      </div>
    );
  }

  return (
    <div className="notification-panel-content">
      {data.notifications.map((notification: Notification) => (
        <NotificationItemComponent
          key={notification.id}
          notification={notification}
          onMarkAsRead={() => markAsRead(notification.id)}
          onSnooze={(id, until) => snooze({ notificationId: id, request: { notificationId: id, snoozeUntil: until } })}
          onClick={() => notification.actionUrl && (window.location.href = `#${notification.actionUrl}`)}
        />
      ))}
    </div>
  );
};

/**
 * Notification Center Component
 */
export const NotificationCenter: React.FC<{ userId: string; currentUser?: any }> = ({
  userId,
  currentUser,
}) => {
  const { isPanelOpen, activeTab, showSettings } = useNotificationStore();
  const store = useNotificationStore();

  const { data: unreadCount } = useUnreadCount(userId);

  if (!isPanelOpen) return null;

  return (
    <>
      <div
        className="notification-panel-overlay"
        onClick={() => store.closePanel()}
      />
      <div className="notification-center-panel">
        <div className="notification-panel-header">
          <h2>
            Notifications
            {unreadCount && unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </h2>
          <button className="notification-panel-close" onClick={() => store.closePanel()}>
            ✕
          </button>
        </div>

        <div className="notification-panel-tabs">
          <button
            className={`notification-panel-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => store.setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`notification-panel-tab ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => store.setActiveTab('unread')}
          >
            Unread
          </button>
          <button
            className={`notification-panel-tab ${activeTab === 'mentions' ? 'active' : ''}`}
            onClick={() => store.setActiveTab('mentions')}
          >
            Mentions
          </button>
          <button
            className={`notification-panel-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => store.setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`notification-panel-tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => store.setActiveTab('calendar')}
          >
            Calendar
          </button>
        </div>

        {showSettings ? (
          <NotificationSettings userId={userId} onClose={() => store.toggleSettingsPanel()} />
        ) : (
          <NotificationList userId={userId} />
        )}
      </div>
    </>
  );
};

/**
 * Notification Badge Component (for bell icon)
 */
export const NotificationBadge: React.FC<{ count?: number }> = ({ count }) => {
  if (!count || count === 0) return null;

  return (
    <span className="notification-badge" title={`${count} unread notifications`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

/**
 * Notification Toast Container
 */
export const NotificationToastContainer: React.FC = () => {
  const { activeToasts, removeToast } = useNotificationStore();

  return (
    <div className="notification-toast-container">
      {activeToasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast.notification}
          onClose={() => removeToast(toast.id)}
          actionLabel={toast.action?.label}
          onAction={toast.action?.onClick}
        />
      ))}
    </div>
  );
};

/**
 * Hook for Do Not Disturb
 */
function useSetDoNotDisturb(userId: string) {
  return {
    mutateAsync: async (enabled: boolean, endTime?: Date) => {
      return notificationAPIClient.setDoNotDisturb(userId, enabled, endTime);
    },
  };
}

/**
 * Utility: Format time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}
