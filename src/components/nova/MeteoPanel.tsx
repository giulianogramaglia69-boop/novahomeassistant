import { WeatherData } from '@/lib/types';

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

const MeteoPanel = ({ weather, loading }: Props) => {
  if (loading || !weather) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-[0.75rem]">
        {loading ? 'Caricamento meteo...' : 'Nessun dato meteo disponibile'}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
      {/* Main weather card */}
      <div className="bg-card border border-border rounded-[18px] p-5 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 20%, hsla(35,100%,60%,0.08), transparent 60%)' }} />
        <div className="relative">
          <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">{weather.city}</div>
          <div className="font-syne text-[3.5rem] font-extrabold leading-none mt-2 mb-1 bg-gradient-to-br from-foreground to-[hsla(40,80%,65%,0.8)] bg-clip-text text-transparent">
            {weather.temperature}°
          </div>
          <div className="text-[0.8rem] text-muted-foreground">{weather.description}</div>
          <div className="absolute top-4 right-5 text-[3rem] opacity-90">{weather.icon}</div>

          <div className="grid grid-cols-3 gap-2 mt-3.5">
            {[
              { val: `${weather.humidity}%`, label: 'UMIDITÀ' },
              { val: `${weather.windSpeed}km/h`, label: 'VENTO' },
              { val: `${weather.feelsLike}°`, label: 'PERCEPITA' },
            ].map(s => (
              <div key={s.label} className="bg-secondary rounded-[10px] p-2.5 text-center">
                <div className="font-syne text-[0.85rem] font-bold text-accent">{s.val}</div>
                <div className="text-[0.55rem] text-muted-foreground mt-0.5 tracking-[0.08em]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="font-syne text-[0.65rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">Previsioni</div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {weather.forecast.map(f => (
          <div key={f.day} className="shrink-0 bg-card border border-border rounded-[12px] px-4 py-3 text-center min-w-[70px]">
            <div className="text-[0.58rem] text-muted-foreground tracking-[0.1em]">{f.day}</div>
            <div className="text-[1.4rem] my-1.5">{f.icon}</div>
            <div className="font-syne text-[0.8rem] font-bold">{f.tempMax}°</div>
            <div className="text-[0.6rem] text-muted-foreground">{f.tempMin}°</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeteoPanel;
