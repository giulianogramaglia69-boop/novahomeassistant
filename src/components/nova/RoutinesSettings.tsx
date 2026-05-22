import { Routine } from '@/hooks/useProactivity';

const LABELS: Record<string, { name: string; sub: string; showTime: boolean }> = {
  morning: { name: '☀️ Buongiorno', sub: 'Briefing meteo + agenda', showTime: true },
  night: { name: '🌙 Buonanotte', sub: 'Riepilogo di domani', showTime: true },
  pre_event: { name: '📅 Pre-evento', sub: 'Avviso 15 min prima', showTime: false },
  weather_alert: { name: '⚠️ Allerta meteo', sub: 'Pioggia / vento forte', showTime: false },
  high_energy: { name: '⚡ Consumi alti', sub: 'Soglia kWh giornaliera', showTime: false },
};

interface Props {
  routines: Routine[];
  onUpdate: (id: string, patch: Partial<Routine>) => void;
}

const RoutinesSettings = ({ routines, onUpdate }: Props) => {
  if (!routines.length) {
    return <div className="text-[0.65rem] text-muted-foreground text-center py-3">Caricamento…</div>;
  }
  return (
    <div className="space-y-2">
      {routines.map(r => {
        const meta = LABELS[r.key] || { name: r.key, sub: '', showTime: false };
        return (
          <div key={r.id} className="bg-card border border-border rounded-2xl p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[0.75rem] font-bold text-foreground truncate">{meta.name}</div>
                <div className="text-[0.6rem] text-muted-foreground">{meta.sub}</div>
              </div>
              <button
                onClick={() => onUpdate(r.id, { enabled: !r.enabled })}
                className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${r.enabled ? 'bg-accent' : 'bg-muted'}`}
              >
                <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${r.enabled ? 'left-[22px]' : 'left-[3px]'}`} />
              </button>
            </div>
            {meta.showTime && (
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">Ora</span>
                <input
                  type="time"
                  value={`${String(r.hour).padStart(2,'0')}:${String(r.minute).padStart(2,'0')}`}
                  onChange={e => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    onUpdate(r.id, { hour: h, minute: m });
                  }}
                  className="bg-secondary border border-border rounded-lg px-2 py-1 text-foreground font-mono text-[0.7rem] outline-none focus:border-primary/40"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoutinesSettings;
