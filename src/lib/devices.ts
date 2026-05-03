import { Device } from './types';

export const DEFAULT_DEVICES: Device[] = [
  { id: '1', name: 'Luce Principale', room: 'Salotto', type: 'light', icon: '💡', on: false, value: 80, wattage: 12 },
  { id: '2', name: 'Condizionatore', room: 'Camera', type: 'ac', icon: '❄️', on: false, value: 22, wattage: 1200 },
  { id: '3', name: 'Presa Smart', room: 'Cucina', type: 'plug', icon: '🔌', on: false, wattage: 150 },
  { id: '4', name: 'Ventilatore', room: 'Studio', type: 'fan', icon: '🌀', on: false, value: 50, wattage: 45 },
  { id: '5', name: 'Lampada LED', room: 'Camera', type: 'light', icon: '🔆', on: false, value: 60, wattage: 8 },
  { id: '6', name: 'Lampada Bagno', room: 'Bagno', type: 'light', icon: '💡', on: false, value: 80, wattage: 10 },
];

// Scene rapide. SmartThings actions richiedono il deviceId reale (per type) → eseguite a runtime.
export interface Scene {
  id: string;
  label: string;
  emoji: string;
  description: string;
  devices: Record<string, { on?: boolean; value?: number }>;
  smart?: { tv?: 'on' | 'off'; washer?: 'on' | 'off' };
}

export const SCENES: Scene[] = [
  { id: 'cinema', label: 'Cinema', emoji: '🎬', description: 'Luci soffuse, TV ON', devices: { '1': { on: false }, '5': { on: true, value: 10 }, '6': { on: true } }, smart: { tv: 'on' } },
  { id: 'sera', label: 'Sera', emoji: '🌙', description: 'Luce calda', devices: { '1': { on: true, value: 30 }, '5': { on: true, value: 20 } } },
  { id: 'mattino', label: 'Buongiorno', emoji: '☀️', description: 'Luci al massimo', devices: { '1': { on: true, value: 100 }, '5': { on: true, value: 80 } } },
  { id: 'lavaggio', label: 'Lavaggio', emoji: '🫧', description: 'Avvia lavatrice', devices: {}, smart: { washer: 'on' } },
  { id: 'esco', label: 'Esco', emoji: '🚪', description: 'Spegni tutto', devices: { '1': { on: false }, '2': { on: false }, '3': { on: false }, '4': { on: false }, '5': { on: false }, '6': { on: false } }, smart: { tv: 'off', washer: 'off' } },
];

// Mappa SmartThings type → stanza
export const SMART_ROOM_MAP: Record<string, string> = {
  tv: 'Salotto',
  washer: 'Bagno',
  other: 'Altro',
};
