import { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { TabId } from '@/lib/types';

type Mode = 'pip' | 'half' | 'multi';
type Kind = 'web' | 'panel';

interface FloatingItem {
  id: string;
  title: string;
  src?: string;        // for web
  panelId?: TabId;     // for panel
  kind: Kind;
  mode: Mode;
  // PiP / multi position & size
  x: number;
  y: number;
  w: number;
  h: number;
  // half side
  side?: 'left' | 'right';
}

interface PendingChooser {
  id: string;
  target: string;
  title: string;
  kind: Kind;
  src?: string;
  panelId?: TabId;
}

const WEB_TARGETS: Record<string, { title: string; src: string }> = {
  maps: { title: '🗺️ Google Maps', src: 'https://maps.google.com/maps?q=Agrigento&t=m&z=12&output=embed' },
  mappe: { title: '🗺️ Google Maps', src: 'https://maps.google.com/maps?q=Agrigento&t=m&z=12&output=embed' },
  traffic: { title: '🚗 Traffico Live', src: 'https://maps.google.com/maps?q=Agrigento&t=m&layer=t&z=12&output=embed' },
  traffico: { title: '🚗 Traffico Live', src: 'https://maps.google.com/maps?q=Agrigento&t=m&layer=t&z=12&output=embed' },
  google: { title: '🌐 Google', src: 'https://www.google.com/webhp?igu=1' },
  youtube: { title: '▶️ YouTube', src: 'https://www.youtube.com' },
  windy: { title: '🌤️ Windy', src: 'https://www.windy.com/?37.310,13.585,9' },
};

const PANEL_TITLES: Partial<Record<TabId, string>> = {
  dashboard: '🏠 Dashboard',
  chat: '💬 Chat NOVA',
  home: '🏡 Casa',
  radio: '📻 Radio',
  meteo: '🌤️ Meteo',
  reminders: '📝 Note',
  timer: '⏱️ Timer',
  calendar: '📅 Calendario',
  ambiente: '🌊 Ambiente',
  news: '📰 News',
  web: '🌐 Web',
  messages: '✉️ Messaggi',
  shopping: '🛒 Spesa',
  traffic: '🚗 Traffico',
  settings: '⚙️ Impostazioni',
};

const PANEL_KEYS = Object.keys(PANEL_TITLES) as TabId[];

function normalizeDomain(s: string): string | null {
  const trimmed = s.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // bare domain like "google.com" or "youtube.com/watch"
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function resolveTarget(target: string, customUrl?: string, customTitle?: string):
  { kind: Kind; title: string; src?: string; panelId?: TabId } {
  if (customUrl) {
    const u = normalizeDomain(customUrl) || customUrl;
    return { kind: 'web', title: customTitle || u, src: u };
  }
  const key = target.toLowerCase().trim();
  // Panel?
  if (key.startsWith('panel:')) {
    const pid = key.slice(6) as TabId;
    if (PANEL_KEYS.includes(pid)) return { kind: 'panel', title: PANEL_TITLES[pid] || pid, panelId: pid };
  }
  if (PANEL_KEYS.includes(key as TabId)) {
    return { kind: 'panel', title: PANEL_TITLES[key as TabId] || key, panelId: key as TabId };
  }
  // Web preset
  if (WEB_TARGETS[key]) return { kind: 'web', ...WEB_TARGETS[key] };
  // URL or bare domain
  const url = normalizeDomain(target);
  if (url) return { kind: 'web', title: customTitle || target, src: url };
  // fallback web search
  return { kind: 'web', title: `🔎 ${target}`, src: `https://glowsearch.lovable.app/?q=${encodeURIComponent(target)}` };
}

interface Props {
  renderPanel?: (id: TabId) => ReactNode;
}

const FloatingHost = ({ renderPanel }: Props) => {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const [pending, setPending] = useState<PendingChooser | null>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);

  const openItem = useCallback((target: string, mode: Mode, customUrl?: string, customTitle?: string) => {
    const resolved = resolveTarget(target, customUrl, customTitle);
    const id = crypto.randomUUID();
    const w = window.innerWidth;
    const h = window.innerHeight;
    setItems(prev => {
      let pipW = 320, pipH = 240;
      if (mode === 'multi') { pipW = Math.min(360, Math.floor(w * 0.42)); pipH = Math.min(280, Math.floor(h * 0.45)); }
      pipW = Math.min(pipW, w - 24);
      pipH = Math.min(pipH, h - 24);
      // Cascade multi windows
      const offset = (prev.length % 5) * 24;
      const side: 'left' | 'right' = prev.some(i => i.mode === 'half' && i.side === 'right') ? 'left' : 'right';
      return [...prev, {
        id, kind: resolved.kind, title: resolved.title,
        src: resolved.src, panelId: resolved.panelId,
        mode,
        x: Math.max(8, w - pipW - 16 - offset),
        y: Math.max(8, h - pipH - 16 - offset),
        w: pipW, h: pipH,
        side,
      }];
    });
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const target = String(d.target || d.url || d.panel || '').trim();
      if (!target) return;
      const mode: Mode | 'ask' = d.mode || 'ask';
      if (mode === 'pip' || mode === 'half' || mode === 'multi') {
        openItem(target, mode, d.url, d.title);
      } else {
        const r = resolveTarget(target, d.url, d.title);
        setPending({ id: crypto.randomUUID(), target, title: r.title, kind: r.kind, src: r.src, panelId: r.panelId });
      }
    };
    window.addEventListener('nova-open-floating', h as EventListener);
    return () => window.removeEventListener('nova-open-floating', h as EventListener);
  }, [openItem]);

  const close = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const cycleMode = (id: string) => setItems(prev => prev.map(i => {
    if (i.id !== id) return i;
    const next: Mode = i.mode === 'pip' ? 'half' : i.mode === 'half' ? 'multi' : 'pip';
    return { ...i, mode: next };
  }));

  const onDragStart = (e: React.PointerEvent, item: FloatingItem) => {
    if (item.mode === 'half') return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id: item.id, offX: e.clientX - item.x, offY: e.clientY - item.y };
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setItems(prev => prev.map(i => {
      if (i.id !== d.id) return i;
      const x = Math.max(0, Math.min(window.innerWidth - i.w, e.clientX - d.offX));
      const y = Math.max(0, Math.min(window.innerHeight - i.h, e.clientY - d.offY));
      return { ...i, x, y };
    }));
  };
  const onDragEnd = () => { dragRef.current = null; };

  return (
    <>
      {/* Chooser dialog */}
      {pending && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div>
              <div className="text-[0.6rem] font-mono uppercase tracking-widest text-muted-foreground">
                {pending.kind === 'panel' ? 'Apri pannello' : 'Apri finestra'}
              </div>
              <div className="font-syne text-lg font-bold mt-1">{pending.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Come vuoi visualizzarla?</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { openItem(pending.target, 'pip'); setPending(null); }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary transition active:scale-95"
              >
                <div className="w-12 h-9 rounded-md border-2 border-current relative">
                  <div className="absolute right-0.5 bottom-0.5 w-5 h-3 bg-current rounded-sm" />
                </div>
                <span className="text-[0.65rem] font-semibold">PiP</span>
              </button>
              <button
                onClick={() => { openItem(pending.target, 'half'); setPending(null); }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary transition active:scale-95"
              >
                <div className="w-12 h-9 rounded-md border-2 border-current flex">
                  <div className="w-1/2 h-full" />
                  <div className="w-1/2 h-full bg-current rounded-r-sm" />
                </div>
                <span className="text-[0.65rem] font-semibold">Metà</span>
              </button>
              <button
                onClick={() => { openItem(pending.target, 'multi'); setPending(null); }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary transition active:scale-95"
              >
                <div className="w-12 h-9 rounded-md border-2 border-current grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
                  <div className="bg-current/60 rounded-sm" />
                  <div className="bg-current/40 rounded-sm" />
                  <div className="bg-current/40 rounded-sm" />
                  <div className="bg-current/60 rounded-sm" />
                </div>
                <span className="text-[0.65rem] font-semibold">Multi</span>
              </button>
            </div>
            <button
              onClick={() => setPending(null)}
              className="w-full py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Floating windows */}
      {items.map(item => {
        const isHalf = item.mode === 'half';
        const style: React.CSSProperties = isHalf
          ? {
              position: 'fixed', top: 0,
              [item.side === 'left' ? 'left' : 'right']: 0,
              width: '50vw', height: '100dvh', zIndex: 150,
            }
          : { position: 'fixed', left: item.x, top: item.y, width: item.w, height: item.h, zIndex: 150 };
        const modeIcon = item.mode === 'pip' ? '◱' : item.mode === 'half' ? '▦' : '⬛';
        return (
          <div
            key={item.id}
            style={style}
            className={`bg-card border border-primary/40 shadow-2xl flex flex-col overflow-hidden ${isHalf ? (item.side === 'left' ? 'rounded-r-2xl' : 'rounded-l-2xl') : 'rounded-xl'} animate-in slide-in-from-right`}
          >
            <div
              onPointerDown={(e) => onDragStart(e, item)}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background/80 backdrop-blur-md ${!isHalf ? 'cursor-move' : ''}`}
            >
              <div className="text-xs font-syne font-bold truncate">{item.title}</div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => cycleMode(item.id)}
                  title={`Modalità: ${item.mode} (click per cambiare)`}
                  className="px-2 py-1 text-[0.6rem] font-mono rounded bg-muted hover:bg-primary/20 transition"
                >
                  {modeIcon}
                </button>
                <button
                  onClick={() => close(item.id)}
                  title="Chiudi"
                  className="px-2 py-1 text-[0.65rem] font-mono rounded bg-destructive/20 text-destructive hover:bg-destructive/40 transition"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden bg-background">
              {item.kind === 'web' && item.src && (
                <iframe
                  src={item.src}
                  title={item.title}
                  className="w-full h-full bg-white border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  loading="lazy"
                />
              )}
              {item.kind === 'panel' && item.panelId && renderPanel && (
                <div className="w-full h-full overflow-auto flex flex-col">
                  {renderPanel(item.panelId)}
                </div>
              )}
              {item.kind === 'panel' && !renderPanel && (
                <div className="p-4 text-xs text-muted-foreground">Renderer pannelli non disponibile.</div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default FloatingHost;
