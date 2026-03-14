import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ST_BASE = "https://api.smartthings.com/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get("SMARTTHINGS_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "SMARTTHINGS_TOKEN non configurato" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const { action, deviceId, command, component, capability, args } = await req.json();

    // LIST devices
    if (action === "list") {
      const res = await fetch(`${ST_BASE}/devices`, { headers: stHeaders });
      if (!res.ok) throw new Error(`SmartThings list failed [${res.status}]: ${await res.text()}`);
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET device status
    if (action === "status" && deviceId) {
      const res = await fetch(`${ST_BASE}/devices/${deviceId}/status`, { headers: stHeaders });
      if (!res.ok) throw new Error(`SmartThings status failed [${res.status}]: ${await res.text()}`);
      const data = await res.json();
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
      const res = await fetch(`${ST_BASE}/devices/${deviceId}/commands`, {
        method: "POST",
        headers: stHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`SmartThings command failed [${res.status}]: ${await res.text()}`);
      const data = await res.json();
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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
