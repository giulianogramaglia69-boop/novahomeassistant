CREATE TABLE IF NOT EXISTS public.nova_face_profiles (
  profile_name text PRIMARY KEY,
  descriptor jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nova_face_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to nova_face_profiles" ON public.nova_face_profiles FOR ALL USING (true) WITH CHECK (true);