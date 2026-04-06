import { useState, useCallback, useEffect } from 'react';
import { Note } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

export function useNotes(profileName?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from DB
  useEffect(() => {
    if (!profileName) return;
    const load = async () => {
      const { data } = await supabase
        .from('nova_notes')
        .select('*')
        .eq('profile_name', profileName)
        .order('created_at', { ascending: false });
      if (data) {
        setNotes(data.map(r => ({ id: r.id, text: r.text, timestamp: r.timestamp })));
      }
      setLoaded(true);
    };
    load();
  }, [profileName]);

  const add = useCallback(async (text: string) => {
    const ts = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const id = crypto.randomUUID();
    const note: Note = { id, text, timestamp: ts };
    setNotes(prev => [note, ...prev]);
    if (profileName) {
      await supabase.from('nova_notes').insert({ id, profile_name: profileName, text, timestamp: ts });
    }
  }, [profileName]);

  const remove = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (profileName) {
      await supabase.from('nova_notes').delete().eq('id', id);
    }
  }, [profileName]);

  const edit = useCallback(async (id: string, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
    if (profileName) {
      await supabase.from('nova_notes').update({ text }).eq('id', id);
    }
  }, [profileName]);

  return { notes, add, remove, edit, loaded };
}
