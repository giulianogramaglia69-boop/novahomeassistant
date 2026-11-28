// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';

// HomeSummary importa useNovaItems → client Supabase, che a import-time
// chiama createClient con VITE_SUPABASE_URL undefined (niente .env qui):
// si stubba il modulo per testare la funzione pura senza rete.
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
    channel: () => ({ on: () => ({ subscribe: () => {} }), subscribe: () => {} }),
    removeChannel: () => {},
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [] }) }) }),
      }),
    }),
  },
}));

import { buildHomeSummary, HomeSummaryInput } from '@/components/nova/HomeSummary';
import { BridgeDevice } from '@/lib/bridge';
import { CalendarEvent } from '@/hooks/useCalendar';
import { Reminder } from '@/lib/types';
import { ShoppingItem } from '@/hooks/useShoppingList';
import { NovaItem } from '@/hooks/useNovaItems';

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function rem(id: string, text: string, done = false): Reminder {
  return { id, text, done, createdAt: '10:00' };
}

function shop(id: string, item: string, done = false): ShoppingItem {
  return { id, item, qty: null, category: null, done, added_by: 'Giuliano', created_at: '2026-11-28T09:00:00Z' };
}

function evt(id: string, title: string, date: string, startTime: string): CalendarEvent {
  return { id, title, date, startTime, endTime: '12:00' };
}

function post(id: string, text: string, author: string, created_at: string): NovaItem<{ text: string; color: string }> {
  return { id, kind: 'postit', data: { text, color: 'yellow' }, created_by: author, created_at };
}

function dev(id: string, type: BridgeDevice['type'], status: BridgeDevice['status'], live?: { online?: boolean; error?: string }): BridgeDevice {
  return { id, name: id, type, ip: '192.168.11.10', status, capabilities: [], live };
}

function base(over: Partial<HomeSummaryInput> = {}): HomeSummaryInput {
  return {
    reminders: [],
    shoppingItems: [],
    upcomingEvents: [],
    boardPosts: [],
    bridgeDevices: [],
    bridgeConfigured: true,
    bridgeError: null,
    ...over,
  };
}

describe('buildHomeSummary', () => {
  it('conta solo i promemoria aperti e ne mostra al massimo 3 testi', () => {
    const s = buildHomeSummary(base({
      reminders: [
        rem('1', 'Comprare il latte'),
        rem('2', 'Chiamare la nonna'),
        rem('3', 'Fare i compiti'),
        rem('4', 'Portare fuori il cane'),
        rem('5', 'Già fatto', true),
      ],
    }));
    expect(s.openReminders).toBe(4);
    expect(s.openReminderTexts).toEqual(['Comprare il latte', 'Chiamare la nonna', 'Fare i compiti']);
  });

  it('conta solo gli articoli della spesa non fatti', () => {
    const s = buildHomeSummary(base({
      shoppingItems: [shop('1', 'Pane'), shop('2', 'Latte'), shop('3', 'Uova', true)],
    }));
    expect(s.openShoppingCount).toBe(2);
  });

  it('sceglie il prossimo evento: il più vicino per data e poi ora', () => {
    const s = buildHomeSummary(base({
      upcomingEvents: [
        evt('a', 'Più lontano', '2026-12-05', '09:00'),
        evt('b', 'Domani mattina', '2026-11-29', '08:00'),
        evt('c', 'Domani pomeriggio', '2026-11-29', '15:00'),
        evt('d', 'Oggi tardi', localToday(), '20:00'),
      ],
    }));
    expect(s.nextEvent?.id).toBe('d');
    expect(s.nextEvent?.title).toBe('Oggi tardi');
  });

  it('nessun evento → nextEvent null', () => {
    const s = buildHomeSummary(base({ upcomingEvents: [] }));
    expect(s.nextEvent).toBeNull();
    expect(s.todayEvent).toBeNull();
  });

  it('bacheca: al massimo 3 post, i più recenti per created_at', () => {
    const s = buildHomeSummary(base({
      boardPosts: [
        post('1', 'vecchio', 'Giuliano', '2026-11-20T09:00:00Z'),
        post('2', 'nuovo', 'Simone', '2026-11-28T09:00:00Z'),
        post('3', 'medio', 'Ilenia', '2026-11-25T09:00:00Z'),
        post('4', 'nuovissimo', 'Giuliano', '2026-11-28T10:00:00Z'),
        post('5', 'vecchissimo', 'Simone', '2026-11-19T09:00:00Z'),
      ],
    }));
    expect(s.latestBoardPosts.map(p => p.text)).toEqual(['nuovissimo', 'nuovo', 'medio']);
    expect(s.latestBoardPosts[0].author).toBe('Giuliano');
  });

  it('stati vuoti: tutto zero e banner "tutto a posto"', () => {
    const s = buildHomeSummary(base());
    expect(s.openReminders).toBe(0);
    expect(s.openShoppingCount).toBe(0);
    expect(s.nextEvent).toBeNull();
    expect(s.bridgeOnlineCount).toBe(0);
    expect(s.bridgeTotal).toBe(0);
    expect(s.latestBoardPosts).toEqual([]);
    expect(s.allClear).toBe(true);
    expect(s.bannerIssues).toEqual([]);
  });

  it('TV offline rilevata: tvOnline false e voce nel banner', () => {
    const s = buildHomeSummary(base({
      bridgeDevices: [
        dev('samsung-tv', 'tv', 'online', { online: false, error: 'tv offline' }),
        dev('printer', 'printer', 'online', { online: true }),
      ],
    }));
    expect(s.tvPresent).toBe(true);
    expect(s.tvOnline).toBe(false);
    expect(s.bridgeOnlineCount).toBe(1);
    expect(s.bridgeTotal).toBe(2);
    expect(s.bannerIssues).toContain('TV Samsung offline');
    expect(s.allClear).toBe(false);
  });

  it('TV online: tvOnline true e nessuna voce TV nel banner', () => {
    const s = buildHomeSummary(base({
      bridgeDevices: [dev('samsung-tv', 'tv', 'online', { online: true })],
    }));
    expect(s.tvOnline).toBe(true);
    expect(s.bannerIssues).not.toContain('TV Samsung offline');
    expect(s.allClear).toBe(true);
  });

  it('ponte non configurato → voce nel banner', () => {
    const s = buildHomeSummary(base({ bridgeConfigured: false }));
    expect(s.bannerIssues).toContain('Ponte Nova non configurato');
    expect(s.allClear).toBe(false);
  });

  it('errore del ponte → messaggio d\'errore nel banner', () => {
    const s = buildHomeSummary(base({ bridgeError: 'Ponte non raggiungibile — controlla che il tablet sia acceso.' }));
    expect(s.bannerIssues).toContain('Ponte non raggiungibile — controlla che il tablet sia acceso.');
    expect(s.allClear).toBe(false);
  });

  it('Chromecast che non risponde → voce nel banner', () => {
    const s = buildHomeSummary(base({
      bridgeDevices: [dev('chromecast-camera', 'chromecast', 'online', { online: false, error: 'handshake: nessuna risposta' })],
    }));
    expect(s.chromecastDown).toBe(true);
    expect(s.bannerIssues).toContain('Chromecast non risponde');
    expect(s.allClear).toBe(false);
  });

  it('evento oggi → todayEvent e voce "Oggi:" nel banner', () => {
    const s = buildHomeSummary(base({
      upcomingEvents: [
        evt('t', 'Verifica di matematica', localToday(), '09:00'),
        evt('f', 'Allenamento', '2026-12-02', '18:00'),
      ],
    }));
    expect(s.todayEvent?.id).toBe('t');
    expect(s.bannerIssues).toContain('Oggi: Verifica di matematica alle 09:00');
    expect(s.allClear).toBe(false);
  });
});
