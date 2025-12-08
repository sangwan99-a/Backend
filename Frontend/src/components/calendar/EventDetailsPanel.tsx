import React, { useState, useEffect } from 'react';
import {
  Button,
  Text,
  Input,
  Textarea,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogActions,
  Checkbox,
  Divider,
  Tooltip,
} from '@fluentui/react-components';
import {
  Delete20Regular,
  Edit20Regular,
  Send20Regular,
  Clock20Regular,
  Location20Regular,
  People20Regular,
  Link20Regular,
} from '@fluentui/react-icons';
import { calendarStore } from '../../store/calendarStore';
import {
  useEvent,
  useUpdateEvent,
  useDeleteEvent,
  useUpdateAttendeeStatus,
} from '../../hooks/useCalendarData';
import type { CalendarEvent } from '../../types/calendar';

/**
 * Event Details Panel
 * 
 * Shows full event details with:
 * - Event title, description, location
 * - Date/time with timezone
 * - Attendees with RSVP status
 * - Attachments
 * - Action buttons (edit, delete, RSVP)
 */

interface EventDetailsPanelProps {
  eventId?: string;
}

export const EventDetailsPanel: React.FC<EventDetailsPanelProps> = ({ eventId }) => {
  const { selectedEventId, setSelectedEvent } = calendarStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedEvent, setEditedEvent] = useState<Partial<CalendarEvent>>({});

  const id = eventId || selectedEventId;
  const { data: event, isLoading, error } = useEvent(id || '');
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();
  const attendeeStatusMutation = useUpdateAttendeeStatus();

  useEffect(() => {
    if (event) {
      setEditedEvent(event);
    }
  }, [event]);

  if (!id) {
    return (
      <div className="event-details-empty">
        <Text>No event selected</Text>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="event-details-loading">
        <Text>Loading event...</Text>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-details-error">
        <Text>Failed to load event</Text>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('Delete this event?')) {
      try {
        await deleteMutation.mutateAsync(event.id);
        setSelectedEvent(undefined);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const handleUpdateEvent = async () => {
    try {
      await updateMutation.mutateAsync({
        eventId: event.id,
        updates: editedEvent,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleAttendeeResponse = async (status: 'accepted' | 'declined' | 'tentative') => {
    try {
      // Get current user email - would come from auth store in real app
      const userEmail = 'user@example.com';
      await attendeeStatusMutation.mutateAsync({
        eventId: event.id,
        attendeeEmail: userEmail,
        status,
      });
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  const startDateTime = new Date(event.startTime);
  const endDateTime = new Date(event.endTime);

  return (
    <div className="event-details-panel">
      <div className="event-details-header">
        <div className="event-title-section">
          <div
            className="event-detail-color-bar"
            style={{ backgroundColor: event.color || '#2b7de9' }}
          ></div>
          <div>
            <Text weight="semibold" size={400}>
              {event.title}
            </Text>
            {event.location && (
              <div className="event-detail-location">
                <Location20Regular />
                <Text size={100}>{event.location}</Text>
              </div>
            )}
          </div>
        </div>

        <div className="event-detail-actions">
          <Tooltip content="Edit" relationship="label">
            <Button
              icon={<Edit20Regular />}
              appearance="subtle"
              onClick={() => setIsEditDialogOpen(true)}
            />
          </Tooltip>
          <Tooltip content="Delete" relationship="label">
            <Button
              icon={<Delete20Regular />}
              appearance="subtle"
              onClick={handleDelete}
            />
          </Tooltip>
        </div>
      </div>

      <Divider />

      {/* Date & Time */}
      <div className="event-detail-section">
          <div className="event-detail-item">
          <Clock20Regular />
          <div className="event-detail-content">
            <Text size={100}>
              Date & Time
            </Text>
            <Text>
              {startDateTime.toLocaleString()}
              {!event.allDay && ` - ${endDateTime.toLocaleTimeString()}`}
            </Text>
            {event.timezone && (
              <Text size={100}>
                Timezone: {event.timezone}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="event-detail-section">
          <Text size={100}>
            Description
          </Text>
          <Text>{event.description}</Text>
        </div>
      )}

      {/* Attendees */}
      {event.attendees.length > 0 && (
        <div className="event-detail-section">
          <div className="event-detail-header-row">
            <People20Regular />
            <Text size={100}>
              Attendees ({event.attendees.length})
            </Text>
          </div>
          <div className="attendee-list">
            {event.attendees.map((attendee) => (
              <div key={attendee.email} className="attendee-item">
                <div className="attendee-avatar">
                  {attendee.name.charAt(0).toUpperCase()}
                </div>
                <div className="attendee-info">
                  <Text size={100}>{attendee.name}</Text>
                  <Text size={100}>
                    {attendee.email}
                  </Text>
                </div>
                <div className={`attendee-status ${attendee.status}`}>
                  {attendee.status === 'accepted' && '✓ Yes'}
                  {attendee.status === 'declined' && '✗ No'}
                  {attendee.status === 'tentative' && '? Maybe'}
                  {attendee.status === 'needs-action' && 'Awaiting response'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {event.attachments.length > 0 && (
        <div className="event-detail-section">
          <div className="event-detail-header-row">
            <Link20Regular />
            <Text size={100}>
              Attachments
            </Text>
          </div>
          <div className="attachment-list">
            {event.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link"
              >
                <Text truncate size={100}>
                  {attachment.title || attachment.fileName}
                </Text>
                {attachment.fileSize && (
                  <Text size={100}>
                    ({(attachment.fileSize / 1024).toFixed(2)} KB)
                  </Text>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* RSVP Section */}
      <div className="event-detail-rsvp">
        <Text size={100}>
          Your response
        </Text>
        <div className="rsvp-buttons">
          <Button
            appearance="primary"
            size="small"
            onClick={() => handleAttendeeResponse('accepted')}
          >
            Accept
          </Button>
          <Button appearance="secondary" size="small" onClick={() => handleAttendeeResponse('tentative')}>
            Maybe
          </Button>
          <Button appearance="secondary" size="small" onClick={() => handleAttendeeResponse('declined')}>
            Decline
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(_, data) => setIsEditDialogOpen(data.open)}>
        <DialogContent>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogBody>
            <div className="edit-event-form">
              <Input
                placeholder="Event title"
                value={editedEvent.title || ''}
                onChange={(_, data: any) => setEditedEvent({ ...editedEvent, title: data.value || '' })}
                size="large"
              />

              <Textarea
                placeholder="Description"
                value={editedEvent.description || ''}
                onChange={(_, data: any) => setEditedEvent({ ...editedEvent, description: data.value || '' })}
              />

              <Input
                placeholder="Location"
                value={editedEvent.location || ''}
                onChange={(_, data: any) => setEditedEvent({ ...editedEvent, location: data.value || '' })}
              />
            </div>
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleUpdateEvent}>
              Save
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailsPanel;
