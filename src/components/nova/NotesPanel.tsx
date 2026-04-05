import { useState } from 'react';
import { Note } from '@/lib/types';

interface Props {
  notes: Note[];
  onAdd: (text: string) => void;
  onRemove: (id: string) => void;
  onEdit?: (id: string, text: string) => void;
}

const formatTimestamp = (ts: string) => {
  // ts is like "14:30" from toLocaleTimeString
  const now = new Date();
  const today = now.toLocaleDateString('it-IT');
  const yesterday = new Date(now.getTime() - 86400000).toLocaleDateString('it-IT');
  // Notes only store time, so we show "Oggi alle HH:MM"
  return `Oggi alle ${ts}`;
};

const getBorderColor = (ts: string) => {
  // Color based on hour
  const parts = ts.split(':');
  const h = parseInt(parts[0] || '12');
  if (h < 8) return 'border-l-indigo-400';
  if (h < 12) return 'border-l-amber-400';
  if (h < 16) return 'border-l-emerald-400';
  if (h < 20) return 'border-l-orange-400';
  return 'border-l-violet-400';
};

const NotesPanel = ({ notes, onAdd, onRemove, onEdit }: Props) => {
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput('');
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim() && onEdit) {
      onEdit(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
      {/* Input area */}
      <div className="bg-card border border-border rounded-[18px] p-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
            placeholder="Scrivi una nuova nota..."
            rows={2}
            className="flex-1 bg-secondary border border-border rounded-[12px] px-4 py-3 text-foreground font-mono text-[0.78rem] outline-none transition-colors focus:border-primary/40 placeholder:text-muted-foreground resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="w-[48px] h-[48px] rounded-[14px] bg-gradient-to-br from-primary to-accent border-none cursor-pointer text-primary-foreground text-[1.3rem] flex items-center justify-center shrink-0 self-end transition-all active:scale-[0.92] disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {notes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-[0.75rem] leading-relaxed animate-fade-in">
          <div className="text-[3rem] mb-4 opacity-50">📝</div>
          Nessuna nota.<br />Aggiungine una sopra!
        </div>
      )}

      <div className="flex flex-col gap-3">
        {notes.map((n, i) => (
          <div
            key={n.id}
            className={`bg-card border border-border ${getBorderColor(n.timestamp)} border-l-[3px] rounded-[14px] px-4 py-3.5 flex flex-col gap-2 transition-all animate-[noteIn_0.35s_ease_both]`}
            style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}
          >
            {editingId === n.id ? (
              <div className="flex gap-2">
                <input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit()}
                  autoFocus
                  className="flex-1 bg-secondary border border-primary/30 rounded-[10px] px-3 py-2 text-foreground font-mono text-[0.78rem] outline-none"
                />
                <button onClick={saveEdit} className="text-primary text-[0.75rem] font-semibold font-syne">Salva</button>
                <button onClick={() => setEditingId(null)} className="text-muted-foreground text-[0.75rem] font-syne">Annulla</button>
              </div>
            ) : (
              <>
                <p className="text-[0.8rem] leading-snug line-clamp-2">{n.text}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[0.58rem] text-muted-foreground font-mono">{formatTimestamp(n.timestamp)}</span>
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => startEdit(n)}
                        className="text-[0.65rem] text-muted-foreground hover:text-primary transition-colors font-syne font-semibold"
                      >
                        ✏️ Modifica
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(n.id)}
                      className="text-[0.65rem] text-muted-foreground hover:text-destructive transition-colors font-syne font-semibold"
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesPanel;
