import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/lib/types';
import { VoiceState } from '@/hooks/useVoiceWake';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (msg: string) => void;
  voiceState: VoiceState;
  voiceStatusText: string;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
}

const ChatPanel = ({ messages, isLoading, onSend, voiceState, voiceStatusText, onVoiceStart, onVoiceStop }: Props) => {
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

  const isActive = voiceState === 'listening' || voiceState === 'processing';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <span className="chip-hud">CHAT · LIVE</span>
        <span className="font-syne text-[0.55rem] tracking-[0.22em] uppercase text-muted-foreground">{messages.length} MSG</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pt-2 flex flex-col gap-3.5 scrollbar-thin">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`} style={{ animation: 'msg-in 0.3s ease' }}>
            <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 text-[0.75rem] ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-primary to-accent glow-primary'
                : 'bg-secondary border border-primary/25'
            }`}>
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="max-w-[78%]">
              <div className={`px-3.5 py-2.5 text-[0.8rem] leading-relaxed break-words backdrop-blur-md ${
                msg.role === 'assistant'
                  ? 'hud-card rounded-[4px_16px_16px_16px]'
                  : 'bg-gradient-to-br from-primary/25 to-accent/15 border border-primary/30 rounded-[16px_4px_16px_16px] text-right shadow-[0_0_18px_-6px_hsl(var(--primary)/0.6)]'
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
            <div className="w-[32px] h-[32px] rounded-full bg-gradient-to-br from-primary to-accent glow-primary flex items-center justify-center shrink-0 text-[0.75rem]">🤖</div>
            <div className="flex gap-[5px] px-3.5 py-3 hud-card rounded-[4px_16px_16px_16px] w-fit">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-[7px] h-[7px] rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                  style={{ animation: `typing 1.2s ease-in-out infinite ${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative p-3 px-4 border-t border-primary/20 bg-background/70 backdrop-blur-[20px] flex gap-2.5 items-end shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        {/* Mic button */}
        <button
          onClick={isActive ? onVoiceStop : onVoiceStart}
          className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 ${
            isActive
              ? 'bg-destructive/20 border-2 border-destructive text-destructive animate-pulse'
              : 'hud-card text-muted-foreground hover:text-primary'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Scrivi un messaggio..."
          rows={1}
          className="flex-1 hud-card rounded-[16px] px-3.5 py-2.5 text-foreground font-mono text-[0.78rem] resize-none max-h-[120px] leading-relaxed outline-none transition-all focus:shadow-[0_0_24px_-6px_hsl(var(--primary)/0.6)] placeholder:text-muted-foreground"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 glow-primary transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:saturate-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
