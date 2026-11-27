import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BridgeConfig,
  BridgeDevice,
  BridgeError,
  fetchBridgeDevices,
  fetchBridgeDevice,
  getBridgeConfig,
  saveBridgeConfig,
  sendBridgeAction,
  triggerBridgeScan,
} from '@/lib/bridge';

const AUTO_REFRESH_MS = 30_000;

/** Dispositivi reali dal ponte Nova Bridge (tablet).
 *  Carica /api/devices al mount, auto-refresh ogni 30 s, refresh manuale.
 *  Per ogni dispositivo legge anche lo stato live (GET /api/devices/{id}),
 *  così errori onesti come "handshake: nessuna risposta" del Chromecast
 *  arrivano in UI invece di restare nascosti. */
export function useBridgeDevices() {
  const [config, setConfig] = useState<BridgeConfig>(() => getBridgeConfig());
  const [devices, setDevices] = useState<BridgeDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<BridgeError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      setActionError(null);
      try {
        const list = await fetchBridgeDevices(config);
        // Stato live per dispositivo (best-effort, in parallelo).
        const withLive = await Promise.all(
          list.map(async (d) => {
            try {
              const detail = await fetchBridgeDevice(config, d.id);
              return { ...d, live: detail.live ?? d.live };
            } catch {
              return d;
            }
          }),
        );
        if (!mounted.current) return;
        setDevices(withLive);
        setError(null);
        setLastUpdated(new Date());
      } catch (e) {
        if (!mounted.current) return;
        setError(
          e instanceof BridgeError
            ? e
            : new BridgeError(
                'unreachable',
                'Ponte non raggiungibile — controlla che il tablet sia acceso e l’URL nelle impostazioni.',
              ),
        );
      } finally {
        if (mounted.current && !opts?.silent) setLoading(false);
      }
    },
    [config],
  );

  // Caricamento iniziale + auto-refresh ogni 30 s.
  useEffect(() => {
    refresh();
    const iv = window.setInterval(() => refresh({ silent: true }), AUTO_REFRESH_MS);
    return () => window.clearInterval(iv);
  }, [refresh]);

  const saveConfig = useCallback((next: BridgeConfig) => {
    const clean = saveBridgeConfig(next);
    setConfig(clean);
    return clean;
  }, []);

  const sendAction = useCallback(
    async (id: string, action: string, params: Record<string, unknown> = {}) => {
      setBusyAction(id);
      setActionError(null);
      try {
        const result = await sendBridgeAction(config, id, action, params);
        await refresh({ silent: true });
        return result;
      } catch (e) {
        const msg =
          e instanceof BridgeError
            ? e.message
            : 'Azione non riuscita — riprova.';
        if (mounted.current) setActionError(msg);
        throw e;
      } finally {
        if (mounted.current) setBusyAction(null);
      }
    },
    [config, refresh],
  );

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const list = await triggerBridgeScan(config);
      if (!mounted.current) return list;
      setDevices(list);
      setError(null);
      setLastUpdated(new Date());
      // Aggiorna anche lo stato live dopo la scansione.
      refresh({ silent: true });
      return list;
    } catch (e) {
      if (mounted.current) {
        setError(
          e instanceof BridgeError
            ? e
            : new BridgeError(
                'unreachable',
                'Ponte non raggiungibile — controlla che il tablet sia acceso e l’URL nelle impostazioni.',
              ),
        );
      }
      throw e;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [config, refresh]);

  return {
    config,
    saveConfig,
    configured: !!config.url && !!config.token,
    devices,
    loading,
    error,
    lastUpdated,
    refresh,
    scan,
    sendAction,
    busyAction,
    actionError,
  };
}

export type BridgeDevicesHook = ReturnType<typeof useBridgeDevices>;
