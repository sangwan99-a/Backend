import React from 'react';
import { Card, Title3, Text, Button, Skeleton, Badge } from '@fluentui/react-components';
import { Calendar20Regular, Clock20Regular, PersonAdd20Regular } from '@fluentui/react-icons';
import { useUpcomingEvents } from '@/hooks/useDashboardData';
import { formatDistanceToNow, parseISO } from 'date-fns';
import '../../styles/dashboard.css';

export const UpcomingEvents: React.FC = () => {
  const { data, isLoading, error } = useUpcomingEvents(24);

  if (error) {
    return (
      <Card className="dashboard-widget">
        <Title3>Upcoming Events</Title3>
        <Text weight="semibold">Failed to load calendar events</Text>
      </Card>
    );
  }

  const getEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isEventSoon = (startTime: string) => {
    const now = new Date();
    const eventTime = new Date(startTime);
    const diffMs = eventTime.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    return diffMins > 0 && diffMins < 30;
  };

  const isEventToday = (startTime: string) => {
    const now = new Date();
    const eventTime = new Date(startTime);
    return (
      now.getFullYear() === eventTime.getFullYear() &&
      now.getMonth() === eventTime.getMonth() &&
      now.getDate() === eventTime.getDate()
    );
  };

  return (
    <Card className="dashboard-widget events-card">
      <div className="widget-header">
        <Calendar20Regular className="widget-icon" />
        <Title3>Upcoming Events</Title3>
      </div>

      <div className="events-list">
        {isLoading ? (
          <>
            <Skeleton />
          </>
        ) : data && data.length > 0 ? (
          data.slice(0, 5).map((event) => (
            <div key={event.id} className="event-item">
              <div className="event-time">
                <Clock20Regular />
                <div className="event-time-text">
                  <Text weight="semibold" size={200}>
                    {getEventTime(event.startTime, event.endTime)}
                  </Text>
                  {isEventToday(event.startTime) && (
                    <Badge appearance="filled" color="success">
                      Today
                    </Badge>
                  )}
                  {isEventSoon(event.startTime) && (
                    <Badge appearance="filled" color="warning">
                      Soon
                    </Badge>
                  )}
                </div>
              </div>

              <div className="event-content">
                <Text weight="semibold">{event.title}</Text>
                {event.description && (
                  <Text size={200}>
                    {event.description}
                  </Text>
                )}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="event-attendees">
                    <PersonAdd20Regular />
                    <Text size={200} weight="regular">
                      {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                    </Text>
                  </div>
                )}
              </div>

              {event.reminder && (
                <Badge appearance="filled" color="informative">
                  🔔 Reminder set
                </Badge>
              )}
            </div>
          ))
        ) : (
          <Text weight="regular">No upcoming events</Text>
        )}
      </div>

      <Button appearance="subtle" style={{ width: '100%' }}>
        View Calendar
      </Button>
    </Card>
  );
};
