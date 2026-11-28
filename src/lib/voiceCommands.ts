// Parser puro (nessun fetch, nessun side effect) per i comandi vocali
// in italiano rivolti ai dispositivi reali di casa.
//
// Mappa comando → azione ponte (src/lib/bridge.ts: sendBridgeAction(config, id, action, params)).
// Device id: TV Samsung = 'samsung-tv' (helper findBridgeTv), Chromecast = 'chromecast-camera'.
//   power on/off   → 'samsung-tv', 'power', {}                          — ATTENZIONE: 'power' è un TOGGLE
//                                                                     (accende se spenta, spegne se accesa).
//                                                                     Il parser distingue on/off solo per la
//                                                                     conferma in chat: chi esegue deve
//                                                                     verificare lo stato live prima o
//                                                                     accettare il comportamento toggle.
//   volume_up      → 'samsung-tv' | 'chromecast-camera', 'volume_up', { step: 0.05 }
//   volume_down    → 'samsung-tv' | 'chromecast-camera', 'volume_down', { step: 0.05 }
//   mute           → 'samsung-tv', 'mute', {}
//   channel_up     → 'samsung-tv', 'channel_up', {}
//   channel_down   → 'samsung-tv', 'channel_down', {}
//   play           → 'samsung-tv' | 'chromecast-camera', 'play', {}
//   pause          → 'samsung-tv' | 'chromecast-camera', 'pause', {}
//   launch_app     → 'samsung-tv' | 'chromecast-camera', 'launch_app', { app_id: 'youtube' | 'netflix' | 'spotify' }
//   source         → 'samsung-tv', 'source', { source: 'tv' | 'HDMI1' | 'HDMI2' }
//
// Nota: la TV non è più su SmartThings — il controllo reale passa dal
// ponte Nova Bridge. Il coordinatore (Index.tsx) cabla questo parser
// nella chat e chiede conferma prima delle azioni mutanti.

export type VoiceCommand =
  | { kind: 'power'; target: 'tv'; want: 'on' | 'off' }
  | { kind: 'volume_up' | 'volume_down' | 'mute' | 'channel_up' | 'channel_down' | 'play' | 'pause'; target: 'tv' | 'chromecast' }
  | { kind: 'launch_app'; target: 'tv' | 'chromecast'; app: 'youtube' | 'netflix' | 'spotify' }
  | { kind: 'source'; target: 'tv'; source: 'tv' | 'HDMI1' | 'HDMI2' };

/** Normalizza il testo: minuscole, toglie la wake word iniziale, toglie la punteggiatura e gli accenti, collassa gli spazi. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(ehi nova|hey nova|ok nova|nova)\s+/, '')
    .replace(/^(ehi nova|hey nova|ok nova|nova)$/, '');
}

/** Frasi che sono richieste/promemoria, mai comandi dispositivo. */
const NON_COMMAND_RE = /^(ricorda|ricordami|aggiungi|segna|nota|appunta)\b/;

/** Target: 'chromecast' se il testo menziona chromecast/camera, altrimenti 'tv'. */
function detectTarget(t: string): 'tv' | 'chromecast' {
  return /\b(chromecast|camera)\b/.test(t) ? 'chromecast' : 'tv';
}

function parseApp(t: string): 'youtube' | 'netflix' | 'spotify' | null {
  if (/\byoutube\b/.test(t)) return 'youtube';
  if (/\bnetflix\b/.test(t)) return 'netflix';
  if (/\bspotify\b/.test(t)) return 'spotify';
  return null;
}

/**
 * Riconosce un comando dispositivo in italiano.
 * Restituisce null per frasi non-comando ("che ore sono", "ricorda che...",
 * "ciao", "com'è il meteo", "aggiungi latte alla spesa", ...).
 */
export function parseVoiceCommand(text: string): VoiceCommand | null {
  const t = normalize(text);
  if (!t || NON_COMMAND_RE.test(t)) return null;

  // Sorgente: "sorgente tv", "metti hdmi 1", "passa a hdmi 2", "sorgente hdmi 1".
  if (/\b(hdmi|sorgente|ingresso)\b/.test(t)) {
    if (/\bhdmi\s*2\b/.test(t)) return { kind: 'source', target: 'tv', source: 'HDMI2' };
    if (/\bhdmi\s*1\b/.test(t)) return { kind: 'source', target: 'tv', source: 'HDMI1' };
    if (/\b(sorgente|ingresso)\b/.test(t) && /\b(tv|televisione|televisore)\b/.test(t)) {
      return { kind: 'source', target: 'tv', source: 'tv' };
    }
  }

  // App: "apri youtube", "metti netflix sul chromecast", "apri spotify in camera".
  const app = parseApp(t);
  if (app) return { kind: 'launch_app', target: detectTarget(t), app };

  // Accensione: "accendi la tv", "spegni la televisione".
  // 'power' esiste solo per la TV: "accendi il chromecast" non è rappresentabile.
  const powerOn = /\b(accendi|accendere)\b/.test(t);
  const powerOff = /\b(spegni|spegnere|spengi)\b/.test(t);
  if (powerOn || powerOff) {
    if (/\b(luce|luci|lampada|lampadina)\b/.test(t)) return null;
    const mentionsTv = /\b(tv|televisione|televisore)\b/.test(t);
    const mentionsCast = /\b(chromecast|camera)\b/.test(t);
    if (mentionsCast && !mentionsTv) return null;
    return { kind: 'power', target: 'tv', want: powerOn ? 'on' : 'off' };
  }

  // Volume: "alza il volume", "abbassa il volume della tv", "alza il volume di camera", "volume su/giù".
  if (/\b(alza|aumenta|alzare|aumentare)\b/.test(t) || (/\bvolume\b/.test(t) && /\b(su|alto)\b/.test(t))) {
    return { kind: 'volume_up', target: detectTarget(t) };
  }
  if (/\b(abbassa|diminuisci|abbassare|diminuire)\b/.test(t) || (/\bvolume\b/.test(t) && /\b(giu|basso)\b/.test(t))) {
    return { kind: 'volume_down', target: detectTarget(t) };
  }

  // Muto: "muto", "silenzia la tv", "metti muto".
  // "togli il muto" / "riattiva l'audio" è l'opposto (unmute, non supportato) → null.
  if (/\btogli (il )?muto\b/.test(t) || /\briattiva l audio\b/.test(t)) return null;
  if (/\b(muto|silenzia|silenziare|senza audio)\b/.test(t) || /\btogli l audio\b/.test(t) || /\bdisattiva l audio\b/.test(t)) {
    return { kind: 'mute', target: detectTarget(t) };
  }

  // Canali: "canale successivo/precedente", "canale su/giù", "cambia canale".
  if (/\bcanale\b/.test(t) || /\bcambia canale\b/.test(t)) {
    if (/\b(successivo|su|avanti|prossimo)\b/.test(t) || /\bcambia canale\b/.test(t)) {
      return { kind: 'channel_up', target: detectTarget(t) };
    }
    if (/\b(precedente|giu|indietro)\b/.test(t)) {
      return { kind: 'channel_down', target: detectTarget(t) };
    }
  }

  // Pausa / play: "metti in pausa", "pausa", "riprendi", "play".
  if (/\b(metti in pausa|in pausa|pausa|ferma la riproduzione)\b/.test(t)) {
    return { kind: 'pause', target: detectTarget(t) };
  }
  if (/\b(riprendi|riprendi la riproduzione|play|continua|riproduci)\b/.test(t)) {
    return { kind: 'play', target: detectTarget(t) };
  }

  return null;
}

const TARGET_LABEL: Record<'tv' | 'chromecast', { di: string; su: string }> = {
  tv: { di: 'della TV', su: 'sulla TV' },
  chromecast: { di: 'del Chromecast', su: 'sul Chromecast' },
};

const APP_LABEL: Record<'youtube' | 'netflix' | 'spotify', string> = {
  youtube: 'YouTube',
  netflix: 'Netflix',
  spotify: 'Spotify',
};

/** Descrizione italiana del comando, per la conferma in chat. */
export function describeVoiceCommand(cmd: VoiceCommand): string {
  switch (cmd.kind) {
    case 'power':
      return cmd.want === 'on' ? 'Accendere la TV' : 'Spegnere la TV';
    case 'volume_up':
      return `Alzare il volume ${TARGET_LABEL[cmd.target].di}`;
    case 'volume_down':
      return `Abbassare il volume ${TARGET_LABEL[cmd.target].di}`;
    case 'mute':
      return `Silenziare ${cmd.target === 'tv' ? 'la TV' : 'il Chromecast'}`;
    case 'channel_up':
      return `Canale successivo ${TARGET_LABEL[cmd.target].su}`;
    case 'channel_down':
      return `Canale precedente ${TARGET_LABEL[cmd.target].su}`;
    case 'play':
      return `Riprendere la riproduzione ${TARGET_LABEL[cmd.target].su}`;
    case 'pause':
      return `Mettere in pausa ${TARGET_LABEL[cmd.target].su}`;
    case 'launch_app':
      return `Aprire ${APP_LABEL[cmd.app]} ${TARGET_LABEL[cmd.target].su}`;
    case 'source':
      return cmd.source === 'tv' ? 'Passare alla sorgente TV' : `Passare a ${cmd.source}`;
  }
}
