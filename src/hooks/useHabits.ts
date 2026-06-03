import { useCallback, useEffect, useState } from 'react';

/**
 * Learns user habits per profile by counting commands by hour-of-day slot.
 * Pure client-side, localStorage-backed. No PII leaves the device unless
 * the user uses a feature that ships the summary to the AI prompt.
 */

export interface HabitEntry {
  /** lowercased short signature of the action (es. "radio italia", "scena cinema") */
  key: string;
  /** count per hour slot 0..23 */
  perHour: number[];
  /** total */
  total: number;
  /** last ISO timestamp */
  last: string;
}

interface HabitDB {
  profile: string;
  habits: Record<string, HabitEntry>;
}

const LS_PREFIX = 'nova_habits_';

const loadDb = (profile: string): HabitDB => {
  try {
    const raw = localStorage.getItem(LS_PREFIX + profile);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { profile, habits: {} };
};
const saveDb = (db: HabitDB) => {
  try { localStorage.setItem(LS_PREFIX + db.profile, JSON.stringify(db)); } catch { /* ignore */ }
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9àèéìòù ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

export function useHabits(profileName?: string) {
  const [db, setDb] = useState<HabitDB>(() => loadDb(profileName || 'default'));

  useEffect(() => {
    setDb(loadDb(profileName || 'default'));
  }, [profileName]);

  /** Log a free-text user command or executed action. */
  const log = useCallback((signal: string) => {
    if (!profileName || !signal) return;
    const key = normalize(signal);
    if (!key || key.length < 3) return;
    const hour = new Date().getHours();
    setDb(prev => {
      const next: HabitDB = { ...prev, habits: { ...prev.habits } };
      const cur = next.habits[key] || { key, perHour: Array(24).fill(0), total: 0, last: '' };
      cur.perHour = [...cur.perHour];
      cur.perHour[hour] = (cur.perHour[hour] || 0) + 1;
      cur.total += 1;
      cur.last = new Date().toISOString();
      next.habits[key] = cur;
      saveDb(next);
      return next;
    });
  }, [profileName]);

  /** Top habits overall (for AI context). */
  const topHabits = useCallback((limit = 8): HabitEntry[] => {
    return Object.values(db.habits)
      .filter(h => h.total >= 2)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }, [db]);

  /** Habit considered "consolidated" at the current hour (>=3 hits in this slot). */
  const habitForHour = useCallback((hour: number): HabitEntry | null => {
    const list = Object.values(db.habits)
      .filter(h => (h.perHour[hour] || 0) >= 3)
      .sort((a, b) => (b.perHour[hour] || 0) - (a.perHour[hour] || 0));
    return list[0] || null;
  }, [db]);

  const reset = useCallback(() => {
    if (!profileName) return;
    localStorage.removeItem(LS_PREFIX + profileName);
    setDb({ profile: profileName, habits: {} });
  }, [profileName]);

  return { log, topHabits, habitForHour, reset, all: db.habits };
}

export function partOfDay(d = new Date()): 'notte' | 'mattina' | 'pomeriggio' | 'sera' {
  const h = d.getHours();
  if (h < 6) return 'notte';
  if (h < 13) return 'mattina';
  if (h < 19) return 'pomeriggio';
  return 'sera';
}
