import { useState, useEffect, useCallback, useRef } from 'react';

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
      setSpeaking(synth.speaking);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const getItalianVoice = useCallback(() => {
    const synth = getSynth();
    if (!synth) return null;
    const voices = synth.getVoices?.() || [];
    return voices.find(v => v.lang.startsWith('it')) || null;
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled) return;
    const synth = getSynth();
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;
    synth.cancel();
    const clean = text.replace(/[*_#`~>\[\]()!|]/g, '').replace(/\n+/g, '. ').trim();
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'it-IT';
    const voice = getItalianVoice();
    if (voice) utter.voice = voice;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    utterRef.current = utter;
    setSpeaking(true);
    synth.speak(utter);
  }, [enabled, getItalianVoice]);

  const stop = useCallback(() => {
    const synth = getSynth();
    if (!synth) return;
    synth.cancel();
    setSpeaking(false);
  }, []);

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
