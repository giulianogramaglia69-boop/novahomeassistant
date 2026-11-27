import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Schermata di accesso famiglia: mostrata PRIMA del PIN finché non c'è
// una sessione Supabase Auth. L'account famiglia si crea nella dashboard
// Supabase (Authentication > Users): qui non c'è registrazione, solo login.
// A login avvenuto la sessione persiste (persistSession: true) e l'app
// procede con il PIN come prima.
const FamilyLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setError('Email o password errati. Riprova.');
    }
    // A login riuscito onAuthStateChange in Index imposta authed=true.
  };

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
        <div className="absolute w-[360px] h-[360px] rounded-full border border-accent/20"
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
      <p className="text-muted-foreground text-[0.65rem] tracking-[0.25em] uppercase mb-7">// Accesso famiglia</p>

      <form
        onSubmit={submit}
        className="hud-frame flex flex-col gap-4 w-[300px] p-5 rounded-2xl bg-card/40 backdrop-blur-md border border-border"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="nova-email" className="text-xs tracking-widest uppercase text-muted-foreground">Email</Label>
          <Input
            id="nova-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="famiglia@email.it"
            className="bg-background/60"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nova-password" className="text-xs tracking-widest uppercase text-muted-foreground">Password</Label>
          <Input
            id="nova-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-background/60"
          />
        </div>
        {error && (
          <p className="text-destructive text-xs font-mono tracking-widest animate-pulse">{error}</p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="h-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white font-syne font-bold text-sm tracking-wide transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? 'Accesso in corso…' : 'Accedi'}
        </button>
        <p className="text-muted-foreground text-[0.65rem] text-center leading-relaxed">
          Usa l'account famiglia creato nella dashboard Supabase.
        </p>
      </form>
    </div>
  );
};

export default FamilyLogin;
