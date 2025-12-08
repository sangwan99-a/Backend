/**
 * Calendar Module - React Query Hooks
 * 
 * Query & Mutation hooks for all calendar operations with:
 * - Optimistic updates for responsive UX
 * - Automatic fallback to IndexedDB on network errors
 * - Smart caching strategies
 * - Real-time sync support
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import useAuthStore from '@/store/authStore';
import * as calendarDb from '../services/calendarDatabase';
import type {
  CalendarEvent,
  UserCalendar,
  CreateEventRequest,
  EventSearchParams,
  CalendarSyncStatus,
  BulkEventActionResult,
  AttendeeAvailability,
  MeetingTimeSuggestion,
} from '../types/calendar';

const API_BASE = '/api/v1/calendar';
const queryClient = useQueryClient();

/**
 * Query Hooks
 */

/**
 * Get all user calendars
 */
export const useCalendars = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery(
    ['calendars', userId],
    async () => {
      if (!userId) return [];
      try {
        const { data } = await axios.get(`${API_BASE}/calendars`, {
          headers: { 'X-User-Id': userId },
        });
        // Save to IndexedDB for offline access
        for (const calendar of data.calendars) {
          await calendarDb.saveCalendar(calendar);
        }
        return data.calendars as UserCalendar[];
      } catch (error) {
        // Fallback to IndexedDB on error
        console.warn('Failed to fetch calendars, using local cache:', error);
        return calendarDb.getCalendars(userId);
      }
    },
    {
      enabled: !!userId,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
    }
  );
};

/**
 * Get single calendar with details
 */
export const useCalendar = (calendarId: string) => {
  return useQuery(
    ['calendar', calendarId],
    async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/calendars/${calendarId}`);
        await calendarDb.saveCalendar(data.calendar);
        return data.calendar as UserCalendar;
      } catch (error) {
        return calendarDb.getCalendarById(calendarId);
      }
    },
    {
      enabled: !!calendarId,
      staleTime: 1000 * 60 * 5,
    }
  );
};

/**
 * Get events for date range
 */
export const useEvents = (startDate: string, endDate: string, calendarIds?: string[]) => {
  return useQuery(
    ['events', startDate, endDate, calendarIds],
    async () => {
      try {
        const params = new URLSearchParams({
          start: startDate,
          end: endDate,
          ...(calendarIds && { calendarIds: calendarIds.join(',') }),
        });

        const { data } = await axios.get(`${API_BASE}/events?${params}`);
        
        // Save events to IndexedDB
        for (const event of data.events) {
          await calendarDb.saveEvent(event);
        }

        return data.events as CalendarEvent[];
      } catch (error) {
        console.warn('Failed to fetch events, using local cache:', error);
        return calendarDb.getEvents(startDate, endDate, calendarIds);
      }
    },
    {
      staleTime: 1000 * 60, // 1 minute
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    }
  );
};

/**
 * Get single event details
 */
export const useEvent = (eventId: string) => {
  return useQuery(
    ['event', eventId],
    async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/events/${eventId}`);
        await calendarDb.saveEvent(data.event);
        return data.event as CalendarEvent;
      } catch (error) {
        return calendarDb.getEventById(eventId);
      }
    },
    {
      enabled: !!eventId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    }
  );
};

/**
 * Search events
 */
export const useSearchEvents = (query: string, calendarIds?: string[], enabled = true) => {
  return useQuery(
    ['search-events', query, calendarIds],
    async () => {
      if (!query) return [];

      try {
        const params = new URLSearchParams({
          q: query,
          ...(calendarIds && { calendarIds: calendarIds.join(',') }),
        });

        const { data } = await axios.get(`${API_BASE}/events/search?${params}`);
        return data.events as CalendarEvent[];
      } catch (error) {
        console.warn('Search failed, using local search:', error);
        return calendarDb.searchEvents(query, calendarIds);
      }
    },
    {
      enabled: enabled && query.length > 0,
      staleTime: 0,
      retry: false,
    }
  );
};

/**
 * Get attendee availability for scheduling
 */
export const useAttendeeAvailability = (
  attendeeEmails: string[],
  startDate: string,
  endDate: string,
  enabled = true
) => {
  return useQuery(
    ['attendee-availability', attendeeEmails, startDate, endDate],
    async () => {
      try {
        const { data } = await axios.post(`${API_BASE}/availability`, {
          attendeeEmails,
          startDate,
          endDate,
        });
        return data.availability as AttendeeAvailability[];
      } catch (error) {
        console.error('Failed to fetch attendee availability:', error);
        return [];
      }
    },
    {
      enabled: enabled && attendeeEmails.length > 0,
      staleTime: 1000 * 60 * 2, // 2 minutes (availability changes frequently)
    }
  );
};

/**
 * Get meeting time suggestions
 */
export const useMeetingTimeSuggestions = (
  attendeeEmails: string[],
  duration: number,
  startDate: string,
  endDate: string,
  enabled = true
) => {
  return useQuery(
    ['meeting-suggestions', attendeeEmails, duration, startDate, endDate],
    async () => {
      try {
        const { data } = await axios.post(`${API_BASE}/suggest-meeting-times`, {
          attendeeEmails,
          durationMinutes: duration,
          startDate,
          endDate,
        });
        return data.suggestions as MeetingTimeSuggestion[];
      } catch (error) {
        console.error('Failed to get meeting suggestions:', error);
        return [];
      }
    },
    {
      enabled: enabled && attendeeEmails.length > 0,
      staleTime: 0,
      retry: false,
    }
  );
};

/**
 * Mutation Hooks
 */

/**
 * Create new calendar
 */
export const useCreateCalendar = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (calendar: Omit<UserCalendar, 'id' | 'userId'>) => {
      const { data } = await axios.post(`${API_BASE}/calendars`, {
        ...calendar,
        userId,
      });
      return data.calendar as UserCalendar;
    },
    {
      onSuccess: (calendar) => {
        // Save to IndexedDB
        calendarDb.saveCalendar(calendar);
        // Invalidate calendars list
        queryClient.invalidateQueries(['calendars', userId]);
      },
    }
  );
};

/**
 * Update calendar
 */
export const useUpdateCalendar = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async ({ calendarId, updates }: { calendarId: string; updates: Partial<UserCalendar> }) => {
      const { data } = await axios.put(`${API_BASE}/calendars/${calendarId}`, updates);
      return data.calendar as UserCalendar;
    },
    {
      onMutate: async ({ calendarId, updates }) => {
        // Optimistic update
        await calendarDb.updateCalendar(calendarId, updates);
        queryClient.setQueryData(['calendar', calendarId], (old: any) => 
          old ? { ...old, ...updates } : undefined
        );
      },
      onSuccess: (calendar) => {
        queryClient.invalidateQueries(['calendar', calendar.id]);
        queryClient.invalidateQueries(['calendars', userId]);
      },
    }
  );
};

/**
 * Delete calendar
 */
export const useDeleteCalendar = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (calendarId: string) => {
      await axios.delete(`${API_BASE}/calendars/${calendarId}`);
    },
    {
      onMutate: async (calendarId) => {
        // Optimistic delete
        await calendarDb.deleteCalendar(calendarId);
        await calendarDb.deleteEventsByCalendar(calendarId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['calendars', userId]);
      },
    }
  );
};

/**
 * Create event
 */
export const useCreateEvent = () => {
  const userId = useAuthStore((state) => state.user?.id);

  return useMutation(
    async (event: CreateEventRequest) => {
      const { data } = await axios.post(`${API_BASE}/events`, event);
      return data.event as CalendarEvent;
    },
    {
      onSuccess: (event) => {
        // Save to IndexedDB
        calendarDb.saveEvent(event);
        // Invalidate relevant queries
        queryClient.invalidateQueries(['events']);
        queryClient.invalidateQueries(['calendar', event.calendarId]);
      },
    }
  );
};

/**
 * Update event
 */
export const useUpdateEvent = () => {
  return useMutation(
    async ({ eventId, updates }: { eventId: string; updates: Partial<CalendarEvent> }) => {
      const { data } = await axios.put(`${API_BASE}/events/${eventId}`, updates);
      return data.event as CalendarEvent;
    },
    {
      onMutate: async ({ eventId, updates }) => {
        // Optimistic update
        const event = await calendarDb.getEventById(eventId);
        if (event) {
          await calendarDb.updateEvent(eventId, updates);
          queryClient.setQueryData(['event', eventId], (old: any) => 
            old ? { ...old, ...updates } : undefined
          );
        }
      },
      onSuccess: (event) => {
        queryClient.invalidateQueries(['event', event.id]);
        queryClient.invalidateQueries(['events']);
      },
    }
  );
};

/**
 * Delete event
 */
export const useDeleteEvent = () => {
  return useMutation(
    async (eventId: string) => {
      await axios.delete(`${API_BASE}/events/${eventId}`);
    },
    {
      onMutate: async (eventId) => {
        // Optimistic delete
        const event = await calendarDb.getEventById(eventId);
        if (event) {
          await calendarDb.deleteEvent(eventId);
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['events']);
      },
    }
  );
};

/**
 * Move event to different calendar
 */
export const useMoveEvent = () => {
  return useMutation(
    async ({ eventId, targetCalendarId }: { eventId: string; targetCalendarId: string }) => {
      const { data } = await axios.patch(`${API_BASE}/events/${eventId}/move`, {
        targetCalendarId,
      });
      return data.event as CalendarEvent;
    },
    {
      onMutate: async ({ eventId, targetCalendarId }) => {
        const event = await calendarDb.getEventById(eventId);
        if (event) {
          await calendarDb.updateEvent(eventId, { calendarId: targetCalendarId });
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['events']);
      },
    }
  );
};

/**
 * Resize/reschedule event
 */
export const useRescheduleEvent = () => {
  return useMutation(
    async ({
      eventId,
      startTime,
      endTime,
    }: {
      eventId: string;
      startTime: string;
      endTime: string;
    }) => {
      const { data } = await axios.patch(`${API_BASE}/events/${eventId}`, {
        startTime,
        endTime,
      });
      return data.event as CalendarEvent;
    },
    {
      onMutate: async ({ eventId, startTime, endTime }) => {
        const event = await calendarDb.getEventById(eventId);
        if (event) {
          await calendarDb.updateEvent(eventId, { startTime, endTime });
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['events']);
      },
    }
  );
};

/**
 * Update attendee status
 */
export const useUpdateAttendeeStatus = () => {
  return useMutation(
    async ({
      eventId,
      attendeeEmail,
      status,
    }: {
      eventId: string;
      attendeeEmail: string;
      status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
    }) => {
      const { data } = await axios.patch(`${API_BASE}/events/${eventId}/attendee-response`, {
        attendeeEmail,
        status,
      });
      return data.event as CalendarEvent;
    },
    {
      onMutate: async ({ eventId, attendeeEmail, status }) => {
        await calendarDb.updateAttendeeStatus(eventId, attendeeEmail, status);
      },
      onSuccess: (event) => {
        queryClient.invalidateQueries(['event', event.id]);
      },
    }
  );
};

/**
 * Bulk operations
 */

/**
 * Move multiple events to different calendar
 */
export const useBulkMoveEvents = () => {
  return useMutation(
    async ({ eventIds, targetCalendarId }: { eventIds: string[]; targetCalendarId: string }) => {
      const { data } = await axios.post(`${API_BASE}/events/bulk-move`, {
        eventIds,
        targetCalendarId,
      });
      return data as BulkEventActionResult;
    },
    {
      onMutate: async ({ eventIds, targetCalendarId }) => {
        await calendarDb.moveEventsToCalendar(eventIds, targetCalendarId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['events']);
      },
    }
  );
};

/**
 * Bulk delete events
 */
export const useBulkDeleteEvents = () => {
  return useMutation(
    async (eventIds: string[]) => {
      const { data } = await axios.post(`${API_BASE}/events/bulk-delete`, { eventIds });
      return data as BulkEventActionResult;
    },
    {
      onMutate: async (eventIds) => {
        await calendarDb.bulkDeleteEvents(eventIds);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['events']);
      },
    }
  );
};

/**
 * Bulk update color
 */
export const useBulkUpdateColor = () => {
  return useMutation(
    async ({ eventIds, color }: { eventIds: string[]; color: string }) => {
      const { data } = await axios.post(`${API_BASE}/events/bulk-color`, {
        eventIds,
        color,
      });
      return data as BulkEventActionResult;
    },
    {
      onMutate: async ({ eventIds, color }) => {
        await calendarDb.bulkUpdateEventColor(eventIds, color);
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['events']);
      },
    }
  );
};

/**
 * Export events
 */
export const useExportEvents = () => {
  return useMutation(
    async ({ calendarIds, format }: { calendarIds: string[]; format: 'ics' | 'csv' | 'json' }) => {
      const { data } = await axios.post(
        `${API_BASE}/export`,
        { calendarIds, format },
        { responseType: format === 'json' ? 'json' : 'blob' }
      );
      return data;
    }
  );
};

/**
 * Import events
 */
export const useImportEvents = () => {
  return useMutation(
    async ({
      targetCalendarId,
      fileContent,
      format,
    }: {
      targetCalendarId: string;
      fileContent: string;
      format: 'ics' | 'csv' | 'json';
    }) => {
      const { data } = await axios.post(`${API_BASE}/import`, {
        targetCalendarId,
        fileContent,
        format,
      });
      return data as BulkEventActionResult;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['events']);
      },
    }
  );
};

/**
 * Get calendar sync status
 */
export const useCalendarSyncStatus = (calendarId: string) => {
  return useQuery(
    ['calendar-sync-status', calendarId],
    async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/calendars/${calendarId}/sync-status`);
        await calendarDb.updateSyncStatus(calendarId, data.syncStatus);
        return data.syncStatus as CalendarSyncStatus;
      } catch (error) {
        return calendarDb.getSyncStatus(calendarId);
      }
    },
    {
      enabled: !!calendarId,
      refetchInterval: 30000, // Poll every 30 seconds
    }
  );
};
