import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarEvent } from '@/hooks/useCalendar';
import { Timer } from '@/hooks/useTimers';
import { WeatherData } from '@/lib/types';

export interface NovaNotification {
  id: string;
  type: 'calendar' | 'timer' | 'weather';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

const LS_KEY = 'nova_notif_settings';

interface NotifSettings {
  calendar: boolean;
  timer: boolean;
  weather: boolean;
}

const defaultSettings: NotifSettings = { calendar: true, timer: true, weather: true };

function getSettings(): NotifSettings {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? { ...defaultSettings, ...JSON.parse(s) } : defaultSettings;
  } catch { return defaultSettings; }
}

function sendBrowserNotif(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/placeholder.svg' });
  }
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotifSettings>(getSettings);
  const [notifications, setNotifications] = useState<NovaNotification[]>([]);
  const notifiedTimers = useRef<Set<string>>(new Set());
  const notifiedEvents = useRef<Set<string>>(new Set());
  const lastWeatherAlert = useRef<string>('');

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Request permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const updateSetting = useCallback((key: keyof NotifSettings, val: boolean) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  }, []);

  const addNotification = useCallback((n: Omit<NovaNotification, 'id' | 'timestamp' | 'read'>) => {
    const notif: NovaNotification = {
      ...n,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
    sendBrowserNotif(n.title, n.body);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  // Check timers
  const checkTimers = useCallback((timers: Timer[]) => {
    if (!settings.timer) return;
    timers.forEach(t => {
      if (t.done && !notifiedTimers.current.has(t.id)) {
        notifiedTimers.current.add(t.id);
        addNotification({ type: 'timer', title: '⏰ Timer completato', body: `"${t.label}" è terminato!` });
      }
    });
  }, [settings.timer, addNotification]);

  // Check upcoming calendar events (within 15 min)
  const checkCalendar = useCallback((events: CalendarEvent[]) => {
    if (!settings.calendar) return;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nowMin = now.getHours() * 60 + now.getMinutes();

    events.forEach(ev => {
      if (ev.date !== today) return;
      const [h, m] = ev.startTime.split(':').map(Number);
      const evMin = h * 60 + m;
      const diff = evMin - nowMin;
      if (diff >= 0 && diff <= 15 && !notifiedEvents.current.has(ev.id)) {
        notifiedEvents.current.add(ev.id);
        addNotification({
          type: 'calendar',
          title: '📅 Evento imminente',
          body: `"${ev.title}" tra ${diff} minuti (${ev.startTime})`,
        });
      }
    });
  }, [settings.calendar, addNotification]);

  // Check severe weather
  const SEVERE_CODES = new Set([65, 75, 82, 95, 96, 99]);
  const checkWeather = useCallback((weather: WeatherData | null) => {
    if (!settings.weather || !weather) return;
    // Extract weather code from description matching
    const desc = weather.description;
    const isSevere = ['intensa', 'Temporale', 'grandine', 'forte'].some(w => desc.includes(w));
    if (isSevere && lastWeatherAlert.current !== desc) {
      lastWeatherAlert.current = desc;
      addNotification({
        type: 'weather',
        title: '⚠️ Meteo avverso',
        body: `${weather.icon} ${desc} — ${weather.temperature}°C a ${weather.city}`,
      });
    }
  }, [settings.weather, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    settings,
    updateSetting,
    notifications,
    unreadCount,
    addNotification,
    markRead,
    clearAll,
    checkTimers,
    checkCalendar,
    checkWeather,
  };
}
