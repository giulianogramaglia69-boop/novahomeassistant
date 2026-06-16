import { useEffect, useState } from 'react';
import { WeatherData } from '@/lib/types';
import { CalendarEvent } from '@/hooks/useCalendar';

interface Props {
  weather: WeatherData | null;
  events: CalendarEvent[];
  onDismiss: () => void;
}

const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const months = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

const Screensaver = ({ weather, events, onDismiss }: Props) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let timeoutId: number;
    const tick = () => {
      setNow(new Date());
      // Self-correcting: schedule next tick aligned to the next second boundary
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
  const dateStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const upcoming = events
    .filter(ev => {
      const evDate = new Date(`${ev.date}T${ev.startTime}`);
      return evDate >= now;
    })
    .slice(0, 3);

  return (
    <div
      onClick={onDismiss}
      onTouchStart={onDismiss}
      onMouseMove={onDismiss}
      onKeyDown={onDismiss}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        background: 'hsl(var(--background) / 0.78)',
        animation: 'screensaverFadeIn 0.6s ease-out',
      }}
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div className="font-syne font-bold text-foreground tabular-nums tracking-tight" style={{ fontSize: 'clamp(6rem, 22vw, 14rem)', lineHeight: 1, textShadow: '0 8px 40px hsl(var(--primary) / 0.4)' }}>
          {hh}<span className="text-primary animate-pulse">:</span>{mm}
        </div>

        <div className="font-syne text-base md:text-lg text-muted-foreground capitalize tracking-wide">
          {dateStr}
        </div>

        {weather && (
          <div className="flex items-center gap-3 bg-card/40 border border-border/50 rounded-2xl px-5 py-3 backdrop-blur-md">
            <span className="text-3xl">{weather.icon}</span>
            <div className="flex flex-col items-start">
              <span className="font-mono text-2xl font-bold text-foreground">{weather.temperature}°</span>
              <span className="text-[0.65rem] text-muted-foreground">{weather.description} · {weather.city}</span>
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="flex flex-col gap-2 w-full max-w-sm mt-2">
            <span className="font-syne text-[0.6rem] font-bold tracking-[0.2em] uppercase text-muted-foreground">Prossimi impegni</span>
            {upcoming.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 bg-card/30 border border-border/40 rounded-xl px-4 py-2 backdrop-blur-sm">
                <span className="font-mono text-xs text-primary font-semibold shrink-0">{ev.startTime}</span>
                <span className="text-xs text-foreground truncate flex-1 text-left">{ev.title}</span>
              </div>
            ))}
          </div>
        )}

        <span className="text-[0.55rem] text-muted-foreground/60 font-syne tracking-[0.3em] uppercase mt-4 animate-pulse">
          Tocca per riattivare
        </span>
      </div>
    </div>
  );
};

export default Screensaver;
