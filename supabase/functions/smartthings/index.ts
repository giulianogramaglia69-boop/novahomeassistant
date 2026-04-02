import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ST_BASE = "https://api.smartthings.com/v1";

class SmartThingsHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "SmartThingsHttpError";
  }
}

function parseBody(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function smartThingsRequest(
  token: string,
  path: string,
  init?: RequestInit,
) {
  const res = await fetch(`${ST_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  const parsed = parseBody(text);

  if (!res.ok) {
    throw new SmartThingsHttpError(
      `SmartThings ${path} failed [${res.status}]: ${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`,
      res.status,
    );
  }

  return parsed;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Try env secret first, then vault fallback
  let rawToken = Deno.env.get("SMARTTHINGS_TOKEN");
  
  if (!rawToken) {
    try {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { db: { schema: "vault" } },
      );
      const { data } = await sb
        .from("decrypted_secrets")
        .select("decrypted_secret")
        .eq("name", "smartthings_token")
        .maybeSingle();
      if (data?.decrypted_secret) rawToken = data.decrypted_secret;
    } catch (e) {
      console.error("Vault read error:", e);
    }
  }

  const token = rawToken?.trim().replace(/^Bearer\s+/i, "");

  if (!token) {
    return new Response(JSON.stringify({ error: "SMARTTHINGS_TOKEN non configurato" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, deviceId, command, component, capability, args } = await req.json();

    // LIST devices
    if (action === "list") {
      const data = await smartThingsRequest(token, "/devices");
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET device status
    if (action === "status" && deviceId) {
      const data = await smartThingsRequest(token, `/devices/${deviceId}/status`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SEND command to device
    if (action === "command" && deviceId && command && capability) {
      const body = {
        commands: [
          {
            component: component || "main",
            capability,
            command,
            arguments: args || [],
          },
        ],
      };

      const data = await smartThingsRequest(token, `/devices/${deviceId}/commands`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Azione non valida. Usa: list, status, command" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("SmartThings error:", e);

    if (e instanceof SmartThingsHttpError) {
      const status = e.status === 401 ? 401 : e.status;
      const message =
        e.status === 401
          ? "SmartThings non autorizzato: aggiorna SMARTTHINGS_TOKEN con un nuovo Personal Access Token valido e permessi dispositivi/comandi."
          : e.message;

      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
