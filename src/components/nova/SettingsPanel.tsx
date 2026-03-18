interface Props {
  onClearChat: () => void;
  onDetectLocation: () => void;
}

const SettingsPanel = ({ onClearChat, onDetectLocation }: Props) => (
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

    <div className="mt-auto pt-6 text-center text-[0.55rem] text-muted-foreground leading-relaxed space-y-1">
      <p>NOVA v1.0 · Made by Giuliano Gramaglia</p>
      <p>Powered by AcquaAI</p>
    </div>
  </div>
);

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
