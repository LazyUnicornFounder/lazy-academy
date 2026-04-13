-- Delete lessons first (depends on modules)
DELETE FROM public.lessons;

-- Delete module projects
DELETE FROM public.module_projects;

-- Delete curriculum modules
DELETE FROM public.curriculum_modules;

-- Reset progress
UPDATE public.child_progress SET total_lessons_completed = 0, current_streak = 0, longest_streak = 0, last_activity_at = NULL;

-- Reset rewards
UPDATE public.child_rewards SET xp_total = 0, level = 1;

-- Delete badges (earned from old curriculum)
DELETE FROM public.badges;