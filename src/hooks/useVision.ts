import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';

const LS_KEY = 'nova_vision_enabled';
const PRESENCE_THRESHOLD = 12; // mean pixel diff to consider "motion"
const ABSENCE_MS = 2 * 60 * 1000; // 2 min no motion = absent

export interface UseVisionResult {
  enabled: boolean;
  toggle: () => void;
  active: boolean;
  present: boolean;
  motionLevel: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  lastPresenceAt: number | null;
}

/**
 * Privacy-respecting computer vision hook.
 * - Opt-in via Settings (persisted in localStorage).
 * - Camera stream stays client-side, only motion stats are exposed.
 * - Lightweight motion-based presence detection (no ML models).
 */
export function useVision(opts: {
  onPresenceChange?: (present: boolean) => void;
}): UseVisionResult {
  const [enabled, setEnabled] = useState<boolean>(() => localStorage.getItem(LS_KEY) === 'true');
  const [active, setActive] = useState(false);
  const [present, setPresent] = useState(false);
  const [motionLevel, setMotionLevel] = useState(0);
  const [lastPresenceAt, setLastPresenceAt] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onPresenceChangeRef = useRef(opts.onPresenceChange);
  useEffect(() => { onPresenceChangeRef.current = opts.onPresenceChange; }, [opts.onPresenceChange]);

  const toggle = useCallback(() => {
    setEnabled(v => {
      const nv = !v;
      localStorage.setItem(LS_KEY, String(nv));
      return nv;
    });
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    prevFrameRef.current = null;
    setActive(false);
    setPresent(false);
    setMotionLevel(0);
  }, []);

  useEffect(() => {
    if (!enabled) { stop(); return; }
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 160, height: 120 },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setActive(true);

        // Offscreen canvas for frame diff
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
          canvasRef.current.width = 64;
          canvasRef.current.height = 48;
        }
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true })!;

        let lastSample = 0;
        let lastMotionAt = Date.now();

        const tick = () => {
          rafRef.current = requestAnimationFrame(tick);
          const v = videoRef.current;
          if (!v || v.readyState < 2) return;

          const now = performance.now();
          if (now - lastSample < 250) return; // 4 fps sampling
          lastSample = now;

          ctx.drawImage(v, 0, 0, 64, 48);
          const frame = ctx.getImageData(0, 0, 64, 48);
          const prev = prevFrameRef.current;
          if (prev) {
            let diff = 0;
            const d1 = frame.data, d0 = prev.data;
            // sample every 4th pixel for speed
            for (let i = 0; i < d1.length; i += 16) {
              diff += Math.abs(d1[i] - d0[i]);
            }
            const avg = diff / (d1.length / 16);
            setMotionLevel(avg);
            const isMoving = avg > PRESENCE_THRESHOLD;
            if (isMoving) {
              lastMotionAt = Date.now();
              setLastPresenceAt(lastMotionAt);
              if (!present) {
                setPresent(true);
                onPresenceChangeRef.current?.(true);
              }
            } else if (present && Date.now() - lastMotionAt > ABSENCE_MS) {
              setPresent(false);
              onPresenceChangeRef.current?.(false);
            }
          }
          prevFrameRef.current = frame;
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err: any) {
        const msg = err?.name === 'NotAllowedError'
          ? 'Permesso fotocamera negato.'
          : `Fotocamera non disponibile: ${err?.message || ''}`;
        toast({ title: 'Visione', description: msg, variant: 'destructive' });
        localStorage.setItem(LS_KEY, 'false');
        setEnabled(false);
      }
    })();

    return () => { cancelled = true; stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { enabled, toggle, active, present, motionLevel, videoRef, lastPresenceAt };
}
