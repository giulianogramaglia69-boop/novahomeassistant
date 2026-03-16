import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/lib/types';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (msg: string) => void;
  voiceState: 'idle' | 'listening' | 'processing';
  voiceSupported: boolean;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  isVoiceActive: boolean;
  voiceError?: string | null;
  wakeMode?: 'none' | 'chat' | 'command';
}

const ChatPanel = ({ messages, isLoading, onSend, voiceState, voiceSupported, onVoiceStart, onVoiceStop, isVoiceActive, voiceError, wakeMode }: Props) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  const getVoiceLabel = () => {
    if (voiceError) return `⚠️ ${voiceError}`;
    if (voiceState === 'listening' && wakeMode === 'chat') return '🎤 Modalità Chat AI...';
    if (voiceState === 'listening' && wakeMode === 'command') return '🏠 Modalità Comandi Casa...';
    if (voiceState === 'listening') return '🎤 Sto ascoltando...';
    if (voiceState === 'processing') return '🧠 Elaboro...';
    if (isVoiceActive) return '👂 "Ehi Nova" = Chat AI · "Ok Nova" = Comandi';
    return 'Microfono disattivato';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Voice status bar */}
      {voiceSupported && (
        <div className={`px-4 py-2 text-[0.65rem] font-mono flex items-center gap-2 border-b border-border transition-all ${
          voiceError ? 'bg-destructive/10 text-destructive' :
          voiceState === 'listening' && wakeMode === 'chat' ? 'bg-primary/10 text-primary' :
          voiceState === 'listening' && wakeMode === 'command' ? 'bg-accent/10 text-accent' :
          voiceState === 'processing' ? 'bg-primary/10 text-primary' :
          isVoiceActive ? 'bg-accent/10 text-accent' : 'bg-card text-muted-foreground'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            voiceError ? 'bg-destructive' :
            voiceState === 'listening' ? 'bg-destructive animate-pulse' :
            voiceState === 'processing' ? 'bg-primary animate-pulse' :
            isVoiceActive ? 'bg-accent animate-[blink_1.5s_infinite]' : 'bg-muted-foreground/40'
          }`} />
          <span className="flex-1 truncate">{getVoiceLabel()}</span>
          <button
            onClick={isVoiceActive ? onVoiceStop : onVoiceStart}
            className={`ml-auto px-2 py-0.5 rounded-full text-[0.6rem] border transition-all shrink-0 ${
              isVoiceActive ? 'border-destructive/40 text-destructive hover:bg-destructive/10' : 'border-accent/40 text-accent hover:bg-accent/10'
            }`}
          >
            {isVoiceActive ? 'Disattiva' : 'Attiva'}
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`} style={{ animation: 'msg-in 0.3s ease' }}>
            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 text-[0.75rem] ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-primary to-accent'
                : 'bg-secondary border border-border'
            }`}>
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="max-w-[78%]">
              <div className={`px-3.5 py-2.5 text-[0.8rem] leading-relaxed break-words ${
                msg.role === 'assistant'
                  ? 'bg-card border border-border rounded-[4px_14px_14px_14px]'
                  : 'bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/25 rounded-[14px_4px_14px_14px] text-right'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              <div className={`text-[0.55rem] text-muted-foreground mt-1 px-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2.5">
            <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 text-[0.75rem]">🤖</div>
            <div className="flex gap-[5px] px-3.5 py-3 bg-card border border-border rounded-[4px_14px_14px_14px] w-fit">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-[7px] h-[7px] rounded-full bg-primary"
                  style={{ animation: `typing 1.2s ease-in-out infinite ${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 px-4 border-t border-border bg-background/85 backdrop-blur-[20px] flex gap-2.5 items-end shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Scrivi un messaggio..."
          rows={1}
          className="flex-1 bg-card border border-border rounded-[14px] px-3.5 py-2.5 text-foreground font-mono text-[0.78rem] resize-none max-h-[120px] leading-relaxed outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-[0_0_15px_hsl(215_100%_61%/0.3)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
