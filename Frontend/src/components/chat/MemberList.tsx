import React from 'react';
import { Avatar, Text, Badge, Spinner } from '@fluentui/react-components';
import { useChannelDetails } from '@/hooks/useChatData';
import '../../styles/chat.css';

const getStatusColor = (status: string): 'success' | 'warning' | 'subtle' => {
  switch (status) {
    case 'online':
      return 'success';
    case 'away':
      return 'warning';
    case 'offline':
      return 'subtle';
    default:
      return 'subtle';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'online':
      return '🟢 Online';
    case 'away':
      return '🟡 Away';
    case 'offline':
      return '⚫ Offline';
    default:
      return status;
  }
};

export const MemberList: React.FC<{ channelId: string }> = ({ channelId }) => {
  const { data: channel, isLoading } = useChannelDetails(channelId, !!channelId);

  if (isLoading) {
    return (
      <div className="member-list">
        <Spinner size="small" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="member-list">
        <Text>No members</Text>
      </div>
    );
  }

  return (
    <div className="member-list">
      <div className="member-list-header">
        <h4>Members ({channel.members.length})</h4>
      </div>

      <div className="member-list-items">
        {channel.members.map((member: any) => (
          <div key={member.id} className="member-item">
            <div className="member-avatar">
              <Avatar
                name={member.name}
                image={{ src: member.avatar }}
              />
              <div className={`status-indicator ${member.status}`} />
            </div>

            <div className="member-info">
              <Text weight="semibold" size={100}>
                {member.name}
              </Text>
              <Badge
                color={getStatusColor(member.status)}
                appearance="tint"
              >
                {getStatusLabel(member.status)}
              </Badge>
              {member.lastSeen && (
                <Text size={100}>
                  Last seen: {new Date(member.lastSeen).toLocaleDateString()}
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
