import { useState, useCallback, useRef, useEffect } from 'react';

export interface Timer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  done: boolean;
}

export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const tick = useCallback((id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id || !t.running) return t;
      const next = t.remainingSeconds - 1;
      if (next <= 0) {
        // Stop interval
        const iv = intervalsRef.current.get(id);
        if (iv) { clearInterval(iv); intervalsRef.current.delete(id); }
        // Play sound
        try { new Audio('/timer-done.mp3').play().catch(() => {}); } catch {}
        return { ...t, remainingSeconds: 0, running: false, done: true };
      }
      return { ...t, remainingSeconds: next };
    }));
  }, []);

  const add = useCallback((label: string, minutes: number) => {
    const id = crypto.randomUUID();
    const totalSeconds = minutes * 60;
    setTimers(prev => [...prev, { id, label, totalSeconds, remainingSeconds: totalSeconds, running: false, done: false }]);
    return id;
  }, []);

  const start = useCallback((id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, running: true, done: false } : t));
    if (!intervalsRef.current.has(id)) {
      const iv = setInterval(() => tick(id), 1000);
      intervalsRef.current.set(id, iv);
    }
  }, [tick]);

  const pause = useCallback((id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, running: false } : t));
    const iv = intervalsRef.current.get(id);
    if (iv) { clearInterval(iv); intervalsRef.current.delete(id); }
  }, []);

  const reset = useCallback((id: string) => {
    pause(id);
    setTimers(prev => prev.map(t => t.id === id ? { ...t, remainingSeconds: t.totalSeconds, running: false, done: false } : t));
  }, [pause]);

  const remove = useCallback((id: string) => {
    pause(id);
    setTimers(prev => prev.filter(t => t.id !== id));
  }, [pause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(iv => clearInterval(iv));
    };
  }, []);

  return { timers, add, start, pause, reset, remove };
}
