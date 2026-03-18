export interface Device {
  id: string;
  name: string;
  room: string;
  type: 'light' | 'ac' | 'plug' | 'fan';
  icon: string;
  on: boolean;
  value?: number; // brightness/intensity 0-100
  wattage: number;
}

export interface Reminder {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type TabId = 'dashboard' | 'chat' | 'home' | 'radio' | 'meteo' | 'reminders' | 'timer' | 'settings';

export interface Note {
  id: string;
  text: string;
  timestamp: string;
}

export interface RadioStation {
  id: string;
  name: string;
  icon: string;
  streams: string[]; // fallback URLs
  color: string; // HSL accent
}

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  city: string;
  forecast: ForecastDay[];
}

export interface ForecastDay {
  day: string;
  icon: string;
  tempMax: number;
  tempMin: number;
}
