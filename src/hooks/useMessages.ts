import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NovaMessage {
  id: string;
  from_profile: string;
  to_profile: string;
  content: string;
  read: boolean;
  created_at: string;
}

export function useMessages(profileName?: string) {
  const [messages, setMessages] = useState<NovaMessage[]>([]);

  const fetchAll = useCallback(async () => {
    if (!profileName) return;
    const { data } = await supabase.from('nova_messages')
      .select('*')
      .or(`from_profile.eq.${profileName},to_profile.eq.${profileName}`)
      .order('created_at', { ascending: true });
    setMessages((data as NovaMessage[]) || []);
  }, [profileName]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!profileName) return;
    const ch = supabase
      .channel('nova-messages-' + profileName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nova_messages' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profileName, fetchAll]);

  const send = useCallback(async (to: string, content: string) => {
    if (!profileName || !content.trim()) return;
    await supabase.from('nova_messages').insert({
      from_profile: profileName, to_profile: to, content: content.trim(),
    });
  }, [profileName]);

  const markRead = useCallback(async (peer: string) => {
    if (!profileName) return;
    await supabase.from('nova_messages').update({ read: true })
      .eq('to_profile', profileName).eq('from_profile', peer).eq('read', false);
  }, [profileName]);

  const unreadCount = messages.filter(m => m.to_profile === profileName && !m.read).length;

  return { messages, send, markRead, unreadCount, refresh: fetchAll };
}
