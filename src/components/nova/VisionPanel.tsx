interface Props {
  enabled: boolean;
  active: boolean;
  present: boolean;
  motionLevel: number;
  onToggle: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VisionPanel = ({ enabled, active, present, motionLevel, onToggle, videoRef }: Props) => {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[0.75rem] text-foreground">Visione &amp; Presenza</div>
          <div className="text-[0.6rem] text-muted-foreground mt-0.5">
            Fotocamera frontale per rilevare la tua presenza. Elaborazione locale.
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${enabled ? 'bg-accent' : 'bg-muted'}`}
        >
          <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'left-[22px]' : 'left-[3px]'}`} />
        </button>
      </div>

      {enabled && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-black border border-border shrink-0">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {active && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[0.6rem] text-muted-foreground">Stato:</span>
                <span className={`text-[0.65rem] font-syne font-semibold ${active ? 'text-accent' : 'text-muted-foreground'}`}>
                  {active ? 'Attiva' : 'Spenta'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6rem] text-muted-foreground">Presenza:</span>
                <span className={`text-[0.65rem] font-syne font-semibold ${present ? 'text-primary' : 'text-muted-foreground'}`}>
                  {present ? 'Rilevata' : 'Assente'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[0.6rem] text-muted-foreground">Movimento:</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-200"
                    style={{ width: `${Math.min(100, motionLevel * 4)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="text-[0.55rem] text-muted-foreground mt-2 leading-relaxed">
            🔒 Privacy: nessun frame lascia il dispositivo. Solo statistiche di movimento.
          </p>
        </div>
      )}
    </div>
  );
};

export default VisionPanel;
