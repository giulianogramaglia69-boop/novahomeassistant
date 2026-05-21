CREATE TABLE IF NOT EXISTS public.nova_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name TEXT NOT NULL,
  key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  hour INTEGER NOT NULL DEFAULT 8,
  minute INTEGER NOT NULL DEFAULT 0,
  days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_name, key)
);
ALTER TABLE public.nova_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nova_routines" ON public.nova_routines FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.nova_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nova_macros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nova_macros" ON public.nova_macros FOR ALL USING (true) WITH CHECK (true);