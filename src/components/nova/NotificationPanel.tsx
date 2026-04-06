import { NovaNotification } from '@/hooks/useNotifications';

interface Props {
  notifications: NovaNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

const typeIcon: Record<string, string> = {
  calendar: '📅',
  timer: '⏰',
  weather: '⚠️',
};

const typeColor: Record<string, string> = {
  calendar: 'border-l-primary',
  timer: 'border-l-accent',
  weather: 'border-l-destructive',
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ora';
  if (mins < 60) return `${mins}m fa`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h fa`;
  return `${Math.floor(hrs / 24)}g fa`;
}

const NotificationPanel = ({ notifications, onMarkRead, onClearAll, onClose }: Props) => (
  <div className="fixed inset-0 z-[100] flex flex-col">
    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 mt-[60px] mx-3 max-h-[70vh] bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-syne text-[0.75rem] font-bold tracking-[0.1em] uppercase">🔔 Notifiche</span>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <button onClick={onClearAll} className="text-[0.6rem] text-muted-foreground hover:text-destructive font-syne font-semibold">
              Cancella tutto
            </button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <span className="text-3xl mb-2">🔕</span>
            <span className="text-[0.7rem] font-syne">Nessuna notifica</span>
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`w-full text-left flex gap-3 px-4 py-3 border-b border-border/50 border-l-[3px] transition-all hover:bg-secondary/50 ${
                typeColor[n.type] || 'border-l-border'
              } ${n.read ? 'opacity-50' : ''}`}
            >
              <span className="text-lg shrink-0 mt-0.5">{typeIcon[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.7rem] font-semibold truncate">{n.title}</span>
                  <span className="text-[0.5rem] text-muted-foreground font-mono shrink-0">{timeAgo(n.timestamp)}</span>
                </div>
                <p className="text-[0.6rem] text-muted-foreground leading-snug mt-0.5">{n.body}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </button>
          ))
        )}
      </div>
    </div>
  </div>
);

export default NotificationPanel;
