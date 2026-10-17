import { useState } from 'react';

const PRESETS = [
  { label: 'Top 50 Italia', uri: 'playlist/37i9dQZEVXbIQnj7RRhdSX' },
  { label: 'Today\'s Top Hits', uri: 'playlist/37i9dQZF1DXcBWIGoYBM5M' },
  { label: 'Hot Hits Italia', uri: 'playlist/37i9dQZF1DX6wfQutivYYr' },
  { label: 'Chill Lofi', uri: 'playlist/37i9dQZF1DWWQRwui0ExPn' },
  { label: 'Rock Classics', uri: 'playlist/37i9dQZF1DWXRqgorJj26U' },
];

const KID_YUGI_PRESETS = [
  { label: '🎤 Artista', uri: 'artist/0EUR8jz8L936AEbV2Spkca' },
  { label: 'Anche gli Eroi Muoiono', uri: 'album/5QGyZ7xyZX8vrwI4DB6pvV' },
  { label: 'I Nomi del Diavolo', uri: 'album/1WeHoP0y9QcQqgpa5xgMAh' },
];

function parse(input: string): string | null {
  const m = input.match(/(playlist|album|track|artist|show|episode)[/:]([A-Za-z0-9]+)/);
  return m ? `${m[1]}/${m[2]}` : null;
}

const SpotifyPanel = () => {
  const [uri, setUri] = useState(() => localStorage.getItem('nova_spotify_uri') || PRESETS[0].uri);
  const [input, setInput] = useState('');
  const select = (u: string) => { setUri(u); localStorage.setItem('nova_spotify_uri', u); };

  return (
    <div className="flex flex-col h-full gap-3 p-4 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-syne font-extrabold tracking-[0.18em] text-primary">🎧 SPOTIFY</h2>
        <button onClick={() => window.open(`https://open.spotify.com/${uri}`, '_blank', 'noopener')} className="chip-hud hover:text-primary">↗ Apri app</button>
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { const p = parse(input); if (p) { select(p); setInput(''); } } }}
          placeholder="Incolla link Spotify (playlist, album, brano)"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-input/60 border border-border text-sm font-mono outline-none focus:border-primary" />
        <button onClick={() => { const p = parse(input); if (p) { select(p); setInput(''); } }}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-semibold">Carica</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button key={p.uri} onClick={() => select(p.uri)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono border transition ${uri === p.uri ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <iframe key={uri} title="Spotify" src={`https://open.spotify.com/embed/${uri}?theme=0`}
        className="w-full flex-1 min-h-[380px] rounded-xl border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
      <p className="text-[0.6rem] font-mono text-muted-foreground">Accedi a Spotify nello stesso browser per ascoltare i brani completi.</p>
    </div>
  );
};

export default SpotifyPanel;
