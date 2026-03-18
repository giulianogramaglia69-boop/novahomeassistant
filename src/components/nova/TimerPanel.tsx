import { useState } from 'react';
import { Timer } from '@/hooks/useTimers';

interface Props {
  timers: Timer[];
  onAdd: (label: string, minutes: number) => string;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onRemove: (id: string) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const TimerPanel = ({ timers, onAdd, onStart, onPause, onReset, onRemove }: Props) => {
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('');

  const handleAdd = () => {
    const mins = parseInt(minutes);
    if (!mins || mins <= 0) return;
    const id = onAdd(label.trim() || 'Timer', mins);
    onStart(id);
    setLabel('');
    setMinutes('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">Timer</div>

      {/* Add timer form */}
      <div className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-3">
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Nome timer (opzionale)"
          className="bg-secondary border border-border rounded-[10px] px-3 py-2 text-foreground font-mono text-[0.72rem] outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Minuti"
            className="flex-1 bg-secondary border border-border rounded-[10px] px-3 py-2 text-foreground font-mono text-[0.72rem] outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground"
          />
          <button
            onClick={handleAdd}
            disabled={!minutes || parseInt(minutes) <= 0}
            className="px-4 py-2 rounded-[10px] bg-gradient-to-br from-primary to-accent text-primary-foreground font-syne font-semibold text-[0.72rem] transition-transform active:scale-95 disabled:opacity-50"
          >
            Avvia
          </button>
        </div>
      </div>

      {/* Active timers */}
      {timers.length === 0 ? (
        <div className="text-center text-[0.7rem] text-muted-foreground mt-8">Nessun timer attivo</div>
      ) : (
        <div className="flex flex-col gap-3">
          {timers.map(t => {
            const progress = t.totalSeconds > 0 ? ((t.totalSeconds - t.remainingSeconds) / t.totalSeconds) * 100 : 0;
            return (
              <div key={t.id} className={`bg-card border rounded-[16px] p-4 transition-all ${t.done ? 'border-accent animate-pulse' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-syne font-semibold text-[0.8rem]">{t.label}</span>
                  <span className={`font-mono text-[1.4rem] font-bold ${t.done ? 'text-accent' : t.running ? 'text-primary' : 'text-foreground'}`}>
                    {formatTime(t.remainingSeconds)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-secondary rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  {t.done ? (
                    <button onClick={() => onRemove(t.id)} className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] hover:border-destructive hover:text-destructive transition-all">
                      Rimuovi
                    </button>
                  ) : (
                    <>
                      {t.running ? (
                        <button onClick={() => onPause(t.id)} className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] hover:border-primary hover:text-primary transition-all">
                          Pausa
                        </button>
                      ) : (
                        <button onClick={() => onStart(t.id)} className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] hover:border-primary hover:text-primary transition-all">
                          Riprendi
                        </button>
                      )}
                      <button onClick={() => onReset(t.id)} className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] hover:border-accent hover:text-accent transition-all">
                        Reset
                      </button>
                      <button onClick={() => onRemove(t.id)} className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] hover:border-destructive hover:text-destructive transition-all">
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
