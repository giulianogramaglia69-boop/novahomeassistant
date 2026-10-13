import { useEffect, useState } from 'react';
import { SmartThingsDevice } from '@/hooks/useSmartThings';

const KEY = 'nova_presence_sim';

/** Randomly toggles SmartThings devices while "away" mode is active (evening hours only). */
export function usePresenceSim(devices: SmartThingsDevice[], toggle: (id: string) => Promise<void> | void) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(KEY) === '1');
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(KEY, enabled ? '1' : '0'); }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let t: number;
    const schedule = () => {
      const delay = (8 + Math.random() * 22) * 60 * 1000; // 8–30 min
      t = window.setTimeout(async () => {
        const h = new Date().getHours();
        const candidates = devices.filter(d => d.type !== 'washer');
        if (h >= 18 && h <= 23 && candidates.length) {
          const d = candidates[Math.floor(Math.random() * candidates.length)];
          await toggle(d.deviceId);
          setLastAction(`${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} · ${d.label || d.name} ${d.on ? 'spento' : 'acceso'}`);
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(t);
  }, [enabled, devices, toggle]);

  return { enabled, setEnabled, lastAction };
}
