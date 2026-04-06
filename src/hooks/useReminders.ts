import { useState, useCallback, useEffect } from 'react';
import { Reminder } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

export function useReminders(profileName?: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (!profileName) return;
    const load = async () => {
      const { data } = await supabase
        .from('nova_reminders')
        .select('*')
        .eq('profile_name', profileName)
        .order('created_at', { ascending: false });
      if (data) {
        setReminders(data.map(r => ({
          id: r.id, text: r.text, done: r.done,
          createdAt: new Date(r.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        })));
      }
    };
    load();
  }, [profileName]);

  const add = useCallback(async (text: string) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    setReminders(prev => [{ id, text, done: false, createdAt }, ...prev]);
    if (profileName) {
      await supabase.from('nova_reminders').insert({ id, profile_name: profileName, text, done: false });
    }
  }, [profileName]);

  const toggleDone = useCallback(async (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done } : r));
    if (profileName) {
      const r = reminders.find(rem => rem.id === id);
      if (r) await supabase.from('nova_reminders').update({ done: !r.done }).eq('id', id);
    }
  }, [profileName, reminders]);

  const remove = useCallback(async (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    if (profileName) {
      await supabase.from('nova_reminders').delete().eq('id', id);
    }
  }, [profileName]);

  return { reminders, add, toggleDone, remove };
}
