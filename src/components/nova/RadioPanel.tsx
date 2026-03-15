import { RadioStation } from '@/lib/types';

interface Props {
  stations: RadioStation[];
  playing: string | null;
  loading: boolean;
  volume: number;
  onToggle: (id: string) => void;
  onVolumeChange: (v: number) => void;
}

const EqBar = ({ delay }: { delay: number }) => (
  <div
    className="w-[3px] rounded-full bg-primary"
    style={{
      animation: `eq-bounce 0.6s ${delay}s ease-in-out infinite alternate`,
    }}
  />
);

const Equalizer = () => (
  <div className="flex items-end gap-[2px] h-4">
    <EqBar delay={0} />
    <EqBar delay={0.15} />
    <EqBar delay={0.3} />
    <EqBar delay={0.1} />
    <EqBar delay={0.25} />
  </div>
);

const RadioPanel = ({ stations, playing, loading, volume, onToggle, onVolumeChange }: Props) => {
  const currentStation = stations.find(s => s.id === playing);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
      {/* Now playing */}
      {currentStation && (
        <div
          className="bg-card border border-primary/30 rounded-[16px] p-5 relative overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, hsl(${currentStation.color} / 0.15), transparent 70%), hsl(var(--card))`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[0.6rem] font-syne font-bold tracking-[0.2em] text-primary uppercase">
              In riproduzione
            </div>
            <Equalizer />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[12px] bg-primary/20 flex items-center justify-center text-[1.4rem]">
              {currentStation.icon}
            </div>
            <div className="flex-1">
              <div className="font-syne text-[0.9rem] font-bold">{currentStation.name}</div>
              <div className="text-[0.6rem] text-muted-foreground">Streaming live</div>
            </div>
            <button
              onClick={() => onToggle(currentStation.id)}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[1.1rem] shadow-[0_0_15px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.6)] transition-all"
            >
              ⏸
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2.5 mt-4">
            <span className="text-[0.65rem] text-muted-foreground">🔈</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={e => onVolumeChange(Number(e.target.value) / 100)}
              className="flex-1 h-[3px] rounded-sm bg-secondary appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_hsl(215_100%_61%/0.5)]"
            />
            <span className="text-[0.65rem] text-muted-foreground">🔊</span>
          </div>
        </div>
      )}

      {/* Stations list */}
      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
        Stazioni
      </div>
      <div className="flex flex-col gap-2">
        {stations.map(station => {
          const isPlaying = playing === station.id;
          const isLoading = loading && !playing && station.id === station.id; // simplified

          return (
            <button
              key={station.id}
              onClick={() => onToggle(station.id)}
              className={`flex items-center gap-3 bg-card border rounded-[14px] p-3.5 text-left transition-all relative overflow-hidden ${
                isPlaying ? 'border-primary/35' : 'border-border hover:border-primary/20'
              }`}
            >
              {isPlaying && (
                <div
                  className="absolute inset-0 rounded-[14px]"
                  style={{
                    background: `radial-gradient(ellipse at 0% 50%, hsl(${station.color} / 0.12), transparent 60%)`,
                  }}
                />
              )}
              <div className="relative flex items-center gap-3 flex-1">
                <div
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-[1.15rem] transition-all ${
                    isPlaying ? 'bg-primary/20' : 'bg-secondary'
                  }`}
                >
                  {station.icon}
                </div>
                <div className="flex-1">
                  <div className="font-syne text-[0.78rem] font-semibold">{station.name}</div>
                  <div className={`text-[0.58rem] mt-0.5 ${isPlaying ? 'text-primary' : 'text-muted-foreground'}`}>
                    {isPlaying ? '● In onda' : 'Tocca per ascoltare'}
                  </div>
                </div>
                {isPlaying && (
                  <div className="relative">
                    <Equalizer />
                  </div>
                )}
                {!isPlaying && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[0.85rem] text-muted-foreground">
                    ▶
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="text-[0.7rem] text-muted-foreground animate-pulse text-center">
          Connessione allo stream...
        </div>
      )}
    </div>
  );
};

export default RadioPanel;
