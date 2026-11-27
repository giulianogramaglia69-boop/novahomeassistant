// Client tipizzato per Nova Bridge — il server sul tablet che espone i
// dispositivi reali di casa (Chromecast, HomePod, stampante, TV Samsung).
// Il ponte è HTTP in LAN, l'app è in HTTPS: vedi BRIDGE_URL_HINTS e la
// nota mixed-content in bridgeErrorMessage().

export type BridgeDeviceType =
  | 'router'
  | 'airplay'
  | 'chromecast'
  | 'printer'
  | 'tv'
  | 'other';

export interface BridgeDeviceLive {
  online?: boolean;
  error?: string;
  note?: string;
  volume_level?: number | null;
  muted?: boolean;
  app?: string | null;
  app_id?: string | null;
  status_text?: string | null;
  model?: string | null;
  title?: string | null;
  toner_pct?: number | null;
  name?: string | null;
  os_build?: string | null;
  volume_db?: number | null;
}

export interface BridgeDevice {
  id: string;
  name: string;
  type: BridgeDeviceType;
  ip: string | null;
  mac?: string | null;
  status: 'online' | 'offline' | 'unknown';
  capabilities: string[];
  info?: Record<string, unknown>;
  pending?: boolean;
  last_seen?: string;
  /** Stato letto al momento (solo da GET /api/devices/{id}). */
  live?: BridgeDeviceLive;
}

export interface BridgeHealth {
  ok: boolean;
  name: string;
  version: string;
  devices: number;
  last_scan: string | null;
}

export interface BridgeConfig {
  url: string;
  token: string;
}

/** Chiave localStorage — il token resta solo sul dispositivo, mai nel repo. */
export const BRIDGE_CONFIG_KEY = 'nova-bridge-config';

/** URL di default: il ponte in LAN. Sul tablet stesso va anche
 *  http://localhost:8090 (vedi BRIDGE_URL_HINTS). */
export const BRIDGE_DEFAULT_URL = 'http://192.168.11.163:8090';

export const BRIDGE_URL_HINTS = {
  tablet: 'http://localhost:8090',
  lan: 'http://192.168.11.163:8090',
  tailscaleHttp: 'http://100.108.199.98:8090',
};

export type BridgeErrorKind =
  | 'not-configured'
  | 'mixed-content'
  | 'unreachable'
  | 'timeout'
  | 'unauthorized'
  | 'http';

export class BridgeError extends Error {
  kind: BridgeErrorKind;
  status?: number;
  constructor(kind: BridgeErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'BridgeError';
    this.kind = kind;
    this.status = status;
  }
}

export function getBridgeConfig(): BridgeConfig {
  try {
    const raw = localStorage.getItem(BRIDGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BridgeConfig>;
      return {
        url: (parsed.url || BRIDGE_DEFAULT_URL).trim(),
        token: (parsed.token || '').trim(),
      };
    }
  } catch {
    /* localStorage non disponibile: si usa il default */
  }
  return { url: BRIDGE_DEFAULT_URL, token: '' };
}

export function saveBridgeConfig(config: BridgeConfig): BridgeConfig {
  const clean: BridgeConfig = {
    url: (config.url || BRIDGE_DEFAULT_URL).trim().replace(/\/+$/, ''),
    token: (config.token || '').trim(),
  };
  try {
    localStorage.setItem(BRIDGE_CONFIG_KEY, JSON.stringify(clean));
  } catch {
    /* storage pieno o bloccato: la config resta in memoria per la sessione */
  }
  return clean;
}

/** true se l'URL è un loopback (localhost/127.0.0.1): i browser lo
 *  considerano sicuro e NON lo bloccano come mixed content nemmeno da
 *  pagine HTTPS. */
export function isLoopbackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch {
    return false;
  }
}

/** La pagina è in HTTPS e il ponte in HTTP non-loopback: il browser
 *  bloccherà il fetch (mixed content). */
export function isMixedContentBlocked(url: string): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.protocol !== 'https:') return false;
  try {
    return new URL(url).protocol === 'http:' && !isLoopbackUrl(url);
  } catch {
    return false;
  }
}

const FETCH_TIMEOUT_MS = 8000;

function isConfigured(config: BridgeConfig): config is BridgeConfig & { token: string } {
  return !!config.url && !!config.token;
}

async function bridgeFetch(
  config: BridgeConfig,
  path: string,
  init?: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<unknown> {
  if (!isConfigured(config)) {
    throw new BridgeError(
      'not-configured',
      'Ponte non configurato — inserisci URL e token nelle Impostazioni (profilo Admin).',
    );
  }
  const base = config.url.replace(/\/+$/, '');
  if (isMixedContentBlocked(base)) {
    throw new BridgeError(
      'mixed-content',
      'L’app è in HTTPS e il ponte è in HTTP: il browser blocca la connessione. Sul tablet usa http://localhost:8090, da fuori casa l’URL https di Tailscale Serve.',
    );
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        'X-Nova-Token': config.token,
        ...(init?.headers || {}),
      },
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new BridgeError(
        'timeout',
        'Ponte non raggiungibile — controlla che il tablet sia acceso e l’URL nelle impostazioni.',
      );
    }
    throw new BridgeError(
      'unreachable',
      'Ponte non raggiungibile — controlla che il tablet sia acceso e l’URL nelle impostazioni.',
    );
  } finally {
    clearTimeout(timer);
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* corpo non JSON: si gestisce sotto con lo status */
  }
  if (res.status === 401) {
    throw new BridgeError(
      'unauthorized',
      'Token del ponte errato — controllalo nelle Impostazioni (profilo Admin).',
      401,
    );
  }
  if (!res.ok) {
    const detail =
      data && typeof data.error === 'string' && data.error
        ? `: ${data.error}`
        : '';
    throw new BridgeError(
      'http',
      `Il ponte ha risposto con un errore (HTTP ${res.status})${detail}`,
      res.status,
    );
  }
  return data;
}

export async function fetchBridgeHealth(config: BridgeConfig): Promise<BridgeHealth> {
  const data = (await bridgeFetch(config, '/api/health')) as BridgeHealth;
  return data;
}

export async function fetchBridgeDevices(config: BridgeConfig): Promise<BridgeDevice[]> {
  const data = (await bridgeFetch(config, '/api/devices')) as { devices: BridgeDevice[] };
  return Array.isArray(data.devices) ? data.devices : [];
}

export async function fetchBridgeDevice(
  config: BridgeConfig,
  id: string,
): Promise<BridgeDevice> {
  const data = (await bridgeFetch(
    config,
    `/api/devices/${encodeURIComponent(id)}`,
  )) as BridgeDevice;
  return data;
}

/** Azioni supportate dal ponte: status, volume_set, volume_up, volume_down,
 *  play, pause, launch_app. Il ponte risponde {ok, result} oppure
 *  {ok:false, error} — gli errori di dispositivo (es. Chromecast che non
 *  risponde all'handshake) sono onesti e vanno mostrati, non nascosti. */
export async function sendBridgeAction(
  config: BridgeConfig,
  id: string,
  action: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const data = (await bridgeFetch(
    config,
    `/api/devices/${encodeURIComponent(id)}/action`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, params }),
    },
    15000,
  )) as { ok?: boolean; error?: string; result?: unknown };
  if (data && data.ok === false) {
    throw new BridgeError(
      'http',
      typeof data.error === 'string' && data.error
        ? data.error
        : `Azione "${action}" non riuscita.`,
    );
  }
  return data?.result ?? data;
}

export async function triggerBridgeScan(config: BridgeConfig): Promise<BridgeDevice[]> {
  const data = (await bridgeFetch(
    config,
    '/api/scan',
    undefined,
    20000,
  )) as { devices: BridgeDevice[] };
  return Array.isArray(data.devices) ? data.devices : [];
}

/* ── Etichette UI ── */

export function bridgeTypeLabel(type: BridgeDeviceType): string {
  switch (type) {
    case 'router':
      return 'Router';
    case 'airplay':
      return 'HomePod · AirPlay';
    case 'chromecast':
      return 'Chromecast';
    case 'printer':
      return 'Stampante';
    case 'tv':
      return 'TV Samsung';
    default:
      return 'Dispositivo';
  }
}

export function bridgeTypeIcon(type: BridgeDeviceType): string {
  switch (type) {
    case 'router':
      return '🛜';
    case 'airplay':
      return '🔊';
    case 'chromecast':
      return '📺';
    case 'printer':
      return '🖨️';
    case 'tv':
      return '📺';
    default:
      return '🔌';
  }
}

export function hasCapability(device: BridgeDevice, cap: string): boolean {
  return Array.isArray(device.capabilities) && device.capabilities.includes(cap);
}

/** Nota in italiano sullo stato live di un dispositivo. */
export function bridgeLiveNote(device: BridgeDevice): string | null {
  if (device.pending || !device.ip) {
    return 'Spenta o fuori rete — accendila e premi Aggiorna.';
  }
  if (device.live && device.live.online === false) {
    if (device.live.error) return device.live.error;
    if (device.live.note) return device.live.note;
    return 'Non risponde al momento.';
  }
  if (device.type === 'airplay') {
    return 'Solo lettura — per comandarlo serve il pairing AirPlay.';
  }
  if (device.type === 'printer' || device.type === 'router') {
    return 'Solo lettura — mostra lo stato.';
  }
  return null;
}
