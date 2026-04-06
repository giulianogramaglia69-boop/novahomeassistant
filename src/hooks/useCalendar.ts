import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export function useCalendar(profileName?: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!profileName) return;
    const load = async () => {
      const { data } = await supabase
        .from('nova_calendar_events')
        .select('*')
        .eq('profile_name', profileName)
        .order('date', { ascending: true });
      if (data) {
        setEvents(data.map(r => ({
          id: r.id, title: r.title, date: r.date,
          startTime: r.start_time, endTime: r.end_time,
          description: r.description || undefined,
        })));
      }
    };
    load();
  }, [profileName]);

  const addEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    const id = crypto.randomUUID();
    setEvents(prev => [...prev, { ...event, id }]);
    if (profileName) {
      await supabase.from('nova_calendar_events').insert({
        id, profile_name: profileName, title: event.title, date: event.date,
        start_time: event.startTime, end_time: event.endTime, description: event.description || null,
      });
    }
  }, [profileName]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    if (profileName) {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      await supabase.from('nova_calendar_events').update(dbUpdates).eq('id', id);
    }
  }, [profileName]);

  const removeEvent = useCallback(async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    if (profileName) {
      await supabase.from('nova_calendar_events').delete().eq('id', id);
    }
  }, [profileName]);

  const getEventsForDate = useCallback((date: string) => {
    return events.filter(e => e.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events]);

  const getUpcomingEvents = useCallback((limit = 3) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return events
      .filter(e => e.date > today || (e.date === today && e.endTime >= nowTime))
      .sort((a, b) => a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date))
      .slice(0, limit);
  }, [events]);

  return { events, addEvent, updateEvent, removeEvent, getEventsForDate, getUpcomingEvents };
}
