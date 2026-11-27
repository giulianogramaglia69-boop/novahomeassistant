import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.js';
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
const MATCH_THRESHOLD = 0.55; // euclidean distance (lower = stricter)

declare global { interface Window { faceapi?: any } }

let loadingPromise: Promise<any> | null = null;
async function loadFaceApi(): Promise<any> {
  if (typeof window === 'undefined') throw new Error('no window');
  if (window.faceapi?.nets?.faceRecognitionNet?.params) return window.faceapi;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    if (!window.faceapi) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = SCRIPT_SRC;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Errore caricamento face-api'));
        document.head.appendChild(s);
      });
    }
    const fa = window.faceapi!;
    await Promise.all([
      fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    return fa;
  })();
  return loadingPromise;
}

export interface FaceProfile { profile_name: string; descriptor: number[] }

export function useFaceRecognition(videoRef: React.RefObject<HTMLVideoElement>) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<FaceProfile[]>([]);
  const faRef = useRef<any>(null);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('nova_face_profiles').select('profile_name,descriptor');
    setProfiles((data as FaceProfile[]) || []);
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // I profili vengono caricati anche prima del login (come anon, quindi
  // vuoti dopo la stretta RLS): ricarica quando la famiglia accede.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') fetchProfiles();
    });
    return () => subscription.unsubscribe();
  }, [fetchProfiles]);

  const ensureLoaded = useCallback(async () => {
    if (faRef.current) return faRef.current;
    setLoading(true);
    try {
      const fa = await loadFaceApi();
      faRef.current = fa;
      setReady(true);
      return fa;
    } catch (e: any) {
      toast({ title: 'Visione', description: 'Modelli volto non disponibili.', variant: 'destructive' });
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const detectDescriptor = useCallback(async (): Promise<number[] | null> => {
    const fa = await ensureLoaded();
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const opts = new fa.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    const det = await fa.detectSingleFace(video, opts).withFaceLandmarks().withFaceDescriptor();
    if (!det?.descriptor) return null;
    return Array.from(det.descriptor as Float32Array);
  }, [ensureLoaded, videoRef]);

  const enroll = useCallback(async (profileName: string): Promise<boolean> => {
    const desc = await detectDescriptor();
    if (!desc) {
      toast({ title: 'Volto non rilevato', description: 'Inquadra il viso e riprova.', variant: 'destructive' });
      return false;
    }
    const { error } = await supabase.from('nova_face_profiles').upsert(
      { profile_name: profileName, descriptor: desc, updated_at: new Date().toISOString() },
      { onConflict: 'profile_name' }
    );
    if (error) {
      toast({ title: 'Errore', description: 'Salvataggio volto fallito.', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Volto registrato ✓', description: profileName });
    await fetchProfiles();
    return true;
  }, [detectDescriptor, fetchProfiles]);

  const recognize = useCallback(async (): Promise<{ profileName: string; distance: number } | null> => {
    const desc = await detectDescriptor();
    if (!desc || profiles.length === 0) return null;
    let best: { profileName: string; distance: number } | null = null;
    for (const p of profiles) {
      let s = 0;
      for (let i = 0; i < desc.length; i++) {
        const d = desc[i] - (p.descriptor[i] ?? 0);
        s += d * d;
      }
      const dist = Math.sqrt(s);
      if (!best || dist < best.distance) best = { profileName: p.profile_name, distance: dist };
    }
    if (best && best.distance <= MATCH_THRESHOLD) return best;
    return null;
  }, [detectDescriptor, profiles]);

  const removeProfile = useCallback(async (profileName: string) => {
    await supabase.from('nova_face_profiles').delete().eq('profile_name', profileName);
    fetchProfiles();
  }, [fetchProfiles]);

  return { ready, loading, profiles, enroll, recognize, removeProfile, refresh: fetchProfiles };
}
