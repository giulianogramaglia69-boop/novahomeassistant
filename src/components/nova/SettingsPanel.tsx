import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Profile } from '@/lib/types';
import { useTheme, THEMES, ThemeId } from '@/hooks/useTheme';
import { MemoryItem } from '@/hooks/useAIMemory';

interface NotifSettings {
  calendar: boolean;
  timer: boolean;
  weather: boolean;
}

interface Props {
  onClearChat: () => void;
  onDetectLocation: () => void;
  profile: Profile;
  onLogout: () => void;
  notifSettings: NotifSettings;
  onNotifSettingChange: (key: keyof NotifSettings, val: boolean) => void;
  ttsEnabled: boolean;
  onTtsToggle: () => void;
  memoryItems: MemoryItem[];
  onForgetMemory: (id: string) => void;
}

const ST_KEY = 'nova_smartthings_token';

const SettingsPanel = ({
  onClearChat, onDetectLocation, profile, onLogout,
  notifSettings, onNotifSettingChange,
  ttsEnabled, onTtsToggle,
  memoryItems, onForgetMemory,
}: Props) => {
  const { theme, setTheme } = useTheme();
  const [stToken, setStToken] = useState(() => localStorage.getItem(ST_KEY) || '');
  const [saving, setSaving] = useState(false);

  const handleSaveToken = async () => {
    if (!stToken.trim()) return;
    setSaving(true);
    try {
      localStorage.setItem(ST_KEY, stToken.trim());
      const { error } = await supabase.functions.invoke('update-smartthings-token', {
        body: { token: stToken.trim() },
      });
      if (error) {
        toast({ title: 'Token salvato localmente', description: 'Errore aggiornamento backend.' });
      } else {
        toast({ title: 'Token aggiornato ✓' });
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile aggiornare il token.' });
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = profile.name === 'Admin';

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scrollbar-thin">

      {/* ─── PROFILO ─── */}
      <Section title="👤 Profilo">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{profile.emoji}</span>
            <div>
              <div className="text-sm font-bold text-foreground">{profile.name}</div>
              <div className="text-[0.6rem] text-muted-foreground">{isAdmin ? 'Amministratore' : 'Utente'}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive font-mono text-[0.65rem] font-semibold transition-all hover:bg-destructive/20 active:scale-95"
          >
            Logout
          </button>
        </div>
      </Section>

      {/* ─── AUDIO & VOCE ─── */}
      <Section title="🔊 Audio & Voce">
        <ToggleRow
          label="Text-to-Speech"
          sub="Leggi le risposte ad alta voce"
          enabled={ttsEnabled}
          onToggle={onTtsToggle}
        />
      </Section>

      {/* ─── NOTIFICHE ─── */}
      <Section title="🔔 Notifiche">
        <ToggleRow
          label="Calendario"
          sub="Avviso 15 min prima degli eventi"
          enabled={notifSettings.calendar}
          onToggle={() => onNotifSettingChange('calendar', !notifSettings.calendar)}
        />
        <ToggleRow
          label="Timer"
          sub="Notifica al completamento"
          enabled={notifSettings.timer}
          onToggle={() => onNotifSettingChange('timer', !notifSettings.timer)}
        />
        <ToggleRow
          label="Meteo avverso"
          sub="Allerte per condizioni severe"
          enabled={notifSettings.weather}
          onToggle={() => onNotifSettingChange('weather', !notifSettings.weather)}
        />
      </Section>

      {/* ─── SISTEMA ─── */}
      <Section title="⚙️ Sistema">
        <ActionRow label="Posizione" sub="Rileva la tua posizione GPS" action={
          <Btn onClick={onDetectLocation}>Rileva</Btn>
        } />
        <ActionRow label="Svuota chat" sub="Cancella tutta la cronologia AI" action={
          <Btn onClick={onClearChat} variant="danger">Svuota</Btn>
        } />
      </Section>

      {/* ─── TEMA ─── */}
      <div>
        <div className="font-syne text-[0.6rem] font-bold tracking-[0.18em] text-muted-foreground uppercase mb-2">🎨 Tema</div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id as ThemeId)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                theme === t.id ? 'bg-primary/15 border-primary/50' : 'bg-card border-border'
              }`}>
              <div className="text-xl">{t.emoji}</div>
              <div className="text-[0.7rem] font-bold text-foreground mt-1">{t.name}</div>
              <div className="text-[0.55rem] text-muted-foreground">{t.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── AI ─── */}
      <Section title="🤖 Intelligenza Artificiale">
        <ActionRow label="AI Gateway" sub="Powered by AcquaAI" action={
          <span className="text-accent text-[0.65rem] font-semibold">Attivo ✓</span>
        } />
      </Section>

      {/* ─── MEMORIA AI ─── */}
      <div>
        <div className="font-syne text-[0.6rem] font-bold tracking-[0.18em] text-muted-foreground uppercase mb-2">
          🧠 Memoria a lungo termine ({memoryItems.length})
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {memoryItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-[0.65rem] text-muted-foreground">
              L'AI imparerà preferenze e fatti su di te col tempo.
            </div>
          ) : (
            <div className="divide-y divide-border max-h-60 overflow-y-auto scrollbar-thin">
              {memoryItems.map(m => (
                <div key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.7rem] font-bold text-primary truncate">{m.key}</div>
                    <div className="text-[0.65rem] text-foreground truncate">{m.value}</div>
                  </div>
                  <button onClick={() => onForgetMemory(m.id)}
                    className="text-destructive/70 hover:text-destructive text-sm shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* ─── DISPOSITIVI (solo Admin) ─── */}
      {isAdmin && (
        <Section title="🔧 Dispositivi (Admin)">
          <div>
            <div className="mb-2">
              <div className="text-[0.75rem] text-foreground">SmartThings Token</div>
              <div className="text-[0.6rem] text-muted-foreground mt-0.5">Personal Access Token per SmartThings API</div>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={stToken}
                onChange={e => setStToken(e.target.value)}
                placeholder="Incolla il token..."
                className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-mono text-[0.65rem] outline-none focus:border-primary/40 placeholder:text-muted-foreground min-w-0"
              />
              <Btn onClick={handleSaveToken} disabled={!stToken.trim() || saving}>
                {saving ? '...' : 'Salva'}
              </Btn>
            </div>
          </div>
        </Section>
      )}

      {/* ─── FOOTER ─── */}
      <div className="mt-auto pt-6 text-center text-[0.55rem] text-muted-foreground leading-relaxed space-y-1">
        <p>NOVA v1.0 · Made by Giuliano Gramaglia</p>
        <p>Powered by AcquaAI</p>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div className="font-syne text-[0.6rem] font-bold tracking-[0.18em] text-muted-foreground uppercase mb-2">{title}</div>
    <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
      {Array.isArray(children)
        ? children.map((child, i) => <div key={i} className="px-4 py-3">{child}</div>)
        : <div className="px-4 py-3">{children}</div>
      }
    </div>
  </div>
);

const ActionRow = ({ label, sub, action }: { label: string; sub: string; action: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-[0.75rem] text-foreground">{label}</div>
      <div className="text-[0.6rem] text-muted-foreground mt-0.5">{sub}</div>
    </div>
    {action}
  </div>
);

const ToggleRow = ({ label, sub, enabled, onToggle }: { label: string; sub: string; enabled: boolean; onToggle: () => void }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-[0.75rem] text-foreground">{label}</div>
      <div className="text-[0.6rem] text-muted-foreground mt-0.5">{sub}</div>
    </div>
    <button
      onClick={onToggle}
      className={`w-10 h-[22px] rounded-full relative transition-colors ${enabled ? 'bg-accent' : 'bg-muted'}`}
    >
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'left-[22px]' : 'left-[3px]'}`} />
    </button>
  </div>
);

const Btn = ({ children, onClick, disabled, variant }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'danger' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 border rounded-lg font-mono text-[0.65rem] cursor-pointer transition-all active:scale-95 disabled:opacity-40 ${
      variant === 'danger'
        ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
        : 'border-border bg-secondary text-foreground hover:border-primary hover:text-primary'
    }`}
  >
    {children}
  </button>
);

export default SettingsPanel;
