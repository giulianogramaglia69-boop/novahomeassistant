import { useState, useEffect } from 'react';
import { ChatMessage, Note, TabId, WeatherData, Profile } from '@/lib/types';
import { SmartThingsDevice } from '@/hooks/useSmartThings';
import { RadioStation } from '@/lib/types';
import { Timer } from '@/hooks/useTimers';
import { CalendarEvent } from '@/hooks/useCalendar';
import { NewsItem } from '@/hooks/useNews';
import { AmbientSound } from '@/hooks/useAmbientSounds';
import GreetingClock from './GreetingClock';
import JarvisHUD from './JarvisHUD';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (msg: string) => void;
  smartDevices: SmartThingsDevice[];
  smartLoading: boolean;
  onSmartToggle: (id: string) => void;
  stations: RadioStation[];
  playing: string | null;
  onRadioToggle: (id: string) => void;
  notes: Note[];
  onAddNote: (text: string) => void;
  onRemoveNote: (id: string) => void;
  onNavigate: (tab: TabId) => void;
  timers: Timer[];
  onTimerNavigate: () => void;
  onTimerStart: (id: string) => void;
  onTimerPause: (id: string) => void;
  weather: WeatherData | null;
  upcomingEvents: CalendarEvent[];
  voiceState: string;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  newsItems: NewsItem[];
  newsLoading: boolean;
  profile: Profile;
  ambientSounds: AmbientSound[];
  ambientPlaying: string | null;
  onAmbientToggle: (id: string) => void;
  ttsSpeaking?: boolean;
  totalWattage?: number;
  devicesOn?: number;
}

const DashboardPanel = ({
  smartDevices, smartLoading, onSmartToggle,
  stations, playing, onRadioToggle,
  notes, onAddNote, onRemoveNote,
  onNavigate,
  timers, onTimerNavigate, onTimerStart, onTimerPause,
  weather,
  upcomingEvents,
  voiceState, onVoiceStart, onVoiceStop,
  newsItems, newsLoading,
  profile,
  ambientSounds, ambientPlaying, onAmbientToggle,
}: Props) => {
  const [noteInput, setNoteInput] = useState('');
  const [newsIndex, setNewsIndex] = useState(0);

  useEffect(() => {
    if (newsItems.length <= 1) return;
    const interval = setInterval(() => {
      setNewsIndex(prev => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [newsItems.length]);

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    onAddNote(noteInput.trim());
    setNoteInput('');
  };

  const activeTimer = timers.find(t => t.running) || timers[0];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 pt-3">
      <div className="grid grid-cols-2 gap-3">

        {/* Row 1: Greeting + Weather */}
        <BentoCard className="col-span-1 min-h-[120px]">
          <GreetingClock compact profile={profile} />
        </BentoCard>

        <BentoCard className="col-span-1 min-h-[120px]" onClick={() => onNavigate('meteo')}>
          {weather ? (
            <div className="flex flex-col items-center justify-center h-full gap-1">
              <span className="text-3xl">{weather.icon}</span>
              <span className="font-mono text-xl font-bold text-foreground">{weather.temperature}°</span>
              <span className="text-[0.6rem] text-muted-foreground text-center leading-tight">{weather.description}</span>
              <span className="text-[0.55rem] text-muted-foreground">{weather.city}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-[0.65rem] text-muted-foreground animate-pulse">Caricamento meteo...</span>
            </div>
          )}
        </BentoCard>

        {/* Row 2: SmartThings full width */}
        <BentoCard className="col-span-2 min-h-[100px]" headerTitle="Dispositivi" headerIcon="🏠" onMore={() => onNavigate('home')}>
          {smartLoading ? (
            <div className="text-[0.65rem] text-muted-foreground animate-pulse">Caricamento...</div>
          ) : smartDevices.length === 0 ? (
            <div className="text-[0.65rem] text-muted-foreground">Nessun dispositivo</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {smartDevices.slice(0, 6).map(d => (
                <button
                  key={d.deviceId}
                  onClick={() => onSmartToggle(d.deviceId)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-95 ${
                    d.on
                      ? 'border-primary/30 bg-primary/10'
                      : 'border-border bg-secondary/50'
                  }`}
                >
                  <span className="text-2xl">{d.icon}</span>
                  <span className={`text-[0.6rem] font-syne font-semibold text-center leading-tight ${d.on ? 'text-foreground' : 'text-muted-foreground'}`}>{d.label}</span>
                  <span className={`w-2 h-2 rounded-full ${d.on ? 'bg-accent' : 'bg-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
          )}
        </BentoCard>

        {/* Row 3: Events + Radio */}
        <BentoCard className="col-span-1 min-h-[120px]" headerTitle="Prossimi eventi" headerIcon="📅" onMore={() => onNavigate('calendar')}>
          {upcomingEvents.length === 0 ? (
            <p className="text-[0.6rem] text-muted-foreground">Nessun evento</p>
          ) : (
            <div className="flex flex-col gap-2">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="flex flex-col gap-0.5">
                  <span className="text-[0.68rem] font-semibold truncate">{ev.title}</span>
                  <span className="text-[0.55rem] text-muted-foreground font-mono">{ev.startTime}–{ev.endTime}</span>
                </div>
              ))}
            </div>
          )}
        </BentoCard>

        <BentoCard className="col-span-1 min-h-[120px]" headerTitle="Radio" headerIcon="📻" onMore={() => onNavigate('radio')}>
          <div className="flex flex-col gap-1.5">
            {stations.map(s => {
              const isPlaying = playing === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onRadioToggle(s.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[0.65rem] transition-all active:scale-[0.97] ${
                    isPlaying ? 'border-primary/30 bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="font-syne font-semibold text-[0.6rem] flex-1 text-left truncate">{s.name}</span>
                  {isPlaying ? (
                    <div className="flex items-end gap-[2px] h-3">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-[3px] bg-primary rounded-full" style={{
                          animation: `eq-bounce 0.${4 + i}s ease-in-out infinite alternate`,
                          height: `${6 + i * 3}px`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[0.55rem]">▶</span>
                  )}
                </button>
              );
            })}
          </div>
        </BentoCard>

        {/* Row 4: Mic + Notes */}
        <BentoCard className="col-span-1 min-h-[120px] flex items-center justify-center">
          <button
            onClick={voiceState === 'listening' ? onVoiceStop : onVoiceStart}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              voiceState === 'listening'
                ? 'bg-primary/20 border-2 border-primary'
                : 'bg-secondary border-2 border-border hover:border-primary/30'
            }`}
            style={voiceState === 'listening' ? { animation: 'mic-pulse 1.5s ease-in-out infinite' } : undefined}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={voiceState === 'listening' ? 'hsl(215, 100%, 61%)' : 'hsl(215, 30%, 54%)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </button>
          <span className={`text-[0.55rem] mt-2 font-syne font-semibold ${voiceState === 'listening' ? 'text-primary' : 'text-muted-foreground'}`}>
            {voiceState === 'listening' ? 'Ascolto...' : 'Voce'}
          </span>
        </BentoCard>

        <BentoCard className="col-span-1 min-h-[120px]" headerTitle="Note" headerIcon="📝" onMore={() => onNavigate('reminders')}>
          <div className="flex flex-col gap-1 mb-2">
            {notes.length === 0 ? (
              <p className="text-[0.6rem] text-muted-foreground">Nessuna nota</p>
            ) : notes.slice(0, 3).map(n => (
              <div key={n.id} className="flex items-center gap-1 text-[0.65rem]">
                <span className="flex-1 truncate">{n.text}</span>
                <button onClick={() => onRemoveNote(n.id)} className="text-muted-foreground hover:text-destructive text-[0.7rem] shrink-0">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              placeholder="Nota..."
              className="flex-1 bg-secondary border border-border rounded-lg px-2 py-1.5 text-foreground font-mono text-[0.65rem] outline-none focus:border-primary/40 placeholder:text-muted-foreground min-w-0"
            />
            <button onClick={handleAddNote} className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 text-primary-foreground text-sm active:scale-95">+</button>
          </div>
        </BentoCard>

        {/* Row 5: Timer + Ambient */}
        <BentoCard className="col-span-1 min-h-[120px]" headerTitle="Timer" headerIcon="⏱️" onMore={onTimerNavigate}>
          {activeTimer ? (() => {
            const m = Math.floor(activeTimer.remainingSeconds / 60);
            const s = activeTimer.remainingSeconds % 60;
            return (
              <div className="flex flex-col items-center gap-2">
                <span className="text-[0.65rem] font-syne font-semibold text-muted-foreground">{activeTimer.label}</span>
                <span className={`font-mono text-xl font-bold tabular-nums ${activeTimer.done ? 'text-accent' : activeTimer.running ? 'text-primary' : 'text-foreground'}`}>
                  {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
                </span>
                {!activeTimer.done && (
                  <button
                    onClick={() => activeTimer.running ? onTimerPause(activeTimer.id) : onTimerStart(activeTimer.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                      activeTimer.running ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'
                    }`}
                  >
                    {activeTimer.running ? '⏸' : '▶'}
                  </button>
                )}
                {activeTimer.done && <span className="text-accent text-[0.65rem] font-syne font-bold">Completato ✓</span>}
              </div>
            );
          })() : (
            <p className="text-[0.6rem] text-muted-foreground text-center">Nessun timer</p>
          )}
        </BentoCard>

        <BentoCard className="col-span-1 min-h-[120px]" headerTitle="Ambiente" headerIcon="🎵" onMore={() => onNavigate('ambiente')}>
          <div className="flex flex-col gap-1.5">
            {ambientSounds.map(s => {
              const isActive = ambientPlaying === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onAmbientToggle(s.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[0.65rem] transition-all active:scale-[0.97] ${
                    isActive ? 'border-primary/30 bg-primary/10 text-foreground' : 'border-border bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="font-syne font-semibold text-[0.6rem] flex-1 text-left">{s.name}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </button>
              );
            })}
          </div>
        </BentoCard>

        {/* Row 6: News full width */}
        {newsItems.length > 0 && (
          <BentoCard className="col-span-2 min-h-[90px] overflow-hidden" headerTitle="News" headerIcon="📰" onMore={() => onNavigate('news')}>
            <div className="relative">
              <div key={newsIndex} className="flex flex-col gap-1" style={{ animation: 'newsSlide 0.4s ease-out' }}>
                <div className="flex items-center gap-2">
                  {newsItems[newsIndex]?.source && (
                    <span className="text-[0.5rem] text-muted-foreground font-mono bg-secondary/80 px-1.5 py-0.5 rounded">{newsItems[newsIndex].source}</span>
                  )}
                  <span className="text-[0.45rem] text-muted-foreground font-mono">
                    {newsItems[newsIndex]?.pubDate && new Date(newsItems[newsIndex].pubDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[0.75rem] font-semibold leading-snug text-foreground line-clamp-2">
                  {newsItems[newsIndex]?.title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {newsItems.slice(0, Math.min(5, newsItems.length)).map((_, i) => (
                  <span key={i} className={`h-1 rounded-full transition-all duration-300 ${i === newsIndex % Math.min(5, newsItems.length) ? 'bg-primary w-4' : 'bg-muted-foreground/30 w-1.5'}`} />
                ))}
                <span className="ml-auto text-[0.45rem] text-muted-foreground font-mono">{(newsIndex % newsItems.length) + 1}/{newsItems.length}</span>
              </div>
            </div>
          </BentoCard>
        )}
        {newsLoading && newsItems.length === 0 && (
          <BentoCard className="col-span-2 min-h-[90px]">
            <div className="animate-pulse">
              <div className="h-2 bg-secondary rounded w-16 mb-2" />
              <div className="h-3 bg-secondary rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          </BentoCard>
        )}
      </div>
    </div>
  );
};

/* Reusable Bento Card */
interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  headerTitle?: string;
  headerIcon?: string;
  onMore?: () => void;
  onClick?: () => void;
}

const BentoCard = ({ children, className = '', headerTitle, headerIcon, onMore, onClick }: BentoCardProps) => (
  <div
    className={`bg-card/80 border border-border rounded-2xl p-3.5 flex flex-col ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
    onClick={onClick}
  >
    {headerTitle && (
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          {headerIcon && <span className="text-[0.8rem]">{headerIcon}</span>}
          <span className="font-syne text-[0.65rem] font-bold tracking-[0.12em] uppercase">{headerTitle}</span>
        </div>
        {onMore && (
          <button onClick={(e) => { e.stopPropagation(); onMore(); }} className="text-[0.55rem] text-primary font-syne font-semibold tracking-wider hover:underline">
            APRI →
          </button>
        )}
      </div>
    )}
    {children}
  </div>
);

export default DashboardPanel;
