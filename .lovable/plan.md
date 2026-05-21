## Obiettivo

Portare NOVA al livello di Jarvis con personalità "Jarvis classico" (formale, ironia british, "Certamente, signore"), voce sempre attiva, proattività, capacità agentiche multi-step, riconoscimento volto e HUD Iron Man.

Lavoro diviso in 4 fasi sequenziali. Confermi ogni fase al termine prima di passare alla successiva.

---

### Fase 1 — Voce sempre attiva + Barge-in + Personalità Jarvis

**Voce continua (`useVoiceWake.ts` refactor)**

- Listening passivo permanente (non solo on-demand): SpeechRecognition `continuous=true`, `interimResults=true`, lang `it-IT`, auto-restart su `onend`/errori (no-speech, network).
- Rilevamento wake word "Ehi Nova" / "Nova" sui transcript interim. Quando rilevata: feedback ("Sì, signore?"), apertura finestra di comando 8s.
- **Barge-in**: mentre NOVA parla (TTS speaking=true), se il microfono capta voce → `speechSynthesis.cancel()` istantaneo e si mette in ascolto comando.
- Indicatore globale stato voce (idle/wake/listening/processing/speaking) sull'header.

**Personalità Jarvis (`nova-chat/index.ts` system prompt)**

- Riscrittura prompt: tono formale, asciutto, "Certamente, signore/signora", uso del titolo, frasi brevi, ironia sobria. Risposte mai >3 frasi salvo richiesta esplicita.
- Saluti personalizzati per profilo (Giuliano = "signore", Ilenia = "signora", Simone = "signorino", Admin = "Comandante").

---

### Fase 2 — Proattività & Routine

`**useProactivity.ts` hook + tabella `nova_routines**`

- Schedule engine client-side che ogni minuto valuta trigger e lancia messaggi/azioni proattive (parlati via TTS + notifica).
- Routine predefinite (configurabili in Settings):
  - **Buongiorno** (h 07:30 feriali): meteo + prima agenda + traffico se evento ha luogo + "Buongiorno signore".
  - **Buonanotte** (h 23:00): riepilogo domani, suggerisce scena Notte.
  - **Pre-evento** (15 min prima): annuncio vocale evento calendario.
  - **Allerta meteo**: pioggia/vento forte oggi.
  - **Consumi alti**: se kWh giornalieri > soglia → suggerisce spegnere device.
  - **Lavatrice fine ciclo**: notifica + voce.
- Nuovo pannello **Routine** nelle Settings: toggle on/off per ogni routine + orari personalizzabili.

---

### Fase 3 — AI Agentica Multi-Step

**Tool calling avanzato (`nova-chat/index.ts`)**

- Nuovo tool `run_sequence` che accetta array di azioni ed esegue in ordine con piccolo delay.
- Tool `delay` (secondi) per orchestrazioni temporali.
- System prompt aggiornato per ragionamento esplicito a step ("Procedo come segue: 1)… 2)…").
- Esempio: "Preparami la serata cinema" → scena Cinema (TV on, luci soffuse) + timer popcorn 5 min + abbassa volume radio + "Tutto pronto, signore".

**Nuove macro/scene utente**

- Tabella `nova_macros` (profile_name, name, steps jsonb). UI in HomePanel per creare macro personalizzate da scene+azioni.

---

### Fase 4 — Visione & HUD Iron Man

**Visione (`useVision.ts` + `VisionPanel.tsx`)**

- Camera frontale via `getUserMedia` (opt-in da Settings, off di default per privacy).
- Riconoscimento volto con `face-api.js` (modelli caricati da CDN) → match con foto profilo memorizzata → auto-unlock + saluto personalizzato.
- Rilevamento presenza: se nessuno davanti per 2 min → entra in screensaver. Se torna qualcuno → wake.
- Sentiment base (sorride/neutro/serio) iniettato nel context AI ("L'utente sembra di buon umore").

**HUD Reattivo (`DashboardPanel.tsx` + nuovo `JarvisHUD.tsx`)**

- Sfera centrale animata (SVG + canvas) che reagisce all'audio:
  - Idle: pulsazione lenta.
  - Ascolto: anelli concentrici espansi al volume del mic (AnalyserNode su MediaStream esistente).
  - Parla: onda sinusoidale animata al volume TTS (analyser sul flusso speechSynthesis tramite proxy oppure simulazione su lunghezza testo).
- Anelli HUD rotanti con timer/data/meteo lungo il bordo (Syne mono digits).
- Radar consumi kWh (grafico polare a 24 ore).
- Particelle di sfondo + scanline + glow accent del tema corrente (rispetta i 4 temi).
- Overlay diagnostica top-right: profilo attivo, # device on, latenza ultima risposta AI, batteria sistema (se disponibile via Battery API).

---

## Dettagli tecnici

**Nuovi file**

- `src/hooks/useProactivity.ts`, `src/hooks/useVision.ts`, `src/hooks/useMacros.ts`
- `src/components/nova/JarvisHUD.tsx`, `src/components/nova/VisionPanel.tsx`, `src/components/nova/RoutinesSettings.tsx`, `src/components/nova/MacrosManager.tsx`

**File modificati**

- `src/hooks/useVoiceWake.ts` (continuo + barge-in)
- `src/hooks/useTTS.ts` (notify start/end con eventi globali per barge-in e HUD)
- `src/components/nova/DashboardPanel.tsx` (embed JarvisHUD)
- `src/components/nova/SettingsPanel.tsx` (routine + visione + privacy camera)
- `src/components/nova/NovaHeader.tsx` (indicatore voce stato)
- `src/pages/Index.tsx` (wire hooks)
- `supabase/functions/nova-chat/index.ts` (prompt Jarvis + nuovi tool)
- `src/index.css` (animazioni HUD: pulse-ring, scan-line, hologram)

**Database (migration)**

- `nova_routines (id, profile_name, key, enabled, hour, minute, days, config jsonb)`
- `nova_macros (id, profile_name, name, steps jsonb, created_at)`
- `nova_face_profiles (profile_name, descriptor jsonb)` per face-api

**Dipendenze**

- `face-api.js` (visione) — caricata solo se utente abilita la camera per evitare bloat.

**Permessi & privacy**

- Camera **opt-in esplicito** in Settings, indicatore rosso fisso quando attiva, possibilità di disattivare in 1 tap.
- Tutta l'elaborazione volto è client-side, solo il descriptor numerico salvato su DB.

---

## Cosa NON cambio

- Sistema temi (4 attuali resta).
- SmartThings integration.
- Schema notes/reminders/calendar/shopping/messages esistenti.
- PIN lock (resta come fallback se face recognition disabilitato o fallisce).

---

## Ordine di consegna

1. **Fase 1** (voce + personalità) — impatto immediato, base per il resto.
2. **Fase 4 HUD** (visivo) — wow factor.
3. **Fase 2** (proattività).
4. **Fase 3** (agente multi-step).
5. **Fase 4 Visione** (camera) per ultima per via dei permessi/dipendenza pesante.

Confermi questo piano e partiamo da fare tutte le fasi