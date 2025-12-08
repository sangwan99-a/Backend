import React, { useState, useCallback } from 'react';
import { Text, Button, Tooltip } from '@fluentui/react-components';
import { ChevronLeft20Regular, ChevronRight20Regular, Home20Regular } from '@fluentui/react-icons';
import { calendarStore } from '../../store/calendarStore';
import { useEvents } from '../../hooks/useCalendarData';
import { CalendarEvent, DayCell } from '../../types/calendar';
import '../../styles/calendar.css';

/**
 * Calendar Grid Component
 * 
 * Renders calendar in multiple views:
 * - Month: 6-week grid with day cells
 * - Week: 7-day view with hourly time slots
 * - Day: Single day with 30-min time slots
 * - Agenda: List view of upcoming events
 */

interface CalendarGridProps {
  onEventClick: (eventId: string) => void;
  onDayClick: (date: string) => void;
  onEventDragStart: (eventId: string, date: string) => void;
  onEventDragEnd: (newDate: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  onEventClick,
  onDayClick,
  onEventDragStart,
  onEventDragEnd,
}) => {
  const {
    viewMode,
    currentDate,
    selectedCalendarIds,
    dragState,
  } = calendarStore();

  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Get events for current view
  const getDateRange = useCallback(() => {
    const current = new Date(currentDate);

    switch (viewMode) {
      case 'month':
        // Get first day of month
        const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
        // Get last day of month
        const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        // Adjust to week boundaries
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());
        const endDate = new Date(lastDay);
        endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

        return [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]];

      case 'week':
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        return [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]];

      case 'day':
        return [currentDate, currentDate];

      case 'agenda':
        const agendaEnd = new Date(current);
        agendaEnd.setDate(current.getDate() + 30);
        return [currentDate, agendaEnd.toISOString().split('T')[0]];

      default:
        return [currentDate, currentDate];
    }
  }, [currentDate, viewMode]);

  const [startDate, endDate] = getDateRange();
  const { data: events = [], isLoading } = useEvents(startDate, endDate, selectedCalendarIds);

  const renderMonthView = () => {
    const current = new Date(currentDate);
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);

    // Get week starting on Sunday
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    const weeks: DayCell[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let week = 0; week < 6; week++) {
      const weekDays: DayCell[] = [];

      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + week * 7 + day);
        const dateStr = cellDate.toISOString().split('T')[0];

        const isCurrentMonth = cellDate.getMonth() === current.getMonth();
        const isToday = cellDate.getTime() === today.getTime();
        const dayOfMonth = cellDate.getDate();

        const dayEvents = events.filter((e) => {
          const eStart = e.startTime.split('T')[0];
          return eStart === dateStr;
        });

        weekDays.push({
          date: dateStr,
          dayOfWeek: day,
          dayOfMonth,
          isCurrentMonth,
          isToday,
          isWeekend: day === 0 || day === 6,
          events: dayEvents,
          eventCount: dayEvents.length,
          isSelected: false,
        });
      }

      weeks.push(weekDays);
    }

    return (
      <div className="calendar-month-view">
        <div className="calendar-weekday-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="calendar-weekday-name">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-month-grid">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="calendar-week-row">
              {week.map((dayCell) => (
                <div
                  key={dayCell.date}
                  className={`calendar-day-cell ${!dayCell.isCurrentMonth ? 'other-month' : ''} ${
                    dayCell.isToday ? 'today' : ''
                  } ${dayCell.isWeekend ? 'weekend' : ''}`}
                  onClick={() => onDayClick(dayCell.date)}
                  onMouseEnter={() => setHoveredDay(dayCell.date)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className="day-number">{dayCell.dayOfMonth}</div>

                  <div className="day-events">
                    {dayCell.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="event-chip"
                        style={{ backgroundColor: event.color || '#2b7de9' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event.id);
                        }}
                        draggable
                        onDragStart={() => onEventDragStart(event.id, dayCell.date)}
                      >
                        <Text truncate size={100}>
                          {event.title}
                        </Text>
                      </div>
                    ))}
                    {dayCell.eventCount > 3 && (
                      <div className="event-overflow">+{dayCell.eventCount - 3} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const current = new Date(currentDate);
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() - current.getDay());

    const weekDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDays.push(date.toISOString().split('T')[0]);
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar-week-view">
        <div className="week-header">
          <div className="time-column-header"></div>
          {weekDays.map((date) => {
            const d = new Date(date);
            return (
              <div key={date} className="day-column-header">
                <div className="day-name">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}</div>
                <div className="day-date">{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        <div className="week-grid">
          {hours.map((hour) => (
            <div key={hour} className="hour-row">
              <div className="time-label">{hour.toString().padStart(2, '0')}:00</div>
              {weekDays.map((date) => {
                const hourStart = `${hour.toString().padStart(2, '0')}:00`;
                const hourEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
                const dayEvents = events.filter((e) => {
                  const eDate = e.startTime.split('T')[0];
                  const eTime = e.startTime.split('T')[1]?.substring(0, 5);
                  return eDate === date && eTime >= hourStart && eTime < hourEnd;
                });

                return (
                  <div
                    key={`${date}-${hour}`}
                    className="time-slot"
                    onClick={() => onDayClick(date)}
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="time-slot-event"
                        style={{ backgroundColor: event.color || '#2b7de9' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event.id);
                        }}
                      >
                        <Text truncate size={100}>
                          {event.title}
                        </Text>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events.filter((e) => e.startTime.split('T')[0] === currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="calendar-day-view">
        <div className="day-header">
          <Text size={500}>{new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </div>

        <div className="day-grid">
          {hours.map((hour) => {
            const hourStart = `${hour.toString().padStart(2, '0')}:00`;
            const hourEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
            const hourEvents = dayEvents.filter((e) => {
              const eTime = e.startTime.split('T')[1]?.substring(0, 5);
              return eTime >= hourStart && eTime < hourEnd;
            });

            return (
              <div key={hour} className="day-hour-row">
                <div className="hour-time-label">{hour.toString().padStart(2, '0')}:00</div>
                <div className="hour-slot">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className="day-event-block"
                      style={{ backgroundColor: event.color || '#2b7de9' }}
                      onClick={() => onEventClick(event.id)}
                    >
                      <Text truncate weight="semibold">
                        {event.title}
                      </Text>
                      <Text truncate size={100}>
                        {event.location}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const upcomingEvents = events
      .filter((e) => e.startTime >= currentDate)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 50);

    const grouped = new Map<string, CalendarEvent[]>();
    upcomingEvents.forEach((event) => {
      const date = event.startTime.split('T')[0];
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(event);
    });

    return (
      <div className="calendar-agenda-view">
        {Array.from(grouped.entries()).map(([date, dayEvents]) => {
          const d = new Date(date);
          return (
            <div key={date} className="agenda-date-section">
              <div className="agenda-date-header">
                <Text weight="semibold" size={300}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </div>

              <div className="agenda-events">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="agenda-event-item"
                    onClick={() => onEventClick(event.id)}
                  >
                    <div
                      className="agenda-event-color"
                      style={{ backgroundColor: event.color || '#2b7de9' }}
                    ></div>
                    <div className="agenda-event-content">
                      <Text weight="semibold">{event.title}</Text>
                      <Text size={100}>
                        {event.startTime.split('T')[1]?.substring(0, 5)} - {event.endTime.split('T')[1]?.substring(0, 5)}
                      </Text>
                      {event.location && (
                        <Text size={100}>📍 {event.location}</Text>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const allEvents = events
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 100);

    return (
      <div className="calendar-list-view">
        {allEvents.map((event) => (
          <div
            key={event.id}
            className="list-event-item"
            onClick={() => onEventClick(event.id)}
          >
            <div
              className="list-event-color"
              style={{ backgroundColor: event.color || '#2b7de9' }}
            ></div>
            <div className="list-event-info">
              <Text weight="semibold">{event.title}</Text>
              <Text size={100}>
                {new Date(event.startTime).toLocaleString()} {event.allDay ? '(All day)' : ''}
              </Text>
              <div className="list-event-meta">
                {event.location && <span>📍 {event.location}</span>}
                {event.attendees.length > 0 && <span>👥 {event.attendees.length} attendees</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="calendar-loading">
        <Text>Loading calendar...</Text>
      </div>
    );
  }

  return (
    <div className="calendar-grid-container">
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'agenda' && renderAgendaView()}
      {viewMode === 'list' && renderListView()}
    </div>
  );
};

export default CalendarGrid;
