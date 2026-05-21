import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MacroStep {
  type: 'navigate' | 'scene' | 'smart_toggle' | 'radio' | 'ambient' | 'timer' | 'speak' | 'delay';
  payload?: any;
}

export interface Macro {
  id: string;
  profile_name: string;
  name: string;
  icon: string | null;
  steps: MacroStep[];
  created_at: string;
}

export function useMacros(profileName?: string) {
  const [macros, setMacros] = useState<Macro[]>([]);

  const fetchAll = useCallback(async () => {
    if (!profileName) return;
    const { data } = await supabase.from('nova_macros').select('*').eq('profile_name', profileName).order('created_at');
    setMacros((data as any) || []);
  }, [profileName]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const add = useCallback(async (name: string, steps: MacroStep[], icon?: string) => {
    if (!profileName) return;
    await supabase.from('nova_macros').insert({ profile_name: profileName, name, icon: icon || null, steps: steps as any });
    fetchAll();
  }, [profileName, fetchAll]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('nova_macros').delete().eq('id', id);
    fetchAll();
  }, [fetchAll]);

  return { macros, add, remove, refresh: fetchAll };
}
