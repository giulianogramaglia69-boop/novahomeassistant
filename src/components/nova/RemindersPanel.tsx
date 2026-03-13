import { useState } from 'react';
import { Reminder } from '@/lib/types';

interface Props {
  reminders: Reminder[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

const RemindersPanel = ({ reminders, onAdd, onToggle, onRemove }: Props) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nuovo promemoria..."
          className="flex-1 bg-card border border-border rounded-[12px] px-3.5 py-2.5 text-foreground font-mono text-[0.78rem] outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground"
        />
        <button
          onClick={handleAdd}
          className="w-[42px] h-[42px] rounded-[12px] bg-gradient-to-br from-primary to-accent border-none cursor-pointer text-primary-foreground text-[1.2rem] flex items-center justify-center shrink-0 transition-transform active:scale-[0.92]"
        >
          +
        </button>
      </div>

      {reminders.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-[0.75rem] leading-relaxed">
          <div className="text-[2.5rem] mb-3 opacity-50">📝</div>
          Nessun promemoria.<br />Aggiungine uno sopra!
        </div>
      )}

      {reminders.map(r => (
        <div
          key={r.id}
          className={`bg-card border border-border rounded-[12px] px-3.5 py-3 flex items-center gap-3 transition-all ${r.done ? 'opacity-45' : ''}`}
          style={{ animation: 'msg-in 0.3s ease' }}
        >
          <button
            onClick={() => onToggle(r.id)}
            className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 text-[0.65rem] transition-all cursor-pointer ${
              r.done
                ? 'bg-accent border-accent text-accent-foreground'
                : 'bg-secondary border-border'
            }`}
          >
            {r.done && '✓'}
          </button>
          <span className={`flex-1 text-[0.78rem] leading-snug ${r.done ? 'line-through text-muted-foreground' : ''}`}>
            {r.text}
          </span>
          <span className="text-[0.58rem] text-muted-foreground">{r.createdAt}</span>
          <button
            onClick={() => onRemove(r.id)}
            className="w-6 h-6 bg-transparent border-none text-muted-foreground cursor-pointer text-[0.85rem] flex items-center justify-center rounded-[6px] transition-all hover:text-destructive hover:bg-destructive/10"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default RemindersPanel;
