import { AmbientSound } from '@/hooks/useAmbientSounds';

interface Props {
  sounds: AmbientSound[];
  playing: string | null;
  volume: number;
  onToggle: (id: string) => void;
  onVolumeChange: (v: number) => void;
}

const AmbientePanel = ({ sounds, playing, volume, onToggle, onVolumeChange }: Props) => (
  <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-4">
    <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-1">Suoni Ambiente</div>

    <div className="grid grid-cols-1 gap-3">
      {sounds.map(s => {
        const isPlaying = playing === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onToggle(s.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] ${
              isPlaying
                ? 'border-primary/30 bg-primary/10'
                : 'border-border bg-card hover:border-primary/20'
            }`}
          >
            <span className="text-3xl">{s.icon}</span>
            <div className="flex-1 text-left">
              <span className={`font-syne font-bold text-sm ${isPlaying ? 'text-foreground' : 'text-muted-foreground'}`}>{s.name}</span>
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-3 mt-1">
                  {[0, 1, 2, 3].map(i => (
                    <span key={i} className="w-[3px] bg-primary rounded-full" style={{
                      animation: `eq-bounce 0.${3 + i}s ease-in-out infinite alternate`,
                      height: `${4 + i * 3}px`,
                    }} />
                  ))}
                </div>
              )}
            </div>
            <span className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-accent' : 'bg-muted-foreground/30'}`} />
          </button>
        );
      })}
    </div>

    {/* Volume */}
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-syne text-[0.65rem] font-bold tracking-wider uppercase">Volume</span>
        <span className="font-mono text-[0.65rem] text-muted-foreground">{Math.round(volume * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={e => onVolumeChange(parseFloat(e.target.value))}
        className="w-full accent-primary h-1"
      />
    </div>

    <p className="text-[0.55rem] text-muted-foreground text-center mt-2">
      I suoni si riprodurranno in loop continuo
    </p>
  </div>
);

export default AmbientePanel;
