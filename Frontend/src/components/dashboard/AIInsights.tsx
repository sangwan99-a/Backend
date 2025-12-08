import React from 'react';
import { Card, Title3, Text, Button, Badge, Skeleton } from '@fluentui/react-components';
import { Lightbulb20Regular, Warning20Regular, CheckmarkCircle20Regular } from '@fluentui/react-icons';
import { useAIInsights } from '@/hooks/useDashboardData';
import '../../styles/dashboard.css';

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'suggestion':
      return <Lightbulb20Regular />;
    case 'bottleneck':
      return <Warning20Regular />;
    case 'action':
      return <CheckmarkCircle20Regular />;
    default:
      return <Lightbulb20Regular />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'warning';
    case 'medium':
      return 'informative';
    case 'low':
      return 'success';
    default:
      return 'informative';
  }
};

export const AIInsights: React.FC = () => {
  const { data, isLoading, error } = useAIInsights();

  if (error) {
    return (
      <Card className="dashboard-widget">
        <Title3>AI Insights</Title3>
        <Text weight="semibold">Failed to load AI insights</Text>
      </Card>
    );
  }

  return (
    <Card className="dashboard-widget insights-card">
      <div className="widget-header">
        <Lightbulb20Regular className="widget-icon" />
        <Title3>AI Insights</Title3>
      </div>

      <div className="insights-list">
        {isLoading ? (
          <>
            <Skeleton />
          </>
        ) : data && data.length > 0 ? (
          data.slice(0, 4).map((insight) => (
            <div key={insight.id} className="insight-item">
              <div className="insight-icon">
                {getInsightIcon(insight.type)}
              </div>

              <div className="insight-content">
                <div className="insight-header">
                  <Text weight="semibold">{insight.title}</Text>
                  <Badge
                    color={getPriorityColor(insight.priority)}
                    appearance="filled"
                  >
                    {insight.priority}
                  </Badge>
                </div>
                <Text size={200} weight="regular">
                  {insight.description}
                </Text>
              </div>

              {insight.actionUrl && (
                <Button
                  appearance="subtle"
                  size="small"
                  onClick={() => window.location.href = insight.actionUrl!}
                >
                  Take Action
                </Button>
              )}
            </div>
          ))
        ) : (
          <Text weight="regular">No insights at this time</Text>
        )}
      </div>

      {data && data.length > 4 && (
        <Button appearance="subtle" style={{ width: '100%' }}>
          View All Insights
        </Button>
      )}
    </Card>
  );
};
