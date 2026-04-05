import { useState, useEffect, useRef } from 'react';
import { Timer } from '@/hooks/useTimers';

interface Props {
  timers: Timer[];
  onAdd: (label: string, minutes: number) => string;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onRemove: (id: string) => void;
}

const getTimerColor = (timer: Timer) => {
  if (timer.done) return 'text-destructive';
  if (timer.totalSeconds === 0) return 'text-foreground';
  const pct = timer.remainingSeconds / timer.totalSeconds;
  if (pct > 0.5) return 'text-emerald-400';
  if (pct > 0.2) return 'text-amber-400';
  return 'text-red-400';
};

const getProgressColor = (timer: Timer) => {
  if (timer.done) return 'from-destructive to-destructive';
  if (timer.totalSeconds === 0) return 'from-primary to-accent';
  const pct = timer.remainingSeconds / timer.totalSeconds;
  if (pct > 0.5) return 'from-emerald-400 to-emerald-500';
  if (pct > 0.2) return 'from-amber-400 to-amber-500';
  return 'from-red-400 to-red-500';
};

const FlipDigit = ({ value, color }: { value: string; color: string }) => {
  const [display, setDisplay] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      setFlipping(true);
      const t = setTimeout(() => {
        setDisplay(value);
        setFlipping(false);
        prev.current = value;
      }, 150);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span className={`inline-block w-[1.2em] text-center transition-transform duration-150 ${flipping ? 'animate-[flipDigit_0.3s_ease]' : ''} ${color}`}>
      {display}
    </span>
  );
};

const TimerDisplay = ({ timer }: { timer: Timer }) => {
  const h = Math.floor(timer.remainingSeconds / 3600);
  const m = Math.floor((timer.remainingSeconds % 3600) / 60);
  const s = timer.remainingSeconds % 60;
  const color = getTimerColor(timer);
  const digits = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className={`font-mono text-[2.8rem] font-bold tracking-[0.06em] tabular-nums leading-none ${timer.done ? 'animate-[blink_0.6s_ease-in-out_infinite]' : ''}`}>
      {digits.split('').map((ch, i) => (
        ch === ':' ? <span key={i} className={`${color} opacity-60`}>:</span> : <FlipDigit key={i} value={ch} color={color} />
      ))}
    </div>
  );
};

const TimerPanel = ({ timers, onAdd, onStart, onPause, onReset, onRemove }: Props) => {
  const [label, setLabel] = useState('');
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [secs, setSecs] = useState('');

  const handleAdd = () => {
    const totalMin = (parseInt(hours || '0') * 60) + parseInt(mins || '0') + (parseInt(secs || '0') / 60);
    if (totalMin <= 0) return;
    const id = onAdd(label.trim() || 'Timer', totalMin);
    onStart(id);
    setLabel('');
    setHours('');
    setMins('');
    setSecs('');
  };

  const totalSecs = (parseInt(hours || '0') * 3600) + (parseInt(mins || '0') * 60) + parseInt(secs || '0');

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
      <div className="font-syne text-[0.6rem] font-bold tracking-[0.25em] text-muted-foreground uppercase">Timer</div>

      {/* Add timer form */}
      <div className="bg-card border border-border rounded-[18px] p-5 flex flex-col gap-4">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Nome timer (opzionale)"
          className="bg-secondary border border-border rounded-[12px] px-3.5 py-2.5 text-foreground font-mono text-[0.75rem] outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground"
        />
        <div className="flex gap-2 items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <input
              type="number" min="0" max="23"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="00"
              className="w-16 bg-secondary border border-border rounded-[10px] px-2 py-3 text-center text-foreground font-mono text-[1.2rem] font-bold outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground/40"
            />
            <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wider">Ore</span>
          </div>
          <span className="text-foreground font-mono text-xl font-bold mt-[-1rem]">:</span>
          <div className="flex flex-col items-center gap-1">
            <input
              type="number" min="0" max="59"
              value={mins}
              onChange={e => setMins(e.target.value)}
              placeholder="00"
              className="w-16 bg-secondary border border-border rounded-[10px] px-2 py-3 text-center text-foreground font-mono text-[1.2rem] font-bold outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground/40"
            />
            <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wider">Min</span>
          </div>
          <span className="text-foreground font-mono text-xl font-bold mt-[-1rem]">:</span>
          <div className="flex flex-col items-center gap-1">
            <input
              type="number" min="0" max="59"
              value={secs}
              onChange={e => setSecs(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="00"
              className="w-16 bg-secondary border border-border rounded-[10px] px-2 py-3 text-center text-foreground font-mono text-[1.2rem] font-bold outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground/40"
            />
            <span className="text-[0.55rem] text-muted-foreground uppercase tracking-wider">Sec</span>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={totalSecs <= 0}
          className="w-full py-3 rounded-[12px] bg-gradient-to-br from-primary to-accent text-primary-foreground font-syne font-bold text-[0.8rem] tracking-wider transition-all active:scale-[0.97] disabled:opacity-40"
        >
          ▶ AVVIA TIMER
        </button>
      </div>

      {/* Active timers */}
      {timers.length === 0 ? (
        <div className="text-center text-[0.7rem] text-muted-foreground mt-8 animate-fade-in">
          <div className="text-[2.5rem] mb-3 opacity-50">⏱️</div>
          Nessun timer attivo
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {timers.map(t => {
            const progress = t.totalSeconds > 0 ? ((t.totalSeconds - t.remainingSeconds) / t.totalSeconds) * 100 : 0;
            return (
              <div
                key={t.id}
                className={`bg-card border rounded-[18px] p-5 transition-all ${t.done ? 'border-destructive/50 animate-[blink-border_0.6s_ease-in-out_infinite]' : 'border-border'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-syne font-bold text-[0.75rem] text-muted-foreground uppercase tracking-wider">{t.label}</span>
                  {t.done && <span className="text-[0.6rem] font-syne font-bold text-destructive animate-pulse uppercase tracking-wider">Completato!</span>}
                </div>

                {/* Big digital display */}
                <div className="flex justify-center py-4">
                  <TimerDisplay timer={t} />
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-secondary rounded-full mb-4 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressColor(t)} rounded-full transition-all duration-1000`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex gap-3 justify-center">
                  {t.done ? (
                    <button onClick={() => onRemove(t.id)} className="flex-1 py-3 rounded-[12px] bg-secondary border border-border text-foreground font-syne font-bold text-[0.72rem] uppercase tracking-wider hover:border-destructive hover:text-destructive transition-all active:scale-[0.97]">
                      🗑️ Rimuovi
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => t.running ? onPause(t.id) : onStart(t.id)}
                        className={`flex-1 py-3 rounded-[12px] font-syne font-bold text-[0.72rem] uppercase tracking-wider transition-all active:scale-[0.97] ${
                          t.running
                            ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                            : 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
                        }`}
                      >
                        {t.running ? '⏸ Pausa' : '▶ Riprendi'}
                      </button>
                      <button onClick={() => onReset(t.id)} className="py-3 px-5 rounded-[12px] bg-secondary border border-border text-foreground font-syne font-bold text-[0.72rem] uppercase tracking-wider hover:border-accent hover:text-accent transition-all active:scale-[0.97]">
                        ↺ Reset
                      </button>
                      <button onClick={() => onRemove(t.id)} className="py-3 px-4 rounded-[12px] bg-secondary border border-border text-foreground font-syne text-[0.8rem] hover:border-destructive hover:text-destructive transition-all active:scale-[0.97]">
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimerPanel;
