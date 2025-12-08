import React from 'react';
import { Button, Card, Text } from '@fluentui/react-components';
import { Chat20Regular, Calendar20Regular, Checkmark20Regular, Sparkle20Regular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import '../../styles/dashboard.css';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card className="dashboard-widget quick-actions-card full-width">
      <Text weight="semibold" size={500}>
        Quick Actions
      </Text>
      <div className="quick-actions-grid">
        <Button
          icon={<Chat20Regular />}
          appearance="outline"
          onClick={() => navigate('/chat')}
          className="quick-action-btn"
        >
          New Chat
        </Button>
        <Button
          icon={<Calendar20Regular />}
          appearance="outline"
          onClick={() => navigate('/calendar')}
          className="quick-action-btn"
        >
          Schedule Meeting
        </Button>
        <Button
          icon={<Checkmark20Regular />}
          appearance="outline"
          onClick={() => navigate('/tasks')}
          className="quick-action-btn"
        >
          Create Task
        </Button>
        <Button
          icon={<Sparkle20Regular />}
          appearance="outline"
          onClick={() => {
            // Show AI assistant dialog
            console.log('Opening AI Assistant');
          }}
          className="quick-action-btn"
        >
          Ask AI
        </Button>
      </div>
    </Card>
  );
};
