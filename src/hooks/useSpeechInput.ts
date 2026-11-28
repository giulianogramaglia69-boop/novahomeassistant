import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseSpeechInputResult {
  supported: boolean;
  listening: boolean;
  error: string | null;
  start: (onResult: (text: string) => void) => void;
  stop: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Permesso microfono negato.',
  'no-speech': 'Non ho sentito niente, riprova.',
  'audio-capture': 'Nessun microfono trovato.',
};

/**
 * Dettatura one-shot per i pulsanti microfono nei form (post-it, dispensa, spesa).
 * Un solo risultato finale, poi si ferma da sola. Non salva nulla: il testo
 * va solo nell'input e l'utente conferma con + / Invio.
 * Stesso pattern SpeechRecognition di useVoiceWake (lang it-IT).
 */
export function useSpeechInput(): UseSpeechInputResult {
  const [supported] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef<(text: string) => void>(() => {});

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* già fermo */
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const start = useCallback((onResult: (text: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Riconoscimento vocale non supportato da questo browser.');
      return;
    }
    if (recognitionRef.current) return; // già in ascolto
    onResultRef.current = onResult;
    setError(null);

    const rec = new SR();
    rec.lang = 'it-IT';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onresult = (event: any) => {
      const transcript: string = event.results?.[0]?.[0]?.transcript?.trim() ?? '';
      if (transcript) onResultRef.current(transcript);
    };
    rec.onerror = (event: any) => {
      setError(ERROR_MESSAGES[event.error] ?? `Errore: ${event.error}`);
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    try {
      rec.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { supported, listening, error, start, stop };
}
