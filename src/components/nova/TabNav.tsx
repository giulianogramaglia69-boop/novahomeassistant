import { TabId } from '@/lib/types';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '🏡', label: 'HOME' },
  { id: 'chat', icon: '💬', label: 'CHAT' },
  { id: 'home', icon: '🏠', label: 'CASA' },
  { id: 'messages', icon: '✉️', label: 'MSG' },
  { id: 'shopping', icon: '🛒', label: 'SPESA' },
  { id: 'radio', icon: '📻', label: 'RADIO' },
  { id: 'meteo', icon: '🌤', label: 'METEO' },
  { id: 'reminders', icon: '📝', label: 'NOTE' },
  { id: 'timer', icon: '⏱️', label: 'TIMER' },
  { id: 'calendar', icon: '📅', label: 'CALENDAR' },
  { id: 'ambiente', icon: '🎵', label: 'AMBIENTE' },
  { id: 'news', icon: '📰', label: 'NEWS' },
  { id: 'traffic', icon: '🚗', label: 'TRAFFIC' },
  { id: 'web', icon: '🌐', label: 'WEB' },
  { id: 'settings', icon: '⚙️', label: '' },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TabNav = ({ active, onChange }: Props) => (
  <div className="relative z-10 flex border-b border-border bg-background/60 backdrop-blur-[10px] shrink-0 overflow-x-auto scrollbar-none px-4">
    {TABS.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`shrink-0 px-3.5 py-3 font-syne text-[0.68rem] font-semibold tracking-[0.1em] border-b-2 transition-all flex items-center gap-1.5 ${
          active === tab.id
            ? 'text-primary border-primary'
            : 'text-muted-foreground border-transparent hover:text-foreground'
        }`}
      >
        <span>{tab.icon}</span>
        {tab.label}
      </button>
    ))}
  </div>
);

export default TabNav;
