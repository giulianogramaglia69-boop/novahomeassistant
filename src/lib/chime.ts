/** Sci-fi chime sounds via HTMLAudioElement — never AudioContext (project rule). */

let chimeEl: HTMLAudioElement | null = null;
let blipEl: HTMLAudioElement | null = null;

/** Two-tone notification chime. */
export function playChime() {
  try {
    if (!chimeEl) chimeEl = new Audio('/nova-chime.mp3');
    chimeEl.currentTime = 0;
    chimeEl.volume = 0.6;
    chimeEl.play().catch(() => {});
  } catch { /* silent */ }
}

/** Soft blip played just before NOVA starts speaking. */
export function playSpeakBlip() {
  try {
    if (!blipEl) blipEl = new Audio('/nova-blip.mp3');
    blipEl.currentTime = 0;
    blipEl.volume = 0.45;
    blipEl.play().catch(() => {});
  } catch { /* silent */ }
}
