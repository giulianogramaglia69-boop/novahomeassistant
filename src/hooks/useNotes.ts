import { useState, useCallback, useEffect } from 'react';
import { Note } from '@/lib/types';

const STORAGE_KEY = 'nova_notes';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const add = useCallback((text: string) => {
    setNotes(prev => [{
      id: crypto.randomUUID(),
      text,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    }, ...prev]);
  }, []);

  const remove = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const edit = useCallback((id: string, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  }, []);

  return { notes, add, remove, edit };
}
