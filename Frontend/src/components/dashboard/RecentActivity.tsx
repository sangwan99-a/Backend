import React from 'react';
import { Card, Title3, Text, Button, Skeleton, Avatar } from '@fluentui/react-components';
import { Chat20Regular, Mail20Regular, DocumentMultiple20Regular, Checkmark20Regular } from '@fluentui/react-icons';
import { useRecentActivity } from '@/hooks/useDashboardData';
import '../../styles/dashboard.css';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'chat':
      return <Chat20Regular />;
    case 'email':
      return <Mail20Regular />;
    case 'document':
      return <DocumentMultiple20Regular />;
    case 'task':
      return <Checkmark20Regular />;
    default:
      return null;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'chat':
      return 'var(--color-blue)';
    case 'email':
      return 'var(--color-purple)';
    case 'document':
      return 'var(--color-green)';
    case 'task':
      return 'var(--color-orange)';
    default:
      return 'var(--color-gray)';
  }
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now.getTime() - time.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const RecentActivity: React.FC = () => {
  const { data, isLoading, error } = useRecentActivity(8);

  if (error) {
    return (
      <Card className="dashboard-widget">
        <Title3>Recent Activity</Title3>
        <Text weight="semibold">Failed to load recent activity</Text>
      </Card>
    );
  }

  return (
    <Card className="dashboard-widget activity-card">
      <div className="widget-header">
        <Chat20Regular className="widget-icon" />
        <Title3>Recent Activity</Title3>
      </div>

      <div className="activity-list">
        {isLoading ? (
          <>
            <Skeleton />
          </>
        ) : data && data.length > 0 ? (
          data.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div
                className="activity-icon"
                style={{ color: getActivityColor(activity.type) }}
              >
                {getActivityIcon(activity.type)}
              </div>

              <div className="activity-content">
                <div className="activity-header">
                  {activity.user && <span className="activity-user">{activity.user}</span>}
                  <span className="activity-title">{activity.title}</span>
                </div>
                <Text size={200}>
                  {activity.description}
                </Text>
                <Text size={200}>
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </div>

              {activity.avatar && (
                <Avatar
                  name={activity.user}
                  image={{ src: activity.avatar }}
                  size={32}
                />
              )}
            </div>
          ))
        ) : (
          <Text weight="regular">No recent activity</Text>
        )}
      </div>

      <Button appearance="subtle" style={{ width: '100%' }}>
        View All Activity
      </Button>
    </Card>
  );
};
