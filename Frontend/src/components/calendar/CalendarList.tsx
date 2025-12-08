import React, { useState } from 'react';
import {
  Button,
  Text,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogBody,
  DialogActions,
  Input,
  Checkbox,
  Tooltip,
} from '@fluentui/react-components';
import { Add20Regular, Settings20Regular, ChevronDown20Regular } from '@fluentui/react-icons';
import { calendarStore } from '../../store/calendarStore';
import { useCalendars, useCreateCalendar } from '../../hooks/useCalendarData';

/**
 * Calendar List Component
 * 
 * Left sidebar showing:
 * - User's calendars with visibility toggles
 * - Unread/event counts
 * - Calendar color indicators
 * - Create new calendar button
 * - Settings for each calendar
 */

export const CalendarList: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState('#2b7de9');
  const [expandedCalendars, setExpandedCalendars] = useState<Set<string>>(new Set());

  const { selectedCalendarIds, toggleCalendarSelection } = calendarStore();
  const { data: calendars = [], isLoading } = useCalendars();
  const createCalendarMutation = useCreateCalendar();

  const handleCreateCalendar = async () => {
    if (!newCalendarName.trim()) return;

    try {
      await createCalendarMutation.mutateAsync({
        title: newCalendarName,
        color: newCalendarColor,
        visibility: 'private',
        isReadOnly: false,
        isPrimary: false,
      });

      setNewCalendarName('');
      setNewCalendarColor('#2b7de9');
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create calendar:', error);
    }
  };

  const toggleCalendarExpanded = (calendarId: string) => {
    const newExpanded = new Set(expandedCalendars);
    if (newExpanded.has(calendarId)) {
      newExpanded.delete(calendarId);
    } else {
      newExpanded.add(calendarId);
    }
    setExpandedCalendars(newExpanded);
  };

  const colors = ['#2b7de9', '#27ae60', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e91e63'];

  return (
    <div className="calendar-list">
      <div className="calendar-list-header">
        <Text weight="semibold" size={300}>
          My Calendars
        </Text>
        <Tooltip content="Create new calendar" relationship="label">
          <Button
            icon={<Add20Regular />}
            size="small"
            appearance="subtle"
            onClick={() => setShowCreateDialog(true)}
          />
        </Tooltip>
      </div>

      {isLoading ? (
        <Text size={100}>
          Loading calendars...
        </Text>
      ) : calendars.length === 0 ? (
        <Text size={100}>
          No calendars yet
        </Text>
      ) : (
        <div className="calendar-list-items">
          {calendars.map((calendar) => (
            <div key={calendar.id} className="calendar-list-item">
              <div className="calendar-item-header">
                <Checkbox
                  checked={selectedCalendarIds.includes(calendar.id)}
                  onChange={() => toggleCalendarSelection(calendar.id)}
                />
                <div
                  className="calendar-color-dot"
                  style={{ backgroundColor: calendar.color }}
                  title={calendar.title}
                ></div>
                <div className="calendar-item-info">
                  <Text truncate size={100}>
                    {calendar.title}
                  </Text>
                  {calendar.eventCount !== undefined && (
                    <Text size={100}>
                      {calendar.eventCount} events
                    </Text>
                  )}
                </div>
                <Button
                  icon={<Settings20Regular />}
                  size="small"
                  appearance="subtle"
                  onClick={() => toggleCalendarExpanded(calendar.id)}
                />
              </div>

              {expandedCalendars.has(calendar.id) && (
                <div className="calendar-item-actions">
                  <Button appearance="subtle" size="small">
                    Rename
                  </Button>
                  <Button appearance="subtle" size="small">
                    Share
                  </Button>
                  <Button appearance="subtle" size="small">
                    Settings
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Calendar Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(_, data) => setShowCreateDialog(data.open)}>
        <DialogContent>
          <DialogTitle>Create New Calendar</DialogTitle>
          <DialogBody>
            <div className="create-calendar-form">
              <Input
                placeholder="Calendar name"
                value={newCalendarName}
                onChange={(_, data: any) => setNewCalendarName(data.value || '')}
                size="small"
              />

              <div className="color-picker">
                <Text size={100}>
                  Calendar color
                </Text>
                <div className="color-options">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`color-option ${newCalendarColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCalendarColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleCreateCalendar}
              disabled={!newCalendarName.trim() || createCalendarMutation.isLoading}
            >
              Create
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarList;
