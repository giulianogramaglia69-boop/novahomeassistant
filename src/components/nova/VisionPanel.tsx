import { useState } from 'react';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import { toast } from '@/hooks/use-toast';

interface Props {
  enabled: boolean;
  active: boolean;
  present: boolean;
  motionLevel: number;
  onToggle: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  profileName?: string;
}

const VisionPanel = ({ enabled, active, present, motionLevel, onToggle, videoRef, profileName }: Props) => {
  const face = useFaceRecognition(videoRef);
  const [busy, setBusy] = useState<'enroll' | 'recognize' | null>(null);

  const handleEnroll = async () => {
    if (!profileName) return;
    setBusy('enroll');
    await face.enroll(profileName);
    setBusy(null);
  };

  const handleRecognize = async () => {
    setBusy('recognize');
    const m = await face.recognize();
    setBusy(null);
    if (m) {
      toast({ title: `Volto riconosciuto: ${m.profileName}`, description: `Affinità ${(100 - m.distance * 100).toFixed(0)}%` });
      window.dispatchEvent(new CustomEvent('nova-face-recognized', { detail: m.profileName }));
    } else {
      toast({ title: 'Nessun volto noto rilevato', description: 'Inquadra il viso o registralo prima.' });
    }
  };

  const enrolled = profileName ? face.profiles.some(p => p.profile_name === profileName) : false;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[0.75rem] text-foreground">Visione &amp; Presenza</div>
          <div className="text-[0.6rem] text-muted-foreground mt-0.5">
            Fotocamera frontale per rilevare presenza e volto. Elaborazione locale.
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
        <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
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

          {/* Face recognition controls */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[0.7rem] text-foreground font-semibold">Riconoscimento volto</div>
                <div className="text-[0.55rem] text-muted-foreground">
                  {face.profiles.length} volti registrati {enrolled && profileName ? `· ${profileName} ✓` : ''}
                </div>
              </div>
              {face.loading && <span className="text-[0.55rem] text-accent font-mono animate-pulse">CARICO MODELLI…</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleEnroll}
                disabled={!profileName || !active || busy !== null}
                className="px-3 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent font-mono text-[0.6rem] font-semibold disabled:opacity-40 active:scale-95 transition-all"
              >
                {busy === 'enroll' ? '...' : enrolled ? 'Aggiorna volto' : 'Registra volto'}
              </button>
              <button
                onClick={handleRecognize}
                disabled={!active || busy !== null || face.profiles.length === 0}
                className="px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary font-mono text-[0.6rem] font-semibold disabled:opacity-40 active:scale-95 transition-all"
              >
                {busy === 'recognize' ? '...' : 'Riconosci'}
              </button>
            </div>
            {face.profiles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {face.profiles.map(p => (
                  <span key={p.profile_name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border text-[0.55rem] font-mono">
                    {p.profile_name}
                    <button onClick={() => face.removeProfile(p.profile_name)} className="text-destructive/70 hover:text-destructive">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="text-[0.55rem] text-muted-foreground leading-relaxed">
            🔒 Privacy: i frame restano sul dispositivo. Solo il descrittore numerico del volto viene salvato.
          </p>
        </div>
      )}
    </div>
  );
};

export default VisionPanel;
