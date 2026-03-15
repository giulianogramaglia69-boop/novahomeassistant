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
      'https://dd.rtl.it/content/pub/rtl1025.mp3',
    ],
    color: '210 80% 55%',
  },
  {
    id: 'deejay',
    name: 'Radio Deejay',
    icon: '🎧',
    streams: [
      'https://streamcdnb10-4556349f1e22.msvdn.net/radiodeejay/radiodeejay/play1.mp3',
      'https://4c4b867c89244861ac216426883d1ad0.msvdn.net/radiodeejay/radiodeejay/chunklist.m3u8',
    ],
    color: '45 90% 55%',
  },
  {
    id: 'radiozeta',
    name: 'Radio Zeta',
    icon: '⚡',
    streams: [
      'https://streamcdnf2-4556349f1e22.msvdn.net/live/radiozeta/radiozeta/chunklist.m3u8',
      'https://streamcdnf2-4556349f1e22.msvdn.net/live/radiozeta/radiozeta/play1.mp3',
    ],
    color: '280 70% 60%',
  },
  {
    id: 'rete94',
    name: 'Rete 94',
    icon: '🎵',
    streams: [
      'https://sr13.streams.ovh/stream/rete94',
    ],
    color: '168 100% 45%',
  },
];

export function useRadio() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const duckVolumeRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = duckVolumeRef.current ? volume * 0.2 : volume;
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

    // Try each stream URL as fallback
    for (const url of station.streams) {
      try {
        audio.src = url;
        audio.volume = volume;
        await audio.play();
        setPlaying(stationId);
        setLoading(false);
        return;
      } catch {
        // Try next stream
        continue;
      }
    }

    // All streams failed
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
      audioRef.current.volume = duckVolumeRef.current ? v * 0.2 : v;
    }
  }, []);

  // Audio ducking for voice
  const duck = useCallback(() => {
    duckVolumeRef.current = true;
    if (audioRef.current) {
      audioRef.current.volume = volume * 0.2;
    }
  }, [volume]);

  const unduck = useCallback(() => {
    duckVolumeRef.current = false;
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return { playing, loading, volume, toggle, stop, changeVolume, duck, unduck, stations: RADIO_STATIONS };
}
