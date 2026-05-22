import { useState } from 'react';
import { Macro, MacroStep } from '@/hooks/useMacros';

interface Props {
  macros: Macro[];
  onAdd: (name: string, steps: MacroStep[], icon?: string) => void;
  onRemove: (id: string) => void;
}

const STEP_TYPES: { type: MacroStep['type']; label: string; placeholder: string }[] = [
  { type: 'speak', label: '🗣 Parla', placeholder: 'Testo da pronunciare' },
  { type: 'scene', label: '🎬 Scena', placeholder: 'cinema | sera | mattino | esco' },
  { type: 'navigate', label: '➡ Vai a', placeholder: 'home | radio | meteo …' },
  { type: 'radio', label: '📻 Radio', placeholder: 'nome stazione o "stop"' },
  { type: 'ambient', label: '🌧 Ambiente', placeholder: 'pioggia | foresta …' },
  { type: 'timer', label: '⏱ Timer', placeholder: 'Etichetta · minuti' },
  { type: 'delay', label: '⏳ Pausa', placeholder: 'Secondi' },
];

const MacrosManager = ({ macros, onAdd, onRemove }: Props) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✨');
  const [steps, setSteps] = useState<MacroStep[]>([]);

  const addStep = (type: MacroStep['type'], raw: string) => {
    let payload: any = raw;
    if (type === 'radio') payload = raw.toLowerCase() === 'stop' ? { action: 'stop' } : { station: raw };
    else if (type === 'ambient') payload = raw.toLowerCase() === 'stop' ? { action: 'stop' } : { sound: raw };
    else if (type === 'timer') {
      const [label, min] = raw.split('·').map(s => s.trim());
      payload = { label: label || 'Timer', seconds: (Number(min) || 1) * 60 };
    } else if (type === 'delay') payload = Number(raw) || 1;
    setSteps(p => [...p, { type, payload }]);
  };

  const save = () => {
    if (!name.trim() || steps.length === 0) return;
    onAdd(name.trim(), steps, icon);
    setName(''); setSteps([]); setIcon('✨');
  };

  return (
    <div className="space-y-3">
      {/* Lista macro */}
      {macros.length > 0 && (
        <div className="space-y-1.5">
          {macros.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2">
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-lg">{m.icon || '✨'}</span>
                <div className="min-w-0">
                  <div className="text-[0.72rem] font-bold text-foreground truncate">{m.name}</div>
                  <div className="text-[0.55rem] text-muted-foreground">{m.steps.length} step</div>
                </div>
              </div>
              <button onClick={() => onRemove(m.id)} className="text-destructive/70 hover:text-destructive text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Creator */}
      <div className="bg-card border border-border rounded-2xl p-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={icon}
            onChange={e => setIcon(e.target.value.slice(0, 2))}
            className="w-12 bg-secondary border border-border rounded-lg px-2 py-2 text-center text-base outline-none"
          />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome macro (es. Serata Cinema)"
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-[0.7rem] outline-none focus:border-primary/40 placeholder:text-muted-foreground min-w-0"
          />
        </div>

        {steps.length > 0 && (
          <div className="space-y-1">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-[0.65rem] bg-secondary/50 rounded-lg px-2 py-1">
                <span className="font-mono text-primary">{i + 1}. {s.type}</span>
                <span className="text-muted-foreground truncate ml-2">{typeof s.payload === 'object' ? JSON.stringify(s.payload) : String(s.payload)}</span>
                <button onClick={() => setSteps(p => p.filter((_, j) => j !== i))} className="ml-2 text-destructive/70">✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {STEP_TYPES.map(st => (
            <button
              key={st.type}
              onClick={() => {
                const v = window.prompt(`${st.label}: ${st.placeholder}`);
                if (v != null && v.trim()) addStep(st.type, v.trim());
              }}
              className="text-[0.6rem] py-1.5 px-2 rounded-lg border border-border bg-secondary hover:border-primary/40 text-foreground"
            >
              + {st.label}
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={!name.trim() || steps.length === 0}
          className="w-full py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-[0.7rem] font-bold disabled:opacity-40"
        >
          Salva macro
        </button>
      </div>
    </div>
  );
};

export default MacrosManager;
