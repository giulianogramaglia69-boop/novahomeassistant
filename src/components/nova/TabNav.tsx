import { TabId } from '@/lib/types';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏡', label: 'HOME' },
  { id: 'chat', icon: '💬', label: 'CHAT' },
  { id: 'home', icon: '🏠', label: 'CASA' },
  { id: 'messages', icon: '✉️', label: 'MSG' },
  { id: 'shopping', icon: '🛒', label: 'SPESA' },
  { id: 'family', icon: '👨‍👩‍👧', label: 'FAMIGLIA' },
  { id: 'radio', icon: '📻', label: 'RADIO' },
  { id: 'meteo', icon: '🌤', label: 'METEO' },
  { id: 'reminders', icon: '📝', label: 'NOTE' },
  { id: 'timer', icon: '⏱️', label: 'TIMER' },
  { id: 'calendar', icon: '📅', label: 'CALENDAR' },
  { id: 'ambiente', icon: '🎵', label: 'AMBIENTE' },
  { id: 'news', icon: '📰', label: 'NEWS' },
  { id: 'traffic', icon: '🚗', label: 'TRAFFIC' },
  { id: 'web', icon: '🌐', label: 'WEB' },
  { id: 'spotify', icon: '🎧', label: 'SPOTIFY' },
  { id: 'settings', icon: '⚙️', label: '' },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TabNav = ({ active, onChange }: Props) => (
  <div className="relative z-10 flex border-b border-primary/20 bg-background/70 backdrop-blur-[14px] shrink-0 overflow-x-auto scrollbar-none px-3">
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none" />
    {TABS.map(tab => {
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative shrink-0 px-3.5 py-3 font-syne text-[0.68rem] font-semibold tracking-[0.14em] transition-all flex items-center gap-1.5 ${
            isActive
              ? 'text-primary text-glow-soft'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className={isActive ? 'drop-shadow-[0_0_6px_hsl(var(--primary))]' : ''}>{tab.icon}</span>
          {tab.label}
          {isActive && (
            <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-primary via-accent to-primary shadow-[0_0_12px_hsl(var(--primary))]" />
          )}
        </button>
      );
    })}
  </div>
);

export default TabNav;
