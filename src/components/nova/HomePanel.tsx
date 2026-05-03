import { useEffect, useMemo } from 'react';
import { Device } from '@/lib/types';
import { SCENES, SMART_ROOM_MAP, Scene } from '@/lib/devices';
import { SmartThingsDevice } from '@/hooks/useSmartThings';
import { useEnergyUsage, TrackedDevice } from '@/hooks/useEnergyUsage';
import TvRemote from './TvRemote';

interface Props {
  devices: Device[];
  devicesOn: number;
  totalWattage: number;
  onToggle: (id: string) => void;
  onValueChange: (id: string, value: number) => void;
  onScene: (sceneId: string) => Scene | undefined;
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

const SMART_WATTAGE: Record<string, number> = { tv: 120, washer: 2000, other: 50 };

const HomePanel = ({
  devices, onToggle, onValueChange, onScene,
  smartDevices, smartLoading, smartError, onSmartToggle, onSmartFetch, onSmartCommand,
}: Props) => {
  useEffect(() => { onSmartFetch(); }, []);

  const tracked: TrackedDevice[] = useMemo(() => [
    ...devices.map(d => ({ id: `loc-${d.id}`, label: d.name, room: d.room, wattage: d.wattage, on: d.on })),
    ...smartDevices.map(d => ({ id: `st-${d.deviceId}`, label: d.label, room: SMART_ROOM_MAP[d.type] || 'Altro', wattage: SMART_WATTAGE[d.type] || 50, on: d.on })),
  ], [devices, smartDevices]);
  const energy = useEnergyUsage(tracked);

  const handleScene = (id: string) => {
    const scene = onScene(id);
    if (!scene?.smart) return;
    if (scene.smart.tv) {
      const tv = smartDevices.find(d => d.type === 'tv');
      if (tv) onSmartCommand(tv.deviceId, 'switch', scene.smart.tv);
    }
    if (scene.smart.washer) {
      const w = smartDevices.find(d => d.type === 'washer');
      if (w) onSmartCommand(w.deviceId, 'switch', scene.smart.washer);
    }
  };

  const rooms = useMemo(() => {
    const map = new Map<string, { local: Device[]; smart: SmartThingsDevice[] }>();
    for (const d of devices) {
      if (!map.has(d.room)) map.set(d.room, { local: [], smart: [] });
      map.get(d.room)!.local.push(d);
    }
    for (const s of smartDevices) {
      const room = SMART_ROOM_MAP[s.type] || 'Altro';
      if (!map.has(room)) map.set(room, { local: [], smart: [] });
      map.get(room)!.smart.push(s);
    }
    const priority = ['Salotto', 'Bagno'];
    return Array.from(map.entries()).sort(([a], [b]) => {
      const pa = priority.indexOf(a); const pb = priority.indexOf(b);
      if (pa !== -1 && pb !== -1) return pa - pb;
      if (pa !== -1) return -1;
      if (pb !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [devices, smartDevices]);

  const allOn = devices.filter(d => d.on).length + smartDevices.filter(d => d.on).length;
  const allTotal = devices.length + smartDevices.length;
  const liveWattage = devices.filter(d => d.on).reduce((s, d) => s + d.wattage, 0)
    + smartDevices.filter(d => d.on).reduce((s, d) => s + (SMART_WATTAGE[d.type] || 0), 0);

  const byDevice = energy.byDevice();
  const maxKwh = byDevice[0]?.kwh || 1;

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
      {smartLoading && <div className="text-[0.7rem] text-muted-foreground animate-pulse">Caricamento dispositivi...</div>}
      {smartError && <div className="text-[0.7rem] text-destructive">{smartError}</div>}

      <div>
        <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Scene</div>
        <div className="grid grid-cols-2 gap-2">
          {SCENES.map(scene => (
            <button
              key={scene.id}
              onClick={() => handleScene(scene.id)}
              className="bg-card border border-border rounded-[14px] p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="text-[1.1rem] mb-0.5">{scene.emoji}</div>
              <div className="font-syne text-[0.75rem] font-semibold">{scene.label}</div>
              <div className="text-[0.55rem] text-muted-foreground mt-0.5">{scene.description}</div>
            </button>
          ))}
        </div>
      </div>

      {rooms.map(([roomName, { local, smart }]) => (
        <div key={roomName}>
          <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">{roomName}</div>
          <div className="grid grid-cols-2 gap-2.5">
            {smart.map(device => (
              <div
                key={device.deviceId}
                className={`bg-card border rounded-[14px] p-3.5 cursor-pointer transition-all relative overflow-hidden ${device.on ? 'border-primary/35' : 'border-border'}`}
                onClick={() => onSmartToggle(device.deviceId)}
              >
                {device.on && <div className="absolute inset-0 rounded-[14px]" style={{ background: SMART_GLOW[device.type] }} />}
                <div className="relative">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[1.1rem] transition-all ${device.on ? 'bg-primary/20' : 'bg-secondary'}`}>
                      {device.icon}
                    </div>
                    <div className={`w-8 h-[18px] rounded-[9px] border transition-all ${device.on ? 'bg-primary border-primary shadow-[0_0_10px_hsl(215_100%_61%/0.4)]' : 'bg-secondary border-border'} relative`}>
                      <div className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-foreground transition-transform pointer-events-none ${device.on ? 'translate-x-[14px]' : ''}`} />
                    </div>
                  </div>
                  <div className="font-syne text-[0.75rem] font-semibold mb-0.5">{device.label}</div>
                  <div className="text-[0.6rem] text-muted-foreground">{device.type === 'tv' ? 'TV' : device.type === 'washer' ? 'Lavatrice' : 'Dispositivo'} · ~{SMART_WATTAGE[device.type]}W</div>
                  <div className={`text-[0.55rem] mt-1 ${device.on ? 'text-accent' : 'text-muted-foreground'}`}>
                    {device.on ? '● Acceso' : '○ Spento'}
                  </div>
                </div>
              </div>
            ))}
            {local.map(device => (
              <div
                key={device.id}
                className={`bg-card border rounded-[14px] p-3.5 cursor-pointer transition-all relative overflow-hidden ${device.on ? 'border-primary/35' : 'border-border'}`}
                onClick={() => onToggle(device.id)}
              >
                {device.on && <div className="absolute inset-0 rounded-[14px]" style={{ background: TYPE_GLOW[device.type] }} />}
                <div className="relative">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[1.1rem] transition-all ${device.on ? 'bg-primary/20' : 'bg-secondary'}`}>
                      {device.icon}
                    </div>
                    <div className={`w-8 h-[18px] rounded-[9px] border transition-all ${device.on ? 'bg-primary border-primary shadow-[0_0_10px_hsl(215_100%_61%/0.4)]' : 'bg-secondary border-border'} relative`}>
                      <div className={`absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-foreground transition-transform pointer-events-none ${device.on ? 'translate-x-[14px]' : ''}`} />
                    </div>
                  </div>
                  <div className="font-syne text-[0.75rem] font-semibold mb-0.5">{device.name}</div>
                  <div className="text-[0.6rem] text-muted-foreground">{device.wattage}W</div>
                  {device.on && device.value !== undefined && (
                    <div className="mt-2.5">
                      <input
                        type="range"
                        min={device.type === 'ac' ? 16 : 0}
                        max={device.type === 'ac' ? 30 : 100}
                        value={device.value}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); onValueChange(device.id, Number(e.target.value)); }}
                        className="w-full h-[3px] rounded-sm bg-secondary appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {smart.filter(d => d.type === 'tv').map(tv => (
            <div key={tv.deviceId} className="mt-2">
              <TvRemote deviceId={tv.deviceId} isOn={tv.on} onCommand={onSmartCommand} />
            </div>
          ))}
        </div>
      ))}

      <div>
        <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Consumi oggi</div>
        <div className="bg-card border border-border rounded-[14px] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[0.6rem] text-muted-foreground">Accesi ora</div>
              <div className="font-syne text-[0.85rem] font-bold">{allOn} di {allTotal} · {liveWattage}W</div>
            </div>
            <div className="text-right">
              <div className="text-[0.6rem] text-muted-foreground">Totale oggi</div>
              <div className="font-syne text-[1.4rem] font-extrabold text-accent leading-none">
                {energy.totalKwh.toFixed(2)}<span className="text-[0.6rem] ml-1">kWh</span>
              </div>
            </div>
          </div>
          {byDevice.length > 0 ? (
            <div className="space-y-1.5 pt-3 border-t border-border">
              {byDevice.slice(0, 6).map(d => (
                <div key={d.id}>
                  <div className="flex items-center justify-between text-[0.6rem] mb-0.5">
                    <span className="truncate">{d.label} <span className="text-muted-foreground">· {d.room}</span></span>
                    <span className="font-mono text-accent">{d.kwh.toFixed(3)} kWh</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${(d.kwh / maxKwh) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[0.6rem] text-muted-foreground text-center py-2 border-t border-border pt-3">
              Nessun consumo registrato oggi. Accendi un dispositivo per iniziare il tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePanel;
