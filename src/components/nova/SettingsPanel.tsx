import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Props {
  onClearChat: () => void;
  onDetectLocation: () => void;
}

const ST_KEY = 'nova_smartthings_token';

const SettingsPanel = ({ onClearChat, onDetectLocation }: Props) => {
  const [stToken, setStToken] = useState(() => localStorage.getItem(ST_KEY) || '');
  const [saving, setSaving] = useState(false);

  const handleSaveToken = async () => {
    if (!stToken.trim()) return;
    setSaving(true);
    try {
      localStorage.setItem(ST_KEY, stToken.trim());
      const { data, error } = await supabase.functions.invoke('update-smartthings-token', {
        body: { token: stToken.trim() },
      });
      if (error) {
        toast({ title: 'Token salvato localmente', description: 'Errore aggiornamento backend. Riprova.' });
      } else {
        toast({ title: 'Token aggiornato ✓', description: 'Il token SmartThings è stato aggiornato nel backend.' });
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile aggiornare il token nel backend.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">Impostazioni</div>

      <SettingsRow
        label="AI Gateway"
        sub="Powered by AcquaAI"
        action={<span className="text-accent text-[0.65rem]">Attivo ✓</span>}
      />

      <SettingsRow
        label="Svuota chat"
        sub="Cancella la cronologia"
        action={
          <button onClick={onClearChat} className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] cursor-pointer transition-all hover:border-primary hover:text-primary">
            Svuota
          </button>
        }
      />

      <SettingsRow
        label="Posizione"
        sub="Clic per rilevare"
        action={
          <button onClick={onDetectLocation} className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] cursor-pointer transition-all hover:border-primary hover:text-primary">
            Rileva
          </button>
        }
      />

      {/* SmartThings Token */}
      <div className="bg-card border border-border rounded-[12px] px-3.5 py-3">
        <div className="mb-2">
          <div className="text-[0.75rem]">SmartThings Token</div>
          <div className="text-[0.6rem] text-muted-foreground mt-0.5">Personal Access Token per i dispositivi</div>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            value={stToken}
            onChange={e => setStToken(e.target.value)}
            placeholder="Incolla il token..."
            className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-mono text-[0.65rem] outline-none focus:border-primary/40 placeholder:text-muted-foreground min-w-0"
          />
          <button
            onClick={handleSaveToken}
            disabled={!stToken.trim() || saving}
            className="px-3 py-1.5 border border-border rounded-lg bg-secondary text-foreground font-mono text-[0.65rem] cursor-pointer transition-all hover:border-primary hover:text-primary disabled:opacity-40"
          >
            {saving ? '...' : 'Salva'}
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6 text-center text-[0.55rem] text-muted-foreground leading-relaxed space-y-1">
        <p>NOVA v1.0 · Made by Giuliano Gramaglia</p>
        <p>Powered by AcquaAI</p>
      </div>
    </div>
  );
};

const SettingsRow = ({ label, sub, action }: { label: string; sub: string; action: React.ReactNode }) => (
  <div className="flex items-center justify-between bg-card border border-border rounded-[12px] px-3.5 py-3">
    <div>
      <div className="text-[0.75rem]">{label}</div>
      <div className="text-[0.6rem] text-muted-foreground mt-0.5">{sub}</div>
    </div>
    {action}
  </div>
);

export default SettingsPanel;
