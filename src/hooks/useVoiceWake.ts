import { useState, useEffect, useCallback, useRef } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing';

export function useVoiceWake(onCommand: (text: string) => void) {
  const [state, setState] = useState<VoiceState>('idle');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wakeDetectedRef = useRef(false);
  const commandBufferRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout>>();

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

      // Check for wake word
      if (!wakeDetectedRef.current) {
        if (combined.includes('ehi nova') || combined.includes('hey nova') || combined.includes('ei nova')) {
          wakeDetectedRef.current = true;
          commandBufferRef.current = '';
          setState('listening');
          // Extract text after wake word
          const afterWake = combined.replace(/e(hi|i|y)\s*nova/i, '').trim();
          if (afterWake) commandBufferRef.current = afterWake;
        }
        return;
      }

      // We're listening for the command after wake word
      if (finalTranscript.trim()) {
        commandBufferRef.current += ' ' + finalTranscript.trim();
        // Reset silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          // Silence detected, process command
          const cmd = commandBufferRef.current.trim();
          if (cmd) {
            setState('processing');
            onCommand(cmd);
          }
          wakeDetectedRef.current = false;
          commandBufferRef.current = '';
          setState('idle');
        }, 2000); // 2s silence = end of command
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setSupported(false);
        return;
      }
      // Auto-restart on other errors
      setTimeout(() => {
        try { recognition.start(); } catch { }
      }, 1000);
    };

    recognition.onend = () => {
      // Auto-restart to keep listening
      if (supported) {
        setTimeout(() => {
          try { recognition.start(); } catch { }
        }, 500);
      }
    };

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { recognition.stop(); } catch { }
    };
  }, [onCommand, supported]);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try { recognition.start(); } catch { }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try { recognition.stop(); } catch { }
    wakeDetectedRef.current = false;
    commandBufferRef.current = '';
    setState('idle');
  }, []);

  return { state, supported, startListening, stopListening };
}
