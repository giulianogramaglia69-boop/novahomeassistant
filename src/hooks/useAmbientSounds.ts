import { useState, useRef, useCallback } from 'react';

export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  url: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Pioggia', icon: '🌧️', url: `${SUPABASE_URL}/storage/v1/object/public/ambiente/Rain` },
  { id: 'ocean', name: 'Oceano', icon: '🌊', url: `${SUPABASE_URL}/storage/v1/object/public/ambiente/Ocean` },
  { id: 'nature', name: 'Natura', icon: '🌿', url: `${SUPABASE_URL}/storage/v1/object/public/ambiente/Nature` },
];

export function useAmbientSounds() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = useCallback((id: string) => {
    if (playing === id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const sound = SOUNDS.find(s => s.id === id);
    if (!sound) return;

    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = volume;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlaying(id);
  }, [playing, volume]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
  }, []);

  return { sounds: SOUNDS, playing, volume, toggle, changeVolume, stop };
}
