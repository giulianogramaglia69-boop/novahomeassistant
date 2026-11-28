import { useCallback, useEffect, useState } from 'react';

const KEY = 'nova_night_mode';

export function useNightMode() {
  const [enabled, setEnabledState] = useState<boolean>(() => localStorage.getItem(KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(KEY, enabled ? 'true' : 'false');
  }, [enabled]);

  const setEnabled = useCallback((v: boolean) => setEnabledState(v), []);
  const toggle = useCallback(() => setEnabledState(prev => !prev), []);

  return { enabled, toggle, setEnabled };
}
