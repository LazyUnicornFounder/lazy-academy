-- Spaced repetition fields on lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS review_due_at timestamptz;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;

-- Reminder fields on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reminder_time time;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false;

-- Module projects table
CREATE TABLE public.module_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL,
  module_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  instructions text,
  photo_url text,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  content_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.module_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own module projects"
  ON public.module_projects FOR ALL
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()))
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- Storage bucket for project photos
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true);

CREATE POLICY "Anyone can view project photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-photos');

CREATE POLICY "Authenticated users upload project photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their project photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their project photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-photos' AND auth.role() = 'authenticated');