import { useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { TabId } from '@/lib/types';

interface Win { id: string; tab: TabId; x: number; y: number; w: number; h: number; z: number; min: boolean; }
interface LogEntry { id: string; time: string; text: string; }

const APPS: { tab: TabId; icon: string; label: string }[] = [
  { tab: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { tab: 'home', icon: '🏡', label: 'Casa' },
  { tab: 'meteo', icon: '🌤️', label: 'Meteo' },
  { tab: 'calendar', icon: '📅', label: 'Calendario' },
  { tab: 'reminders', icon: '📝', label: 'Note' },
  { tab: 'timer', icon: '⏱️', label: 'Timer' },
  { tab: 'radio', icon: '📻', label: 'Radio' },
  { tab: 'ambiente', icon: '🌊', label: 'Ambiente' },
  { tab: 'news', icon: '📰', label: 'News' },
  { tab: 'web', icon: '🌐', label: 'Web' },
  { tab: 'messages', icon: '✉️', label: 'Messaggi' },
  { tab: 'shopping', icon: '🛒', label: 'Spesa' },
  { tab: 'traffic', icon: '🚗', label: 'Traffico' },
  { tab: 'family', icon: '👨‍👩‍👧', label: 'Famiglia' },
  { tab: 'settings', icon: '⚙️', label: 'Impostazioni' },
];

const ACTION_LABEL: Record<string, string> = {
  navigate: 'Apro', web_search: 'Cerco sul web', start_timer: 'Avvio timer', play_radio: 'Avvio radio',
  play_ambient: 'Avvio suono ambiente', add_event: 'Creo evento', add_note: 'Creo nota', remember: 'Memorizzo',
  add_shopping: 'Aggiungo alla spesa', run_sequence: 'Eseguo sequenza', delay: 'Attendo', add_reminder: 'Aggiungo promemoria',
  smart_toggle: 'Controllo dispositivo', scene: 'Attivo scena', open_floating: 'Apro finestra', refresh_devices: 'Aggiorno dispositivi',
};

const now = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

interface Props { chat: ReactNode; renderPanel: (t: TabId) => ReactNode; onExit: () => void; }

const DesktopMode = ({ chat, renderPanel, onExit }: Props) => {
  const [wins, setWins] = useState<Win[]>([]);
  const [log, setLog] = useState<LogEntry[]>([{ id: 'boot', time: now(), text: 'NOVA OS avviato. Copilot in ascolto.' }]);
  const [clock, setClock] = useState(now());
  const zTop = useRef(10);
  const drag = useRef<{ id: string; dx: number; dy: number; resize?: boolean } | null>(null);
  const deskRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string) => setLog(l => [{ id: crypto.randomUUID(), time: now(), text }, ...l].slice(0, 60));

  const open = useCallback((tab: TabId) => {
    setWins(ws => {
      const ex = ws.find(w => w.tab === tab);
      zTop.current += 1;
      if (ex) return ws.map(w => w.id === ex.id ? { ...w, z: zTop.current, min: false } : w);
      const n = ws.length;
      return [...ws, { id: crypto.randomUUID(), tab, x: 40 + n * 28, y: 30 + n * 28, w: 560, h: 420, z: zTop.current, min: false }];
    });
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setClock(now()), 1000);
    const onAction = (e: Event) => {
      const a = (e as CustomEvent).detail as { type: string; payload?: string };
      addLog(`${ACTION_LABEL[a.type] || a.type}${a.payload ? ` → ${a.payload.slice(0, 60)}` : ''}`);
      if (a.type === 'navigate' && a.payload) {
        const t = a.payload.trim().toLowerCase() as TabId;
        if (APPS.some(x => x.tab === t)) open(t);
      }
    };
    const onUser = (e: Event) => addLog(`🗣️ “${String((e as CustomEvent).detail).slice(0, 60)}”`);
    window.addEventListener('nova-agent-action', onAction);
    window.addEventListener('nova-agent-user', onUser);
    return () => { clearInterval(iv); window.removeEventListener('nova-agent-action', onAction); window.removeEventListener('nova-agent-user', onUser); };
  }, [open]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current; if (!d) return;
      const r = deskRef.current?.getBoundingClientRect(); if (!r) return;
      setWins(ws => ws.map(w => {
        if (w.id !== d.id) return w;
        if (d.resize) return { ...w, w: Math.max(320, e.clientX - r.left - w.x), h: Math.max(220, e.clientY - r.top - w.y) };
        return { ...w, x: Math.max(0, e.clientX - r.left - d.dx), y: Math.max(0, e.clientY - r.top - d.dy) };
      }));
    };
    const up = () => { drag.current = null; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const focus = (id: string) => { zTop.current += 1; setWins(ws => ws.map(w => w.id === id ? { ...w, z: zTop.current } : w)); };
  const title = (t: TabId) => APPS.find(a => a.tab === t);

  return (
    <div className="fixed inset-0 z-[80] flex bg-background">
      {/* Copilot */}
      <aside className="w-[34%] min-w-[320px] flex flex-col border-r border-primary/25 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 shrink-0">
          <div>
            <div className="font-syne font-extrabold tracking-[0.18em] text-primary text-sm">NOVA COPILOT</div>
            <div className="text-[0.55rem] text-muted-foreground tracking-[0.2em] uppercase">Agent · Desktop Mode</div>
          </div>
          <button onClick={onExit} className="chip-hud hover:text-primary">✕ Esci</button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">{chat}</div>
        <div className="h-[30%] min-h-[140px] border-t border-primary/20 flex flex-col shrink-0">
          <div className="px-4 py-2 flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="chip-hud">LIVE AGENT FEED</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-3 font-mono text-[0.65rem] space-y-1 scrollbar-thin">
            {log.map(l => (
              <div key={l.id} className="flex gap-2" style={{ animation: 'msg-in 0.3s ease' }}>
                <span className="text-muted-foreground shrink-0">{l.time}</span>
                <span className="text-foreground">{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Desktop */}
      <section className="flex-1 flex flex-col min-w-0">
        <div ref={deskRef} className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 p-5 grid grid-flow-col grid-rows-[repeat(auto-fill,88px)] auto-cols-[84px] gap-2 content-start">
            {APPS.map(a => (
              <button key={a.tab} onDoubleClick={() => open(a.tab)} onClick={() => open(a.tab)}
                className="flex flex-col items-center justify-center gap-1 rounded-xl hover:bg-primary/10 transition-colors">
                <span className="text-3xl drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]">{a.icon}</span>
                <span className="text-[0.6rem] font-mono text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
          {wins.filter(w => !w.min).map(w => (
            <div key={w.id} onPointerDown={() => focus(w.id)}
              className="absolute hud-card rounded-xl overflow-hidden flex flex-col shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.5)]"
              style={{ left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z }}>
              <div className="flex items-center justify-between px-3 py-1.5 bg-primary/10 border-b border-primary/20 cursor-move select-none touch-none shrink-0"
                onPointerDown={e => { drag.current = { id: w.id, dx: e.nativeEvent.offsetX, dy: e.nativeEvent.offsetY }; }}>
                <span className="text-[0.7rem] font-mono">{title(w.tab)?.icon} {title(w.tab)?.label}</span>
                <div className="flex gap-1.5" onPointerDown={e => e.stopPropagation()}>
                  <button onClick={() => setWins(ws => ws.map(x => x.id === w.id ? { ...x, min: true } : x))} className="w-3 h-3 rounded-full bg-accent" aria-label="Riduci" />
                  <button onClick={() => setWins(ws => ws.filter(x => x.id !== w.id))} className="w-3 h-3 rounded-full bg-destructive" aria-label="Chiudi" />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-auto flex flex-col">{renderPanel(w.tab)}</div>
              <div className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize touch-none"
                onPointerDown={e => { e.stopPropagation(); drag.current = { id: w.id, dx: 0, dy: 0, resize: true }; }} />
            </div>
          ))}
        </div>
        {/* Taskbar */}
        <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-t border-primary/20 bg-background/80 backdrop-blur-xl">
          <span className="font-syne font-extrabold text-primary text-xs tracking-[0.2em] mr-2">NOVA OS</span>
          {wins.map(w => (
            <button key={w.id} onClick={() => { setWins(ws => ws.map(x => x.id === w.id ? { ...x, min: false } : x)); focus(w.id); }}
              className={`px-2.5 py-1 rounded-md text-[0.65rem] font-mono border ${w.min ? 'border-border text-muted-foreground' : 'border-primary/40 bg-primary/10 text-primary'}`}>
              {title(w.tab)?.icon} {title(w.tab)?.label}
            </button>
          ))}
          <span className="ml-auto font-mono text-[0.7rem] text-muted-foreground">{clock}</span>
        </div>
      </section>
    </div>
  );
};

export default DesktopMode;
