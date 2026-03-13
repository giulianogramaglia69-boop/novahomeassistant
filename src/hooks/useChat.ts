import { useState, useCallback } from 'react';
import { ChatMessage } from '@/lib/types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nova-chat`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Ciao! Sono NOVA, il tuo assistente di casa. Posso aiutarti con domande generali, controllare i dispositivi smart home, darti info sul meteo o gestire i tuoi promemoria.\n\nCome posso aiutarti oggi?',
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';
    const assistantId = crypto.randomUUID();
    const timestamp = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { id: assistantId, role: 'assistant', content: assistantSoFar, timestamp }];
      });
    };

    try {
      const apiMessages = [...messages, userMsg]
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Errore: ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('Chat error:', e);
      upsert('\n\n⚠️ Errore nella comunicazione con l\'AI. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
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
