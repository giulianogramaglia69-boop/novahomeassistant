import { useEffect, useRef, useState } from 'react';

interface Props {
  voiceState: string;
  ttsSpeaking: boolean;
  totalWattage: number;
  devicesOn: number;
  weatherTemp?: number | null;
  onTap?: () => void;
}

/**
 * Jarvis-style HUD: animated orb with concentric rings.
 * Reactivity is derived synthetically from voiceState/TTS state — we deliberately
 * do NOT open a separate AudioContext/getUserMedia stream to avoid competing with
 * SpeechRecognition for the microphone (which breaks always-on listening).
 */
const JarvisHUD = ({ voiceState, ttsSpeaking, totalWattage, devicesOn, weatherTemp, onTap }: Props) => {
  const [level, setLevel] = useState(0.15);
  const rafRef = useRef<number | null>(null);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const micActive = voiceState === 'listening' || voiceState === 'wake';
  const processing = voiceState === 'processing';

  // Synthetic reactive animation driven by state (no microphone capture)
  useEffect(() => {
    let t = 0;
    const tick = () => {
      t += 0.08;
      let v: number;
      if (ttsSpeaking) {
        v = 0.55 + 0.3 * Math.abs(Math.sin(t * 1.4)) + 0.1 * Math.sin(t * 3.1);
      } else if (micActive) {
        v = 0.4 + 0.35 * Math.abs(Math.sin(t * 2.2)) + 0.15 * Math.abs(Math.sin(t * 5));
      } else if (processing) {
        v = 0.5 + 0.4 * Math.abs(Math.sin(t * 3));
      } else {
        v = 0.15 + 0.08 * Math.sin(t * 0.6);
      }
      setLevel(Math.min(1, v));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [ttsSpeaking, micActive, processing]);

  const active = ttsSpeaking || micActive || processing;

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const baseR = 56;
  const ringR = baseR + level * 14;

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');
  const dateStr = time.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="relative w-full flex flex-col items-center select-none" onClick={onTap}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          style={{ animation: 'hud-spin 22s linear infinite' }}
        >
          <defs>
            <linearGradient id="hud-grad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={100} fill="none" stroke="url(#hud-grad)" strokeWidth="1" strokeDasharray="2 5" opacity="0.55" />
          <circle cx={cx} cy={cy} r={92} fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="60 380" />
        </svg>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
          style={{ animation: 'hud-spin-rev 30s linear infinite' }}
        >
          <circle cx={cx} cy={cy} r={84} fill="none" stroke="hsl(var(--accent))" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 8" />
          <circle cx={cx} cy={cy} r={76} fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="120 220" />
        </svg>

        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
          {[0, 1, 2].map(i => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={ringR + i * 12 + level * 6}
              fill="none"
              stroke={active ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
              strokeOpacity={0.45 - i * 0.12}
              strokeWidth={1.4}
            />
          ))}
        </svg>

        <div
          className="absolute rounded-full"
          style={{
            left: cx - baseR,
            top: cy - baseR,
            width: baseR * 2,
            height: baseR * 2,
            background: `radial-gradient(circle at 35% 30%, hsl(var(--accent) / 0.9), hsl(var(--primary) / 0.7) 55%, hsl(var(--primary) / 0.25) 80%, transparent)`,
            boxShadow: `0 0 ${30 + level * 60}px hsl(var(--primary) / ${0.35 + level * 0.4}), inset 0 0 30px hsl(var(--accent) / 0.5)`,
            transition: 'box-shadow 80ms linear',
          }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-syne font-extrabold tracking-[0.25em] text-[0.65rem] text-foreground/90">N.O.V.A.</span>
          <span className="font-mono text-[0.5rem] text-foreground/60 tracking-[0.2em] uppercase mt-0.5">
            {voiceState === 'wake' ? 'IN ATTESA' :
             voiceState === 'listening' ? 'ASCOLTO' :
             voiceState === 'processing' ? 'ELABORO' :
             ttsSpeaking ? 'PARLA' : 'STANDBY'}
          </span>
        </div>

        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const r1 = 104;
            const r2 = i % 3 === 0 ? 110 : 107;
            const x1 = cx + r1 * Math.cos(a);
            const y1 = cy + r1 * Math.sin(a);
            const x2 = cx + r2 * Math.cos(a);
            const y2 = cy + r2 * Math.sin(a);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={i % 3 === 0 ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
                strokeOpacity={i % 3 === 0 ? 0.55 : 0.25}
                strokeWidth={1}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-2 w-full grid grid-cols-3 gap-2 text-center font-mono">
        <div className="rounded-xl border border-border bg-card/60 py-1.5 px-2">
          <div className="text-[0.5rem] text-muted-foreground tracking-[0.18em] uppercase">Ora</div>
          <div className="text-[0.85rem] font-bold tabular-nums">{hh}:{mm}<span className="text-[0.55rem] text-muted-foreground">:{ss}</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 py-1.5 px-2">
          <div className="text-[0.5rem] text-muted-foreground tracking-[0.18em] uppercase">Energia</div>
          <div className="text-[0.85rem] font-bold text-accent">{Math.round(totalWattage)}W</div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 py-1.5 px-2">
          <div className="text-[0.5rem] text-muted-foreground tracking-[0.18em] uppercase">Device</div>
          <div className="text-[0.85rem] font-bold text-primary">{devicesOn}</div>
        </div>
      </div>
      <div className="mt-1 text-[0.55rem] font-mono text-muted-foreground uppercase tracking-[0.2em]">
        {dateStr}{weatherTemp != null ? ` · ${weatherTemp}°` : ''}
      </div>
    </div>
  );
};

export default JarvisHUD;
