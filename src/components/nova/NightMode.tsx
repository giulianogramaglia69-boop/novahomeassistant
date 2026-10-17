import { useEffect, useState } from 'react';
import { WeatherData } from '@/lib/types';
import { NovaNotification } from '@/hooks/useNotifications';

interface Props {
  weather: WeatherData | null;
  notifications: NovaNotification[];
  unreadCount: number;
  greeting: string;
  onClose: () => void;
}

const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const months = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

const NightMode = ({ weather, notifications, unreadCount, greeting, onClose }: Props) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let timeoutId: number;
    const tick = () => {
      setNow(new Date());
      const delay = 1000 - (Date.now() % 1000);
      timeoutId = window.setTimeout(tick, delay);
    };
    tick();
    const forceUpdate = () => {
      setNow(new Date());
      window.clearTimeout(timeoutId);
      tick();
    };
    document.addEventListener('visibilitychange', forceUpdate);
    window.addEventListener('focus', forceUpdate);
    window.addEventListener('pageshow', forceUpdate);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', forceUpdate);
      window.removeEventListener('focus', forceUpdate);
      window.removeEventListener('pageshow', forceUpdate);
    };
  }, []);

  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const dateStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
  const recent = notifications.filter(n => !n.read).slice(0, 4);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[95] flex flex-col items-center justify-center select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, hsl(var(--background)) 0%, hsl(var(--background) / 0.96) 55%, hsl(var(--background)) 100%)',
        animation: 'screensaverFadeIn 0.6s ease-out',
      }}
    >
      <div className="absolute top-4 right-4 chip-hud">MODALITÀ NOTTE</div>

      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <span className="font-syne text-[0.65rem] tracking-[0.3em] uppercase text-muted-foreground">{greeting}</span>

        <div
          className="font-syne font-bold text-foreground tabular-nums tracking-tight"
          style={{ fontSize: 'clamp(5rem, 20vw, 12rem)', lineHeight: 1, textShadow: '0 8px 40px hsl(var(--primary) / 0.35)' }}
        >
          {hh}<span className="text-primary animate-pulse">:</span>{mm}
        </div>

        <div className="font-syne text-base text-muted-foreground capitalize tracking-wide">{dateStr}</div>

        {weather && (
          <div className="flex items-center gap-3 bg-card/30 border border-border/40 rounded-2xl px-5 py-2.5">
            <span className="text-2xl">{weather.icon}</span>
            <span className="font-mono text-xl font-bold text-foreground">{weather.temperature}°</span>
            <span className="text-[0.6rem] text-muted-foreground">{weather.description}</span>
          </div>
        )}

        {recent.length > 0 ? (
          <div className="flex flex-col gap-1.5 w-full max-w-sm mt-2">
            <span className="font-syne text-[0.55rem] font-bold tracking-[0.2em] uppercase text-muted-foreground">Notifiche · {unreadCount} nuove</span>
            {recent.map(n => (
              <div key={n.id} className="flex items-center gap-3 bg-card/25 border border-border/40 rounded-xl px-4 py-2 text-left">
                <span className="text-[0.68rem] font-semibold text-foreground truncate">{n.title}</span>
                <span className="text-[0.6rem] text-muted-foreground truncate flex-1">{n.body}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[0.6rem] text-muted-foreground/70 font-mono tracking-widest uppercase">Nessuna nuova notifica</span>
        )}

        <span className="text-[0.55rem] text-muted-foreground/50 font-syne tracking-[0.3em] uppercase mt-4 animate-pulse">
          Tocca per uscire
        </span>
      </div>
    </div>
  );
};

export default NightMode;
