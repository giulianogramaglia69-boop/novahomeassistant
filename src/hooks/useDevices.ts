import { useState, useCallback, useEffect } from 'react';
import { Device } from '@/lib/types';
import { DEFAULT_DEVICES, SCENES } from '@/lib/devices';

const STORAGE_KEY = 'nova-devices';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_DEVICES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  }, [devices]);

  const toggle = useCallback((id: string) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, on: !d.on } : d));
  }, []);

  const setValue = useCallback((id: string, value: number) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, value } : d));
  }, []);

  const applyScene = useCallback((sceneId: string) => {
    const scene = SCENES.find(s => s.id === sceneId);
    if (!scene) return undefined;
    setDevices(prev => prev.map(d => {
      const override = scene.devices[d.id];
      if (!override) return d;
      return { ...d, ...override };
    }));
    return scene;
  }, []);

  const devicesOn = devices.filter(d => d.on).length;
  const totalWattage = devices.filter(d => d.on).reduce((sum, d) => sum + d.wattage, 0);

  return { devices, toggle, setValue, applyScene, devicesOn, totalWattage };
}
