import { useEffect, useRef, useState } from 'react';
import { WeatherData } from '@/lib/types';
import { CalendarEvent } from '@/hooks/useCalendar';

interface Props {
  weather: WeatherData | null;
  events: CalendarEvent[];
  onClose: () => void;
}

/** Smart mirror: front camera, mirrored, with HUD overlay. */
const MirrorMode = ({ weather, events, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [now, setNow] = useState(new Date());
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => { stream = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => setErr('Fotocamera non disponibile o permesso negato'));
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    const i = window.setInterval(() => setNow(new Date()), 1000);
    const resync = () => setNow(new Date());
    document.addEventListener('visibilitychange', resync);
    return () => { window.clearInterval(i); document.removeEventListener('visibilitychange', resync); };
  }, []);

  const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 z-[120] bg-background animate-fade-in">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background/80 pointer-events-none" />
      {err && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono text-sm">{err}</div>}

      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div>
          <div className="font-syne font-extrabold text-6xl md:text-8xl text-foreground text-glow-soft tabular-nums">{time}</div>
          <div className="font-mono text-sm uppercase tracking-[0.2em] text-primary capitalize">{date}</div>
        </div>
        {weather && (
          <div className="text-right">
            <div className="font-syne text-5xl font-bold text-foreground">{Math.round(weather.temperature)}°</div>
            <div className="font-mono text-xs text-muted-foreground tracking-wider">AGRIGENTO</div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 left-6 right-6 pointer-events-none">
        <div className="font-mono text-[0.65rem] tracking-[0.2em] text-primary mb-2">IMPEGNI</div>
        {events.length === 0 && <div className="text-sm text-muted-foreground font-mono">Nessun impegno in programma</div>}
        {events.slice(0, 3).map(e => (
          <div key={e.id} className="text-foreground font-mono text-sm">▸ {e.startTime?.slice(0, 5)} · {e.title}</div>
        ))}
      </div>

      <button onClick={onClose} className="absolute top-6 right-1/2 translate-x-1/2 px-4 py-1.5 rounded-full border border-primary/40 bg-background/60 backdrop-blur text-primary font-mono text-xs tracking-wider">
        ✕ CHIUDI SPECCHIO
      </button>
    </div>
  );
};

export default MirrorMode;
