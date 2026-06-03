import { useState, useCallback } from 'react';
import { ChatMessage, WeatherData, Reminder, Note } from '@/lib/types';
import { Timer } from '@/hooks/useTimers';
import { supabase } from '@/integrations/supabase/client';

export interface ChatContext {
  weather: WeatherData | null;
  reminders: Reminder[];
  notes?: Note[];
  timers?: Timer[];
  smartDevices?: { deviceId: string; label: string; type: string; on: boolean }[];
  calendarEvents?: any[];
  ambientPlaying?: string | null;
  profileName?: string;
  notifications?: any[];
  memory?: { key: string; value: string }[];
  shopping?: { item: string; qty: string | null; category: string | null; done: boolean }[];
  unreadMessages?: number;
  ambient?: { partOfDay: string; isWeekend: boolean; presence: boolean; visionEnabled: boolean };
  habits?: { top: { key: string; total: number }[]; nowHourHabit: string | null };
}


export interface ChatToolAction {
  type: 'add_reminder' | 'complete_reminder' | 'remove_reminder' | 'refresh_devices'
    | 'navigate' | 'web_search' | 'start_timer' | 'play_radio' | 'play_ambient'
    | 'add_event' | 'add_note' | 'remember' | 'add_shopping'
    | 'run_sequence' | 'delay' | 'scene' | 'smart_toggle' | 'speak'
    | 'open_floating';
  payload?: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ciao! Sono NOVA, il tuo assistente di casa. Posso controllare la TV e la lavatrice, darti info sul meteo, gestire i tuoi promemoria e rispondere a qualsiasi domanda.\n\nDì **"Ehi Nova"** per attivarmi con la voce! 🎤',
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input: string, context?: ChatContext): Promise<ChatToolAction[]> => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const actions: ChatToolAction[] = [];

    try {
      const apiMessages = [...messages, userMsg]
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('nova-chat', {
        body: {
          messages: apiMessages,
          context: {
            weather: context?.weather || null,
            reminders: context?.reminders || [],
            notes: context?.notes || [],
            timers: context?.timers || [],
            smartDevices: context?.smartDevices || [],
            calendarEvents: context?.calendarEvents || [],
            ambientPlaying: context?.ambientPlaying || null,
            profileName: context?.profileName || 'Giuliano',
            notifications: context?.notifications || [],
            memory: context?.memory || [],
            shopping: context?.shopping || [],
            unreadMessages: context?.unreadMessages || 0,
            ambient: context?.ambient || null,
            habits: context?.habits || null,
          },
        },
      });

      if (error) throw new Error(error.message);

      const content = data?.content || '⚠️ Nessuna risposta ricevuta.';
      const toolActions: string[] = data?.tool_actions || [];

      // Process tool actions
      for (const ta of toolActions) {
        const m = ta.match(/^TOOL_ACTION:([A-Z_]+):(.*)$/s);
        if (!m) continue;
        const [, kind, payload] = m;
        switch (kind) {
          case 'ADD_REMINDER': actions.push({ type: 'add_reminder', payload }); break;
          case 'COMPLETE_REMINDER': actions.push({ type: 'complete_reminder', payload }); break;
          case 'REMOVE_REMINDER': actions.push({ type: 'remove_reminder', payload }); break;
          case 'NAVIGATE': actions.push({ type: 'navigate', payload }); break;
          case 'WEB_SEARCH': actions.push({ type: 'web_search', payload }); break;
          case 'START_TIMER': actions.push({ type: 'start_timer', payload }); break;
          case 'PLAY_RADIO': actions.push({ type: 'play_radio', payload }); break;
          case 'PLAY_AMBIENT': actions.push({ type: 'play_ambient', payload }); break;
          case 'ADD_EVENT': actions.push({ type: 'add_event', payload }); break;
          case 'ADD_NOTE': actions.push({ type: 'add_note', payload }); break;
          case 'REMEMBER': actions.push({ type: 'remember', payload }); break;
          case 'ADD_SHOPPING': actions.push({ type: 'add_shopping', payload }); break;
          case 'RUN_SEQUENCE': actions.push({ type: 'run_sequence', payload }); break;
          case 'DELAY': actions.push({ type: 'delay', payload }); break;
          case 'OPEN_FLOATING': actions.push({ type: 'open_floating', payload }); break;
        }
      }

      // If the AI controlled a device, also refresh
      if (content.toLowerCase().includes('accesa') || content.toLowerCase().includes('spenta') || 
          content.toLowerCase().includes('canale') || content.toLowerCase().includes('volume')) {
        actions.push({ type: 'refresh_devices' });
      }

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content,
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Chat error:', e);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '⚠️ Errore nella comunicazione con l\'AI. Riprova più tardi.',
        timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }

    return actions;
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Chat svuotata. Come posso aiutarti?',
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    }]);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
