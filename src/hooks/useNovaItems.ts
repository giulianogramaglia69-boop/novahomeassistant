import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type NovaItemKind = 'postit' | 'expense' | 'pantry' | 'parcel' | 'announce';

export interface NovaItem<T = Record<string, any>> {
  id: string;
  kind: NovaItemKind;
  data: T;
  created_by: string;
  created_at: string;
}

const db = supabase as any;

/** Shared family items (post-it, spese, dispensa, pacchi) with realtime sync. */
export function useNovaItems<T = Record<string, any>>(kind: NovaItemKind, profileName?: string) {
  const [items, setItems] = useState<NovaItem<T>[]>([]);

  const fetchAll = useCallback(async () => {
    const { data } = await db.from('nova_items').select('*').eq('kind', kind).order('created_at', { ascending: false }).limit(200);
    setItems((data as NovaItem<T>[]) || []);
  }, [kind]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Gli item vengono caricati anche prima del login (come anon, quindi
  // vuoti dopo la stretta RLS): ricarica quando la famiglia accede.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') fetchAll();
    });
    return () => subscription.unsubscribe();
  }, [fetchAll]);

  useEffect(() => {
    const ch = supabase.channel(`nova-items-${kind}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nova_items', filter: `kind=eq.${kind}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [kind, fetchAll]);

  const add = useCallback(async (data: T) => {
    await db.from('nova_items').insert({ kind, data, created_by: profileName || '' });
    fetchAll();
  }, [kind, profileName, fetchAll]);

  const update = useCallback(async (id: string, data: T) => {
    await db.from('nova_items').update({ data }).eq('id', id);
    fetchAll();
  }, [fetchAll]);

  const remove = useCallback(async (id: string) => {
    await db.from('nova_items').delete().eq('id', id);
    fetchAll();
  }, [fetchAll]);

  return { items, add, update, remove, refresh: fetchAll };
}

/** Listen for broadcast voice announcements and read them aloud. */
export function useAnnouncements(profileName: string | undefined, speak: (t: string) => void) {
  useEffect(() => {
    if (!profileName) return;
    const ch = supabase.channel('nova-announce-listen')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nova_items', filter: 'kind=eq.announce' }, (payload: any) => {
        const row = payload.new as NovaItem<{ text: string; to?: string }>;
        const to = row.data?.to || 'Tutti';
        if (to !== 'Tutti' && to !== profileName) return;
        const msg = `Annuncio da ${row.created_by}: ${row.data?.text || ''}`;
        try { speak(msg); } catch { /* noop */ }
        window.dispatchEvent(new CustomEvent('nova-announce', { detail: msg }));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profileName, speak]);
}
