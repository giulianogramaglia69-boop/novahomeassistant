import { WeatherData } from '@/lib/types';

interface Props {
  weather: WeatherData | null;
  loading: boolean;
}

const getWeatherAnimation = (description: string, icon: string) => {
  const desc = description.toLowerCase();
  if (desc.includes('pioggia') || desc.includes('piovos') || icon.includes('🌧')) return 'rain';
  if (desc.includes('neve') || icon.includes('❄') || icon.includes('🌨')) return 'snow';
  if (desc.includes('temporale') || icon.includes('⛈') || icon.includes('🌩')) return 'storm';
  if (desc.includes('nuvol') || desc.includes('coper') || icon.includes('☁') || icon.includes('🌥') || icon.includes('⛅')) return 'cloudy';
  if (desc.includes('vento') || desc.includes('forte')) return 'windy';
  if (desc.includes('nebbia') || desc.includes('foschia') || icon.includes('🌫')) return 'fog';
  if (icon.includes('🌙') || icon.includes('🌑')) return 'night';
  return 'sunny';
};

const WeatherAnimatedIcon = ({ type, size = 'lg' }: { type: string; size?: 'sm' | 'lg' }) => {
  const s = size === 'lg' ? 'w-24 h-24' : 'w-10 h-10';
  const iconS = size === 'lg' ? 'text-[3.5rem]' : 'text-[1.6rem]';

  return (
    <div className={`${s} relative flex items-center justify-center`}>
      {type === 'sunny' && (
        <div className={`${iconS} animate-[spin_20s_linear_infinite]`}>☀️</div>
      )}
      {type === 'night' && (
        <div className={`${iconS} animate-[float_3s_ease-in-out_infinite]`}>🌙</div>
      )}
      {type === 'cloudy' && (
        <div className="relative">
          <div className={`${iconS} animate-[drift_6s_ease-in-out_infinite]`}>☁️</div>
          {size === 'lg' && <div className="absolute -bottom-1 -left-3 text-[2rem] animate-[drift_8s_ease-in-out_infinite_reverse] opacity-60">☁️</div>}
        </div>
      )}
      {type === 'rain' && (
        <div className="relative">
          <div className={`${iconS} animate-[drift_5s_ease-in-out_infinite]`}>🌧️</div>
          {size === 'lg' && (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-[2px] h-4 bg-primary/60 rounded-full animate-[rainDrop_0.8s_ease-in_infinite]" style={{ animationDelay: `${i * 0.25}s` }} />
              ))}
            </div>
          )}
        </div>
      )}
      {type === 'snow' && (
        <div className="relative">
          <div className={`${iconS} animate-[float_4s_ease-in-out_infinite]`}>❄️</div>
          {size === 'lg' && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
              {[0, 1, 2].map(i => (
                <span key={i} className="text-[0.5rem] animate-[snowFall_2s_linear_infinite] opacity-70" style={{ animationDelay: `${i * 0.6}s` }}>❄</span>
              ))}
            </div>
          )}
        </div>
      )}
      {type === 'storm' && (
        <div className="relative">
          <div className={`${iconS} animate-[shake_0.5s_ease-in-out_infinite]`}>⛈️</div>
          {size === 'lg' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xl animate-[flash_1.5s_ease-in-out_infinite]">⚡</div>}
        </div>
      )}
      {type === 'windy' && (
        <div className={`${iconS} animate-[sway_2s_ease-in-out_infinite]`}>💨</div>
      )}
      {type === 'fog' && (
        <div className={`${iconS} animate-[fade-pulse_3s_ease-in-out_infinite]`}>🌫️</div>
      )}
    </div>
  );
};

const MeteoPanel = ({ weather, loading }: Props) => {
  if (loading || !weather) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-[0.75rem]">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span>Caricamento meteo...</span>
          </div>
        ) : 'Nessun dato meteo disponibile'}
      </div>
    );
  }

  const animType = getWeatherAnimation(weather.description, weather.icon);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
      {/* Hero weather card */}
      <div className="bg-card border border-border rounded-[22px] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-accent/10 to-transparent rounded-full -translate-y-10 translate-x-10" />

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="font-syne text-[0.6rem] font-bold tracking-[0.25em] text-primary uppercase">{weather.city}</div>
            <div className="font-syne text-[4.5rem] font-extrabold leading-none mt-1 bg-gradient-to-br from-foreground via-foreground to-accent/70 bg-clip-text text-transparent">
              {weather.temperature}°
            </div>
            <div className="text-[0.85rem] text-muted-foreground mt-1 capitalize">{weather.description}</div>
          </div>
          <WeatherAnimatedIcon type={animType} size="lg" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '💧', val: `${weather.humidity}%`, label: 'Umidità', anim: 'animate-[float_3s_ease-in-out_infinite]' },
          { icon: '💨', val: `${weather.windSpeed}km/h`, label: 'Vento', anim: 'animate-[sway_2s_ease-in-out_infinite]' },
          { icon: '🌡️', val: `${weather.feelsLike}°`, label: 'Percepita', anim: 'animate-[pulse_2s_ease-in-out_infinite]' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-[16px] p-4 flex flex-col items-center gap-2 transition-all hover:border-primary/20">
            <span className={`text-[1.5rem] ${s.anim}`}>{s.icon}</span>
            <span className="font-syne text-[1rem] font-bold text-accent">{s.val}</span>
            <span className="text-[0.55rem] text-muted-foreground tracking-[0.1em] uppercase">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Forecast */}
      <div>
        <div className="font-syne text-[0.6rem] font-bold tracking-[0.25em] text-muted-foreground uppercase mb-3">Previsioni 7 giorni</div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {weather.forecast.map((f, i) => {
            const fType = getWeatherAnimation('', f.icon);
            return (
              <div
                key={f.day}
                className="shrink-0 bg-card border border-border rounded-[16px] px-5 py-4 text-center min-w-[85px] transition-all hover:border-primary/20 hover:scale-[1.02]"
                style={{ animation: `fade-in 0.4s ease ${i * 0.08}s both` }}
              >
                <div className="text-[0.6rem] text-muted-foreground tracking-[0.12em] font-semibold uppercase">{f.day}</div>
                <div className="my-2 flex justify-center">
                  <WeatherAnimatedIcon type={fType} size="sm" />
                </div>
                <div className="font-syne text-[0.9rem] font-bold">{f.tempMax}°</div>
                <div className="text-[0.6rem] text-muted-foreground">{f.tempMin}°</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MeteoPanel;
