
-- Notes table
CREATE TABLE public.nova_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_name TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar events table
CREATE TABLE public.nova_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_name TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reminders table
CREATE TABLE public.nova_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_name TEXT NOT NULL,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications history table
CREATE TABLE public.nova_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- All tables are public (no auth, PIN-based profiles)
ALTER TABLE public.nova_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_notifications ENABLE ROW LEVEL SECURITY;

-- Allow full access (app uses PIN lock, not auth)
CREATE POLICY "Allow all access to nova_notes" ON public.nova_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to nova_calendar_events" ON public.nova_calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to nova_reminders" ON public.nova_reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to nova_notifications" ON public.nova_notifications FOR ALL USING (true) WITH CHECK (true);
