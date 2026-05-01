import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ST_BASE = "https://api.smartthings.com/v1";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const tools = [
  {
    type: "function",
    function: {
      name: "control_device",
      description: "Controlla un dispositivo SmartThings (TV Samsung o Lavatrice Samsung). Può accendere, spegnere, cambiare canale TV, cambiare volume TV, cambiare sorgente TV.",
      parameters: {
        type: "object",
        properties: {
          device: { type: "string", enum: ["tv", "lavatrice"] },
          action: { type: "string", enum: ["on", "off", "set_channel", "set_volume", "set_input", "get_status"] },
          value: { type: "string" },
        },
        required: ["device", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Ottieni meteo attuale e previsioni.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_reminder",
      description: "Gestisci promemoria: add/list/complete/remove.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "list", "complete", "remove"] },
          text: { type: "string" },
          index: { type: "number" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "navigate_tab",
      description: "Naviga a una scheda dell'app NOVA.",
      parameters: {
        type: "object",
        properties: {
          tab: { type: "string", enum: ["dashboard", "chat", "home", "radio", "meteo", "reminders", "timer", "calendar", "ambiente", "news", "web", "settings"] },
        },
        required: ["tab"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Esegui una ricerca web su GlowSearch e apri la scheda Web con i risultati.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Query di ricerca" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "start_timer",
      description: "Avvia un timer con durata in secondi e etichetta opzionale.",
      parameters: {
        type: "object",
        properties: {
          seconds: { type: "number" },
          label: { type: "string" },
        },
        required: ["seconds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "play_radio",
      description: "Avvia o ferma una stazione radio. Stazioni: 'radio italia', 'rtl', 'zeta'.",
      parameters: {
        type: "object",
        properties: {
          station: { type: "string", description: "nome stazione, vuoto per stop" },
          action: { type: "string", enum: ["play", "stop"] },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "play_ambient",
      description: "Avvia o ferma un suono ambientale (pioggia, vento, foresta, ecc).",
      parameters: {
        type: "object",
        properties: {
          sound: { type: "string" },
          action: { type: "string", enum: ["play", "stop"] },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_calendar_event",
      description: "Crea evento calendario. Date in formato YYYY-MM-DD, orari HH:MM.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          date: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "date", "startTime", "endTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_note",
      description: "Aggiungi una nota.",
      parameters: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
  },
];

function findDeviceIdFromContext(context: any, type: string): string | null {
  const devices = context?.smartDevices || [];
  const match = devices.find((d: any) => {
    if (type === 'tv') return d.type === 'tv';
    if (type === 'lavatrice') return d.type === 'washer';
    return false;
  });
  return match?.deviceId || null;
}

async function findDeviceId(token: string, type: string, context: any): Promise<string | null> {
  const fromContext = findDeviceIdFromContext(context, type);
  if (fromContext) return fromContext;
  try {
    const res = await fetch(`${ST_BASE}/devices`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.items || [];
    const match = items.find((d: any) => {
      const cats = d.components?.flatMap((c: any) => c.categories?.map((cat: any) => cat.name.toLowerCase()) || []) || [];
      const name = (d.label || d.name || '').toLowerCase();
      if (type === 'tv') return cats.includes('television') || cats.includes('tv') || name.includes('tv');
      if (type === 'lavatrice') return cats.includes('washer') || name.includes('washer') || name.includes('lavat');
      return false;
    });
    return match?.deviceId || null;
  } catch { return null; }
}

async function getDeviceStatus(token: string, deviceId: string) {
  const res = await fetch(`${ST_BASE}/devices/${deviceId}/status`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) return null;
  return await res.json();
}

async function sendDeviceCommand(token: string, deviceId: string, capability: string, command: string, args: any[] = []) {
  const res = await fetch(`${ST_BASE}/devices/${deviceId}/commands`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ commands: [{ component: "main", capability, command, arguments: args }] }),
  });
  return res.ok;
}

async function executeToolCall(toolName: string, args: any, stToken: string, context: any): Promise<string> {
  if (toolName === "control_device") {
    const deviceId = await findDeviceId(stToken, args.device, context);
    if (!deviceId) return `Dispositivo "${args.device}" non trovato.`;
    switch (args.action) {
      case "on": await sendDeviceCommand(stToken, deviceId, "switch", "on"); return `${args.device} accesa.`;
      case "off": await sendDeviceCommand(stToken, deviceId, "switch", "off"); return `${args.device} spenta.`;
      case "set_channel":
        if (args.device !== 'tv') return "Solo TV.";
        await sendDeviceCommand(stToken, deviceId, "tvChannel", "setTvChannel", [args.value || "1"]);
        return `Canale ${args.value}.`;
      case "set_volume":
        if (args.device !== 'tv') return "Solo TV.";
        await sendDeviceCommand(stToken, deviceId, "audioVolume", "setVolume", [parseInt(args.value || "20")]);
        return `Volume ${args.value}.`;
      case "set_input":
        if (args.device !== 'tv') return "Solo TV.";
        await sendDeviceCommand(stToken, deviceId, "samsungvd.mediaInputSource", "setInputSource", [args.value || "dtv"]);
        return `Sorgente ${args.value}.`;
      case "get_status": {
        const status = await getDeviceStatus(stToken, deviceId);
        if (!status) return "Stato non disponibile.";
        const sw = status?.components?.main?.switch?.switch?.value || "?";
        return `${args.device}: ${sw}`;
      }
      default: return "Azione sconosciuta.";
    }
  }

  if (toolName === "get_weather") {
    if (context.weather) {
      const w = context.weather;
      let response = `Meteo a ${w.city}: ${w.temperature}°C, ${w.description}. Percepita: ${w.feelsLike}°C. Umidità: ${w.humidity}%. Vento: ${w.windSpeed} km/h.`;
      if (w.forecast?.length) response += "\nPrev: " + w.forecast.map((f: any) => `${f.day}: ${f.tempMin}°-${f.tempMax}°`).join(", ");
      return response;
    }
    return "Dati meteo non disponibili.";
  }

  if (toolName === "manage_reminder") {
    const reminders = context.reminders || [];
    switch (args.action) {
      case "list":
        if (reminders.length === 0) return "Nessun promemoria.";
        return reminders.map((r: any, i: number) => `${i + 1}. ${r.done ? '✅' : '⬜'} ${r.text}`).join("\n");
      case "add": return `TOOL_ACTION:ADD_REMINDER:${args.text}`;
      case "complete":
        if (args.index !== undefined && reminders[args.index]) return `TOOL_ACTION:COMPLETE_REMINDER:${args.index}`;
        return "Indice non valido.";
      case "remove":
        if (args.index !== undefined && reminders[args.index]) return `TOOL_ACTION:REMOVE_REMINDER:${args.index}`;
        return "Indice non valido.";
      default: return "Azione non valida.";
    }
  }

  if (toolName === "navigate_tab") return `TOOL_ACTION:NAVIGATE:${args.tab}`;
  if (toolName === "web_search") return `TOOL_ACTION:WEB_SEARCH:${args.query}`;
  if (toolName === "start_timer") return `TOOL_ACTION:START_TIMER:${JSON.stringify({ seconds: args.seconds, label: args.label || 'Timer' })}`;
  if (toolName === "play_radio") return `TOOL_ACTION:PLAY_RADIO:${JSON.stringify({ station: args.station || '', action: args.action })}`;
  if (toolName === "play_ambient") return `TOOL_ACTION:PLAY_AMBIENT:${JSON.stringify({ sound: args.sound || '', action: args.action })}`;
  if (toolName === "add_calendar_event") return `TOOL_ACTION:ADD_EVENT:${JSON.stringify(args)}`;
  if (toolName === "add_note") return `TOOL_ACTION:ADD_NOTE:${args.text}`;

  return "Tool non riconosciuto.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY non configurata");

    let ST_TOKEN = "";
    try {
      const sbUrl = Deno.env.get("SUPABASE_URL") || "";
      const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      if (sbUrl && sbKey) {
        const dbRes = await fetch(`${sbUrl}/rest/v1/app_settings?key=eq.smartthings_token&select=value`, {
          headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
        });
        if (dbRes.ok) {
          const rows = await dbRes.json();
          if (rows?.[0]?.value) ST_TOKEN = rows[0].value;
        }
      }
    } catch { /* ignore */ }
    if (!ST_TOKEN) ST_TOKEN = Deno.env.get("SMARTTHINGS_TOKEN") || "";

    const notesContext = context?.notes?.length ? `\n\nNote:\n${context.notes.map((n: any) => `- ${n.text} (${n.timestamp})`).join('\n')}` : '';
    const timersContext = context?.timers?.length ? `\n\nTimer:\n${context.timers.map((t: any) => `- ${t.label}: ${Math.floor(t.remainingSeconds/60)}m ${t.remainingSeconds%60}s ${t.running ? '(corso)' : t.done ? '(done)' : '(pausa)'}`).join('\n')}` : '';
    const devicesContext = context?.smartDevices?.length ? `\n\nDispositivi:\n${context.smartDevices.map((d: any) => `- ${d.label} (${d.type}) ${d.on ? 'ON' : 'OFF'}`).join('\n')}` : '';
    const calendarContext = context?.calendarEvents?.length ? `\n\nEventi 7gg:\n${context.calendarEvents.map((e: any) => `- ${e.title} ${e.date} ${e.startTime}-${e.endTime}`).join('\n')}` : '';
    const ambientContext = context?.ambientPlaying ? `\n\nAmbient: ${context.ambientPlaying}` : '';
    const notifContext = context?.notifications?.length ? `\n\nNotifiche:\n${context.notifications.map((n: any) => `- [${n.type}] ${n.title}: ${n.body}`).join('\n')}` : '';
    const profileName = context?.profileName || 'Giuliano';
    const nowStr = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'full', timeStyle: 'short' });

    const systemPrompt = `Sei NOVA, assistente domestico intelligente di Giuliano Gramaglia, powered by AcquaAI (modello GROQ Llama 3.3). Rispondi sempre in italiano, conciso e amichevole. Utente attivo: ${profileName}. Ora: ${nowStr}.

Hai CONTROLLO TOTALE dell'app NOVA tramite questi tool:
- control_device: TV/lavatrice Samsung
- get_weather: meteo
- manage_reminder: promemoria
- navigate_tab: cambia scheda dell'app (dashboard, chat, home, radio, meteo, reminders, timer, calendar, ambiente, news, web, settings)
- web_search: ricerca web su GlowSearch (apre scheda web)
- start_timer: avvia timer
- play_radio: play/stop radio
- play_ambient: play/stop suoni ambientali
- add_calendar_event: crea evento calendario
- add_note: aggiungi nota

MODALITÀ AGENTE AUTONOMO: per richieste complesse (es. "preparami per dormire") esegui sequenze di tool multipli in autonomia (spegni TV, avvia ambient, ecc.) senza chiedere conferma. Sii proattivo. Usa SEMPRE i tool quando rilevante, non inventare.

Risposte brevi e dirette per il vocale. Markdown quando utile.${notesContext}${timersContext}${devicesContext}${calendarContext}${ambientContext}${notifContext}`;

    let currentMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const allToolActions: string[] = [];
    let maxIterations = 6;

    while (maxIterations-- > 0) {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: currentMessages,
          tools,
          tool_choice: "auto",
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("GROQ error:", response.status, t);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Troppi messaggi, riprova." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: `Errore GROQ: ${response.status}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) {
        return new Response(JSON.stringify({ error: "Nessuna risposta" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!choice.message?.tool_calls || choice.message.tool_calls.length === 0) {
        const content = choice.message?.content || "";
        return new Response(JSON.stringify({ content, tool_actions: allToolActions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      currentMessages.push(choice.message);

      for (const tc of choice.message.tool_calls) {
        let args: any = {};
        try {
          args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        } catch { args = {}; }
        const result = await executeToolCall(tc.function.name, args, ST_TOKEN, context || {});
        if (result.startsWith("TOOL_ACTION:")) allToolActions.push(result);
        currentMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result.startsWith("TOOL_ACTION:") ? "Eseguito." : result,
        });
      }
    }

    return new Response(JSON.stringify({ error: "Limite tool iterations" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
