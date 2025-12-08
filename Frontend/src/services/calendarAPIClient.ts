/**
 * Calendar API Integration
 * Calendar microservice with drag-drop rescheduling and iCal support
 */

import { getApiClient, useApi, useMutateApi } from '@/lib/api-client';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string;
  allDay: boolean;
  location?: string;
  organizer: string;
  attendees: CalendarAttendee[];
  recurrence?: CalendarRecurrence;
  reminders: CalendarReminder[];
  attachments?: CalendarAttachment[];
  color?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  role: 'organizer' | 'attendee' | 'optional';
  status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
}

export interface CalendarRecurrence {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  interval?: number;
  daysOfWeek?: number[]; // 0=Sunday, 6=Saturday
  endDate?: string;
  occurrences?: number;
}

export interface CalendarReminder {
  type: 'notification' | 'email';
  minutesBefore: number;
}

export interface CalendarAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface CalendarAvailability {
  date: string;
  slots: AvailableSlot[];
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface CalendarConflict {
  eventId: string;
  title: string;
  startTime: string;
  endTime: string;
  conflictsWith: string[];
}

/**
 * Calendar API Client
 */
export class CalendarAPIClient {
  private api = getApiClient();

  /**
   * Get events for date range
   */
  async getEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    return this.api.get(`/api/v1/calendar/events?start=${startDate}&end=${endDate}`);
  }

  /**
   * Get event details
   */
  async getEvent(eventId: string): Promise<CalendarEvent> {
    return this.api.get(`/api/v1/calendar/events/${eventId}`);
  }

  /**
   * Create new event
   */
  async createEvent(data: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    allDay?: boolean;
    location?: string;
    attendees?: string[];
    recurrence?: CalendarRecurrence;
    reminders?: CalendarReminder[];
    color?: string;
  }): Promise<CalendarEvent> {
    return this.api.post('/api/v1/calendar/events', data);
  }

  /**
   * Update event
   */
  async updateEvent(
    eventId: string,
    data: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    return this.api.put(`/api/v1/calendar/events/${eventId}`, data);
  }

  /**
   * Update event time (drag-drop rescheduling)
   */
  async rescheduleEvent(
    eventId: string,
    startTime: string,
    endTime: string,
    notifyAttendees: boolean = true
  ): Promise<CalendarEvent> {
    return this.api.patch(`/api/v1/calendar/events/${eventId}/reschedule`, {
      startTime,
      endTime,
      notifyAttendees,
    });
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: string, deleteAll: boolean = false): Promise<void> {
    return this.api.delete(`/api/v1/calendar/events/${eventId}?deleteAll=${deleteAll}`);
  }

  /**
   * Accept event invitation
   */
  async acceptEvent(eventId: string, response?: string): Promise<CalendarEvent> {
    return this.api.post(`/api/v1/calendar/events/${eventId}/accept`, { response });
  }

  /**
   * Decline event invitation
   */
  async declineEvent(eventId: string, response?: string): Promise<CalendarEvent> {
    return this.api.post(`/api/v1/calendar/events/${eventId}/decline`, { response });
  }

  /**
   * Mark event as tentative
   */
  async tentativeEvent(eventId: string, response?: string): Promise<CalendarEvent> {
    return this.api.post(`/api/v1/calendar/events/${eventId}/tentative`, { response });
  }

  /**
   * Get calendar availability for scheduling
   */
  async getAvailability(date: string, duration: number = 30): Promise<CalendarAvailability> {
    return this.api.get(`/api/v1/calendar/availability?date=${date}&duration=${duration}`);
  }

  /**
   * Check for conflicts when creating/updating event
   */
  async checkConflicts(
    startTime: string,
    endTime: string,
    attendees?: string[]
  ): Promise<CalendarConflict[]> {
    return this.api.post('/api/v1/calendar/check-conflicts', {
      startTime,
      endTime,
      attendees,
    });
  }

  /**
   * Find available meeting time
   */
  async findAvailableTime(
    attendees: string[],
    duration: number = 30,
    daysAhead: number = 7
  ): Promise<AvailableSlot[]> {
    return this.api.post('/api/v1/calendar/find-available', {
      attendees,
      duration,
      daysAhead,
    });
  }

  /**
   * Import calendar from iCal file
   */
  async importCalendar(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.getClient().post('/api/v1/calendar/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Export calendar to iCal
   */
  async exportCalendar(startDate: string, endDate: string): Promise<Blob> {
    const response = await this.api.getClient().get(
      `/api/v1/calendar/export?start=${startDate}&end=${endDate}`,
      {
        responseType: 'blob',
      }
    );

    return response.data;
  }

  /**
   * Export specific event to iCal
   */
  async exportEvent(eventId: string): Promise<Blob> {
    const response = await this.api.getClient().get(`/api/v1/calendar/events/${eventId}/export`, {
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Get calendar settings
   */
  async getSettings(): Promise<{
    timezone: string;
    workingHours: { start: string; end: string };
    notifications: boolean;
  }> {
    return this.api.get('/api/v1/calendar/settings');
  }

  /**
   * Update calendar settings
   */
  async updateSettings(data: {
    timezone?: string;
    workingHours?: { start: string; end: string };
    notifications?: boolean;
  }): Promise<void> {
    return this.api.patch('/api/v1/calendar/settings', data);
  }
}

/**
 * Export singleton instance
 */
export const calendarAPI = new CalendarAPIClient();

/**
 * React hooks for calendar data
 */

/**
 * Hook to fetch events for date range
 */
export function useCalendarEvents(startDate: string, endDate: string) {
  return useApi(
    ['calendar-events', startDate, endDate],
    () => calendarAPI.getEvents(startDate, endDate),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 15 * 60 * 1000, // Cache for 15 minutes
    }
  );
}

/**
 * Hook to fetch single event
 */
export function useCalendarEvent(eventId: string) {
  return useApi(['calendar-event', eventId], () => calendarAPI.getEvent(eventId), {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create event
 */
export function useCreateEvent() {
  return useMutateApi(
    (data: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      allDay?: boolean;
      location?: string;
      attendees?: string[];
      recurrence?: CalendarRecurrence;
      reminders?: CalendarReminder[];
      color?: string;
    }) => calendarAPI.createEvent(data)
  );
}

/**
 * Hook to update event
 */
export function useUpdateEvent() {
  return useMutateApi(
    ({ eventId, data }: { eventId: string; data: Partial<CalendarEvent> }) =>
      calendarAPI.updateEvent(eventId, data)
  );
}

/**
 * Hook to reschedule event (drag-drop)
 */
export function useRescheduleEvent() {
  return useMutateApi(
    ({
      eventId,
      startTime,
      endTime,
      notifyAttendees,
    }: {
      eventId: string;
      startTime: string;
      endTime: string;
      notifyAttendees?: boolean;
    }) => calendarAPI.rescheduleEvent(eventId, startTime, endTime, notifyAttendees)
  );
}

/**
 * Hook to delete event
 */
export function useDeleteEvent() {
  return useMutateApi(
    ({ eventId, deleteAll }: { eventId: string; deleteAll?: boolean }) =>
      calendarAPI.deleteEvent(eventId, deleteAll)
  );
}

/**
 * Hook to accept event invitation
 */
export function useAcceptEvent() {
  return useMutateApi(
    ({ eventId, response }: { eventId: string; response?: string }) =>
      calendarAPI.acceptEvent(eventId, response)
  );
}

/**
 * Hook to decline event invitation
 */
export function useDeclineEvent() {
  return useMutateApi(
    ({ eventId, response }: { eventId: string; response?: string }) =>
      calendarAPI.declineEvent(eventId, response)
  );
}

/**
 * Hook to mark event as tentative
 */
export function useTentativeEvent() {
  return useMutateApi(
    ({ eventId, response }: { eventId: string; response?: string }) =>
      calendarAPI.tentativeEvent(eventId, response)
  );
}

/**
 * Hook to check for conflicts
 */
export function useCheckCalendarConflicts(
  startTime: string,
  endTime: string,
  attendees?: string[]
) {
  return useApi(
    ['calendar-conflicts', startTime, endTime, JSON.stringify(attendees)],
    () => calendarAPI.checkConflicts(startTime, endTime, attendees),
    {
      enabled: !!startTime && !!endTime,
      staleTime: 0, // Always fresh
    }
  );
}

/**
 * Hook to find available meeting time
 */
export function useFindAvailableTime(
  attendees: string[],
  duration: number = 30,
  daysAhead: number = 7
) {
  return useApi(
    ['calendar-available-time', JSON.stringify(attendees), String(duration), String(daysAhead)],
    () => calendarAPI.findAvailableTime(attendees, duration, daysAhead),
    {
      enabled: attendees.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to import calendar
 */
export function useImportCalendar() {
  return useMutateApi((file: File) => calendarAPI.importCalendar(file));
}

/**
 * Hook to get calendar settings
 */
export function useCalendarSettings() {
  return useApi(['calendar-settings'], () => calendarAPI.getSettings(), {
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}
