import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WeatherData } from '@/lib/types';
import { CalendarEvent } from '@/hooks/useCalendar';

export interface Routine {
  id: string;
  profile_name: string;
  key: string;
  enabled: boolean;
  hour: number;
  minute: number;
  days: number[];
  config: Record<string, any>;
}

// Default routines if none exist
const DEFAULT_ROUTINES: Omit<Routine, 'id' | 'profile_name'>[] = [
  { key: 'morning', enabled: true, hour: 7, minute: 30, days: [1,2,3,4,5], config: {} },
  { key: 'night', enabled: true, hour: 23, minute: 0, days: [0,1,2,3,4,5,6], config: {} },
  { key: 'pre_event', enabled: true, hour: 0, minute: 0, days: [0,1,2,3,4,5,6], config: { leadMinutes: 15 } },
  { key: 'weather_alert', enabled: true, hour: 0, minute: 0, days: [0,1,2,3,4,5,6], config: {} },
  { key: 'high_energy', enabled: true, hour: 0, minute: 0, days: [0,1,2,3,4,5,6], config: { thresholdKwh: 6 } },
  { key: 'habit_suggest', enabled: true, hour: 0, minute: 0, days: [0,1,2,3,4,5,6], config: {} },
];

interface ProactivityCtx {
  profileName?: string;
  weather: WeatherData | null;
  events: CalendarEvent[];
  totalKwh: number;
  speak: (text: string) => void;
  addNotification: (n: { type: string; title: string; body: string }) => void;
  /** Returns the consolidated habit for the current hour, if any. */
  habitForHour?: (hour: number) => { key: string; perHour: number[]; total: number } | null;
}

const RUN_LS = 'nova_proactive_runs';
const getRuns = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(RUN_LS) || '{}'); } catch { return {}; }
};
const markRun = (key: string) => {
  const r = getRuns();
  r[key] = Date.now();
  localStorage.setItem(RUN_LS, JSON.stringify(r));
};
const ranToday = (key: string) => {
  const ts = getRuns()[key];
  if (!ts) return false;
  const d = new Date(ts);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};
const ranWithin = (key: string, ms: number) => {
  const ts = getRuns()[key];
  return ts && (Date.now() - ts) < ms;
};

export function useProactivity(ctx: ProactivityCtx) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const ctxRef = useRef(ctx);
  useEffect(() => { ctxRef.current = ctx; }, [ctx]);

  const fetchRoutines = useCallback(async () => {
    const name = ctx.profileName;
    if (!name) return;
    const { data } = await supabase.from('nova_routines').select('*').eq('profile_name', name);
    let list = (data || []) as Routine[];
    if (list.length === 0) {
      const seed = DEFAULT_ROUTINES.map(r => ({ ...r, profile_name: name }));
      await supabase.from('nova_routines').insert(seed);
      const r2 = await supabase.from('nova_routines').select('*').eq('profile_name', name);
      list = (r2.data || []) as Routine[];
    }
    setRoutines(list);
  }, [ctx.profileName]);

  useEffect(() => { fetchRoutines(); }, [fetchRoutines]);

  const updateRoutine = useCallback(async (id: string, patch: Partial<Routine>) => {
    await supabase.from('nova_routines').update(patch).eq('id', id);
    fetchRoutines();
  }, [fetchRoutines]);

  // Address depending on profile
  const address = useCallback(() => {
    const n = ctxRef.current.profileName || 'Giuliano';
    if (n === 'Ilenia') return 'signora';
    if (n === 'Simone') return 'signorino';
    if (n === 'Admin') return 'Comandante';
    return 'signore';
  }, []);

  // Engine: check every 60s
  useEffect(() => {
    if (routines.length === 0) return;
    const evaluate = () => {
      const c = ctxRef.current;
      const now = new Date();
      const dow = now.getDay();
      const hh = now.getHours();
      const mm = now.getMinutes();

      for (const r of routines) {
        if (!r.enabled) continue;

        // Morning briefing
        if (r.key === 'morning' && r.days.includes(dow) && hh === r.hour && mm === r.minute && !ranToday('morning')) {
          const w = c.weather;
          const ev = c.events[0];
          let msg = `Buongiorno, ${address()}.`;
          if (w) msg += ` Oggi ${w.temperature} gradi, ${w.description}.`;
          if (ev) msg += ` Primo impegno alle ${ev.startTime}: ${ev.title}.`;
          msg += ' Tutto pronto.';
          c.speak(msg);
          c.addNotification({ type: 'routine', title: 'Buongiorno', body: msg });
          markRun('morning');
        }

        // Night routine
        if (r.key === 'night' && r.days.includes(dow) && hh === r.hour && mm === r.minute && !ranToday('night')) {
          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
          const ymd = tomorrow.toISOString().slice(0, 10);
          const evs = c.events.filter(e => e.date === ymd);
          let msg = `È quasi ora di riposare, ${address()}.`;
          if (evs.length > 0) msg += ` Domani ha ${evs.length} impegn${evs.length === 1 ? 'o' : 'i'}, il primo alle ${evs[0].startTime}.`;
          msg += ' Posso preparare la scena Notte?';
          c.speak(msg);
          c.addNotification({ type: 'routine', title: 'Buonanotte', body: msg });
          markRun('night');
        }

        // Pre-event alert (15min before any event)
        if (r.key === 'pre_event') {
          const lead = (r.config?.leadMinutes ?? 15) * 60_000;
          for (const ev of c.events) {
            const [Y, M, D] = ev.date.split('-').map(Number);
            const [eh, em] = ev.startTime.split(':').map(Number);
            const evDate = new Date(Y, M - 1, D, eh, em);
            const diff = evDate.getTime() - now.getTime();
            const key = `event_${ev.id}`;
            if (diff > 0 && diff <= lead && !ranWithin(key, 30 * 60_000)) {
              const msg = `Promemoria, ${address()}: tra ${Math.max(1, Math.round(diff / 60_000))} minuti ha "${ev.title}".`;
              c.speak(msg);
              c.addNotification({ type: 'routine', title: 'Impegno in arrivo', body: msg });
              markRun(key);
            }
          }
        }

        // Weather alert
        if (r.key === 'weather_alert' && c.weather && !ranToday('weather_alert')) {
          const desc = (c.weather.description || '').toLowerCase();
          const wind = c.weather.windSpeed || 0;
          if (/piogg|tempor|temporal/.test(desc) || wind > 40) {
            const msg = `Allerta meteo, ${address()}: ${c.weather.description}, vento ${wind} km/h. Le consiglio di prepararsi.`;
            c.speak(msg);
            c.addNotification({ type: 'routine', title: 'Allerta meteo', body: msg });
            markRun('weather_alert');
          }
        }

        // High energy usage
        if (r.key === 'high_energy') {
          const t = r.config?.thresholdKwh ?? 6;
          if (c.totalKwh >= t && !ranWithin('high_energy', 6 * 3600_000)) {
            const msg = `${address()}, consumo giornaliero a ${c.totalKwh.toFixed(1)} kWh, sopra la soglia. Consiglio di spegnere ciò che non serve.`;
            c.speak(msg);
            c.addNotification({ type: 'routine', title: 'Consumi elevati', body: msg });
            markRun('high_energy');
          }
        }

        // Habit suggestion: at the top of each hour, propose the consolidated habit for this slot (once per slot per day)
        if (r.key === 'habit_suggest' && c.habitForHour && mm === 0) {
          const slotKey = `habit_${hh}`;
          const habit = c.habitForHour(hh);
          if (habit && !ranWithin(slotKey, 18 * 3600_000)) {
            const msg = `${address()}, di solito a quest'ora richiede "${habit.key}". Gradisce che proceda?`;
            c.speak(msg);
            c.addNotification({ type: 'routine', title: 'Suggerimento abituale', body: msg });
            markRun(slotKey);
          }
        }
      }
    };

    evaluate();
    const iv = setInterval(evaluate, 60_000);
    return () => clearInterval(iv);
  }, [routines]);

  return { routines, updateRoutine, refresh: fetchRoutines };
}
