import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SmartThingsDevice {
  deviceId: string;
  name: string;
  label: string;
  type: 'tv' | 'washer' | 'other';
  icon: string;
  on: boolean;
  status: Record<string, any>;
}

function categorizeDevice(device: any): 'tv' | 'washer' | 'other' {
  const cats = device.components?.flatMap((c: any) => c.categories?.map((cat: any) => cat.name.toLowerCase()) || []) || [];
  const name = (device.label || device.name || '').toLowerCase();
  if (cats.includes('television') || cats.includes('tv') || name.includes('tv')) return 'tv';
  if (cats.includes('washer') || cats.includes('washingmachine') || name.includes('lavat')) return 'washer';
  return 'other';
}

function deviceIcon(type: 'tv' | 'washer' | 'other') {
  if (type === 'tv') return '📺';
  if (type === 'washer') return '🫧';
  return '🔌';
}

export function useSmartThings() {
  const [devices, setDevices] = useState<SmartThingsDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoke = useCallback(async (body: Record<string, any>) => {
    const { data, error } = await supabase.functions.invoke('smartthings', { body });
    if (error) throw new Error(error.message);
    return data;
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke({ action: 'list' });
      const items: any[] = data.items || [];
      
      // Filter relevant devices first
      const relevant = items.filter(d => {
        const type = categorizeDevice(d);
        return type === 'tv' || type === 'washer';
      });

      // Fetch status sequentially with delay to avoid rate limits
      const mapped: SmartThingsDevice[] = [];
      for (const d of relevant) {
        const type = categorizeDevice(d);
        let on = false;
        let status: Record<string, any> = {};
        try {
          const st = await invoke({ action: 'status', deviceId: d.deviceId });
          status = st;
          const switchState = st?.components?.main?.switch?.switch?.value;
          on = switchState === 'on';
        } catch { /* ignore status error */ }
        mapped.push({
          deviceId: d.deviceId,
          name: d.name,
          label: d.label || d.name,
          type,
          icon: deviceIcon(type),
          on,
          status,
        });
        // Wait 1.5s between status calls to respect rate limits
        if (relevant.indexOf(d) < relevant.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      setDevices(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore SmartThings');
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  const sendCommand = useCallback(async (
    deviceId: string,
    capability: string,
    command: string,
    args?: any[]
  ) => {
    try {
      await invoke({ action: 'command', deviceId, capability, command, args });
      // Refresh status after command
      const st = await invoke({ action: 'status', deviceId });
      setDevices(prev => prev.map(d => {
        if (d.deviceId !== deviceId) return d;
        const switchState = st?.components?.main?.switch?.switch?.value;
        return { ...d, on: switchState === 'on', status: st };
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore comando');
    }
  }, [invoke]);

  const toggleDevice = useCallback(async (deviceId: string) => {
    const device = devices.find(d => d.deviceId === deviceId);
    if (!device) return;
    const cmd = device.on ? 'off' : 'on';
    await sendCommand(deviceId, 'switch', cmd);
  }, [devices, sendCommand]);

  return { devices, loading, error, fetchDevices, toggleDevice, sendCommand };
}
