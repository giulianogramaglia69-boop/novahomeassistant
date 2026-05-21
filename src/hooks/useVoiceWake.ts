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

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

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
    const onSpeakEnd = () => { ttsSpeakingRef.current = false; setState(s => (s === 'speaking' ? 'idle' : s)); };
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
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setState('idle');
    setStatusText('');
  }, []);

  const startContinuous = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: 'Errore', description: 'Riconoscimento vocale non supportato.', variant: 'destructive' });
      setState('error');
      return;
    }

    // Permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError' ? 'Permesso microfono negato.' : `Errore microfono: ${err?.message || ''}`;
      toast({ title: 'Microfono', description: msg, variant: 'destructive' });
      setState('error');
      setStatusText(msg);
      return;
    }

    stopRequestedRef.current = false;
    const rec = new SR();
    rec.lang = 'it-IT';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    setState('idle');
    setStatusText('In ascolto della wake word…');

    rec.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      const raw = (finalText || interimText).trim();
      if (!raw) return;

      // Barge-in: if TTS is speaking and any voice detected -> stop TTS
      if (ttsSpeakingRef.current && raw.length > 1) {
        window.dispatchEvent(new CustomEvent('nova-barge-in'));
      }

      // Wake word detection
      if (!wakeArmedRef.current) {
        if (WAKE_RE.test(raw)) {
          wakeArmedRef.current = true;
          setState('wake');
          setStatusText('Sì, signore?');
          // Optional acoustic ping
          window.dispatchEvent(new CustomEvent('nova-wake'));
          // Strip wake word from utterance
          const after = raw.replace(WAKE_RE, '').trim();
          if (after && after.length > 2 && /\s/.test(after)) {
            // user said wake word + command together
            wakeArmedRef.current = false;
            setState('processing');
            setStatusText('Elaborazione…');
            onResultRef.current(after);
            setTimeout(() => { setState('idle'); setStatusText('In ascolto…'); }, 1200);
            return;
          }
          // Otherwise wait for the next utterance for COMMAND_WINDOW_MS
          clearCommandTimer();
          commandTimerRef.current = window.setTimeout(() => {
            wakeArmedRef.current = false;
            setState('idle');
            setStatusText('In ascolto…');
          }, COMMAND_WINDOW_MS);
        }
        return;
      }

      // Wake armed -> first final result becomes the command
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
      // Auto-restart on transient errors
    };

    rec.onend = () => {
      recognitionRef.current = null;
      if (!stopRequestedRef.current) {
        // Restart with small debounce
        setTimeout(() => {
          if (!stopRequestedRef.current) startContinuous();
        }, 400);
      }
    };

    try { rec.start(); }
    catch (err: any) {
      // Already started somewhere
      setTimeout(() => { if (!stopRequestedRef.current) startContinuous(); }, 600);
    }
  }, []);

  const startListening = useCallback(() => {
    // Manual one-shot trigger: arm wake state and start continuous if not already
    wakeArmedRef.current = true;
    setState('wake');
    setStatusText('Sì, signore?');
    clearCommandTimer();
    commandTimerRef.current = window.setTimeout(() => {
      wakeArmedRef.current = false;
      setState('idle');
      setStatusText(alwaysOn ? 'In ascolto…' : '');
    }, COMMAND_WINDOW_MS);
    if (!recognitionRef.current) startContinuous();
  }, [startContinuous, alwaysOn]);

  // Auto-start when always-on toggled on
  useEffect(() => {
    if (alwaysOn && !recognitionRef.current) {
      startContinuous();
    } else if (!alwaysOn && recognitionRef.current) {
      stopListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alwaysOn]);

  // Cleanup on unmount
  useEffect(() => () => { stopListening(); }, [stopListening]);

  return { state, statusText, startListening, stopListening, alwaysOn, setAlwaysOn };
}
