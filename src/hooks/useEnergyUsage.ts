import { useEffect, useRef, useState, useCallback } from 'react';

// Daily kWh tracker. Persists per-day accumulated Wh per device id in localStorage.
// Strategy: each tick (every 30s) adds (wattage * 30/3600) Wh for each device currently ON.

const STORAGE_KEY = 'nova-energy-usage';
const TICK_MS = 30_000;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DayUsage {
  date: string;
  // wh per device key
  perDevice: Record<string, { wh: number; label: string; room: string }>;
}

function loadAll(): Record<string, DayUsage> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAll(data: Record<string, DayUsage>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* */ }
}

export interface TrackedDevice {
  id: string;
  label: string;
  room: string;
  wattage: number;
  on: boolean;
}

export function useEnergyUsage(devices: TrackedDevice[]) {
  const [today, setToday] = useState<DayUsage>(() => {
    const all = loadAll();
    const k = todayKey();
    return all[k] || { date: k, perDevice: {} };
  });
  const devicesRef = useRef(devices);
  devicesRef.current = devices;

  useEffect(() => {
    const tick = () => {
      const k = todayKey();
      const all = loadAll();
      const day: DayUsage = all[k] || { date: k, perDevice: {} };
      const hours = TICK_MS / 3_600_000;
      for (const d of devicesRef.current) {
        if (!d.on || !d.wattage) continue;
        const cur = day.perDevice[d.id] || { wh: 0, label: d.label, room: d.room };
        cur.wh += d.wattage * hours;
        cur.label = d.label;
        cur.room = d.room;
        day.perDevice[d.id] = cur;
      }
      all[k] = day;
      saveAll(all);
      setToday(day);
    };
    const iv = setInterval(tick, TICK_MS);
    return () => clearInterval(iv);
  }, []);

  const totalKwh = Object.values(today.perDevice).reduce((s, v) => s + v.wh, 0) / 1000;

  const byRoom = useCallback(() => {
    const map: Record<string, number> = {};
    for (const v of Object.values(today.perDevice)) {
      map[v.room] = (map[v.room] || 0) + v.wh;
    }
    return Object.entries(map).map(([room, wh]) => ({ room, kwh: wh / 1000 }));
  }, [today]);

  const byDevice = useCallback(() => {
    return Object.entries(today.perDevice)
      .map(([id, v]) => ({ id, label: v.label, room: v.room, kwh: v.wh / 1000 }))
      .sort((a, b) => b.kwh - a.kwh);
  }, [today]);

  return { totalKwh, byRoom, byDevice, today };
}
