import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MemoryItem { id: string; key: string; value: string; created_at: string; }

export function useAIMemory(profileName?: string) {
  const [items, setItems] = useState<MemoryItem[]>([]);

  const fetchAll = useCallback(async () => {
    if (!profileName) return;
    const { data } = await supabase.from('nova_ai_memory')
      .select('id,key,value,created_at')
      .eq('profile_name', profileName)
      .order('created_at', { ascending: false });
    setItems((data as MemoryItem[]) || []);
  }, [profileName]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const remember = useCallback(async (key: string, value: string) => {
    if (!profileName) return;
    await supabase.from('nova_ai_memory').upsert(
      { profile_name: profileName, key, value },
      { onConflict: 'profile_name,key' }
    );
    fetchAll();
  }, [profileName, fetchAll]);

  const forget = useCallback(async (id: string) => {
    await supabase.from('nova_ai_memory').delete().eq('id', id);
    fetchAll();
  }, [fetchAll]);

  return { items, remember, forget, refresh: fetchAll };
}
