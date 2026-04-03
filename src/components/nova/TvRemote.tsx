import { useState } from 'react';

interface Props {
  deviceId: string;
  isOn: boolean;
  onCommand: (deviceId: string, capability: string, command: string, args?: any[]) => void;
}

const TvRemote = ({ deviceId, isOn, onCommand }: Props) => {
  const [channelInput, setChannelInput] = useState('');

  const btn = (label: string, onClick: () => void, className = '') => (
    <button
      onClick={onClick}
      className={`rounded-xl bg-card border border-border text-foreground text-[0.75rem] font-syne font-semibold 
        transition-all active:scale-90 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-30 ${className}`}
      disabled={!isOn && label !== '⏻'}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-card/50 border border-border rounded-[18px] p-4 backdrop-blur-sm">
      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-3">
        Telecomando TV
      </div>

      {/* Power */}
      <div className="flex justify-center mb-3">
        {btn('⏻', () => onCommand(deviceId, 'switch', isOn ? 'off' : 'on'),
          `w-12 h-12 text-lg ${isOn ? 'border-accent text-accent shadow-[0_0_12px_hsl(var(--accent)/0.3)]' : 'border-destructive/50 text-destructive'}`
        )}
      </div>

      {/* Volume & Channel grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Volume */}
        <div className="flex flex-col gap-1.5 items-center">
          <div className="text-[0.55rem] text-muted-foreground font-mono mb-0.5">VOL</div>
          {btn('▲', () => onCommand(deviceId, 'audioVolume', 'volumeUp'), 'w-10 h-10')}
          {btn('▼', () => onCommand(deviceId, 'audioVolume', 'volumeDown'), 'w-10 h-10')}
          {btn('🔇', () => onCommand(deviceId, 'audioMute', 'mute'), 'w-10 h-10 text-[0.65rem]')}
        </div>

        {/* Center - source & OK */}
        <div className="flex flex-col gap-1.5 items-center">
          {btn('📡', () => onCommand(deviceId, 'samsungvd.mediaInputSource', 'setInputSource', ['dtv']), 'w-10 h-10')}
          {btn('HDMI', () => onCommand(deviceId, 'samsungvd.mediaInputSource', 'setInputSource', ['HDMI1']), 'w-10 h-10 text-[0.55rem]')}
          {btn('🏠', () => onCommand(deviceId, 'samsungvd.remoteControl', 'send', ['KEY_HOME']), 'w-10 h-10')}
        </div>

        {/* Channel */}
        <div className="flex flex-col gap-1.5 items-center">
          <div className="text-[0.55rem] text-muted-foreground font-mono mb-0.5">CH</div>
          {btn('▲', () => onCommand(deviceId, 'tvChannel', 'channelUp'), 'w-10 h-10')}
          {btn('▼', () => onCommand(deviceId, 'tvChannel', 'channelDown'), 'w-10 h-10')}
          {btn('↩', () => onCommand(deviceId, 'samsungvd.remoteControl', 'send', ['KEY_RETURN']), 'w-10 h-10 text-[0.65rem]')}
        </div>
      </div>

      {/* Direct channel input */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={channelInput}
          onChange={e => setChannelInput(e.target.value)}
          placeholder="N° canale"
          className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-[0.72rem] font-mono text-foreground outline-none focus:border-primary/40 placeholder:text-muted-foreground"
          disabled={!isOn}
        />
        <button
          onClick={() => { if (channelInput) { onCommand(deviceId, 'tvChannel', 'setTvChannel', [channelInput]); setChannelInput(''); } }}
          disabled={!isOn || !channelInput}
          className="px-3 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-[0.65rem] font-semibold 
            transition-all hover:bg-primary/25 active:scale-95 disabled:opacity-30"
        >
          Vai
        </button>
      </div>
    </div>
  );
};

export default TvRemote;
