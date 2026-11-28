import { useState } from 'react';
import { useNovaItems } from '@/hooks/useNovaItems';
import { useSpeechInput, type UseSpeechInputResult } from '@/hooks/useSpeechInput';

type Sub = 'board' | 'expenses' | 'pantry' | 'parcels' | 'announce' | 'security';

const SUBS: { id: Sub; label: string }[] = [
  { id: 'board', label: '📌 Bacheca' },
  { id: 'announce', label: '📢 Annunci' },
  { id: 'expenses', label: '💶 Spese' },
  { id: 'pantry', label: '🥫 Dispensa' },
  { id: 'parcels', label: '📦 Pacchi' },
  { id: 'security', label: '🛡 Presenza' },
];

const COLORS = ['primary', 'accent', 'destructive', 'muted-foreground'];

interface Props {
  profileName: string;
  onAddShopping: (item: string) => void;
  presence: { enabled: boolean; setEnabled: (v: boolean) => void; lastAction: string | null };
  deviceCount: number;
}

const input = 'flex-1 min-w-0 rounded-lg bg-secondary border border-border px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50';
const btn = 'rounded-lg px-3 py-2 text-xs font-mono font-bold tracking-wider bg-primary/15 border border-primary/40 text-primary active:scale-95';
const card = 'hud-card rounded-xl border border-border bg-card/70 p-3';

/** Pulsante microfono per dettare il testo di un input (non salva da solo). */
const MicButton = ({ speech, onText }: { speech: UseSpeechInputResult; onText: (t: string) => void }) => (
  <button
    type="button"
    disabled={!speech.supported}
    title={speech.supported ? 'Detta con la voce' : 'Riconoscimento vocale non supportato da questo browser'}
    onClick={() => (speech.listening ? speech.stop() : speech.start(onText))}
    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-mono font-bold tracking-wider border active:scale-95 disabled:opacity-40 ${
      speech.listening
        ? 'bg-destructive/20 border-destructive/60 text-destructive'
        : 'bg-primary/15 border-primary/40 text-primary'
    }`}
  >
    {speech.listening ? '🎤 In ascolto…' : '🎤'}
  </button>
);

const Board = ({ profileName }: { profileName: string }) => {
  const { items, add, remove } = useNovaItems<{ text: string; color: string }>('postit', profileName);
  const [text, setText] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const speech = useSpeechInput();
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className={input} value={text} onChange={e => setText(e.target.value)} placeholder="Scrivi un post-it…"
          onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { add({ text, color }); setText(''); } }} />
        <MicButton speech={speech} onText={setText} />
        <div className="flex gap-1 items-center">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`} style={{ background: `hsl(var(--${c}))` }} />
          ))}
        </div>
        <button className={btn} onClick={() => { if (text.trim()) { add({ text, color }); setText(''); } }}>+</button>
      </div>
      {speech.error && <p className="text-[0.65rem] text-destructive font-mono">{speech.error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it, i) => (
          <div key={it.id} className="relative rounded-lg p-3 min-h-[110px] shadow-lg border"
            style={{ background: `hsl(var(--${it.data.color}) / 0.15)`, borderColor: `hsl(var(--${it.data.color}) / 0.5)`, transform: `rotate(${(i % 3) - 1}deg)` }}>
            <button onClick={() => remove(it.id)} className="absolute top-1 right-2 text-muted-foreground text-xs">✕</button>
            <p className="text-sm text-foreground whitespace-pre-wrap pr-3">{it.data.text}</p>
            <p className="absolute bottom-1.5 left-3 text-[0.55rem] font-mono text-muted-foreground">{it.created_by}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Announce = ({ profileName }: { profileName: string }) => {
  const { items, add } = useNovaItems<{ text: string; to: string }>('announce', profileName);
  const [text, setText] = useState('');
  const [to, setTo] = useState('Tutti');
  const send = (t = text) => { if (t.trim()) { add({ text: t, to }); setText(''); } };
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <select value={to} onChange={e => setTo(e.target.value)} className="rounded-lg bg-secondary border border-border px-2 text-sm font-mono text-foreground">
          {['Tutti', 'Giuliano', 'Simone', 'Ilenia'].map(p => <option key={p}>{p}</option>)}
        </select>
        <input className={input} value={text} onChange={e => setText(e.target.value)} placeholder="Messaggio da annunciare…" onKeyDown={e => e.key === 'Enter' && send()} />
        <button className={btn} onClick={() => send()}>📢 INVIA</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['La cena è pronta!', 'Scendete, si esce!', 'Qualcuno al citofono', 'Buonanotte a tutti'].map(q => (
          <button key={q} onClick={() => send(q)} className="px-3 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent text-xs font-mono">{q}</button>
        ))}
      </div>
      <div className="space-y-2">
        {items.slice(0, 20).map(it => (
          <div key={it.id} className={card}>
            <div className="text-sm text-foreground">{it.data.text}</div>
            <div className="text-[0.6rem] font-mono text-muted-foreground mt-1">{it.created_by} → {it.data.to} · {new Date(it.created_at).toLocaleString('it-IT')}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Expenses = ({ profileName }: { profileName: string }) => {
  const { items, add, remove } = useNovaItems<{ title: string; amount: number; category: string }>('expense', profileName);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Spesa');
  const month = new Date().toISOString().slice(0, 7);
  const monthItems = items.filter(i => i.created_at.startsWith(month));
  const total = monthItems.reduce((s, i) => s + (Number(i.data.amount) || 0), 0);
  const byCat = monthItems.reduce<Record<string, number>>((acc, i) => { acc[i.data.category] = (acc[i.data.category] || 0) + Number(i.data.amount); return acc; }, {});
  const submit = () => { const a = parseFloat(amount.replace(',', '.')); if (title.trim() && a > 0) { add({ title, amount: a, category }); setTitle(''); setAmount(''); } };
  return (
    <div className="space-y-3">
      <div className={card}>
        <div className="text-[0.6rem] font-mono tracking-[0.2em] text-primary">TOTALE MESE</div>
        <div className="font-syne text-3xl font-bold text-foreground">€ {total.toFixed(2)}</div>
        <div className="flex gap-2 flex-wrap mt-2">
          {Object.entries(byCat).map(([c, v]) => <span key={c} className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{c}: €{v.toFixed(2)}</span>)}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <input className={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Descrizione" />
        <input className={`${input} max-w-[100px]`} value={amount} onChange={e => setAmount(e.target.value)} placeholder="€" inputMode="decimal" />
        <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-lg bg-secondary border border-border px-2 text-sm font-mono text-foreground">
          {['Spesa', 'Bollette', 'Casa', 'Svago', 'Altro'].map(c => <option key={c}>{c}</option>)}
        </select>
        <button className={btn} onClick={submit}>+</button>
      </div>
      {items.map(it => (
        <div key={it.id} className={`${card} flex items-center justify-between`}>
          <div>
            <div className="text-sm text-foreground">{it.data.title}</div>
            <div className="text-[0.6rem] font-mono text-muted-foreground">{it.data.category} · {it.created_by} · {new Date(it.created_at).toLocaleDateString('it-IT')}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-primary">€{Number(it.data.amount).toFixed(2)}</span>
            <button onClick={() => remove(it.id)} className="text-muted-foreground text-xs">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const Pantry = ({ profileName, onAddShopping }: { profileName: string; onAddShopping: (i: string) => void }) => {
  const { items, add, update, remove } = useNovaItems<{ name: string; qty: number; expiry?: string }>('pantry', profileName);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [expiry, setExpiry] = useState('');
  const speech = useSpeechInput();
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const setQ = (id: string, d: any, q: number) => {
    if (q <= 0) { onAddShopping(d.name); remove(id); } else update(id, { ...d, qty: q });
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Prodotto" />
        <MicButton speech={speech} onText={setName} />
        <input className={`${input} max-w-[70px]`} value={qty} onChange={e => setQty(e.target.value)} inputMode="numeric" />
        <input type="date" className={`${input} max-w-[160px]`} value={expiry} onChange={e => setExpiry(e.target.value)} />
        <button className={btn} onClick={() => { if (name.trim()) { add({ name, qty: parseInt(qty) || 1, expiry: expiry || undefined }); setName(''); setQty('1'); setExpiry(''); } }}>+</button>
      </div>
      {speech.error && <p className="text-[0.65rem] text-destructive font-mono">{speech.error}</p>}
      <p className="text-[0.6rem] font-mono text-muted-foreground">Quando un prodotto arriva a zero viene aggiunto alla lista della spesa.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {items.map(it => {
          const exp = it.data.expiry;
          const status = exp ? (exp < today ? 'text-destructive' : exp <= soon ? 'text-accent' : 'text-muted-foreground') : 'text-muted-foreground';
          return (
            <div key={it.id} className={`${card} flex items-center justify-between`}>
              <div>
                <div className="text-sm text-foreground">{it.data.name}</div>
                {exp && <div className={`text-[0.6rem] font-mono ${status}`}>Scade {new Date(exp).toLocaleDateString('it-IT')}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded-full bg-secondary text-foreground" onClick={() => setQ(it.id, it.data, it.data.qty - 1)}>−</button>
                <span className="font-mono w-6 text-center text-foreground">{it.data.qty}</span>
                <button className="w-7 h-7 rounded-full bg-secondary text-foreground" onClick={() => setQ(it.id, it.data, it.data.qty + 1)}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const STEPS = ['Ordinato', 'Spedito', 'In transito', 'In consegna', 'Consegnato'];
const trackUrl = (carrier: string, code: string) => {
  const c = encodeURIComponent(code);
  switch (carrier) {
    case 'Poste': return `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${c}`;
    case 'BRT': return `https://vas.brt.it/vas/sped_det_show.hsm?referer=sped_numspe_par.htm&Nspediz=${c}`;
    case 'GLS': return `https://www.gls-italy.com/it/servizi-online/ricerca-spedizioni?match=${c}`;
    case 'DHL': return `https://www.dhl.com/it-it/home/tracking.html?tracking-id=${c}`;
    case 'SDA': return `https://www.sda.it/wps/portal/Servizi_online/dettaglio-spedizione?locale=it&tracing.letteraVettura=${c}`;
    case 'Amazon': return `https://www.amazon.it/gp/your-account/order-history`;
    default: return `https://parcelsapp.com/it/tracking/${c}`;
  }
};

const Parcels = ({ profileName }: { profileName: string }) => {
  const { items, add, update, remove } = useNovaItems<{ name: string; code: string; carrier: string; step: number }>('parcel', profileName);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [carrier, setCarrier] = useState('Amazon');
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Cosa aspetti?" />
        <input className={input} value={code} onChange={e => setCode(e.target.value)} placeholder="Codice tracking" />
        <select value={carrier} onChange={e => setCarrier(e.target.value)} className="rounded-lg bg-secondary border border-border px-2 text-sm font-mono text-foreground">
          {['Amazon', 'Poste', 'BRT', 'GLS', 'SDA', 'DHL', 'Altro'].map(c => <option key={c}>{c}</option>)}
        </select>
        <button className={btn} onClick={() => { if (name.trim()) { add({ name, code, carrier, step: 0 }); setName(''); setCode(''); } }}>+</button>
      </div>
      {items.map(it => (
        <div key={it.id} className={card}>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-foreground">{it.data.name}</div>
              <div className="text-[0.6rem] font-mono text-muted-foreground">{it.data.carrier} · {it.data.code || '—'}</div>
            </div>
            <div className="flex gap-2">
              {it.data.code && <a href={trackUrl(it.data.carrier, it.data.code)} target="_blank" rel="noreferrer" className="text-xs font-mono text-primary">TRACCIA ↗</a>}
              <button onClick={() => remove(it.id)} className="text-muted-foreground text-xs">✕</button>
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => update(it.id, { ...it.data, step: i })} className="flex-1 text-left">
                <div className={`h-1.5 rounded-full ${i <= it.data.step ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]' : 'bg-secondary'}`} />
                <div className={`text-[0.5rem] font-mono mt-1 ${i === it.data.step ? 'text-primary' : 'text-muted-foreground'}`}>{s}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Security = ({ presence, deviceCount }: { presence: Props['presence']; deviceCount: number }) => (
  <div className={`${card} space-y-3`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="font-syne font-bold text-foreground">Simulazione presenza</div>
        <div className="text-xs text-muted-foreground font-mono">Accende e spegne i dispositivi a caso tra le 18 e le 23 mentre sei fuori casa.</div>
      </div>
      <button onClick={() => presence.setEnabled(!presence.enabled)}
        className={`px-4 py-2 rounded-full font-mono text-xs font-bold border ${presence.enabled ? 'bg-primary/20 border-primary text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
        {presence.enabled ? 'ATTIVA' : 'SPENTA'}
      </button>
    </div>
    <div className="text-[0.65rem] font-mono text-muted-foreground">Dispositivi coinvolti: {deviceCount} · Ultima azione: {presence.lastAction || '—'}</div>
    <div className="text-[0.6rem] font-mono text-muted-foreground">Lascia NOVA aperta sul tablet perché la simulazione funzioni.</div>
  </div>
);

const FamilyPanel = ({ profileName, onAddShopping, presence, deviceCount }: Props) => {
  const [sub, setSub] = useState<Sub>('board');
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {SUBS.map(s => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono border ${sub === s.id ? 'bg-primary/15 border-primary/50 text-primary' : 'bg-secondary border-border text-muted-foreground'}`}>
            {s.label}
          </button>
        ))}
      </div>
      {sub === 'board' && <Board profileName={profileName} />}
      {sub === 'announce' && <Announce profileName={profileName} />}
      {sub === 'expenses' && <Expenses profileName={profileName} />}
      {sub === 'pantry' && <Pantry profileName={profileName} onAddShopping={onAddShopping} />}
      {sub === 'parcels' && <Parcels profileName={profileName} />}
      {sub === 'security' && <Security presence={presence} deviceCount={deviceCount} />}
    </div>
  );
};

export default FamilyPanel;
