import { BridgeDevicesHook } from '@/hooks/useBridgeDevices';
import { CalendarEvent } from '@/hooks/useCalendar';
import { ShoppingItem } from '@/hooks/useShoppingList';
import { Reminder, TabId } from '@/lib/types';
import HomeSummary from './HomeSummary';
import {
  bridgeTypeIcon,
  bridgeTypeLabel,
  bridgeLiveNote,
  findBridgeTv,
  hasCapability,
} from '@/lib/bridge';
import TvRemote from './TvRemote';

interface Props {
  /** Dispositivi reali dal ponte Nova Bridge (tablet). */
  bridge: BridgeDevicesHook;
  /** Profilo attivo (serve alla bacheca famiglia nel riepilogo). */
  profileName: string;
  reminders: Reminder[];
  shoppingItems: ShoppingItem[];
  upcomingEvents: CalendarEvent[];
  onNavigate?: (tab: TabId) => void;
}

/** Pagina Casa: solo ciò che è reale — i dispositivi del ponte Nova
 *  Bridge e il telecomando della TV Samsung. Niente scene, stanze finte
 *  o consumi stimati: quelli non comandano nulla di vero. */
const HomePanel = ({ bridge, profileName, reminders, shoppingItems, upcomingEvents, onNavigate }: Props) => {
  const tv = findBridgeTv(bridge.devices);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
      {/* ─── RIEPILOGO OGGI ─── */}
      <HomeSummary
        profileName={profileName}
        reminders={reminders}
        shoppingItems={shoppingItems}
        upcomingEvents={upcomingEvents}
        bridgeDevices={bridge.devices}
        bridgeConfigured={bridge.configured}
        bridgeError={bridge.error?.message ?? null}
        onNavigate={onNavigate}
      />

      {/* ─── DISPOSITIVI REALI · PONTE NOVA ─── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Dispositivi reali · Ponte Nova
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => bridge.refresh()}
              disabled={bridge.loading}
              className="px-2 py-1 rounded-lg border border-border bg-secondary text-[0.6rem] font-semibold text-foreground hover:border-primary/40 disabled:opacity-40 active:scale-95 transition-all"
            >
              ↻ Aggiorna
            </button>
            <button
              onClick={() => bridge.scan().catch(() => {})}
              disabled={bridge.loading}
              className="px-2 py-1 rounded-lg border border-border bg-secondary text-[0.6rem] font-semibold text-foreground hover:border-primary/40 disabled:opacity-40 active:scale-95 transition-all"
            >
              Scansiona
            </button>
          </div>
        </div>

        {!bridge.configured && (
          <div className="bg-card border border-border rounded-[14px] p-3.5 text-[0.65rem] text-muted-foreground">
            Ponte non configurato — inserisci URL e token nelle Impostazioni (profilo Admin).
          </div>
        )}

        {bridge.configured && bridge.error && (
          <div className="bg-card border border-destructive/40 rounded-[14px] p-3.5 text-[0.65rem] text-destructive">
            {bridge.error.message}
          </div>
        )}

        {bridge.configured && !bridge.error && bridge.loading && bridge.devices.length === 0 && (
          <div className="text-[0.7rem] text-muted-foreground animate-pulse">Caricamento dispositivi...</div>
        )}

        {bridge.configured && !bridge.error && bridge.devices.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {bridge.devices.map(device => {
              const liveDown = device.live?.online === false;
              const note = bridgeLiveNote(device);
              const volPct =
                typeof device.live?.volume_level === 'number'
                  ? Math.round(device.live.volume_level * 100)
                  : null;
              const busy = bridge.busyAction === device.id;
              return (
                <div
                  key={device.id}
                  className={`bg-card border rounded-[14px] p-3.5 relative overflow-hidden ${
                    device.status === 'online' && !liveDown ? 'border-primary/35' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[1.1rem] ${
                      device.status === 'online' && !liveDown ? 'bg-primary/20' : 'bg-secondary'
                    }`}>
                      {bridgeTypeIcon(device.type)}
                    </div>
                    <div className={`text-[0.55rem] ${
                      device.status === 'online' && !liveDown ? 'text-accent' : 'text-muted-foreground'
                    }`}>
                      {device.pending
                        ? '○ In attesa'
                        : device.status === 'online'
                          ? '● Online'
                          : device.status === 'offline'
                            ? '○ Offline'
                            : '○ Stato sconosciuto'}
                    </div>
                  </div>
                  <div className="font-syne text-[0.75rem] font-semibold mb-0.5">{device.name}</div>
                  <div className="text-[0.6rem] text-muted-foreground">
                    {bridgeTypeLabel(device.type)}
                    {device.ip ? ` · ${device.ip}` : ''}
                  </div>
                  {device.type === 'printer' && typeof device.info?.model === 'string' && (
                    <div className="text-[0.6rem] text-muted-foreground mt-0.5">{device.info.model}</div>
                  )}
                  {device.live?.app && (
                    <div className="text-[0.6rem] text-accent mt-0.5">▶ {device.live.app}</div>
                  )}
                  {note && (
                    <div className={`text-[0.6rem] mt-1.5 leading-snug ${liveDown ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {note}
                    </div>
                  )}
                  {device.type === 'chromecast' && !liveDown && (
                    <div className="mt-2.5 space-y-2" onClick={e => e.stopPropagation()}>
                      {hasCapability(device, 'volume') && (
                        <div className="flex items-center gap-1.5">
                          <BridgeActionBtn
                            label="−"
                            disabled={busy}
                            onClick={() => bridge.sendAction(device.id, 'volume_down', { step: 0.1 }).catch(() => {})}
                          />
                          <span className="flex-1 text-center text-[0.65rem] font-mono text-foreground">
                            {volPct !== null ? `${volPct}%` : 'Volume'}
                          </span>
                          <BridgeActionBtn
                            label="+"
                            disabled={busy}
                            onClick={() => bridge.sendAction(device.id, 'volume_up', { step: 0.1 }).catch(() => {})}
                          />
                        </div>
                      )}
                      {(hasCapability(device, 'play') || hasCapability(device, 'pause')) && (
                        <div className="flex gap-1.5">
                          {hasCapability(device, 'play') && (
                            <BridgeActionBtn
                              label="▶ Play"
                              disabled={busy}
                              onClick={() => bridge.sendAction(device.id, 'play').catch(() => {})}
                            />
                          )}
                          {hasCapability(device, 'pause') && (
                            <BridgeActionBtn
                              label="⏸ Pausa"
                              disabled={busy}
                              onClick={() => bridge.sendAction(device.id, 'pause').catch(() => {})}
                            />
                          )}
                        </div>
                      )}
                      {hasCapability(device, 'launch_app') && (
                        <div className="flex gap-1.5">
                          {(['youtube', 'netflix', 'spotify'] as const).map(app => (
                            <BridgeActionBtn
                              key={app}
                              label={app === 'youtube' ? 'YouTube' : app === 'netflix' ? 'Netflix' : 'Spotify'}
                              disabled={busy}
                              onClick={() => bridge.sendAction(device.id, 'launch_app', { app_id: app }).catch(() => {})}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {bridge.actionError && (
          <div className="mt-2 text-[0.65rem] text-destructive">{bridge.actionError}</div>
        )}
        {bridge.configured && !bridge.error && bridge.lastUpdated && (
          <div className="mt-2 text-[0.55rem] text-muted-foreground">
            Ultimo aggiornamento: {bridge.lastUpdated.toLocaleTimeString('it-IT')} · si aggiorna ogni 30 s
          </div>
        )}
      </div>

      {/* ─── TELECOMANDO TV ─── */}
      <TvRemote tv={tv} bridge={bridge} />
    </div>
  );
};

const BridgeActionBtn = ({
  label, onClick, disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-secondary text-[0.6rem] font-semibold text-foreground hover:border-primary/40 disabled:opacity-40 active:scale-95 transition-all"
  >
    {label}
  </button>
);

export default HomePanel;
