import { useState, useEffect, useCallback, useRef } from 'react';

const LS_KEY = 'nova_tts_enabled';

export function useTTS() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(LS_KEY) === 'true');
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    localStorage.setItem(LS_KEY, String(enabled));
  }, [enabled]);

  // Track speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeaking(window.speechSynthesis.speaking);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const getItalianVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.lang.startsWith('it')) || null;
  }, []);

  const speak = useCallback((text: string) => {
    if (!enabled) return;
    window.speechSynthesis.cancel();
    // Strip markdown
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
    window.speechSynthesis.speak(utter);
  }, [enabled, getItalianVoice]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      if (prev) window.speechSynthesis.cancel();
      return !prev;
    });
  }, []);

  // Preload voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {};
  }, []);

  return { enabled, speaking, toggle, speak, stop };
}
