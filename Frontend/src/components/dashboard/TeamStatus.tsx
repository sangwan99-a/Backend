import React from 'react';
import { Card, Title3, Text, Badge, Skeleton, Avatar, Button } from '@fluentui/react-components';
import { Person20Regular } from '@fluentui/react-icons';
import { useTeamStatus } from '@/hooks/useDashboardData';
import '../../styles/dashboard.css';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'success';
    case 'idle':
      return 'warning';
    case 'offline':
      return 'success'; // Use success as fallback since neutral is not available
    default:
      return 'success';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'online':
      return '🟢 Online';
    case 'idle':
      return '🟡 Idle';
    case 'offline':
      return '⚫ Offline';
    default:
      return status;
  }
};

export const TeamStatus: React.FC = () => {
  const { data, isLoading, error } = useTeamStatus();

  if (error) {
    return (
      <Card className="dashboard-widget">
        <Title3>Team Status</Title3>
        <Text weight="semibold">Failed to load team status</Text>
      </Card>
    );
  }

  const onlineCount = data?.filter((m) => m.status === 'online').length ?? 0;
  const totalCount = data?.length ?? 0;

  return (
    <Card className="dashboard-widget team-card">
      <div className="widget-header">
        <Person20Regular className="widget-icon" />
        <Title3>Team Status</Title3>
        <Badge color="informative" appearance="filled">
          {onlineCount}/{totalCount} Online
        </Badge>
      </div>

      <div className="team-list">
        {isLoading ? (
          <>
            <Skeleton />
          </>
        ) : data && data.length > 0 ? (
          data.slice(0, 6).map((member) => (
            <div key={member.id} className="team-member">
              <div className="member-avatar">
                <Avatar
                  name={member.name}
                  image={{ src: member.avatar }}
                />
              </div>

              <div className="member-content">
                <Text weight="semibold" size={200}>
                  {member.name}
                </Text>
                {member.currentTask ? (
                  <Text size={200}>
                    Working on: {member.currentTask}
                  </Text>
                ) : (
                  <Text size={200}>
                    {member.availability}
                  </Text>
                )}
              </div>

              <Badge
                color={getStatusColor(member.status)}
                appearance="filled"
              >
                {getStatusLabel(member.status)}
              </Badge>
            </div>
          ))
        ) : (
          <Text weight="regular">No team members</Text>
        )}
      </div>

      {data && data.length > 6 && (
        <Button appearance="subtle" style={{ width: '100%' }}>
          View All Team Members
        </Button>
      )}
    </Card>
  );
};
