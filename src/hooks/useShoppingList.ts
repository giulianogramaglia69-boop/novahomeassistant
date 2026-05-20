import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ShoppingItem {
  id: string; item: string; qty: string | null; category: string | null;
  done: boolean; added_by: string; created_at: string;
}

export function useShoppingList(profileName?: string) {
  const [items, setItems] = useState<ShoppingItem[]>([]);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase.from('nova_shopping').select('*').order('created_at', { ascending: false });
    setItems((data as ShoppingItem[]) || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const ch = supabase.channel('nova-shopping')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nova_shopping' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  const add = useCallback(async (item: string, qty?: string, category?: string) => {
    if (!item.trim() || !profileName) return;
    await supabase.from('nova_shopping').insert({
      item: item.trim(), qty: qty || null, category: category || null, added_by: profileName,
    });
  }, [profileName]);

  const toggle = useCallback(async (id: string, done: boolean) => {
    await supabase.from('nova_shopping').update({ done: !done }).eq('id', id);
  }, []);

  const remove = useCallback(async (id: string) => {
    await supabase.from('nova_shopping').delete().eq('id', id);
  }, []);

  const clearDone = useCallback(async () => {
    await supabase.from('nova_shopping').delete().eq('done', true);
  }, []);

  return { items, add, toggle, remove, clearDone };
}
