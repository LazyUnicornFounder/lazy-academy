
-- Child rewards (XP & levels)
CREATE TABLE public.child_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  xp_total INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id)
);

ALTER TABLE public.child_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own child rewards"
ON public.child_rewards
FOR ALL
USING (child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid()))
WITH CHECK (child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid()));

-- Badges
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(child_id, badge_type)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own child badges"
ON public.badges
FOR ALL
USING (child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid()))
WITH CHECK (child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid()));

-- Daily challenge flag on lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_daily_challenge BOOLEAN NOT NULL DEFAULT false;
