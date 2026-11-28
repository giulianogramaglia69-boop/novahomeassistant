// Parser deterministico per "ricorda che..." in chat.
// La edge function nova-chat ha già un tool `remember`, ma il modello può
// non chiamarlo: questo parser garantisce che un fatto detto in chat venga
// salvato nella memoria del profilo attivo (nova_ai_memory, già per-profilo
// via profile_name + UNIQUE(profile_name, key)) anche senza l'AI.

export interface RememberRequest {
  /** Chiave breve derivata dal fatto (snake_case, max 3 parole). */
  key: string;
  /** Il fatto completo, così come detto. */
  value: string;
}

const STOPWORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
  'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
  'che', 'non', 'mi', 'ti', 'si', 'ci', 'vi',
  'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
  'sono', 'sei', 'è', 'siamo', 'siete',
  'ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno',
  'mio', 'mia', 'miei', 'mie', 'tuo', 'tua', 'tuoi', 'tue',
  'suo', 'sua', 'suoi', 'sue', 'nostro', 'nostra',
  'questo', 'questa', 'questi', 'queste', 'quello', 'quella',
  'e', 'o', 'ma', 'anche', 'come', 'quando', 'dove',
]);

/** "sono allergico alle noci" -> "allergico_alle_noci" (max 3 parole utili). */
export function factToKey(fact: string): string {
  const words = fact
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .slice(0, 3);
  const key = words.join('_');
  return key || 'nota';
}

/** "Ricorda che sono allergico alle noci" -> { key: 'allergico_alle_noci',
 *  value: 'sono allergico alle noci' }. Null se non è una richiesta di
 *  memoria ("ricorda che..." / "ricordati che..." / "memorizza che..."). */
export function parseRememberRequest(text: string): RememberRequest | null {
  const m = text
    .trim()
    .match(/^(?:ricorda|ricordati|memorizza)(?:\s+che)?\s+(.+)$/i);
  if (!m) return null;
  const value = m[1].trim().replace(/[.!?]+$/, '');
  if (value.length < 3) return null;
  const key = factToKey(value);
  // "ricorda che" da solo (o solo stopword) non è un fatto salvabile.
  if (key === 'nota') return null;
  return { key, value };
}
