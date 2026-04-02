import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string" || token.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Token non valido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      db: { schema: "vault" },
    });

    // Delete existing smartthings_token secret if any
    const { data: existing } = await supabase
      .from("secrets")
      .select("id")
      .eq("name", "smartthings_token")
      .maybeSingle();

    if (existing) {
      await supabase.from("secrets").delete().eq("id", existing.id);
    }

    // Insert new secret
    const { error } = await supabase.from("secrets").insert({
      name: "smartthings_token",
      secret: token.trim(),
    });

    if (error) {
      console.error("Vault insert error:", error);
      return new Response(
        JSON.stringify({ error: "Errore salvataggio token nel vault" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Token SmartThings aggiornato nel backend" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
