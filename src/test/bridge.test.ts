// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BridgeError,
  bridgeLiveNote,
  bridgeTypeLabel,
  fetchBridgeDevices,
  getBridgeConfig,
  isLoopbackUrl,
  saveBridgeConfig,
  sendBridgeAction,
  BRIDGE_CONFIG_KEY,
} from '@/lib/bridge';

const CFG = { url: 'http://192.168.11.163:8090', token: 'token-di-test' };

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('bridge config (localStorage)', () => {
  beforeEach(() => localStorage.clear());

  it('salva e rilegge URL e token', () => {
    saveBridgeConfig(CFG);
    expect(getBridgeConfig()).toEqual(CFG);
    expect(JSON.parse(localStorage.getItem(BRIDGE_CONFIG_KEY)!)).toEqual(CFG);
  });

  it('toglie lo slash finale e gli spazi', () => {
    saveBridgeConfig({ url: '  http://192.168.11.163:8090/ ', token: '  abc ' });
    expect(getBridgeConfig()).toEqual({ url: 'http://192.168.11.163:8090', token: 'abc' });
  });
});

describe('bridge client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('senza token rifiuta con not-configured (prima di qualsiasi fetch)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(fetchBridgeDevices({ url: CFG.url, token: '' })).rejects.toMatchObject({
      kind: 'not-configured',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('carica la lista dispositivi con header X-Nova-Token', async () => {
    const fetchSpy = mockFetch({ devices: [{ id: 'printer', name: 'Stampante' }] });
    vi.stubGlobal('fetch', fetchSpy);
    const devices = await fetchBridgeDevices(CFG);
    expect(devices).toEqual([{ id: 'printer', name: 'Stampante' }]);
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://192.168.11.163:8090/api/devices',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Nova-Token': 'token-di-test' }),
      }),
    );
  });

  it('401 → errore unauthorized in italiano', async () => {
    vi.stubGlobal('fetch', mockFetch({ ok: false, error: 'token mancante o errato' }, 401));
    await expect(fetchBridgeDevices(CFG)).rejects.toMatchObject({
      kind: 'unauthorized',
    });
  });

  it('azione con ok:false propaga l’errore onesto del dispositivo', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ ok: false, error: 'handshake: nessuna risposta', code: 502 }, 502),
    );
    await expect(
      sendBridgeAction(CFG, 'chromecast-camera', 'status'),
    ).rejects.toMatchObject({
      message: expect.stringContaining('handshake'),
    } as Partial<BridgeError>);
  });
});

describe('helper', () => {
  it('isLoopbackUrl riconosce solo localhost', () => {
    expect(isLoopbackUrl('http://localhost:8090')).toBe(true);
    expect(isLoopbackUrl('http://127.0.0.1:8090')).toBe(true);
    expect(isLoopbackUrl('http://192.168.11.163:8090')).toBe(false);
    expect(isLoopbackUrl('https://novahomeassistant.lovable.app')).toBe(false);
  });

  it('bridgeTypeLabel in italiano', () => {
    expect(bridgeTypeLabel('chromecast')).toBe('Chromecast');
    expect(bridgeTypeLabel('airplay')).toBe('HomePod · AirPlay');
    expect(bridgeTypeLabel('tv')).toBe('TV Samsung');
  });

  it('bridgeLiveNote: TV pending, HomePod solo lettura', () => {
    expect(
      bridgeLiveNote({
        id: 'samsung-tv',
        name: 'TV Samsung',
        type: 'tv',
        ip: null,
        status: 'unknown',
        capabilities: [],
        pending: true,
      }),
    ).toMatch(/Accendila/i);
    expect(
      bridgeLiveNote({
        id: 'airplay-apple',
        name: 'Salone',
        type: 'airplay',
        ip: '192.168.11.156',
        status: 'online',
        capabilities: ['identify'],
      }),
    ).toMatch(/pairing/i);
  });
});
