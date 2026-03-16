import { useState, useEffect, useCallback, useRef } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing';
type WakeMode = 'none' | 'chat' | 'command';

export interface VoiceWakeCallbacks {
  onChatCommand: (text: string) => void;
  onHomeCommand: (command: string) => void;
}

export function useVoiceWake(callbacks: VoiceWakeCallbacks) {
  const [state, setState] = useState<VoiceState>('idle');
  const [wakeMode, setWakeMode] = useState<WakeMode>('none');
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const wakeModeRef = useRef<WakeMode>('none');
  const commandBufferRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately, we just needed the permission
      stream.getTracks().forEach(t => t.stop());
      setError(null);
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Permesso microfono negato, vai nelle impostazioni del browser e abilita il microfono per questo sito');
      } else if (err.name === 'NotFoundError') {
        setError('Nessun microfono trovato');
      } else {
        setError(`Errore microfono: ${err.message}`);
      }
      setSupported(false);
      return false;
    }
  }, []);

  const processHomeCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    // Direct home commands without AI
    const commands = [
      { patterns: ['accendi tv', 'accendi la tv'], action: 'tv_on' },
      { patterns: ['spegni tv', 'spegni la tv'], action: 'tv_off' },
      { patterns: ['accendi luci', 'accendi le luci'], action: 'lights_on' },
      { patterns: ['spegni luci', 'spegni le luci'], action: 'lights_off' },
      { patterns: ['accendi climatizzatore', 'accendi il climatizzatore', 'accendi aria condizionata'], action: 'ac_on' },
      { patterns: ['spegni climatizzatore', 'spegni il climatizzatore', 'spegni aria condizionata'], action: 'ac_off' },
      { patterns: ['spegni tutto'], action: 'all_off' },
    ];

    for (const cmd of commands) {
      if (cmd.patterns.some(p => lower.includes(p))) {
        callbacksRef.current.onHomeCommand(cmd.action);
        return;
      }
    }

    // Radio commands
    if (lower.includes('metti radio') || lower.includes('metti la radio')) {
      const stationMatch = lower.match(/(?:metti|metti la)\s+radio\s+(.+)/);
      if (stationMatch) {
        callbacksRef.current.onHomeCommand(`radio_play:${stationMatch[1].trim()}`);
        return;
      }
    }
    if (lower.includes('stoppa radio') || lower.includes('ferma radio') || lower.includes('stop radio') || lower.includes('spegni radio')) {
      callbacksRef.current.onHomeCommand('radio_stop');
      return;
    }

    // Fallback: send as chat command
    callbacksRef.current.onChatCommand(text);
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'it-IT';
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      const combined = (finalTranscript + ' ' + interim).toLowerCase().trim();

      // Check for wake words when not in active mode
      if (wakeModeRef.current === 'none') {
        // "Ehi Nova" variants -> chat mode
        if (combined.includes('ehi nova') || combined.includes('hey nova') || combined.includes('ei nova')) {
          wakeModeRef.current = 'chat';
          setWakeMode('chat');
          commandBufferRef.current = '';
          setState('listening');
          const afterWake = combined.replace(/(?:ehi|hey|ei)\s*nova/i, '').trim();
          if (afterWake) commandBufferRef.current = afterWake;
          return;
        }
        // "Ok Nova" variants -> command mode
        if (combined.includes('ok nova') || combined.includes('okay nova')) {
          wakeModeRef.current = 'command';
          setWakeMode('command');
          commandBufferRef.current = '';
          setState('listening');
          const afterWake = combined.replace(/(?:ok|okay)\s*nova/i, '').trim();
          if (afterWake) commandBufferRef.current = afterWake;
          return;
        }
        return;
      }

      // Listening for command after wake word
      if (finalTranscript.trim()) {
        commandBufferRef.current += ' ' + finalTranscript.trim();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const cmd = commandBufferRef.current.trim();
          if (cmd) {
            setState('processing');
            if (wakeModeRef.current === 'chat') {
              callbacksRef.current.onChatCommand(cmd);
            } else if (wakeModeRef.current === 'command') {
              processHomeCommand(cmd);
            }
          }
          wakeModeRef.current = 'none';
          setWakeMode('none');
          commandBufferRef.current = '';
          setState('idle');
        }, 2000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Permesso microfono negato, vai nelle impostazioni del browser e abilita il microfono per questo sito');
        setSupported(false);
        return;
      }
      setTimeout(() => {
        try { recognition.start(); } catch { }
      }, 1000);
    };

    recognition.onend = () => {
      // Auto-restart to keep listening
      setTimeout(() => {
        try { recognition.start(); } catch { }
      }, 500);
    };

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { recognition.stop(); } catch { }
    };
  }, [processHomeCommand]);

  const startListening = useCallback(async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) return;

    // Resume AudioContext if needed
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioCtx.close();
    } catch { }

    const recognition = recognitionRef.current;
    if (!recognition) return;
    try { recognition.start(); } catch { }
  }, [requestMicPermission]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try { recognition.stop(); } catch { }
    wakeModeRef.current = 'none';
    setWakeMode('none');
    commandBufferRef.current = '';
    setState('idle');
    setError(null);
  }, []);

  return { state, wakeMode, supported, error, startListening, stopListening };
}
