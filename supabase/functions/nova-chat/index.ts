import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ST_BASE = "https://api.smartthings.com/v1";

const tools = [
  {
    type: "function",
    function: {
      name: "control_device",
      description: "Controlla un dispositivo SmartThings (TV Samsung o Lavatrice Samsung). Può accendere, spegnere, cambiare canale TV, cambiare volume TV, cambiare sorgente TV.",
      parameters: {
        type: "object",
        properties: {
          device: { type: "string", enum: ["tv", "lavatrice"], description: "Il dispositivo da controllare" },
          action: { type: "string", enum: ["on", "off", "set_channel", "set_volume", "set_input", "get_status"], description: "L'azione da eseguire" },
          value: { type: "string", description: "Valore per l'azione (numero canale, livello volume, nome sorgente)" },
        },
        required: ["device", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Ottieni le informazioni meteo attuali e le previsioni per la posizione dell'utente.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_reminder",
      description: "Gestisci i promemoria dell'utente. Puoi aggiungere, elencare o completare promemoria.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["add", "list", "complete", "remove"], description: "L'azione da eseguire" },
          text: { type: "string", description: "Testo del promemoria (per add)" },
          index: { type: "number", description: "Indice del promemoria (per complete/remove, 0-based)" },
        },
        required: ["action"],
      },
    },
  },
];

// Find device ID from context first, then fallback to API
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
  // Try context first (already fetched by client)
  const fromContext = findDeviceIdFromContext(context, type);
  if (fromContext) return fromContext;

  // Fallback to API call
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
  } catch {
    return null;
  }
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
    body: JSON.stringify({
      commands: [{ component: "main", capability, command, arguments: args }],
    }),
  });
  return res.ok;
}

async function executeToolCall(toolName: string, args: any, stToken: string, context: any): Promise<string> {
  if (toolName === "control_device") {
    const deviceId = await findDeviceId(stToken, args.device, context);
    if (!deviceId) return `Dispositivo "${args.device}" non trovato. Assicurati che sia collegato e visibile nella pagina Casa.`;

    switch (args.action) {
      case "on":
        await sendDeviceCommand(stToken, deviceId, "switch", "on");
        return `${args.device === 'tv' ? 'TV' : 'Lavatrice'} accesa.`;
      case "off":
        await sendDeviceCommand(stToken, deviceId, "switch", "off");
        return `${args.device === 'tv' ? 'TV' : 'Lavatrice'} spenta.`;
      case "set_channel":
        if (args.device !== 'tv') return "Il cambio canale è disponibile solo per la TV.";
        await sendDeviceCommand(stToken, deviceId, "tvChannel", "setTvChannel", [args.value || "1"]);
        return `Canale TV impostato su ${args.value}.`;
      case "set_volume":
        if (args.device !== 'tv') return "Il volume è disponibile solo per la TV.";
        await sendDeviceCommand(stToken, deviceId, "audioVolume", "setVolume", [parseInt(args.value || "20")]);
        return `Volume TV impostato a ${args.value}.`;
      case "set_input":
        if (args.device !== 'tv') return "La sorgente è disponibile solo per la TV.";
        await sendDeviceCommand(stToken, deviceId, "samsungvd.mediaInputSource", "setInputSource", [args.value || "dtv"]);
        return `Sorgente TV impostata su ${args.value}.`;
      case "get_status": {
        const status = await getDeviceStatus(stToken, deviceId);
        if (!status) return "Impossibile ottenere lo stato.";
        const sw = status?.components?.main?.switch?.switch?.value || "sconosciuto";
        if (args.device === 'tv') {
          const ch = status?.components?.main?.tvChannel?.tvChannelName?.value || "N/D";
          const vol = status?.components?.main?.audioVolume?.volume?.value || "N/D";
          const input = status?.components?.main?.samsungvd?.mediaInputSource?.inputSource?.value || "N/D";
          return `TV: ${sw}, Canale: ${ch}, Volume: ${vol}%, Sorgente: ${input}`;
        } else {
          const machineState = status?.components?.main?.washerOperatingState?.machineState?.value || "N/D";
          const jobState = status?.components?.main?.washerOperatingState?.washerJobState?.value || "N/D";
          return `Lavatrice: ${sw}, Stato: ${machineState}, Lavaggio: ${jobState}`;
        }
      }
      default:
        return "Azione non riconosciuta.";
    }
  }

  if (toolName === "get_weather") {
    // Use context weather data passed from client
    if (context.weather) {
      const w = context.weather;
      let response = `Meteo a ${w.city}: ${w.temperature}°C, ${w.description}. Percepita: ${w.feelsLike}°C. Umidità: ${w.humidity}%. Vento: ${w.windSpeed} km/h.`;
      if (w.forecast?.length) {
        response += "\nPrevisioni: " + w.forecast.map((f: any) => `${f.day}: ${f.icon} ${f.tempMin}°-${f.tempMax}°`).join(", ");
      }
      return response;
    }
    return "Dati meteo non disponibili. L'utente deve prima rilevare la posizione nelle impostazioni.";
  }

  if (toolName === "manage_reminder") {
    const reminders = context.reminders || [];
    switch (args.action) {
      case "list":
        if (reminders.length === 0) return "Non hai promemoria.";
        return "Promemoria:\n" + reminders.map((r: any, i: number) => `${i + 1}. ${r.done ? '✅' : '⬜'} ${r.text}`).join("\n");
      case "add":
        return `TOOL_ACTION:ADD_REMINDER:${args.text}`;
      case "complete":
        if (args.index !== undefined && reminders[args.index]) {
          return `TOOL_ACTION:COMPLETE_REMINDER:${args.index}`;
        }
        return "Indice promemoria non valido.";
      case "remove":
        if (args.index !== undefined && reminders[args.index]) {
          return `TOOL_ACTION:REMOVE_REMINDER:${args.index}`;
        }
        return "Indice promemoria non valido.";
      default:
        return "Azione promemoria non valida.";
    }
  }

  return "Tool non riconosciuto.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Read SmartThings token from DB first, then fallback to env
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

    const notesContext = context?.notes?.length ? `\n\nNote dell'utente:\n${context.notes.map((n: any) => `- ${n.text} (${n.timestamp})`).join('\n')}` : '';
    const timersContext = context?.timers?.length ? `\n\nTimer attivi:\n${context.timers.map((t: any) => `- ${t.label}: ${Math.floor(t.remainingSeconds/60)}m ${t.remainingSeconds%60}s ${t.running ? '(in corso)' : t.done ? '(completato)' : '(in pausa)'}`).join('\n')}` : '';
    const devicesContext = context?.smartDevices?.length ? `\n\nDispositivi SmartThings collegati:\n${context.smartDevices.map((d: any) => `- ${d.label} (${d.type}) - ${d.on ? 'Acceso' : 'Spento'}`).join('\n')}` : '';
    const calendarContext = context?.calendarEvents?.length ? `\n\nEventi calendario prossimi 7 giorni:\n${context.calendarEvents.map((e: any) => `- ${e.title} il ${e.date} dalle ${e.startTime} alle ${e.endTime}${e.description ? ' — ' + e.description : ''}`).join('\n')}` : '';
    const ambientContext = context?.ambientPlaying ? `\n\nSuono ambientale in riproduzione: ${context.ambientPlaying}` : '';
    const profileName = context?.profileName || 'Giuliano';
    const nowStr = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'full', timeStyle: 'short' });

    const systemPrompt = `Sei NOVA, un assistente domestico intelligente creato da Giuliano Gramaglia, powered by AcquaAI. Rispondi sempre in italiano in modo conciso e amichevole. L'utente attivo è: ${profileName}. Data e ora attuali: ${nowStr}.

Hai accesso a questi strumenti:

1. **Controllo dispositivi SmartThings**: Puoi accendere/spegnere la TV Samsung e la Lavatrice Samsung, cambiare canale, volume e sorgente della TV, e controllare lo stato di entrambi.
2. **Meteo**: Puoi consultare le informazioni meteo attuali e le previsioni.
3. **Promemoria**: Puoi aggiungere, elencare, completare e rimuovere promemoria.

Quando l'utente chiede qualcosa relativo ai dispositivi, meteo o promemoria, USA SEMPRE i tool disponibili. Non inventare informazioni, usa i tool.
Usa un tono caldo e professionale. Formatta le risposte con markdown quando utile.
Rispondi in modo breve e diretto, specialmente per i comandi vocali.${notesContext}${timersContext}${devicesContext}${calendarContext}${ambientContext}`;

    let currentMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Tool calling loop
    let maxIterations = 5;
    while (maxIterations-- > 0) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: currentMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Troppi messaggi, riprova tra poco." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "Errore AI gateway" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        return new Response(JSON.stringify({ error: "Nessuna risposta dall'AI" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If no tool calls, return the text response
      if (!choice.message?.tool_calls || choice.message.tool_calls.length === 0) {
        const content = choice.message?.content || "";
        // Check for tool actions embedded in content
        const toolActions: string[] = [];
        const cleanContent = content;

        return new Response(JSON.stringify({ 
          content: cleanContent,
          tool_actions: toolActions,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Execute tool calls
      currentMessages.push(choice.message);
      const toolActions: string[] = [];

      for (const tc of choice.message.tool_calls) {
        const args = typeof tc.function.arguments === 'string' 
          ? JSON.parse(tc.function.arguments) 
          : tc.function.arguments;
        
        const result = await executeToolCall(tc.function.name, args, ST_TOKEN, context || {});
        
        // Collect tool actions for frontend
        if (result.startsWith("TOOL_ACTION:")) {
          toolActions.push(result);
        }

        currentMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result.startsWith("TOOL_ACTION:") ? "Fatto!" : result,
        });
      }

      // Store tool actions to include in final response
      if (toolActions.length > 0) {
        (currentMessages as any)._toolActions = [...((currentMessages as any)._toolActions || []), ...toolActions];
      }
    }

    return new Response(JSON.stringify({ error: "Troppi passaggi di tool calling" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
