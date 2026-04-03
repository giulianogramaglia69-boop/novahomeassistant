import { useEffect } from 'react';
import { Device } from '@/lib/types';
import { SCENES } from '@/lib/devices';
import { SmartThingsDevice } from '@/hooks/useSmartThings';
import TvRemote from './TvRemote';

interface Props {
  devices: Device[];
  devicesOn: number;
  totalWattage: number;
  onToggle: (id: string) => void;
  onValueChange: (id: string, value: number) => void;
  onScene: (sceneId: string) => void;
  smartDevices: SmartThingsDevice[];
  smartLoading: boolean;
  smartError: string | null;
  onSmartToggle: (deviceId: string) => void;
  onSmartFetch: () => void;
  onSmartCommand: (deviceId: string, capability: string, command: string, args?: any[]) => void;
}

const TYPE_GLOW: Record<string, string> = {
  light: 'radial-gradient(ellipse at 50% 0%, hsla(45,100%,66%,0.12), transparent 70%)',
  ac: 'radial-gradient(ellipse at 50% 0%, hsla(168,100%,45%,0.12), transparent 70%)',
  plug: 'radial-gradient(ellipse at 50% 0%, hsla(215,100%,61%,0.12), transparent 70%)',
  fan: 'radial-gradient(ellipse at 50% 0%, hsla(270,60%,70%,0.12), transparent 70%)',
};

const SMART_GLOW: Record<string, string> = {
  tv: 'radial-gradient(ellipse at 50% 0%, hsla(215,100%,61%,0.12), transparent 70%)',
  washer: 'radial-gradient(ellipse at 50% 0%, hsla(200,80%,55%,0.12), transparent 70%)',
  other: 'radial-gradient(ellipse at 50% 0%, hsla(270,60%,70%,0.12), transparent 70%)',
};

const HomePanel = ({
  devices, devicesOn, totalWattage, onToggle, onValueChange, onScene,
  smartDevices, smartLoading, smartError, onSmartToggle, onSmartFetch, onSmartCommand,
}: Props) => {
  useEffect(() => {
    onSmartFetch();
  }, []);

  const allOn = devicesOn + smartDevices.filter(d => d.on).length;
  const allTotal = devices.length + smartDevices.length;

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin">
      {/* SmartThings section */}
      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
        SmartThings
      </div>
      {smartLoading && (
        <div className="text-[0.7rem] text-muted-foreground animate-pulse">Caricamento dispositivi...</div>
      )}
      {smartError && (
        <div className="text-[0.7rem] text-destructive">{smartError}</div>
      )}
      {!smartLoading && smartDevices.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {smartDevices.map(device => (
            <div
              key={device.deviceId}
              className={`bg-card border rounded-[14px] p-3.5 cursor-pointer transition-all relative overflow-hidden ${
                device.on ? 'border-primary/35' : 'border-border'
              }`}
              onClick={() => onSmartToggle(device.deviceId)}
            >
              {device.on && (
                <div className="absolute inset-0 rounded-[14px]" style={{ background: SMART_GLOW[device.type] }} />
              )}
              <div className="relative">
                <div className="flex items-start justify-between mb-2.5">
                  <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[1.1rem] transition-all ${
                    device.on ? 'bg-primary/20' : 'bg-secondary'
                  }`}>
                    {device.icon}
                  </div>
                  <div className="w-8 h-[18px] relative" onClick={e => { e.stopPropagation(); onSmartToggle(device.deviceId); }}>
                    <div className={`w-8 h-[18px] rounded-[9px] border transition-all cursor-pointer ${
                      device.on
                        ? 'bg-primary border-primary shadow-[0_0_10px_hsl(215_100%_61%/0.4)]'
                        : 'bg-secondary border-border'
                    }`}>
                      <div className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-foreground transition-transform pointer-events-none ${
                        device.on ? 'translate-x-[14px]' : ''
                      }`} />
                    </div>
                  </div>
                </div>
                <div className="font-syne text-[0.75rem] font-semibold mb-0.5">{device.label}</div>
                <div className="text-[0.6rem] text-muted-foreground">
                  {device.type === 'tv' ? 'TV' : device.type === 'washer' ? 'Lavatrice' : 'Dispositivo'}
                </div>
                <div className={`text-[0.55rem] mt-1 ${device.on ? 'text-accent' : 'text-muted-foreground'}`}>
                  {device.on ? '● Acceso' : '○ Spento'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!smartLoading && smartDevices.length === 0 && !smartError && (
        <div className="text-[0.65rem] text-muted-foreground">Nessun dispositivo SmartThings trovato</div>
      )}

      {/* Local devices */}
      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mt-2">Soggiorno</div>
      <div className="grid grid-cols-2 gap-2.5">
        {devices.map(device => (
          <div
            key={device.id}
            className={`bg-card border rounded-[14px] p-3.5 cursor-pointer transition-all relative overflow-hidden ${
              device.on ? 'border-primary/35' : 'border-border'
            }`}
            onClick={() => onToggle(device.id)}
          >
            {device.on && (
              <div className="absolute inset-0 rounded-[14px]" style={{ background: TYPE_GLOW[device.type] }} />
            )}
            <div className="relative">
              <div className="flex items-start justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[1.1rem] transition-all ${
                  device.on ? 'bg-primary/20' : 'bg-secondary'
                }`}>
                  {device.icon}
                </div>
                <div className="w-8 h-[18px] relative" onClick={e => { e.stopPropagation(); onToggle(device.id); }}>
                  <div className={`w-8 h-[18px] rounded-[9px] border transition-all cursor-pointer ${
                    device.on
                      ? 'bg-primary border-primary shadow-[0_0_10px_hsl(215_100%_61%/0.4)]'
                      : 'bg-secondary border-border'
                  }`}>
                    <div className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-foreground transition-transform pointer-events-none ${
                      device.on ? 'translate-x-[14px]' : ''
                    }`} />
                  </div>
                </div>
              </div>
              <div className="font-syne text-[0.75rem] font-semibold mb-0.5">{device.name}</div>
              <div className="text-[0.6rem] text-muted-foreground">{device.room}</div>
              {device.on && device.value !== undefined && (
                <div className="mt-2.5">
                  <input
                    type="range"
                    min={device.type === 'ac' ? 16 : 0}
                    max={device.type === 'ac' ? 30 : 100}
                    value={device.value}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); onValueChange(device.id, Number(e.target.value)); }}
                    className="w-full h-[3px] rounded-sm bg-secondary appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_hsl(215_100%_61%/0.5)]"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mt-2">Scena rapida</div>
      <div className="flex gap-2 flex-wrap">
        {SCENES.map(scene => (
          <button
            key={scene.id}
            onClick={() => onScene(scene.id)}
            className="px-3 py-1.5 rounded-full text-[0.65rem] border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
          >
            {scene.label}
          </button>
        ))}
      </div>

      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mt-2">Consumi stimati</div>
      <div className="bg-card border border-border rounded-[14px] p-4 flex items-center justify-between">
        <div>
          <div className="text-[0.6rem] text-muted-foreground">Dispositivi accesi</div>
          <div className="font-syne text-[0.85rem] font-bold">{allOn} di {allTotal}</div>
        </div>
        <div className="font-syne text-[1.2rem] font-extrabold text-accent">{totalWattage}W</div>
      </div>
    </div>
  );
};

export default HomePanel;
