import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export interface UseVoiceResult {
  state: VoiceState;
  statusText: string;
  startListening: () => void;
  stopListening: () => void;
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return 'Permesso microfono negato. Abilita il microfono nelle impostazioni del browser.';
    case 'no-speech':
      return 'Nessun discorso rilevato. Riprova.';
    case 'network':
      return 'Errore di rete. Controlla la connessione internet.';
    case 'aborted':
      return 'Ascolto interrotto.';
    case 'audio-capture':
      return 'Nessun microfono trovato.';
    case 'service-not-allowed':
      return 'Servizio di riconoscimento vocale non disponibile.';
    default:
      return `Errore: ${error}`;
  }
}

export function useVoiceWake(onResult: (text: string) => void): UseVoiceResult {
  const [state, setState] = useState<VoiceState>('idle');
  const [statusText, setStatusText] = useState('');
  const recognitionRef = useRef<any>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setState('idle');
    setStatusText('');
  }, []);

  const startListening = useCallback(async () => {
    // Check SpeechRecognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const msg = 'Riconoscimento vocale non supportato dal browser.';
      toast({ title: 'Errore', description: msg, variant: 'destructive' });
      setState('error');
      setStatusText(msg);
      return;
    }

    // Request mic permission first
    setState('listening');
    setStatusText('Richiesta permesso microfono...');
    
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately, we just needed permission
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Permesso microfono negato. Abilita il microfono nelle impostazioni del browser.'
        : err.name === 'NotFoundError'
        ? 'Nessun microfono trovato.'
        : `Errore microfono: ${err.message}`;
      toast({ title: 'Errore Microfono', description: msg, variant: 'destructive' });
      setState('error');
      setStatusText(`Errore: ${msg}`);
      return;
    }

    // Create and start SpeechRecognition
    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setStatusText('In ascolto…');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setState('processing');
        setStatusText('Elaborazione…');
        onResult(transcript);
        // Reset after a short delay
        setTimeout(() => {
          setState('idle');
          setStatusText('');
        }, 1500);
      } else {
        setState('idle');
        setStatusText('');
      }
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      const msg = getErrorMessage(event.error);
      toast({ title: 'Errore Vocale', description: msg, variant: 'destructive' });
      setState('error');
      setStatusText(`Errore: ${msg}`);
      recognitionRef.current = null;
      // Auto-clear error after 4s
      setTimeout(() => {
        setState('idle');
        setStatusText('');
      }, 4000);
    };

    recognition.onend = () => {
      // If still in listening state (no result/error fired), reset
      setState(prev => prev === 'listening' ? 'idle' : prev);
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
    } catch (err: any) {
      const msg = `Impossibile avviare il riconoscimento: ${err.message}`;
      toast({ title: 'Errore', description: msg, variant: 'destructive' });
      setState('error');
      setStatusText(`Errore: ${msg}`);
      recognitionRef.current = null;
    }
  }, [onResult]);

  return { state, statusText, startListening, stopListening };
}
