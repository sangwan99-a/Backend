/**
 * Calendar Module - Type Definitions
 * 
 * Comprehensive type system for:
 * - Events with recurrence patterns
 * - Multiple calendars with sharing
 * - Attendee management with responses
 * - Timezone handling
 * - Rich event metadata
 */

/**
 * Basic event attendee with RSVP status
 */
export interface EventAttendee {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  isOrganizer: boolean;
  responseDate?: string;
}

/**
 * Event attachment (documents, links, etc.)
 */
export interface EventAttachment {
  id: string;
  type: 'file' | 'link' | 'video' | 'location';
  title: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
}

/**
 * Recurrence rule for repeating events
 */
export interface RecurrenceRule {
  id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every N days/weeks/etc
  daysOfWeek?: ('SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA')[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endType: 'never' | 'after-count' | 'on-date';
  endCount?: number; // For 'after-count'
  endDate?: string; // For 'on-date'
  exceptions?: string[]; // ISO strings of excluded dates
}

/**
 * Recurring event instance with override data
 */
export interface RecurringEventException {
  id: string;
  eventId: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  title?: string;
  description?: string;
  cancelled?: boolean;
}

/**
 * Calendar availability/busy status
 */
export interface FreeBusy {
  id: string;
  calendarId: string;
  userId: string;
  startTime: string;
  endTime: string;
  busy: boolean;
  tentative: boolean;
}

/**
 * Main event interface
 */
export interface CalendarEvent {
  id: string;
  calendarId: string;
  createdBy: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  timezone?: string; // IANA timezone e.g. 'America/New_York'
  allDay: boolean;
  color?: string; // Hex color for event
  visibility: 'public' | 'private' | 'confidential';
  attendees: EventAttendee[];
  attachments: EventAttachment[];
  recurrence?: RecurrenceRule;
  isRecurringException?: boolean;
  parentEventId?: string; // For recurring event instances
  status: 'confirmed' | 'tentative' | 'cancelled';
  lastModified: string;
  conferenceData?: {
    entryPoints: Array<{
      entryPointType: 'video' | 'phone' | 'sip';
      uri: string;
      label?: string;
      pin?: string;
    }>;
    conferenceSolution?: {
      key: 'zoom' | 'teams' | 'meet' | 'hangout';
      name: string;
    };
    signature?: string; // Google Calendar signing
  };
  reminders?: {
    type: 'notification' | 'email';
    minutes: number; // Before event start
  }[];
  priority?: 'low' | 'medium' | 'high';
  categories?: string[];
  tags?: string[];
}

/**
 * User's calendar (can be shared)
 */
export interface UserCalendar {
  id: string;
  userId: string;
  title: string;
  description?: string;
  color: string; // Hex color
  icon?: string;
  timezone?: string;
  visibility: 'private' | 'shared' | 'public';
  isReadOnly: boolean;
  isPrimary: boolean;
  eventCount?: number;
  lastSyncTime?: string;
  settings?: {
    showInList: boolean;
    notifyNewEvents: boolean;
    defaultEventDuration: number; // minutes
  };
}

/**
 * Calendar sharing with permissions
 */
export interface CalendarShare {
  id: string;
  calendarId: string;
  sharedWith: string; // User ID or email
  permission: 'read' | 'write' | 'admin';
  sharedDate: string;
}

/**
 * Event creation/update request
 */
export interface CreateEventRequest {
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  allDay: boolean;
  attendeeEmails?: string[];
  recurrenceRule?: RecurrenceRule;
  attachmentUrls?: string[];
  reminders?: {
    type: 'notification' | 'email';
    minutes: number;
  }[];
  conferenceType?: 'zoom' | 'teams' | 'meet' | 'none';
  color?: string;
  visibility?: 'public' | 'private' | 'confidential';
}

/**
 * Event search/filter parameters
 */
export interface EventSearchParams {
  query?: string;
  startDate?: string;
  endDate?: string;
  calendarIds?: string[];
  attendee?: string;
  location?: string;
  status?: CalendarEvent['status'];
  tags?: string[];
  sortBy?: 'startTime' | 'title' | 'lastModified';
  limit?: number;
  offset?: number;
}

/**
 * Calendar UI state
 */
export interface CalendarUIState {
  viewMode: 'month' | 'week' | 'day' | 'agenda' | 'list';
  currentDate: string; // ISO date
  selectedDate?: string;
  selectedCalendarIds: string[];
  selectedEventId?: string;
  isCreatingEvent: boolean;
  editingEventId?: string;
  searchQuery?: string;
  filterTags?: string[];
  dragState?: {
    eventId: string;
    source: 'calendar' | 'list';
    originalStart: string;
    originalEnd: string;
    offsetMinutes?: number;
  };
  timezone?: string;
  showAttendees: boolean;
  showDetails: boolean;
  sidebarCollapsed: boolean;
}

/**
 * Calendar sync status
 */
export interface CalendarSyncStatus {
  id: string;
  calendarId: string;
  lastSyncTime: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
  nextSyncTime?: string;
  eventsCount: number;
}

/**
 * Attendee availability for scheduling
 */
export interface AttendeeAvailability {
  attendeeId: string;
  attendeeName: string;
  availableSlots: Array<{
    startTime: string;
    endTime: string;
    confidence: number; // 0-100
  }>;
  busySlots: Array<{
    startTime: string;
    endTime: string;
    event?: string;
  }>;
}

/**
 * Meeting scheduling suggestion
 */
export interface MeetingTimeSuggestion {
  startTime: string;
  endTime: string;
  score: number; // 0-100 based on availability
  reason: string;
  conflictingAttendees?: string[];
}

/**
 * Calendar notification event
 */
export interface CalendarNotification {
  id: string;
  type: 'event-created' | 'event-updated' | 'event-deleted' | 'event-reminder' | 'rsvp-request' | 'calendar-shared';
  eventId?: string;
  calendarId?: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

/**
 * Event filtering options
 */
export interface EventFilter {
  id: string;
  name: string;
  conditions: {
    calendarId?: string[];
    attendee?: string;
    hasAttachments?: boolean;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  };
  color?: string;
}

/**
 * Bulk event action result
 */
export interface BulkEventActionResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    eventId: string;
    error: string;
  }>;
  affectedEvents: string[];
}

/**
 * Calendar export options
 */
export interface ExportOptions {
  format: 'ics' | 'csv' | 'json';
  calendarIds: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  includeAttachments?: boolean;
  includeAttendees?: boolean;
}

/**
 * Calendar import data
 */
export interface ImportData {
  format: 'ics' | 'csv' | 'json';
  data: string;
  targetCalendarId: string;
  mergeStrategy?: 'skip-duplicates' | 'overwrite' | 'create-all';
}

/**
 * Time slot for availability display
 */
export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string;
  available: boolean;
  event?: {
    id: string;
    title: string;
  };
}

/**
 * Day cell data for month view
 */
export interface DayCell {
  date: string; // ISO date
  dayOfWeek: number; // 0-6
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
  eventCount: number;
  isSelected: boolean;
}

/**
 * Week view data structure
 */
export interface WeekData {
  weekStartDate: string;
  weekEndDate: string;
  days: DayCell[];
  timeSlots: TimeSlot[];
  allDayEvents: CalendarEvent[];
}

/**
 * Agenda view entry
 */
export interface AgendaEntry {
  date: string;
  dayName: string;
  events: CalendarEvent[];
  isEmpty: boolean;
}

/**
 * Calendar statistics
 */
export interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  attendingCount: number;
  organizingCount: number;
  busyHours: number;
  averageEventsPerDay: number;
  mostBusyDay: string;
}

/**
 * Event drag-drop action
 */
export interface EventDragAction {
  eventId: string;
  sourceCalendarId: string;
  targetCalendarId: string;
  newStartTime: string;
  newEndTime: string;
  sourceViewMode: 'month' | 'week' | 'day' | 'agenda' | 'list';
}

/**
 * Recurring event update scope
 */
export type RecurrenceUpdateScope = 'this-event' | 'this-and-following' | 'all-events';
