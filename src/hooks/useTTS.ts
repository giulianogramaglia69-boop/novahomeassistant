import { useState, useEffect, useCallback, useRef } from 'react';
import { playSpeakBlip } from '@/lib/chime';

const LS_KEY = 'nova_tts_enabled';

const getSynth = (): SpeechSynthesis | null => {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
};

export function useTTS() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(LS_KEY) === 'true');
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, String(enabled));
  }, [enabled]);

  useEffect(() => {
    const synth = getSynth();
    if (!synth) return;
    const interval = setInterval(() => {
      setSpeaking(prev => {
        const now = synth.speaking;
        if (prev !== now) {
          window.dispatchEvent(new CustomEvent(now ? 'nova-tts-start' : 'nova-tts-end'));
        }
        return now;
      });
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const getItalianVoice = useCallback(() => {
    const synth = getSynth();
    if (!synth) return null;
    const voices = synth.getVoices?.() || [];
    // Prefer a male, deep Italian voice if available (Jarvis tone)
    const male = voices.find(v => v.lang?.startsWith('it') && /male|maschile|luca|cosimo|giorgio|paolo|carlo/i.test(v.name));
    return male || voices.find(v => v.lang?.startsWith('it')) || null;
  }, []);

  const stop = useCallback(() => {
    const synth = getSynth();
    if (!synth) return;
    synth.cancel();
    setSpeaking(false);
    window.dispatchEvent(new CustomEvent('nova-tts-end'));
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled) return;
    const synth = getSynth();
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    synth.cancel();
    const clean = text.replace(/[*_#`~>\[\]()!|]/g, '').replace(/\n+/g, '. ').trim();
    if (!clean) return;
    playSpeakBlip();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'it-IT';
    utter.rate = 1.0;
    utter.pitch = 0.95; // slightly deeper, Jarvis-like
    const voice = getItalianVoice();
    if (voice) utter.voice = voice;
    utter.onstart = () => { setSpeaking(true); window.dispatchEvent(new CustomEvent('nova-tts-start')); };
    utter.onend = () => { setSpeaking(false); window.dispatchEvent(new CustomEvent('nova-tts-end')); };
    utter.onerror = () => { setSpeaking(false); window.dispatchEvent(new CustomEvent('nova-tts-end')); };
    utterRef.current = utter;
    synth.speak(utter);
  }, [enabled, getItalianVoice]);

  // Barge-in: stop speaking when user starts talking
  useEffect(() => {
    const onBarge = () => stop();
    window.addEventListener('nova-barge-in', onBarge);
    return () => window.removeEventListener('nova-barge-in', onBarge);
  }, [stop]);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const synth = getSynth();
      if (prev && synth) synth.cancel();
      return !prev;
    });
  }, []);

  useEffect(() => {
    const synth = getSynth();
    if (!synth) return;
    synth.getVoices?.();
    synth.onvoiceschanged = () => {};
  }, []);

  return { enabled, speaking, toggle, speak, stop };
}
