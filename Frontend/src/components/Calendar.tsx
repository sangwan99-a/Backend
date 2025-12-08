import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Button, Spinner, Text, Tooltip } from '@fluentui/react-components';
import {
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Home20Regular,
} from '@fluentui/react-icons';
import CalendarGrid from './calendar/CalendarGrid';
import CalendarList from './calendar/CalendarList';
import EventDetailsPanel from './calendar/EventDetailsPanel';
import EventDialog from './calendar/EventDialog';
import { calendarStore } from '../store/calendarStore';
import { useCalendars } from '../hooks/useCalendarData';
import {
  initializeCalendarNotifications,
  disconnectCalendarNotifications,
} from '../services/calendarNotifications';
import {
  initializeCalendarKeyboardShortcuts,
  cleanupCalendarKeyboardShortcuts,
} from '../utils/calendarKeyboardShortcuts';
import '../styles/calendar.css';

// Create a separate QueryClient for calendar module
const calendarQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute default
      cacheTime: 1000 * 60 * 5, // 5 minutes cache time
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Calendar Module - Main Container Component
 *
 * Layout: 3-pane view with sidebar, calendar grid, and event details
 * - Left: Calendar list with visibility toggles
 * - Middle: Calendar grid (month/week/day/agenda/list views)
 * - Right: Event details panel
 *
 * Features:
 * - Multi-view calendar (month, week, day, agenda, list)
 * - Drag-drop event creation and rescheduling
 * - Real-time event synchronization
 * - Offline-first with IndexedDB caching
 * - Event creation/edit dialog
 * - Attendee management
 * - Keyboard shortcuts (C to create, D to duplicate, arrow keys to navigate)
 */
export const Calendar: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  const {
    viewMode,
    currentDate,
    selectedCalendarIds,
    goToToday,
    goToNextPeriod,
    goToPreviousPeriod,
    setViewMode,
    setSelectedEvent,
    openCreateEvent,
  } = calendarStore();

  const { isLoading: calendarsLoading, error: calendarsError } = useCalendars();

  // Initialize calendar module on mount
  useEffect(() => {
    const initializeCalendarModule = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // Initialize database if needed
        // Calendars will be fetched via React Query hook

        // Set up WebSocket for real-time notifications
        const userId = 'current-user'; // Get from auth context in real implementation
        const authToken = 'token'; // Get from auth context
        initializeCalendarNotifications(userId, authToken);

        // Initialize keyboard shortcuts
        initializeCalendarKeyboardShortcuts();

        setIsInitializing(false);
      } catch (error) {
        console.error('Calendar module initialization error:', error);
        setInitError(
          error instanceof Error
            ? error.message
            : 'Failed to initialize calendar module'
        );
        setIsInitializing(false);
      }
    };

    initializeCalendarModule();

    // Cleanup on unmount
    return () => {
      disconnectCalendarNotifications();
      cleanupCalendarKeyboardShortcuts();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // C: Create event
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        openCreateEvent();
        setEventDialogOpen(true);
      }

      // T: Go to today
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault();
        goToToday();
      }

      // Arrow keys: Navigate dates
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPreviousPeriod();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNextPeriod();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToToday, goToNextPeriod, goToPreviousPeriod, openCreateEvent]);

  // Render error state
  if (initError) {
    return (
      <div className="calendar-page">
        <div style={{ padding: '16px', background: 'var(--colorPaletteRedBackground2)', color: 'var(--colorPaletteRedForeground1)' }}>
          <strong>Error initializing calendar module:</strong> {initError}
          <Button
            appearance="secondary"
            size="small"
            onClick={() => {
              setInitError(null);
              setIsInitializing(true);
            }}
            style={{ marginTop: '8px', marginLeft: '8px' }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isInitializing || calendarsLoading) {
    return (
      <div className="calendar-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Spinner label="Loading calendar..." />
        </div>
      </div>
    );
  }

  if (calendarsError) {
    return (
      <div className="calendar-page">
        <div style={{ padding: '16px', background: 'var(--colorPaletteRedBackground2)', color: 'var(--colorPaletteRedForeground1)' }}>
          <strong>Error loading calendars:</strong> Unable to retrieve your calendars
          <Button
            appearance="secondary"
            size="small"
            onClick={() => window.location.reload()}
            style={{ marginTop: '8px', marginLeft: '8px' }}
          >
            Reload
          </Button>
        </div>
      </div>
    );
  }

  const dateString = new Date(currentDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <QueryClientProvider client={calendarQueryClient}>
      <div className="calendar-page">
        {/* Calendar Header with Controls */}
        <div className="calendar-header">
          <div className="calendar-header-left">
            <div className="calendar-nav-buttons">
              <Tooltip content="Previous" relationship="label">
                <Button
                  icon={<ChevronLeft20Regular />}
                  appearance="subtle"
                  onClick={goToPreviousPeriod}
                />
              </Tooltip>
              <Tooltip content="Today" relationship="label">
                <Button
                  icon={<Home20Regular />}
                  appearance="subtle"
                  onClick={goToToday}
                />
              </Tooltip>
              <Tooltip content="Next" relationship="label">
                <Button
                  icon={<ChevronRight20Regular />}
                  appearance="subtle"
                  onClick={goToNextPeriod}
                />
              </Tooltip>
            </div>

            <Text className="calendar-current-date">{dateString}</Text>
          </div>

          <div className="calendar-view-selector">
            {(['month', 'week', 'day', 'agenda', 'list'] as const).map((mode) => (
              <button
                key={mode}
                className={`calendar-view-button ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="calendar-header-right">
            <Button
              appearance="primary"
              onClick={() => {
                openCreateEvent();
                setEventDialogOpen(true);
              }}
            >
              + New Event
            </Button>
          </div>
        </div>

        {/* Main Calendar Container */}
        <div className="calendar-container">
          {/* Left Sidebar: Calendar List */}
          <div className="calendar-sidebar">
            <CalendarList />
          </div>

          {/* Middle: Calendar Grid */}
          <div className="calendar-main">
            <CalendarGrid
              onEventClick={(eventId) => setSelectedEvent(eventId)}
              onDayClick={(date) => {
                openCreateEvent(date);
                setEventDialogOpen(true);
              }}
              onEventDragStart={(eventId, date) => {
                console.log('Drag start:', eventId, date);
              }}
              onEventDragEnd={(newDate) => {
                console.log('Drag end:', newDate);
              }}
            />
          </div>

          {/* Right Sidebar: Event Details */}
          <div className="event-details-panel">
            <EventDetailsPanel />
          </div>
        </div>

        {/* Event Creation/Edit Dialog */}
        <EventDialog open={eventDialogOpen} onOpenChange={setEventDialogOpen} />
      </div>
    </QueryClientProvider>
  );
};

export default Calendar;
