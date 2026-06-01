import { useEffect, useRef, useState, useCallback } from 'react';

type Mode = 'pip' | 'half';

interface FloatingItem {
  id: string;
  title: string;
  src: string;
  mode: Mode;
  // PiP position
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PendingChooser {
  id: string;
  target: string;
  title: string;
  src: string;
}

const TARGET_MAP: Record<string, { title: string; src: string }> = {
  maps: { title: '🗺️ Google Maps', src: 'https://maps.google.com/maps?q=Agrigento&t=m&z=12&output=embed' },
  mappe: { title: '🗺️ Google Maps', src: 'https://maps.google.com/maps?q=Agrigento&t=m&z=12&output=embed' },
  traffic: { title: '🚗 Traffico Live', src: 'https://maps.google.com/maps?q=Agrigento&t=m&layer=t&z=12&output=embed' },
  traffico: { title: '🚗 Traffico Live', src: 'https://maps.google.com/maps?q=Agrigento&t=m&layer=t&z=12&output=embed' },
  web: { title: '🌐 GlowSearch', src: 'https://glowsearch.lovable.app' },
  google: { title: '🌐 Google', src: 'https://www.google.com/webhp?igu=1' },
  youtube: { title: '▶️ YouTube', src: 'https://www.youtube.com' },
  meteo: { title: '🌤️ Meteo', src: 'https://www.windy.com/?37.310,13.585,9' },
  windy: { title: '🌤️ Windy', src: 'https://www.windy.com/?37.310,13.585,9' },
};

function resolveTarget(target: string, customUrl?: string, customTitle?: string) {
  if (customUrl) return { title: customTitle || customUrl, src: customUrl };
  const key = target.toLowerCase().trim();
  if (TARGET_MAP[key]) return TARGET_MAP[key];
  if (/^https?:\/\//i.test(target)) return { title: customTitle || target, src: target };
  // fallback web search
  return { title: `🔎 ${target}`, src: `https://glowsearch.lovable.app/?q=${encodeURIComponent(target)}` };
}

const FloatingHost = () => {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const [pending, setPending] = useState<PendingChooser | null>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);

  const openItem = useCallback((target: string, mode: Mode, customUrl?: string, customTitle?: string) => {
    const { title, src } = resolveTarget(target, customUrl, customTitle);
    const id = crypto.randomUUID();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pipW = Math.min(320, w - 24);
    const pipH = Math.min(240, h - 24);
    setItems(prev => [...prev, {
      id, title, src, mode,
      x: w - pipW - 16,
      y: h - pipH - 16,
      w: pipW, h: pipH,
    }]);
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const target = String(d.target || d.url || '').trim();
      if (!target) return;
      const mode: Mode | 'ask' = d.mode || 'ask';
      if (mode === 'pip' || mode === 'half') {
        openItem(target, mode, d.url, d.title);
      } else {
        const { title, src } = resolveTarget(target, d.url, d.title);
        setPending({ id: crypto.randomUUID(), target, title, src });
      }
    };
    window.addEventListener('nova-open-floating', h as EventListener);
    return () => window.removeEventListener('nova-open-floating', h as EventListener);
  }, [openItem]);

  const close = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const setMode = (id: string, mode: Mode) => setItems(prev => prev.map(i => i.id === id ? { ...i, mode } : i));

  const onDragStart = (e: React.PointerEvent, item: FloatingItem) => {
    if (item.mode !== 'pip') return;
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
              <div className="text-[0.6rem] font-mono uppercase tracking-widest text-muted-foreground">Apri finestra</div>
              <div className="font-syne text-lg font-bold mt-1">{pending.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Come vuoi visualizzarla?</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { openItem(pending.target, 'pip'); setPending(null); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary transition active:scale-95"
              >
                <div className="w-14 h-10 rounded-md border-2 border-current relative">
                  <div className="absolute right-0.5 bottom-0.5 w-6 h-4 bg-current rounded-sm" />
                </div>
                <span className="text-xs font-semibold">Picture in Picture</span>
              </button>
              <button
                onClick={() => { openItem(pending.target, 'half'); setPending(null); }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary transition active:scale-95"
              >
                <div className="w-14 h-10 rounded-md border-2 border-current flex">
                  <div className="w-1/2 h-full" />
                  <div className="w-1/2 h-full bg-current rounded-r-sm" />
                </div>
                <span className="text-xs font-semibold">Metà schermo</span>
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
          ? { position: 'fixed', top: 0, right: 0, width: '50vw', height: '100dvh', zIndex: 150 }
          : { position: 'fixed', left: item.x, top: item.y, width: item.w, height: item.h, zIndex: 150 };
        return (
          <div
            key={item.id}
            style={style}
            className={`bg-card border border-primary/40 shadow-2xl flex flex-col overflow-hidden ${isHalf ? 'rounded-l-2xl' : 'rounded-xl'} animate-in slide-in-from-right`}
          >
            <div
              onPointerDown={(e) => onDragStart(e, item)}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              className={`flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background/80 backdrop-blur-md ${item.mode === 'pip' ? 'cursor-move' : ''}`}
            >
              <div className="text-xs font-syne font-bold truncate">{item.title}</div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setMode(item.id, item.mode === 'pip' ? 'half' : 'pip')}
                  title={item.mode === 'pip' ? 'Metà schermo' : 'Picture in Picture'}
                  className="px-2 py-1 text-[0.6rem] font-mono rounded bg-muted hover:bg-primary/20 transition"
                >
                  {item.mode === 'pip' ? '⬛' : '◱'}
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
            <iframe
              src={item.src}
              title={item.title}
              className="flex-1 w-full bg-white border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              loading="lazy"
            />
          </div>
        );
      })}
    </>
  );
};

export default FloatingHost;
