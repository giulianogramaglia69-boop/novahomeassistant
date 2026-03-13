import { useState, useCallback, useEffect } from 'react';
import { Reminder } from '@/lib/types';

const STORAGE_KEY = 'nova-reminders';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  }, [reminders]);

  const add = useCallback((text: string) => {
    setReminders(prev => [{
      id: crypto.randomUUID(),
      text,
      done: false,
      createdAt: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    }, ...prev]);
  }, []);

  const toggleDone = useCallback((id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
  }, []);

  const remove = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  return { reminders, add, toggleDone, remove };
}
