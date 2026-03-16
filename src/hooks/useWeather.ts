import { useState, useCallback, useEffect } from 'react';
import { WeatherData } from '@/lib/types';

const WMO_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '🌨', 73: '🌨', 75: '❄️',
  80: '🌦', 81: '🌧', 82: '⛈',
  95: '⛈', 96: '⛈', 99: '⛈',
};

const WMO_DESC: Record<number, string> = {
  0: 'Sereno', 1: 'Prevalentemente sereno', 2: 'Parzialmente nuvoloso', 3: 'Nuvoloso',
  45: 'Nebbia', 48: 'Nebbia gelata',
  51: 'Pioggerella', 53: 'Pioggerella', 55: 'Pioggerella intensa',
  61: 'Pioggia leggera', 63: 'Pioggia', 65: 'Pioggia intensa',
  71: 'Neve leggera', 73: 'Neve', 75: 'Neve intensa',
  80: 'Rovesci', 81: 'Rovesci', 82: 'Rovesci intensi',
  95: 'Temporale', 96: 'Temporale con grandine', 99: 'Temporale forte',
};

const DAYS_IT = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(() => {
    const stored = localStorage.getItem('nova-coords');
    return stored ? JSON.parse(stored) : null;
  });

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCoords(c);
        localStorage.setItem('nova-coords', JSON.stringify(c));
      },
      () => {
        // Default to Milan
        const c = { lat: 37.3115, lon: 13.5765 };
        setCoords(c);
        localStorage.setItem('nova-coords', JSON.stringify(c));
      }
    );
  }, []);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      );
      const data = await res.json();
      const code = data.current.weather_code;

      // Reverse geocode city
      let city = 'La tua città';
      try {
        const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=it`);
        const geoData = await geo.json();
        city = geoData.address?.city || geoData.address?.town || geoData.address?.village || city;
      } catch {}

      const forecast = data.daily.time.slice(1, 6).map((date: string, i: number) => {
        const d = new Date(date);
        const dayCode = data.daily.weather_code[i + 1];
        return {
          day: DAYS_IT[d.getDay()],
          icon: WMO_ICONS[dayCode] || '🌤',
          tempMax: Math.round(data.daily.temperature_2m_max[i + 1]),
          tempMin: Math.round(data.daily.temperature_2m_min[i + 1]),
        };
      });

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        description: WMO_DESC[code] || 'N/D',
        icon: WMO_ICONS[code] || '🌤',
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        feelsLike: Math.round(data.current.apparent_temperature),
        city: `${city}, IT`,
        forecast,
      });
    } catch (e) {
      console.error('Weather fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!coords) {
      detectLocation();
    } else {
      fetchWeather(coords.lat, coords.lon);
    }
  }, [coords, detectLocation, fetchWeather]);

  return { weather, loading, detectLocation };
}
