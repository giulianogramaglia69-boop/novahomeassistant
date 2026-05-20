
CREATE TABLE public.nova_ai_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_name, key)
);
ALTER TABLE public.nova_ai_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nova_ai_memory" ON public.nova_ai_memory FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.nova_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile text NOT NULL,
  to_profile text NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nova_messages" ON public.nova_messages FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.nova_messages;

CREATE TABLE public.nova_shopping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text NOT NULL,
  qty text,
  category text,
  done boolean NOT NULL DEFAULT false,
  added_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nova_shopping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nova_shopping" ON public.nova_shopping FOR ALL USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.nova_shopping;
