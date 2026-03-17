import { useState } from 'react';
import { ChatMessage, Note, TabId } from '@/lib/types';
import GreetingClock from './GreetingClock';
import { SmartThingsDevice } from '@/hooks/useSmartThings';
import { RadioStation } from '@/lib/types';

interface Props {
  // Chat
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (msg: string) => void;
  // Devices
  smartDevices: SmartThingsDevice[];
  smartLoading: boolean;
  onSmartToggle: (id: string) => void;
  // Radio
  stations: RadioStation[];
  playing: string | null;
  onRadioToggle: (id: string) => void;
  // Notes
  notes: Note[];
  onAddNote: (text: string) => void;
  onRemoveNote: (id: string) => void;
  // Navigation
  onNavigate: (tab: TabId) => void;
}

const DashboardPanel = ({
  messages, isLoading, onSend,
  smartDevices, smartLoading, onSmartToggle,
  stations, playing, onRadioToggle,
  notes, onAddNote, onRemoveNote,
  onNavigate,
}: Props) => {
  const [chatInput, setChatInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const lastMessages = messages.slice(-3);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    onSend(chatInput.trim());
    setChatInput('');
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    onAddNote(noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
      {/* Chat AI section */}
      <DashboardSection title="Chat AI" icon="💬" onMore={() => onNavigate('chat')}>
        <div className="flex flex-col gap-2 mb-2">
          {lastMessages.map(msg => (
            <div key={msg.id} className={`text-[0.72rem] leading-snug px-2.5 py-1.5 rounded-[10px] ${
              msg.role === 'assistant'
                ? 'bg-secondary text-foreground'
                : 'bg-primary/15 text-foreground ml-auto'
            } max-w-[90%] truncate`}>
              {msg.content.slice(0, 80)}{msg.content.length > 80 ? '…' : ''}
            </div>
          ))}
          {isLoading && <div className="text-[0.65rem] text-muted-foreground animate-pulse">Elaboro...</div>}
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            placeholder="Chiedi a Nova..."
            className="flex-1 bg-secondary border border-border rounded-[10px] px-3 py-2 text-foreground font-mono text-[0.72rem] outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSendChat}
            disabled={!chatInput.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </DashboardSection>

      {/* SmartThings section */}
      <DashboardSection title="Dispositivi" icon="🏠" onMore={() => onNavigate('home')}>
        {smartLoading ? (
          <div className="text-[0.65rem] text-muted-foreground animate-pulse">Caricamento...</div>
        ) : smartDevices.length === 0 ? (
          <div className="text-[0.65rem] text-muted-foreground">Nessun dispositivo</div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {smartDevices.map(d => (
              <button
                key={d.deviceId}
                onClick={() => onSmartToggle(d.deviceId)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] border text-[0.7rem] transition-all ${
                  d.on ? 'border-primary/35 bg-primary/10 text-foreground' : 'border-border bg-secondary text-muted-foreground'
                }`}
              >
                <span>{d.icon}</span>
                <span className="font-syne font-semibold">{d.label}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${d.on ? 'bg-accent' : 'bg-muted-foreground/40'}`} />
              </button>
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Radio section */}
      <DashboardSection title="Radio" icon="📻" onMore={() => onNavigate('radio')}>
        <div className="flex gap-2 flex-wrap">
          {stations.map(s => {
            const isPlaying = playing === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onRadioToggle(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] border text-[0.7rem] transition-all ${
                  isPlaying ? 'border-primary/35 bg-primary/10 text-foreground' : 'border-border bg-secondary text-muted-foreground hover:border-primary/20'
                }`}
              >
                <span>{s.icon}</span>
                <span className="font-syne font-semibold text-[0.65rem]">{s.name}</span>
                {isPlaying ? (
                  <span className="text-[0.6rem] text-primary">●</span>
                ) : (
                  <span className="text-[0.55rem]">▶</span>
                )}
              </button>
            );
          })}
        </div>
      </DashboardSection>

      {/* Notes section */}
      <DashboardSection title="Note" icon="📝" onMore={() => onNavigate('reminders')}>
        <div className="flex flex-col gap-1.5 mb-2">
          {notes.length === 0 ? (
            <div className="text-[0.65rem] text-muted-foreground">Nessuna nota</div>
          ) : notes.slice(0, 3).map(n => (
            <div key={n.id} className="flex items-center gap-2 text-[0.72rem]">
              <span className="flex-1 truncate">{n.text}</span>
              <span className="text-[0.55rem] text-muted-foreground shrink-0">{n.timestamp}</span>
              <button onClick={() => onRemoveNote(n.id)} className="text-muted-foreground hover:text-destructive text-[0.75rem] transition-colors">×</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNote()}
            placeholder="Nota veloce..."
            className="flex-1 bg-secondary border border-border rounded-[10px] px-3 py-2 text-foreground font-mono text-[0.72rem] outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground"
          />
          <button
            onClick={handleAddNote}
            className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 text-primary-foreground text-[1rem] transition-transform active:scale-95"
          >
            +
          </button>
        </div>
      </DashboardSection>
    </div>
  );
};

const DashboardSection = ({ title, icon, onMore, children }: { title: string; icon: string; onMore: () => void; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-[16px] p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-[0.9rem]">{icon}</span>
        <span className="font-syne text-[0.72rem] font-bold tracking-[0.15em] uppercase">{title}</span>
      </div>
      <button onClick={onMore} className="text-[0.6rem] text-primary font-syne font-semibold tracking-[0.1em] hover:underline">
        APRI →
      </button>
    </div>
    {children}
  </div>
);

export default DashboardPanel;
