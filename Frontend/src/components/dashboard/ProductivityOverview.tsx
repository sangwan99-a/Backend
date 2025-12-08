import React from 'react';
import { Card, Title3, Text, Skeleton } from '@fluentui/react-components';
import { CheckmarkCircle20Regular, Clock20Regular, Send20Regular, Calendar20Regular } from '@fluentui/react-icons';
import { useProductivityMetrics } from '@/hooks/useDashboardData';
import '../../styles/dashboard.css';

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ icon, label, value, unit }) => (
  <div className="metric-item">
    <div className="metric-icon">{icon}</div>
    <div className="metric-content">
      <Text className="metric-label">{label}</Text>
      <div className="metric-value">
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
    </div>
  </div>
);

export const ProductivityOverview: React.FC = () => {
  const { data, isLoading, error } = useProductivityMetrics();

  if (error) {
    return (
      <Card className="dashboard-widget">
        <Title3>Productivity Overview</Title3>
        <Text weight="semibold">Failed to load productivity metrics</Text>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card className="dashboard-widget">
        <Title3>Productivity Overview</Title3>
        <Skeleton />
      </Card>
    );
  }

  return (
    <Card className="dashboard-widget productivity-card">
      <div className="widget-header">
        <CheckmarkCircle20Regular className="widget-icon" />
        <Title3>Productivity Overview</Title3>
      </div>

      <div className="metrics-grid">
        <MetricItem
          icon={<CheckmarkCircle20Regular className="metric-icon-small" />}
          label="Tasks Completed"
          value={data.completedTasks}
        />
        <MetricItem
          icon={<Calendar20Regular className="metric-icon-small" />}
          label="Meetings"
          value={data.meetingCount}
        />
        <MetricItem
          icon={<Clock20Regular className="metric-icon-small" />}
          label="Focus Time"
          value={Math.round(data.focusTime / 60)}
          unit="h"
        />
        <MetricItem
          icon={<Send20Regular className="metric-icon-small" />}
          label="Avg Response"
          value={data.responseTime}
          unit="min"
        />
      </div>

      <Text size={200}>
        Last updated: {new Date(data.date).toLocaleTimeString()}
      </Text>
    </Card>
  );
};
