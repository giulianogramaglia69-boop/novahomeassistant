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
      <p className="text-muted-foreground text-xs mb-8">Inserisci il PIN per accedere</p>

      <div className={`flex gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? error
                  ? 'bg-destructive border-destructive'
                  : 'bg-primary border-primary'
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

      <div className="grid grid-cols-3 gap-3 w-[260px]">
        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => (
          <button
            key={key || 'empty'}
            onClick={() => {
              if (key === '⌫') handleDelete();
              else if (key) handleDigit(key);
              inputRef.current?.focus();
            }}
            disabled={!key}
            className={`h-14 rounded-2xl text-lg font-syne font-bold transition-all active:scale-95 ${
              !key ? 'invisible' :
              key === '⌫'
                ? 'bg-secondary text-muted-foreground hover:bg-muted'
                : 'bg-card border border-border text-foreground hover:bg-secondary active:bg-muted'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-destructive text-xs mt-4 font-mono">PIN errato</p>
      )}
    </div>
  );
};

export default PinLock;
