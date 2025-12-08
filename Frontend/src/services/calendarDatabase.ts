/**
 * Calendar Database Service - IndexedDB with Dexie
 * 
 * Tables:
 * - calendars: User's calendars
 * - events: Calendar events with recurrence
 * - recurrence: Recurring event patterns
 * - attendees: Event attendees with RSVP status
 * - exceptions: Recurring event exceptions
 * - syncStatus: Sync tracking per calendar
 */

import Dexie from 'dexie';
import type {
  CalendarEvent,
  UserCalendar,
  EventAttendee,
  RecurrenceRule,
  RecurringEventException,
  CalendarSyncStatus,
  FreeBusy,
} from '../types/calendar';

// Initialize Dexie database
const db = new Dexie('FusionDeskCalendarDB');

db.version(1).stores({
  calendars: 'id, userId, isPrimary',
  events: 'id, calendarId, startTime, endTime, [calendarId+startTime]',
  recurrence: 'id, eventId',
  attendees: 'id, eventId, email',
  exceptions: 'id, eventId, eventDate',
  syncStatus: 'id, calendarId',
  freeBusy: 'id, calendarId, startTime',
});

/**
 * Calendar management functions
 */

export const getCalendars = async (userId: string): Promise<UserCalendar[]> => {
  return db.table('calendars')
    .where('userId')
    .equals(userId)
    .toArray();
};

export const getCalendarById = async (calendarId: string): Promise<UserCalendar | undefined> => {
  return db.table('calendars').get(calendarId);
};

export const saveCalendar = async (calendar: UserCalendar): Promise<string> => {
  return (await db.table('calendars').put(calendar)) as any as string;
};

export const updateCalendar = async (calendarId: string, updates: Partial<UserCalendar>): Promise<void> => {
  await db.table('calendars').update(calendarId, updates);
};

export const deleteCalendar = async (calendarId: string): Promise<void> => {
  return db.table('calendars').delete(calendarId);
};

export const toggleCalendarVisibility = async (calendarId: string, visible: boolean): Promise<void> => {
  await db.table('calendars').update(calendarId, {
    settings: {
      showInList: visible,
    },
  } as any);
};

/**
 * Event management functions
 */

export const getEvents = async (
  startDate: string,
  endDate: string,
  calendarIds?: string[]
): Promise<CalendarEvent[]> => {
  let query = db.table('events')
    .where('startTime')
    .between(startDate, endDate);

  if (calendarIds && calendarIds.length > 0) {
    // Filter by specific calendars
    const events = await query.toArray();
    return events.filter(e => calendarIds.includes(e.calendarId));
  }

  return query.toArray();
};

export const getEventById = async (eventId: string): Promise<CalendarEvent | undefined> => {
  return db.table('events').get(eventId);
};

export const saveEvent = async (event: CalendarEvent): Promise<string> => {
  return (await db.table('events').put(event)) as any as string;
};

export const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>): Promise<void> => {
  await db.table('events').update(eventId, updates);
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  return db.table('events').delete(eventId);
};

export const getEventsByCalendar = async (calendarId: string): Promise<CalendarEvent[]> => {
  return db.table('events')
    .where('calendarId')
    .equals(calendarId)
    .toArray();
};

export const getEventsByAttendee = async (attendeeEmail: string, startDate: string, endDate: string): Promise<CalendarEvent[]> => {
  const events = await db.table('events')
    .where('startTime')
    .between(startDate, endDate)
    .toArray();

  return events.filter((e) =>
    e.attendees.some((a: any) => a.email === attendeeEmail)
  );
};

export const searchEvents = async (query: string, calendarIds?: string[]): Promise<CalendarEvent[]> => {
  const lowerQuery = query.toLowerCase();
  let events = await db.table('events').toArray();

  events = events.filter((e) =>
    e.title.toLowerCase().includes(lowerQuery) ||
    e.description?.toLowerCase().includes(lowerQuery) ||
    e.location?.toLowerCase().includes(lowerQuery) ||
    e.attendees.some((a: any) => a.name.toLowerCase().includes(lowerQuery) || a.email.toLowerCase().includes(lowerQuery))
  );

  if (calendarIds && calendarIds.length > 0) {
    events = events.filter(e => calendarIds.includes(e.calendarId));
  }

  return events;
};

/**
 * Recurrence rule functions
 */

export const saveRecurrenceRule = async (rule: RecurrenceRule): Promise<string> => {
  return (await db.table('recurrence').put(rule)) as any as string;
};

export const getRecurrenceRule = async (ruleId: string): Promise<RecurrenceRule | undefined> => {
  return db.table('recurrence').get(ruleId);
};

export const deleteRecurrenceRule = async (ruleId: string): Promise<void> => {
  return db.table('recurrence').delete(ruleId);
};

/**
 * Attendee functions
 */

export const addAttendee = async (eventId: string, attendee: EventAttendee): Promise<void> => {
  const event = await getEventById(eventId);
  if (!event) return;

  // Check if attendee already exists
  if (!event.attendees.some(a => a.email === attendee.email)) {
    event.attendees.push(attendee);
    await updateEvent(eventId, { attendees: event.attendees });
  }
};

export const removeAttendee = async (eventId: string, attendeeEmail: string): Promise<void> => {
  const event = await getEventById(eventId);
  if (!event) return;

  event.attendees = event.attendees.filter(a => a.email !== attendeeEmail);
  await updateEvent(eventId, { attendees: event.attendees });
};

export const updateAttendeeStatus = async (eventId: string, attendeeEmail: string, status: EventAttendee['status']): Promise<void> => {
  const event = await getEventById(eventId);
  if (!event) return;

  const attendee = event.attendees.find(a => a.email === attendeeEmail);
  if (attendee) {
    attendee.status = status;
    attendee.responseDate = new Date().toISOString();
    await updateEvent(eventId, { attendees: event.attendees });
  }
};

export const getAttendees = async (eventId: string): Promise<EventAttendee[]> => {
  const event = await getEventById(eventId);
  return event?.attendees ?? [];
};

/**
 * Recurring event exception functions
 */

export const saveException = async (exception: RecurringEventException): Promise<string> => {
  return (await db.table('exceptions').put(exception)) as any as string;
};

export const getEventExceptions = async (eventId: string): Promise<RecurringEventException[]> => {
  return db.table('exceptions')
    .where('eventId')
    .equals(eventId)
    .toArray();
};

export const deleteException = async (exceptionId: string): Promise<void> => {
  return db.table('exceptions').delete(exceptionId);
};

/**
 * Sync status functions
 */

export const getSyncStatus = async (calendarId: string): Promise<CalendarSyncStatus | undefined> => {
  return db.table('syncStatus').get(calendarId);
};

export const updateSyncStatus = async (calendarId: string, status: Partial<CalendarSyncStatus>): Promise<void> => {
  const existing = await getSyncStatus(calendarId);
  if (existing) {
    await db.table('syncStatus').update(calendarId, status);
  } else {
    await db.table('syncStatus').put({
      id: calendarId,
      calendarId,
      lastSyncTime: new Date().toISOString(),
      syncStatus: 'idle',
      eventsCount: 0,
      ...status,
    } as any);
  }
};

/**
 * Free/Busy tracking
 */

export const saveFreeBusy = async (freeBusy: FreeBusy): Promise<string> => {
  return (await db.table('freeBusy').put(freeBusy)) as any as string;
};

export const getFreeBusy = async (
  calendarId: string,
  startTime: string,
  endTime: string
): Promise<FreeBusy[]> => {
  return db.table('freeBusy')
    .where('calendarId')
    .equals(calendarId)
    .filter(fb => fb.startTime >= startTime && fb.endTime <= endTime)
    .toArray();
};

export const clearFreeBusy = async (calendarId: string): Promise<void> => {
  await db.table('freeBusy')
    .where('calendarId')
    .equals(calendarId)
    .delete();
};

/**
 * Bulk operations
 */

export const deleteEventsByCalendar = async (calendarId: string): Promise<number> => {
  return db.table('events')
    .where('calendarId')
    .equals(calendarId)
    .delete();
};

export const moveEventsToCalendar = async (eventIds: string[], targetCalendarId: string): Promise<void> => {
  const events = await db.table('events').bulkGet(eventIds);
  const updated = events
    .filter(e => e !== undefined)
    .map(e => ({ ...e, calendarId: targetCalendarId }));

  await db.table('events').bulkPut(updated);
};

export const bulkUpdateEventColor = async (eventIds: string[], color: string): Promise<void> => {
  const events = await db.table('events').bulkGet(eventIds);
  const updated = events
    .filter(e => e !== undefined)
    .map(e => ({ ...e, color }));

  await db.table('events').bulkPut(updated);
};

export const bulkDeleteEvents = async (eventIds: string[]): Promise<number> => {
  await db.table('events').bulkDelete(eventIds);
  return eventIds.length;
};

/**
 * Database cleanup and maintenance
 */

export const deleteExpiredEvents = async (beforeDate: string): Promise<number> => {
  const events = await db.table('events')
    .where('endTime')
    .below(beforeDate)
    .toArray();

  const ids = events.map(e => e.id);
  await db.table('events').bulkDelete(ids);
  return ids.length;
};

export const clearAllCalendarData = async (): Promise<void> => {
  await Promise.all([
    db.table('calendars').clear(),
    db.table('events').clear(),
    db.table('recurrence').clear(),
    db.table('attendees').clear(),
    db.table('exceptions').clear(),
    db.table('syncStatus').clear(),
    db.table('freeBusy').clear(),
  ]);
};

export const getStorageStats = async (): Promise<{
  calendarsCount: number;
  eventsCount: number;
  recurrenceCount: number;
  exceptionsCount: number;
}> => {
  return {
    calendarsCount: await db.table('calendars').count(),
    eventsCount: await db.table('events').count(),
    recurrenceCount: await db.table('recurrence').count(),
    exceptionsCount: await db.table('exceptions').count(),
  };
};

export default db;
