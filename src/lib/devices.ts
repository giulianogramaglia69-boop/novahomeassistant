import { Device } from './types';

export const DEFAULT_DEVICES: Device[] = [
  { id: '1', name: 'Luce Principale', room: 'Soggiorno', type: 'light', icon: '💡', on: false, value: 80, wattage: 12 },
  { id: '2', name: 'Condizionatore', room: 'Camera', type: 'ac', icon: '❄️', on: false, value: 22, wattage: 1200 },
  { id: '3', name: 'Presa Smart', room: 'Cucina', type: 'plug', icon: '🔌', on: false, wattage: 150 },
  { id: '4', name: 'Ventilatore', room: 'Studio', type: 'fan', icon: '🌀', on: false, value: 50, wattage: 45 },
  { id: '5', name: 'Lampada LED', room: 'Camera', type: 'light', icon: '🔆', on: false, value: 60, wattage: 8 },
  { id: '6', name: 'TV Smart', room: 'Soggiorno', type: 'plug', icon: '📺', on: false, wattage: 120 },
];

export const SCENES = [
  { id: 'sera', label: '🌙 Sera', devices: { '1': { on: true, value: 30 }, '5': { on: true, value: 20 } } },
  { id: 'film', label: '🎬 Film', devices: { '1': { on: false }, '5': { on: true, value: 10 }, '6': { on: true } } },
  { id: 'mattino', label: '☀️ Mattino', devices: { '1': { on: true, value: 100 }, '5': { on: true, value: 80 } } },
  { id: 'esco', label: '🚪 Esco', devices: { '1': { on: false }, '2': { on: false }, '3': { on: false }, '4': { on: false }, '5': { on: false }, '6': { on: false } } },
] as const;
