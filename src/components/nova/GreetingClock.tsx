import { useState, useEffect } from 'react';
import { Profile } from '@/lib/types';

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const pad = (n: number) => n.toString().padStart(2, '0');

const getDisplayName = (profile?: Profile | null) => {
  if (!profile) return 'Giuliano';
  if (profile.name === 'Admin') return 'Giuliano';
  return profile.name;
};

const GreetingClock = ({ compact = false, profile }: { compact?: boolean; profile?: Profile | null }) => {
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

  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const name = getDisplayName(profile);

  if (compact) {
    return (
      <div>
        <p className="font-syne font-bold text-foreground text-[0.8rem]">Ciao {name} 👋</p>
        <span className="font-mono text-xl font-bold text-primary tabular-nums">{timeStr}</span>
        <p className="text-muted-foreground text-[0.55rem] mt-0.5 font-mono">{dateStr}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-border rounded-2xl p-4">
        <p className="font-syne font-bold text-foreground text-base">Ciao {name} 👋</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-mono text-2xl font-bold text-primary tabular-nums">{timeStr}</span>
        </div>
        <p className="text-muted-foreground text-xs mt-0.5 font-mono">{dateStr}</p>
      </div>
    </div>
  );
};

export default GreetingClock;
