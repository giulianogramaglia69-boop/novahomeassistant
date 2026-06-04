import { useState, useRef, useEffect } from 'react';
import { Profile, ProfileName } from '@/lib/types';

const PINS: Record<string, ProfileName[]> = {
  '050891': ['Giuliano', 'Simone', 'Ilenia'],
  '000589': ['Admin'],
};

const PROFILES: Profile[] = [
  { name: 'Giuliano', emoji: '👨‍💻' },
  { name: 'Simone', emoji: '🧑' },
  { name: 'Ilenia', emoji: '👩' },
  { name: 'Admin', emoji: '🔧' },
];

interface Props {
  onUnlock: (profile: Profile) => void;
}

const PinLock = ({ onUnlock }: Props) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (pin.length === 6) {
      const allowedNames = PINS[pin];
      if (allowedNames) {
        const profiles = PROFILES.filter(p => allowedNames.includes(p.name));
        if (profiles.length === 1) {
          onUnlock(profiles[0]);
        } else {
          setAvailableProfiles(profiles);
        }
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPin('');
          setError(false);
          setShake(false);
          inputRef.current?.focus();
        }, 600);
      }
    }
  }, [pin, onUnlock]);

  const handleDigit = (d: string) => {
    if (pin.length < 6) setPin(prev => prev + d);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  if (availableProfiles) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-background select-none">
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6"
          style={{ animation: 'pulse-orb 3s ease-in-out infinite' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="font-syne font-extrabold text-xl tracking-[0.15em] text-foreground mb-1">NOVA</h1>
        <p className="text-muted-foreground text-xs mb-8">Seleziona il tuo profilo</p>
        <div className="flex flex-col gap-3 w-[260px]">
          {availableProfiles.map(profile => (
            <button
              key={profile.name}
              onClick={() => onUnlock(profile)}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card border border-border text-foreground font-syne font-bold text-sm tracking-wide transition-all hover:bg-secondary hover:border-primary/40 active:scale-[0.97]"
            >
              <span className="text-2xl">{profile.emoji}</span>
              <span>{profile.name}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => { setPin(''); setAvailableProfiles(null); }}
          className="mt-6 text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          ← Torna al PIN
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-dvh bg-background select-none overflow-hidden">
      {/* Orbital rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute w-[520px] h-[520px] rounded-full border border-primary/15"
          style={{ animation: 'hud-spin 28s linear infinite' }}
        >
          <span className="absolute -top-1 left-1/2 w-2 h-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
        </div>
        <div
          className="absolute w-[360px] h-[360px] rounded-full border border-accent/20"
          style={{ animation: 'hud-spin-rev 18s linear infinite' }}
        >
          <span className="absolute top-1/2 -right-1 w-1.5 h-1.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_hsl(var(--accent))]" />
        </div>
        <div className="absolute w-[240px] h-[240px] rounded-full border border-primary/10" />
      </div>

      {/* Core orb */}
      <div
        className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 glow-primary"
        style={{ animation: 'pulse-orb 3s ease-in-out infinite' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>

      <h1 className="font-syne font-extrabold text-3xl tracking-[0.28em] gradient-text text-glow mb-1.5">NOVA</h1>
      <p className="text-muted-foreground text-[0.65rem] tracking-[0.25em] uppercase mb-7">// Inserisci il PIN</p>

      <div className={`flex gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? error
                  ? 'bg-destructive border-destructive shadow-[0_0_12px_hsl(var(--destructive))]'
                  : 'bg-primary border-primary shadow-[0_0_14px_hsl(var(--primary))]'
                : 'border-muted-foreground/40 bg-transparent'
            }`}
          />
        ))}
      </div>

      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        maxLength={6}
        value={pin}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '').slice(0, 6);
          setPin(v);
          setError(false);
        }}
        className="absolute opacity-0 w-0 h-0"
        autoFocus
      />

      <div className="hud-frame grid grid-cols-3 gap-3 w-[260px] p-3 rounded-2xl bg-card/40 backdrop-blur-md border border-border">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
          <button
            key={key || 'empty'}
            onClick={() => {
              if (key === '⌫') handleDelete();
              else if (key) handleDigit(key);
              inputRef.current?.focus();
            }}
            disabled={!key}
            className={`h-14 rounded-xl text-lg font-syne font-bold transition-all active:scale-95 ${
              !key ? 'invisible' :
              key === '⌫'
                ? 'bg-secondary/70 text-muted-foreground hover:bg-muted'
                : 'bg-gradient-to-br from-card to-secondary/40 border border-primary/20 text-foreground hover:border-primary/50 hover:shadow-[0_0_18px_hsl(var(--primary)/0.25)]'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-destructive text-xs mt-4 font-mono tracking-widest animate-pulse">// PIN ERRATO</p>
      )}
    </div>
  );
};

export default PinLock;
