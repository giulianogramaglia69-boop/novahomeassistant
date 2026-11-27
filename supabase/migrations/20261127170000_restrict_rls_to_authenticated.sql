-- Nova Home Hub: chiude l'accesso anonimo alle tabelle dati.
--
-- Prima di questa migration 10 tabelle avevano la policy
-- "Allow all access to <tabella>" con USING (true) WITH CHECK (true):
-- chiunque avesse la chiave anon (pubblica: è nel bundle dell'app e
-- in .env) poteva leggere, scrivere e cancellare tutto.
-- Una dodicesima tabella, nova_items (bacheca famiglia: post-it, annunci,
-- spese, dispensa, pacchi), non ha una migration nel repo — è stata
-- creata fuori dalle migration — quindi le sue policy esistenti vengono
-- rimosse in modo generico (qualunque nome abbiano).
--
-- Dopo questa migration solo le richieste con ruolo `authenticated`
-- (utente Supabase Auth, sessione persistente) possono leggere e
-- scrivere. app_settings resta com'è (policy service-role-only con
-- USING (false)). La publication realtime NON viene toccata: le
-- subscription continuano a funzionare per gli utenti autenticati
-- (supabase-js aggiorna il token realtime al login).
--
-- DA APPLICARE NELLA DASHBOARD SUPABASE (SQL Editor) DOPO aver creato
-- l'utente famiglia in Authentication. Non viene applicata da sola.

-- nova_notes
ALTER TABLE public.nova_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_notes" ON public.nova_notes;
CREATE POLICY "Authenticated access to nova_notes" ON public.nova_notes
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_calendar_events
ALTER TABLE public.nova_calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_calendar_events" ON public.nova_calendar_events;
CREATE POLICY "Authenticated access to nova_calendar_events" ON public.nova_calendar_events
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_reminders
ALTER TABLE public.nova_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_reminders" ON public.nova_reminders;
CREATE POLICY "Authenticated access to nova_reminders" ON public.nova_reminders
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_notifications
ALTER TABLE public.nova_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_notifications" ON public.nova_notifications;
CREATE POLICY "Authenticated access to nova_notifications" ON public.nova_notifications
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_ai_memory
ALTER TABLE public.nova_ai_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_ai_memory" ON public.nova_ai_memory;
CREATE POLICY "Authenticated access to nova_ai_memory" ON public.nova_ai_memory
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_messages
ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_messages" ON public.nova_messages;
CREATE POLICY "Authenticated access to nova_messages" ON public.nova_messages
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_shopping
ALTER TABLE public.nova_shopping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_shopping" ON public.nova_shopping;
CREATE POLICY "Authenticated access to nova_shopping" ON public.nova_shopping
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_routines
ALTER TABLE public.nova_routines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_routines" ON public.nova_routines;
CREATE POLICY "Authenticated access to nova_routines" ON public.nova_routines
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_macros
ALTER TABLE public.nova_macros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_macros" ON public.nova_macros;
CREATE POLICY "Authenticated access to nova_macros" ON public.nova_macros
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_face_profiles
ALTER TABLE public.nova_face_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to nova_face_profiles" ON public.nova_face_profiles;
CREATE POLICY "Authenticated access to nova_face_profiles" ON public.nova_face_profiles
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- nova_items (bacheca famiglia; creata fuori dalle migration, nome delle
-- policy esistenti sconosciuto: vengono rimosse tutte, qualunque nome
-- abbiano; se la tabella non esiste il blocco non fa nulla).
DO $$
DECLARE
  pol record;
BEGIN
  IF to_regclass('public.nova_items') IS NOT NULL THEN
    ALTER TABLE public.nova_items ENABLE ROW LEVEL SECURITY;
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'nova_items'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.nova_items', pol.policyname);
    END LOOP;
    CREATE POLICY "Authenticated access to nova_items" ON public.nova_items
      FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
