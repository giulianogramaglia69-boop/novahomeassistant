import { useState, useCallback } from 'react';
import { ChatMessage, WeatherData, Reminder, Note } from '@/lib/types';
import { Timer } from '@/hooks/useTimers';
import { supabase } from '@/integrations/supabase/client';

export interface ChatContext {
  weather: WeatherData | null;
  reminders: Reminder[];
  notes?: Note[];
  timers?: Timer[];
}

export interface ChatToolAction {
  type: 'add_reminder' | 'complete_reminder' | 'remove_reminder' | 'refresh_devices';
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
          },
        },
      });

      if (error) throw new Error(error.message);

      const content = data?.content || '⚠️ Nessuna risposta ricevuta.';
      const toolActions: string[] = data?.tool_actions || [];

      // Process tool actions
      for (const ta of toolActions) {
        if (ta.startsWith('TOOL_ACTION:ADD_REMINDER:')) {
          actions.push({ type: 'add_reminder', payload: ta.replace('TOOL_ACTION:ADD_REMINDER:', '') });
        } else if (ta.startsWith('TOOL_ACTION:COMPLETE_REMINDER:')) {
          actions.push({ type: 'complete_reminder', payload: ta.replace('TOOL_ACTION:COMPLETE_REMINDER:', '') });
        } else if (ta.startsWith('TOOL_ACTION:REMOVE_REMINDER:')) {
          actions.push({ type: 'remove_reminder', payload: ta.replace('TOOL_ACTION:REMOVE_REMINDER:', '') });
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
