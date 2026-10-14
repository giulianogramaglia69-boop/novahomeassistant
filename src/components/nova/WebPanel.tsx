import { useState, useRef, useEffect } from 'react';
import { GOOGLE_HOME, toEmbeddable } from '@/lib/webEmbed';

const WebPanel = () => {
  const [url, setUrl] = useState(GOOGLE_HOME);
  const [input, setInput] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const go = (target: string) => {
    if (!target.trim()) return;
    const u = toEmbeddable(target);
    setUrl(u);
    setInput(target.trim());
  };

  useEffect(() => {
    const h = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') go(detail);
    };
    window.addEventListener('nova-web-go', h);
    return () => window.removeEventListener('nova-web-go', h);
  }, []);

  const external = () => window.open(input && /^https?:|\./.test(input) ? (input.startsWith('http') ? input : `https://${input}`) : url.replace('igu=1', ''), '_blank', 'noopener');

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card/40 backdrop-blur-md">
        <button onClick={() => iframeRef.current && (iframeRef.current.src = url)}
          className="px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/70 transition" title="Ricarica">↻</button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go(input)}
          placeholder="Cerca su Google o inserisci URL"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-input/60 border border-border text-sm font-mono outline-none focus:border-primary"
        />
        <button onClick={() => go(input)}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">Vai</button>
        <button onClick={external} className="px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/70 transition" title="Apri fuori da NOVA">↗</button>
        <button onClick={() => { setUrl(GOOGLE_HOME); setInput(''); }}
          className="px-3 py-2 text-sm rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition" title="Google">🏠</button>
      </div>
      <div className="px-3 py-1 text-[0.6rem] font-mono text-muted-foreground border-b border-border">
        Se un sito rifiuta la connessione, non permette di essere aperto dentro altre app: usa ↗ per aprirlo a parte.
      </div>
      <iframe
        key={url}
        ref={iframeRef}
        src={url}
        className="flex-1 w-full bg-white"
        title="Web"
        allow="autoplay; encrypted-media; fullscreen; clipboard-write; geolocation"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default WebPanel;
