import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Tooltip,
  Text,
} from '@fluentui/react-components';
import { Clock20Regular, People20Regular, Attach20Regular } from '@fluentui/react-icons';
import { calendarStore } from '../../store/calendarStore';
import {
  useCreateEvent,
  useUpdateEvent,
  useEvent,
  useCalendars,
} from '../../hooks/useCalendarData';
import type { CreateEventRequest, CalendarEvent } from '../../types/calendar';

/**
 * Event Dialog Component
 * 
 * Create or edit events with:
 * - Title and description
 * - Date and time with timezone
 * - Calendar selection
 * - Attendee management
 * - Recurrence configuration
 * - Attachment support
 * - Form validation
 */

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
}

export const EventDialog: React.FC<EventDialogProps> = ({ open, onOpenChange, selectedDate }) => {
  const {
    isCreatingEvent,
    closeCreateEvent,
    editingEventId,
    closeEditEvent,
    selectedCalendarIds,
  } = calendarStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(startDate);
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [timezone, setTimezone] = useState('UTC');
  const [calendarId, setCalendarId] = useState(selectedCalendarIds[0] || '');
  const [attendees, setAttendees] = useState<string>('');
  const [recurDaily, setRecurDaily] = useState(false);
  const [recurWeekly, setRecurWeekly] = useState(false);
  const [color, setColor] = useState('#2b7de9');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: calendars = [] } = useCalendars();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const { data: existingEvent } = useEvent(editingEventId || '');

  // Load existing event data if editing
  useEffect(() => {
    if (existingEvent && editingEventId) {
      setTitle(existingEvent.title);
      setDescription(existingEvent.description || '');
      setLocation(existingEvent.location || '');
      setStartDate(existingEvent.startTime.split('T')[0]);
      setStartTime(existingEvent.startTime.split('T')[1]?.substring(0, 5) || '09:00');
      setEndDate(existingEvent.endTime.split('T')[0]);
      setEndTime(existingEvent.endTime.split('T')[1]?.substring(0, 5) || '10:00');
      setAllDay(existingEvent.allDay);
      setTimezone(existingEvent.timezone || 'UTC');
      setCalendarId(existingEvent.calendarId);
      setColor(existingEvent.color || '#2b7de9');
      setAttendees(existingEvent.attendees.map((a) => a.email).join(', '));
    }
  }, [existingEvent, editingEventId]);

  // Reset form when closing
  useEffect(() => {
    if (!isCreatingEvent) {
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate(selectedDate || new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndDate(startDate);
      setEndTime('10:00');
      setAllDay(false);
      setAttendees('');
      setErrors({});
    }
  }, [isCreatingEvent]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!calendarId) {
      newErrors.calendarId = 'Calendar is required';
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (startDateTime >= endDateTime && !allDay) {
      newErrors.time = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const attendeeEmails = attendees
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      const createRequest: CreateEventRequest = {
        calendarId,
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`,
        endTime: allDay ? `${endDate}T23:59:59` : `${endDate}T${endTime}:00`,
        timezone,
        allDay,
        attendeeEmails,
        color,
        visibility: 'private',
        recurrenceRule: recurDaily
          ? {
              id: `rule-${Date.now()}-daily`,
              frequency: 'daily' as const,
              interval: 1,
              endType: 'never' as const,
            }
          : recurWeekly
            ? {
                id: `rule-${Date.now()}-weekly`,
                frequency: 'weekly' as const,
                interval: 1,
                endType: 'never' as const,
              }
            : undefined,
      };

      if (editingEventId && existingEvent) {
        await updateMutation.mutateAsync({
          eventId: editingEventId,
          updates: createRequest as any,
        });
      } else {
        await createMutation.mutateAsync(createRequest);
      }

      closeCreateEvent();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create/update event:', error);
      setErrors({ submit: 'Failed to save event' });
    }
  };

  const colors = ['#2b7de9', '#27ae60', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];

  return (
    <Dialog
      open={isCreatingEvent && open}
      onOpenChange={(_, data) => {
        onOpenChange(data.open);
        if (!data.open) {
          closeCreateEvent();
        }
      }}
    >
      <DialogContent className="event-dialog">
        <DialogTitle>{editingEventId ? 'Edit Event' : 'Create Event'}</DialogTitle>
        <DialogBody>
          <div className="event-form">
            {/* Title */}
            <div className="form-group">
              <Input
                placeholder="Event title"
                value={title}
                onChange={(_, data: any) => setTitle(String(data.value || ''))}
                size="large"
                aria-label="Event title"
              />
              {errors.title && <Text>{errors.title}</Text>}
            </div>

            {/* Description */}
            <div className="form-group">
              <Textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(_, data: any) => setDescription(String(data.value || ''))}
              />
            </div>

            {/* Location */}
            <div className="form-group">
              <Input
                placeholder="Location (optional)"
                value={location}
                onChange={(_, data: any) => setLocation(String(data.value || ''))}
              />
            </div>

            {/* Calendar Selection */}
            <div className="form-group">
              <label>Calendar</label>
              <Select
                value={calendarId}
                onChange={(_, data) => setCalendarId(data.value)}
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.title}
                  </option>
                ))}
              </Select>
              {errors.calendarId && <Text>{errors.calendarId}</Text>}
            </div>

            {/* Date/Time */}
            <div className="form-group">
              <Checkbox
                label="All day event"
                checked={allDay}
                onChange={(_, data: any) => setAllDay(Boolean(data.checked !== false))}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(_, data: any) => setStartDate(String(data.value || ''))}
                />
              </div>
              {!allDay && (
                <div className="form-group">
                  <label>Start Time</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(_, data: any) => setStartTime(String(data.value || ''))}
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(_, data: any) => setEndDate(String(data.value || ''))}
                />
              </div>
              {!allDay && (
                <div className="form-group">
                  <label>End Time</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(_, data: any) => setEndTime(String(data.value || ''))}
                  />
                </div>
              )}
            </div>

            {errors.time && <Text>{errors.time}</Text>}

            {/* Timezone */}
            <div className="form-group">
              <label>Timezone</label>
              <Select value={timezone} onChange={(_, data) => setTimezone(data.value)}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </Select>
            </div>

            {/* Attendees */}
            <div className="form-group">
              <label>Attendees (comma-separated emails)</label>
              <Input
                placeholder="user@example.com, another@example.com"
                value={attendees}
                onChange={(_, data: any) => setAttendees(String(data.value || ''))}
              />
            </div>

            {/* Recurrence */}
            <div className="form-group">
              <Checkbox
                label="Repeat daily"
                checked={recurDaily}
                onChange={(_, data: any) => {
                  setRecurDaily(Boolean(data.checked !== false));
                  if (Boolean(data.checked !== false)) setRecurWeekly(false);
                }}
              />
              <Checkbox
                label="Repeat weekly"
                checked={recurWeekly}
                onChange={(_, data: any) => {
                  setRecurWeekly(Boolean(data.checked !== false));
                  if (Boolean(data.checked !== false)) setRecurDaily(false);
                }}
              />
            </div>

            {/* Color */}
            <div className="form-group">
              <label>Event Color</label>
              <div className="color-picker">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`color-option ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {errors.submit && <Text>{errors.submit}</Text>}
          </div>
        </DialogBody>
        <DialogActions>
          <Button appearance="secondary" onClick={() => closeCreateEvent()}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            onClick={handleCreate}
            disabled={createMutation.isLoading || updateMutation.isLoading}
          >
            {editingEventId ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;
