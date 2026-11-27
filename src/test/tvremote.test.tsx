// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TvRemote from '@/components/nova/TvRemote';
import { BridgeDevice } from '@/lib/bridge';
import { BridgeDevicesHook } from '@/hooks/useBridgeDevices';

afterEach(() => cleanup());

const TV_ONLINE: BridgeDevice = {
  id: 'samsung-tv',
  name: 'TV Samsung (salotto)',
  type: 'tv',
  ip: '192.168.11.100',
  status: 'online',
  capabilities: [
    'power', 'mute', 'channel_up', 'channel_down', 'source', 'key',
    'volume', 'play', 'pause', 'launch_app',
  ],
  live: { online: true },
};

const TV_OFFLINE: BridgeDevice = {
  ...TV_ONLINE,
  live: { online: false, error: 'tv offline' },
};

function makeBridge(overrides: Partial<BridgeDevicesHook> = {}): BridgeDevicesHook {
  return {
    config: { url: 'http://192.168.11.163:8090', token: 'token-di-test' },
    saveConfig: vi.fn(),
    configured: true,
    devices: [],
    loading: false,
    error: null,
    lastUpdated: null,
    refresh: vi.fn(),
    scan: vi.fn(),
    sendAction: vi.fn().mockResolvedValue({ ok: true }),
    busyAction: null,
    actionError: null,
    ...overrides,
  } as unknown as BridgeDevicesHook;
}

function btn(name: string): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

describe('TvRemote (ponte)', () => {
  it('TV online: i tasti inviano le azioni giuste al device TV', () => {
    const bridge = makeBridge();
    render(<TvRemote tv={TV_ONLINE} bridge={bridge} />);
    const send = bridge.sendAction as unknown as ReturnType<typeof vi.fn>;

    fireEvent.click(btn('Volume su'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'volume_up', { step: 0.05 });
    fireEvent.click(btn('Volume giù'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'volume_down', { step: 0.05 });
    fireEvent.click(btn('Muto'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'mute', {});
    fireEvent.click(btn('Canale su'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'channel_up', {});
    fireEvent.click(btn('Canale giù'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'channel_down', {});
    fireEvent.click(btn('OK'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'key', { key: 'KEY_ENTER' });
    fireEvent.click(btn('Su'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'key', { key: 'KEY_UP' });
    fireEvent.click(btn('Giù'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'key', { key: 'KEY_DOWN' });
    fireEvent.click(btn('Sinistra'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'key', { key: 'KEY_LEFT' });
    fireEvent.click(btn('Destra'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'key', { key: 'KEY_RIGHT' });
    fireEvent.click(btn('Indietro'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'key', { key: 'KEY_RETURN' });
    fireEvent.click(btn('Home'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'key', { key: 'KEY_HOME' });
    fireEvent.click(btn('Play'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'play', {});
    fireEvent.click(btn('Pausa'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'pause', {});
    fireEvent.click(btn('Accendi o spegni TV'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'power', {});
    fireEvent.click(btn('Sorgente TV'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'source', { source: 'tv' });
    fireEvent.click(btn('Sorgente HDMI 1'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'source', { source: 'HDMI1' });
    fireEvent.click(btn('Sorgente HDMI 2'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'source', { source: 'HDMI2' });
    fireEvent.click(btn('Apri YouTube'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'launch_app', { app_id: 'youtube' });
    fireEvent.click(btn('Apri Netflix'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'launch_app', { app_id: 'netflix' });
    fireEvent.click(btn('Apri Spotify'));
    expect(send).toHaveBeenLastCalledWith('samsung-tv', 'launch_app', { app_id: 'spotify' });
  });

  it('TV offline: nota chiara, tasti disabilitati tranne accensione', () => {
    const bridge = makeBridge();
    render(<TvRemote tv={TV_OFFLINE} bridge={bridge} />);
    expect(screen.getByText(/TV spenta o non raggiungibile/i)).toBeTruthy();
    expect(btn('Volume su').disabled).toBe(true);
    expect(btn('Canale su').disabled).toBe(true);
    expect(btn('OK').disabled).toBe(true);
    expect(btn('Apri YouTube').disabled).toBe(true);
    expect(btn('Accendi o spegni TV').disabled).toBe(false);
    // L'accensione prova comunque l'azione (errore del ponte, non crash).
    fireEvent.click(btn('Accendi o spegni TV'));
    expect(bridge.sendAction as unknown as ReturnType<typeof vi.fn>)
      .toHaveBeenCalledWith('samsung-tv', 'power', {});
  });

  it('TV non trovata: nota e tutto disabilitato', () => {
    const bridge = makeBridge();
    render(<TvRemote tv={null} bridge={bridge} />);
    expect(screen.getByText(/TV non trovata/i)).toBeTruthy();
    expect(btn('Accendi o spegni TV').disabled).toBe(true);
    expect(btn('Volume su').disabled).toBe(true);
    expect(bridge.sendAction as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
  });

  it('ponte non configurato: nota e niente crash', () => {
    const bridge = makeBridge({ configured: false });
    render(<TvRemote tv={TV_ONLINE} bridge={bridge} />);
    expect(screen.getByText(/Ponte non configurato/i)).toBeTruthy();
    expect(btn('Accendi o spegni TV').disabled).toBe(true);
  });

  it('errore di azione mostrato in italiano sotto il telecomando', () => {
    const bridge = makeBridge({ actionError: 'tv offline' });
    render(<TvRemote tv={TV_OFFLINE} bridge={bridge} />);
    expect(screen.getByText('tv offline')).toBeTruthy();
  });
});
