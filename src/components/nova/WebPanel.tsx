import { useState, useRef } from 'react';

const WebPanel = () => {
  const [url, setUrl] = useState('https://glowsearch.lovable.app');
  const [input, setInput] = useState('https://glowsearch.lovable.app');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const go = (target: string) => {
    let u = target.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) {
      // treat as search query
      u = `https://glowsearch.lovable.app/?q=${encodeURIComponent(u)}`;
    }
    setUrl(u);
    setInput(u);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card/40 backdrop-blur-md">
        <button
          onClick={() => iframeRef.current?.contentWindow?.history.back()}
          className="px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/70 transition"
          title="Indietro"
        >
          ←
        </button>
        <button
          onClick={() => iframeRef.current && (iframeRef.current.src = url)}
          className="px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/70 transition"
          title="Ricarica"
        >
          ↻
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && go(input)}
          placeholder="Cerca o inserisci URL"
          className="flex-1 px-3 py-2 rounded-lg bg-input/60 border border-border text-sm font-mono outline-none focus:border-primary"
        />
        <button
          onClick={() => go(input)}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
        >
          Vai
        </button>
        <button
          onClick={() => go('https://glowsearch.lovable.app')}
          className="px-3 py-2 text-sm rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition"
          title="Home GlowSearch"
        >
          🏠
        </button>
      </div>
      <iframe
        ref={iframeRef}
        src={url}
        className="flex-1 w-full bg-white"
        title="GlowSearch"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

export default WebPanel;
