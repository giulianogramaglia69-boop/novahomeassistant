import { useState, useRef, useCallback, useEffect } from 'react';
import { RadioStation } from '@/lib/types';

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'radioitalia',
    name: 'Radio Italia',
    icon: '🇮🇹',
    streams: [
      'https://radioitaliasmi.akamaized.net/hls/live/2093120/RISMI/stream01/streamPlaylist.m3u8',
      'https://stream.radioitalia.it/live.mp3',
    ],
    color: '0 70% 50%',
  },
  {
    id: 'rtl1025',
    name: 'RTL 102.5',
    icon: '📻',
    streams: [
      'https://streamingv2.shoutcast.com/rtl1025',
    ],
    color: '210 80% 55%',
  },
  {
    id: 'radiozeta',
    name: 'Radio Zeta',
    icon: '⚡',
    streams: [
      'https://dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S9346184/XEx1LqlYbNic/playlist.m3u8',
    ],
    color: '280 70% 60%',
  },
];

export function useRadio() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlaying(null);
    setLoading(false);
  }, []);

  const play = useCallback(async (stationId: string) => {
    const station = RADIO_STATIONS.find(s => s.id === stationId);
    if (!station) return;

    stop();
    setLoading(true);

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    for (const url of station.streams) {
      try {
        audio.src = url;
        audio.volume = volume;
        await audio.play();
        setPlaying(stationId);
        setLoading(false);
        return;
      } catch {
        continue;
      }
    }

    setLoading(false);
    console.error(`All streams failed for ${station.name}`);
  }, [stop, volume]);

  const toggle = useCallback((stationId: string) => {
    if (playing === stationId) {
      stop();
    } else {
      play(stationId);
    }
  }, [playing, play, stop]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  return { playing, loading, volume, toggle, stop, changeVolume, stations: RADIO_STATIONS };
}
