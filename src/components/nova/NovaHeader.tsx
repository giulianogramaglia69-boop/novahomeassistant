import { useState } from 'react';
import { Profile } from '@/lib/types';
import { NovaNotification } from '@/hooks/useNotifications';
import { VoiceState } from '@/hooks/useVoiceWake';
import NotificationPanel from './NotificationPanel';

interface Props {
  ttsEnabled: boolean;
  ttsSpeaking: boolean;
  onTtsToggle: () => void;
  onTtsStop: () => void;
  profile: Profile;
  notifications: NovaNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onClearNotifications: () => void;
  voiceState?: VoiceState;
  voiceAlwaysOn?: boolean;
  onMirror?: () => void;
  onDesktop?: () => void;
  nightModeEnabled: boolean;
  onNightModeToggle: () => void;
}

const VOICE_LABEL: Record<VoiceState, { text: string; cls: string }> = {
  idle:       { text: 'IDLE',   cls: 'border-border bg-secondary text-muted-foreground' },
  wake:       { text: 'WAKE',   cls: 'border-accent/40 bg-accent/15 text-accent' },
  listening:  { text: 'LISTEN', cls: 'border-primary/40 bg-primary/15 text-primary' },
  processing: { text: 'THINK',  cls: 'border-accent/40 bg-accent/15 text-accent animate-pulse' },
  speaking:   { text: 'SPEAK',  cls: 'border-primary/40 bg-primary/15 text-primary' },
  error:      { text: 'ERR',    cls: 'border-destructive/40 bg-destructive/15 text-destructive' },
};

const NovaHeader = ({ ttsEnabled, ttsSpeaking, onTtsToggle, onTtsStop, profile, notifications, unreadCount, onMarkRead, onClearNotifications, voiceState = 'idle', voiceAlwaysOn, onMirror, onDesktop, nightModeEnabled, onNightModeToggle }: Props) => {
  const toggleFs = () => {
    const d: any = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen)?.call(d);
    else { const el: any = document.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); }
  };
  const [showNotif, setShowNotif] = useState(false);
  const v = VOICE_LABEL[voiceState];

  return (
    <>
      <header className="relative z-10 flex items-center justify-between px-5 pt-[18px] pb-[14px] border-b border-border bg-background/80 backdrop-blur-[20px] shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0"
            style={{ animation: 'pulse-orb 3s ease-in-out infinite' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="font-syne font-extrabold text-[1.2rem] tracking-[0.12em] bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
              NOVA
            </div>
            <div className="text-[0.58rem] text-muted-foreground tracking-[0.1em] -mt-1">HOME ASSISTANT</div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[0.6rem] text-muted-foreground font-mono mr-1">{profile.emoji} {profile.name}</span>

          {/* Voice state badge */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[0.55rem] font-mono font-bold tracking-[0.12em] ${v.cls}`}
            title={`Voce: ${v.text}${voiceAlwaysOn ? ' · sempre attiva' : ''}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ animation: voiceState !== 'idle' ? 'blink 1.2s infinite' : undefined }} />
            {v.text}
          </div>
          
          <button onClick={toggleFs} title="Schermo intero" className="w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] border border-border bg-secondary transition-all active:scale-90 hover:border-primary/30">⛶</button>
          {onDesktop && <button onClick={onDesktop} title="Desktop Mode" className="w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] border border-border bg-secondary transition-all active:scale-90 hover:border-primary/30">🖥️</button>}
          {onMirror && <button onClick={onMirror} title="Modalità specchio" className="w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] border border-border bg-secondary transition-all active:scale-90 hover:border-primary/30">🪞</button>}
          <button
            onClick={onNightModeToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] border transition-all active:scale-90 hover:border-primary/30 ${
              nightModeEnabled
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'border-border bg-secondary'
            }`}
            title={nightModeEnabled ? 'Esci dalla modalità notte' : 'Modalità notte'}
          >
            🌙
          </button>
          {/* Notification bell */}
          <button
            onClick={() => setShowNotif(prev => !prev)}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] border border-border bg-secondary transition-all active:scale-90 hover:border-primary/30"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[0.5rem] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {ttsSpeaking && (
            <button
              onClick={onTtsStop}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] bg-destructive/15 border border-destructive/30 text-destructive animate-pulse transition-all active:scale-90"
              title="Ferma lettura"
            >
              ⏹
            </button>
          )}
          <button
            onClick={onTtsToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.85rem] border transition-all active:scale-90 ${
              ttsEnabled
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-secondary border-border text-muted-foreground'
            }`}
            title={ttsEnabled ? 'Disattiva voce' : 'Attiva voce'}
          >
            🔊
          </button>
          <div className="flex items-center gap-[5px] px-2.5 py-1 rounded-full text-[0.6rem] tracking-[0.08em] border border-accent/30 bg-accent/5 text-accent cursor-pointer">
            <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ animation: 'blink 1.5s infinite' }} />
            AI ON
          </div>
        </div>
      </header>

      {showNotif && (
        <NotificationPanel
          notifications={notifications}
          onMarkRead={onMarkRead}
          onClearAll={onClearNotifications}
          onClose={() => setShowNotif(false)}
        />
      )}
    </>
  );
};

export default NovaHeader;
