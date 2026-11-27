import { BridgeDevice, isBridgeTvOnline } from '@/lib/bridge';
import { BridgeDevicesHook } from '@/hooks/useBridgeDevices';

interface Props {
  /** La TV Samsung dal ponte (null se non scoperta). */
  tv: BridgeDevice | null;
  bridge: BridgeDevicesHook;
}

/** Telecomando virtuale della TV Samsung via ponte Nova Bridge.
 *  Se la TV è spenta o non raggiungibile i tasti sono disabilitati
 *  tranne l'accensione (che prova comunque e mostra l'errore del ponte). */
const TvRemote = ({ tv, bridge }: Props) => {
  const online = isBridgeTvOnline(tv);
  const busy = !!tv && bridge.busyAction === tv.id;
  const noTv = !tv;
  const noBridge = !bridge.configured;
  const disabled = !online || busy;

  const send = (action: string, params: Record<string, unknown> = {}) => {
    if (!tv) return;
    bridge.sendAction(tv.id, action, params).catch(() => {});
  };

  const btn = (
    label: string,
    ariaLabel: string,
    onClick: () => void,
    className = '',
    forceDisabled = false,
  ) => (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`rounded-xl bg-card border border-border text-foreground text-[0.75rem] font-syne font-semibold
        transition-all active:scale-90 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-30 ${className}`}
      disabled={forceDisabled || disabled}
    >
      {label}
    </button>
  );

  const powerDisabled = noTv || noBridge || busy;

  return (
    <div className="bg-card/50 border border-border rounded-[18px] p-4 backdrop-blur-sm">
      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-3">
        Telecomando TV
      </div>

      {noBridge && (
        <div className="text-[0.65rem] text-muted-foreground leading-snug mb-3">
          Ponte non configurato — inserisci URL e token nelle Impostazioni (profilo Admin).
        </div>
      )}
      {!noBridge && noTv && (
        <div className="text-[0.65rem] text-muted-foreground leading-snug mb-3">
          TV non trovata — accendila e premi Scansiona in Dispositivi reali.
        </div>
      )}
      {!noBridge && !noTv && !online && (
        <div className="text-[0.65rem] text-muted-foreground leading-snug mb-3">
          TV spenta o non raggiungibile — accendila per usare il telecomando.
        </div>
      )}

      {/* Power */}
      <div className="flex justify-center mb-3">
        <button
          type="button"
          aria-label="Accendi o spegni TV"
          onClick={() => send('power')}
          disabled={powerDisabled}
          className={`w-12 h-12 rounded-xl bg-card border text-[1.1rem] font-syne font-semibold transition-all active:scale-90 hover:border-primary/40 disabled:opacity-30 ${
            online
              ? 'border-accent text-accent shadow-[0_0_12px_hsl(var(--accent)/0.3)]'
              : 'border-destructive/50 text-destructive'
          }`}
        >
          ⏻
        </button>
      </div>

      {/* Volume · D-pad · Canali */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Volume */}
        <div className="flex flex-col gap-1.5 items-center">
          <div className="text-[0.55rem] text-muted-foreground font-mono mb-0.5">VOL</div>
          {btn('▲', 'Volume su', () => send('volume_up', { step: 0.05 }), 'w-10 h-10')}
          {btn('▼', 'Volume giù', () => send('volume_down', { step: 0.05 }), 'w-10 h-10')}
          {btn('🔇', 'Muto', () => send('mute'), 'w-10 h-10 text-[0.65rem]')}
        </div>

        {/* D-pad */}
        <div className="flex flex-col items-center">
          <div className="text-[0.55rem] text-muted-foreground font-mono mb-0.5">MENU</div>
          <div className="grid grid-cols-3 gap-1">
            <span />
            {btn('▲', 'Su', () => send('key', { key: 'KEY_UP' }), 'w-9 h-9')}
            <span />
            {btn('◀', 'Sinistra', () => send('key', { key: 'KEY_LEFT' }), 'w-9 h-9')}
            {btn('OK', 'OK', () => send('key', { key: 'KEY_ENTER' }), 'w-9 h-9 text-[0.6rem]')}
            {btn('▶', 'Destra', () => send('key', { key: 'KEY_RIGHT' }), 'w-9 h-9')}
            <span />
            {btn('▼', 'Giù', () => send('key', { key: 'KEY_DOWN' }), 'w-9 h-9')}
            <span />
          </div>
        </div>

        {/* Canali */}
        <div className="flex flex-col gap-1.5 items-center">
          <div className="text-[0.55rem] text-muted-foreground font-mono mb-0.5">CH</div>
          {btn('▲', 'Canale su', () => send('channel_up'), 'w-10 h-10')}
          {btn('▼', 'Canale giù', () => send('channel_down'), 'w-10 h-10')}
          {btn('⏸', 'Pausa', () => send('pause'), 'w-10 h-10 text-[0.65rem]')}
        </div>
      </div>

      {/* Indietro · Home · Play/Pausa */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {btn('↩ Indietro', 'Indietro', () => send('key', { key: 'KEY_RETURN' }), 'py-2 text-[0.65rem]')}
        {btn('🏠 Home', 'Home', () => send('key', { key: 'KEY_HOME' }), 'py-2 text-[0.65rem]')}
        {btn('▶ Play', 'Play', () => send('play'), 'py-2 text-[0.65rem]')}
      </div>

      {/* Sorgente */}
      <div className="mb-3">
        <div className="text-[0.55rem] text-muted-foreground font-mono mb-1.5">SORGENTE</div>
        <div className="grid grid-cols-3 gap-2">
          {btn('📡 TV', 'Sorgente TV', () => send('source', { source: 'tv' }), 'py-2 text-[0.65rem]')}
          {btn('HDMI 1', 'Sorgente HDMI 1', () => send('source', { source: 'HDMI1' }), 'py-2 text-[0.65rem]')}
          {btn('HDMI 2', 'Sorgente HDMI 2', () => send('source', { source: 'HDMI2' }), 'py-2 text-[0.65rem]')}
        </div>
      </div>

      {/* App */}
      <div>
        <div className="text-[0.55rem] text-muted-foreground font-mono mb-1.5">APP</div>
        <div className="grid grid-cols-3 gap-2">
          {btn('YouTube', 'Apri YouTube', () => send('launch_app', { app_id: 'youtube' }), 'py-2 text-[0.65rem]')}
          {btn('Netflix', 'Apri Netflix', () => send('launch_app', { app_id: 'netflix' }), 'py-2 text-[0.65rem]')}
          {btn('Spotify', 'Apri Spotify', () => send('launch_app', { app_id: 'spotify' }), 'py-2 text-[0.65rem]')}
        </div>
      </div>

      {bridge.actionError && (
        <div className="mt-3 text-[0.65rem] text-destructive">{bridge.actionError}</div>
      )}
    </div>
  );
};

export default TvRemote;
