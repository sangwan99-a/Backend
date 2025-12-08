import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Title2, Text, Divider, Spinner } from '@fluentui/react-components';
import { Home20Regular } from '@fluentui/react-icons';
import useAuthStore from '@/store/authStore';
import { ProductivityOverview } from './dashboard/ProductivityOverview';
import { RecentActivity } from './dashboard/RecentActivity';
import { UpcomingEvents } from './dashboard/UpcomingEvents';
import { AIInsights } from './dashboard/AIInsights';
import { TeamStatus } from './dashboard/TeamStatus';
import { ProductivityChart } from './dashboard/ProductivityChart';
import { QuickActions } from './dashboard/QuickActions';
import { notificationWebSocket } from '@/services/websocket';
import '../styles/dashboard.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [wsConnected, setWsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (!user?.id) {
      setIsInitializing(false);
      return;
    }

    const initializeWebSocket = async () => {
      try {
        notificationWebSocket.connect(user.id);
        setWsConnected(true);

        // Subscribe to real-time updates
        notificationWebSocket.on('presence', (data: any) => {
          console.log('Presence update:', data);
          queryClient.invalidateQueries('team-status');
        });

        notificationWebSocket.on('activity', (data: any) => {
          console.log('Activity update:', data);
          queryClient.invalidateQueries('recent-activity');
        });

        notificationWebSocket.on('task-update', (data: any) => {
          console.log('Task update:', data);
          queryClient.invalidateQueries('recent-tasks');
        });

        notificationWebSocket.on('message', (data: any) => {
          console.log('New message:', data);
          queryClient.invalidateQueries('recent-activity');
        });

        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsInitializing(false);
      }
    };

    initializeWebSocket();

    return () => {
      notificationWebSocket.disconnect();
    };
  }, [user?.id]);

  if (isInitializing) {
    return (
      <div className="module-page">
        <div className="module-header">
          <Home20Regular className="module-icon" />
          <div>
            <Title2>Dashboard</Title2>
            <Text>Initializing your dashboard...</Text>
          </div>
        </div>
        <Divider />
        <div className="module-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spinner label="Loading your dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="module-page">
        <div className="module-header">
          <Home20Regular className="module-icon" />
          <div>
            <Title2>Dashboard</Title2>
            <Text>Welcome back! Here's your productivity overview</Text>
            {wsConnected && (
              <div className="connection-status">
                <span className="status-indicator online"></span>
                <Text size={300}>
                  Real-time updates enabled
                </Text>
              </div>
            )}
          </div>
        </div>

        <Divider />

        <div className="module-content">
          {/* Quick Actions */}
          <QuickActions />

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Productivity Overview */}
            <ProductivityOverview />

            {/* Recent Activity */}
            <RecentActivity />

            {/* Upcoming Events */}
            <UpcomingEvents />

            {/* AI Insights */}
            <AIInsights />

            {/* Team Status */}
            <TeamStatus />
          </div>

          {/* Productivity Chart - Full Width */}
          <ProductivityChart />
        </div>
      </div>
    </QueryClientProvider>
  );
};
