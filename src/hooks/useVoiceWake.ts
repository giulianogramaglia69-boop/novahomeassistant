import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export type VoiceState = 'idle' | 'wake' | 'listening' | 'processing' | 'speaking' | 'error';

export interface UseVoiceResult {
  state: VoiceState;
  statusText: string;
  startListening: () => void;
  stopListening: () => void;
  alwaysOn: boolean;
  setAlwaysOn: (v: boolean) => void;
}

const WAKE_RE = /\b(ehi\s*nova|hey\s*nova|ok\s*nova|nova)\b/i;
const COMMAND_WINDOW_MS = 8000;
const LS_KEY = 'nova_voice_always_on';
const WATCHDOG_MS = 6000;

function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed': return 'Permesso microfono negato.';
    case 'no-speech': return '';
    case 'network': return 'Errore di rete.';
    case 'aborted': return '';
    case 'audio-capture': return 'Nessun microfono trovato.';
    case 'service-not-allowed': return 'Servizio vocale non disponibile.';
    default: return `Errore: ${error}`;
  }
}

export function useVoiceWake(onResult: (text: string) => void): UseVoiceResult {
  const [state, setState] = useState<VoiceState>('idle');
  const [statusText, setStatusText] = useState('');
  const [alwaysOn, setAlwaysOnState] = useState<boolean>(() => localStorage.getItem(LS_KEY) === 'true');
  const recognitionRef = useRef<any>(null);
  const wakeArmedRef = useRef<boolean>(false);
  const commandTimerRef = useRef<number | null>(null);
  const stopRequestedRef = useRef<boolean>(false);
  const onResultRef = useRef(onResult);
  const ttsSpeakingRef = useRef(false);
  const alwaysOnRef = useRef(alwaysOn);
  const lastActivityRef = useRef<number>(Date.now());
  const watchdogRef = useRef<number | null>(null);
  const restartBackoffRef = useRef<number>(0);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { alwaysOnRef.current = alwaysOn; }, [alwaysOn]);

  const setAlwaysOn = useCallback((v: boolean) => {
    localStorage.setItem(LS_KEY, String(v));
    setAlwaysOnState(v);
  }, []);

  const clearCommandTimer = () => {
    if (commandTimerRef.current) {
      window.clearTimeout(commandTimerRef.current);
      commandTimerRef.current = null;
    }
  };

  // Listen to TTS state for barge-in
  useEffect(() => {
    const onSpeakStart = () => { ttsSpeakingRef.current = true; setState(s => (s === 'idle' ? 'speaking' : s)); };
    const onSpeakEnd = () => {
      ttsSpeakingRef.current = false;
      setState(s => (s === 'speaking' ? 'idle' : s));
      // After TTS ends, ensure recognition is alive in always-on mode
      if (alwaysOnRef.current && !recognitionRef.current && !stopRequestedRef.current) {
        setTimeout(() => { if (alwaysOnRef.current) startContinuousRef.current?.(); }, 250);
      }
    };
    window.addEventListener('nova-tts-start', onSpeakStart);
    window.addEventListener('nova-tts-end', onSpeakEnd);
    return () => {
      window.removeEventListener('nova-tts-start', onSpeakStart);
      window.removeEventListener('nova-tts-end', onSpeakEnd);
    };
  }, []);

  const stopListening = useCallback(() => {
    stopRequestedRef.current = true;
    clearCommandTimer();
    wakeArmedRef.current = false;
    if (watchdogRef.current) { window.clearInterval(watchdogRef.current); watchdogRef.current = null; }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setState('idle');
    setStatusText('');
  }, []);

  const startContinuousRef = useRef<() => Promise<void>>();

  const startContinuous = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: 'Errore', description: 'Riconoscimento vocale non supportato.', variant: 'destructive' });
      setState('error');
      return;
    }

    if (recognitionRef.current) return; // already running

    // Permission probe (one-shot, releases immediately)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError' ? 'Permesso microfono negato.' : `Errore microfono: ${err?.message || ''}`;
      toast({ title: 'Microfono', description: msg, variant: 'destructive' });
      setState('error');
      setStatusText(msg);
      // Don't keep trying if permission denied
      if (err?.name === 'NotAllowedError') {
        setAlwaysOnState(false);
        localStorage.setItem(LS_KEY, 'false');
      }
      return;
    }

    stopRequestedRef.current = false;
    const rec = new SR();
    rec.lang = 'it-IT';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    lastActivityRef.current = Date.now();

    setState('idle');
    setStatusText('In ascolto della wake word…');

    rec.onstart = () => { lastActivityRef.current = Date.now(); restartBackoffRef.current = 0; };
    rec.onaudiostart = () => { lastActivityRef.current = Date.now(); };
    rec.onspeechstart = () => { lastActivityRef.current = Date.now(); };
    rec.onsoundstart = () => { lastActivityRef.current = Date.now(); };

    rec.onresult = (event: any) => {
      lastActivityRef.current = Date.now();
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      const raw = (finalText || interimText).trim();
      if (!raw) return;

      // Barge-in
      if (ttsSpeakingRef.current && raw.length > 1) {
        window.dispatchEvent(new CustomEvent('nova-barge-in'));
      }

      if (!wakeArmedRef.current) {
        if (WAKE_RE.test(raw)) {
          wakeArmedRef.current = true;
          setState('wake');
          setStatusText('Sì, signore?');
          window.dispatchEvent(new CustomEvent('nova-wake'));
          const after = raw.replace(WAKE_RE, '').trim();
          if (after && after.length > 2 && /\s/.test(after)) {
            wakeArmedRef.current = false;
            setState('processing');
            setStatusText('Elaborazione…');
            onResultRef.current(after);
            setTimeout(() => { setState('idle'); setStatusText('In ascolto…'); }, 1200);
            return;
          }
          clearCommandTimer();
          commandTimerRef.current = window.setTimeout(() => {
            wakeArmedRef.current = false;
            setState('idle');
            setStatusText('In ascolto…');
          }, COMMAND_WINDOW_MS);
        }
        return;
      }

      if (finalText.trim()) {
        clearCommandTimer();
        wakeArmedRef.current = false;
        setState('processing');
        setStatusText('Elaborazione…');
        onResultRef.current(finalText.trim());
        setTimeout(() => { setState('idle'); setStatusText('In ascolto…'); }, 1200);
      } else {
        setStatusText(`„ ${interimText} …`);
      }
    };

    rec.onerror = (event: any) => {
      const msg = getErrorMessage(event.error);
      if (msg) setStatusText(msg);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopRequestedRef.current = true;
        setAlwaysOnState(false);
        localStorage.setItem(LS_KEY, 'false');
      }
      // onend will follow and trigger restart
    };

    rec.onend = () => {
      recognitionRef.current = null;
      if (stopRequestedRef.current) return;
      // Backoff to avoid hot loops on persistent errors
      restartBackoffRef.current = Math.min(5000, (restartBackoffRef.current || 200) * 1.5);
      const delay = restartBackoffRef.current;
      setTimeout(() => {
        if (!stopRequestedRef.current && alwaysOnRef.current) startContinuousRef.current?.();
      }, delay);
    };

    try {
      rec.start();
    } catch (err: any) {
      // "already started" or NotAllowedError on restart
      recognitionRef.current = null;
      if (err?.name === 'NotAllowedError') {
        toast({ title: 'Microfono', description: 'Riavvia l\'ascolto toccando lo schermo.', variant: 'destructive' });
        return;
      }
      setTimeout(() => { if (!stopRequestedRef.current && alwaysOnRef.current) startContinuousRef.current?.(); }, 800);
    }
  }, []);

  startContinuousRef.current = startContinuous;

  const startListening = useCallback(() => {
    wakeArmedRef.current = true;
    setState('wake');
    setStatusText('Sì, signore?');
    clearCommandTimer();
    commandTimerRef.current = window.setTimeout(() => {
      wakeArmedRef.current = false;
      setState('idle');
      setStatusText(alwaysOnRef.current ? 'In ascolto…' : '');
    }, COMMAND_WINDOW_MS);
    if (!recognitionRef.current) startContinuous();
  }, [startContinuous]);

  // Toggle always-on
  useEffect(() => {
    if (alwaysOn) {
      stopRequestedRef.current = false;
      if (!recognitionRef.current) startContinuous();
    } else {
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alwaysOn]);

  // Watchdog: if recognition is silent / dead for too long while always-on, restart it
  useEffect(() => {
    if (!alwaysOn) return;
    watchdogRef.current = window.setInterval(() => {
      if (stopRequestedRef.current) return;
      const silent = Date.now() - lastActivityRef.current > WATCHDOG_MS;
      const dead = !recognitionRef.current;
      if ((dead || silent) && !ttsSpeakingRef.current) {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
          recognitionRef.current = null;
        }
        startContinuousRef.current?.();
        lastActivityRef.current = Date.now();
      }
    }, 3000);
    return () => { if (watchdogRef.current) { window.clearInterval(watchdogRef.current); watchdogRef.current = null; } };
  }, [alwaysOn]);

  // Restart on visibility / focus changes (browsers kill SR when tab hides)
  useEffect(() => {
    if (!alwaysOn) return;
    const kick = () => {
      if (document.visibilityState === 'visible' && alwaysOnRef.current && !stopRequestedRef.current) {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
          recognitionRef.current = null;
        }
        setTimeout(() => startContinuousRef.current?.(), 300);
      }
    };
    document.addEventListener('visibilitychange', kick);
    window.addEventListener('focus', kick);
    window.addEventListener('pageshow', kick);
    return () => {
      document.removeEventListener('visibilitychange', kick);
      window.removeEventListener('focus', kick);
      window.removeEventListener('pageshow', kick);
    };
  }, [alwaysOn]);

  // Cleanup on unmount
  useEffect(() => () => { stopListening(); }, [stopListening]);

  return { state, statusText, startListening, stopListening, alwaysOn, setAlwaysOn };
}
