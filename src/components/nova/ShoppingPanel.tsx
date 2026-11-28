import { useState } from 'react';
import { ShoppingItem } from '@/hooks/useShoppingList';
import { useSpeechInput } from '@/hooks/useSpeechInput';

const CATEGORIES = ['Frutta/Verdura', 'Carne/Pesce', 'Latticini', 'Pane/Pasta', 'Bevande', 'Surgelati', 'Igiene', 'Casa', 'Altro'];

interface Props {
  items: ShoppingItem[];
  onAdd: (item: string, qty?: string, category?: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
  onClearDone: () => void;
}

const ShoppingPanel = ({ items, onAdd, onToggle, onRemove, onClearDone }: Props) => {
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('');
  const [cat, setCat] = useState('Altro');
  const speech = useSpeechInput();

  const add = () => {
    if (!item.trim()) return;
    onAdd(item, qty, cat);
    setItem(''); setQty('');
  };

  const grouped = CATEGORIES.map(c => ({ cat: c, items: items.filter(i => (i.category || 'Altro') === c) }))
    .filter(g => g.items.length > 0);

  const doneCount = items.filter(i => i.done).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-syne text-lg font-bold">🛒 Lista Spesa</h2>
        <div className="text-[0.65rem] text-muted-foreground">{items.length} articoli · {doneCount} fatti</div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-3 mb-4 space-y-2">
        <div className="flex gap-2">
          <input value={item} onChange={e => setItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Articolo…" className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-[0.8rem] outline-none focus:border-primary/40" />
          <button
            type="button"
            disabled={!speech.supported}
            title={speech.supported ? 'Detta con la voce' : 'Riconoscimento vocale non supportato da questo browser'}
            onClick={() => (speech.listening ? speech.stop() : speech.start(setItem))}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-mono font-bold border active:scale-95 disabled:opacity-40 ${
              speech.listening
                ? 'bg-destructive/20 border-destructive/60 text-destructive'
                : 'bg-primary/15 border-primary/40 text-primary'
            }`}
          >
            {speech.listening ? '🎤 In ascolto…' : '🎤'}
          </button>
          <input value={qty} onChange={e => setQty(e.target.value)}
            placeholder="Q.tà" className="w-20 bg-secondary border border-border rounded-lg px-2 py-2 text-[0.8rem] outline-none focus:border-primary/40" />
        </div>
        {speech.error && <p className="text-[0.65rem] text-destructive font-mono">{speech.error}</p>}
        <div className="flex gap-2">
          <select value={cat} onChange={e => setCat(e.target.value)}
            className="flex-1 bg-secondary border border-border rounded-lg px-2 py-2 text-[0.75rem] outline-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={add} className="px-4 rounded-lg bg-primary text-primary-foreground font-syne text-xs font-bold active:scale-95">Aggiungi</button>
        </div>
      </div>

      {grouped.length === 0 && <div className="text-center text-muted-foreground text-xs mt-8">Lista vuota.</div>}

      <div className="space-y-4">
        {grouped.map(g => (
          <div key={g.cat}>
            <div className="font-syne text-[0.6rem] font-bold tracking-[0.15em] text-muted-foreground uppercase mb-2">{g.cat}</div>
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {g.items.map(it => (
                <div key={it.id} className="flex items-center gap-3 px-3 py-2.5">
                  <button onClick={() => onToggle(it.id, it.done)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[0.6rem] ${
                      it.done ? 'bg-accent border-accent text-accent-foreground' : 'border-muted-foreground'
                    }`}>
                    {it.done && '✓'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[0.85rem] ${it.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {it.item} {it.qty && <span className="text-muted-foreground text-[0.7rem]">· {it.qty}</span>}
                    </div>
                    <div className="text-[0.55rem] text-muted-foreground">da {it.added_by}</div>
                  </div>
                  <button onClick={() => onRemove(it.id)} className="text-destructive/70 hover:text-destructive text-sm">✕</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {doneCount > 0 && (
        <button onClick={onClearDone}
          className="mt-4 w-full py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive font-mono text-xs font-semibold active:scale-95">
          Rimuovi {doneCount} articoli fatti
        </button>
      )}
    </div>
  );
};

export default ShoppingPanel;
