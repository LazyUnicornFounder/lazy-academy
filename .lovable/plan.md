

# LazyAcademy — AI-Powered Learning Curriculum Generator

## Overview
A warm, playful web app where parents input their child's age and interests, AI generates a personalized 30-day curriculum, and parents track daily progress with streaks and badges.

**Tagline:** "Your kid's personalized school. Built in 60 seconds."

---

## Phase 1: Foundation & Design System

- Set up design tokens: background `#f5f4ed`, card `#faf9f5`, brand terracotta `#c96442`, dark `#141413`, text colors, Georgia headings, Inter body
- Configure Tailwind with custom colors, 8px/16px border radius, generous spacing
- Build shared layout components (page wrapper, section container, nav)

## Phase 2: Landing Page (/)

- Hero section with tagline, subhead, and "Create a Curriculum — Free" CTA
- 3 example lesson cards (Space+Math Age 8, Dinosaurs+Reading Age 6, Coding+Logic Age 12)
- "How it works" 3-step section with icons
- "What a lesson looks like" sample lesson card with Read/Activity/Watch/Create sections
- Pricing cards (Free trial, Family $9/mo, Premium $19/mo)
- Testimonials placeholder section
- FAQ accordion (5 questions)
- Footer

## Phase 3: Auth & Database

- Enable Lovable Cloud with Google OAuth
- Create database tables: `profiles`, `children`, `curricula`, `lessons`, `badges` with RLS policies
- Auto-create profile on signup trigger
- Set up Supabase Storage bucket for child creation uploads

## Phase 4: Onboarding (/setup)

- Auth-gated multi-step form with playful UI:
  - Step 1: Child's name, age group (big buttons: 3-5, 6-8, 9-12, 13-16), avatar picker (8 animal icons)
  - Step 2: Interest grid (18 colorful selectable cards, pick 3-6)
  - Step 3: Learning goals (pick 2-4 from 8 options)
  - Step 4: Schedule (days per week, minutes per lesson as selectable buttons)
- "Generate Curriculum" CTA → fun loading screen with facts → redirect to dashboard

## Phase 5: Curriculum Generation (Edge Function)

- `generate-curriculum` edge function using **Lovable AI Gateway** (not Anthropic — uses the pre-configured gateway for simpler setup)
- Takes child profile, generates 30 structured lessons as JSON
- Each lesson has: read content, activity (math/quiz/writing/open), watch query, create project, parent note
- Inserts curriculum + 30 lessons into database
- Returns curriculum ID

## Phase 6: Parent Dashboard (/app)

- Header: child name + avatar + streak 🔥 + "Day X of 30"
- Progress bar (0-100%)
- "Today's Lesson" prominent card with Start button
- Week view: Mon-Sun row with completed/today/upcoming indicators
- Skills progress bars per learning goal
- "This Week's Topics" upcoming lesson list
- "Add Another Child" button
- Sidebar nav (desktop) / tab bar (mobile): Dashboard, Lessons, Progress, Settings

## Phase 7: Lesson View (/app/lesson/:id)

- Distraction-free layout (no sidebar)
- Header: day number, topic, estimated time, difficulty dots
- 4 collapsible sections: Read (📖), Activity (🧩), Watch (▶️), Create (🎨)
- Activity types: math input + check/hint, writing textarea, quiz multiple choice, open-ended
- Image upload for Create section (Supabase Storage)
- Parent Note collapsible section
- Bottom bar: Mark Complete ✓ (big green, satisfying animation), Skip, Previous/Next nav

## Phase 8: Lesson Completion (Edge Function)

- `complete-lesson` edge function: marks complete, updates streak, checks badge triggers
- Badge system: First Step, Week Warrior (7-day), Creator (first upload), Math Whiz (10 math), Science Explorer, Graduate (all 30), etc.
- Badge earned animation on dashboard

## Phase 9: Progress Page (/app/progress)

- Calendar heatmap (friendly colors, like GitHub contributions)
- Skills bar chart per learning goal
- Streak stats: current + longest
- Badges gallery with earned/locked states
- Completion counter: "23 of 30 lessons"
- Per-interest breakdown

## Phase 10: Settings (/app/settings)

- Edit child profile (name, age, avatar)
- Edit interests & goals (triggers curriculum adaptation)
- Edit schedule
- Add/switch children
- "Regenerate Curriculum" button
- Manage subscription link

## Phase 11: Curriculum Adaptation (Edge Function)

- `adapt-curriculum` edge function using Lovable AI Gateway
- Reads progress, adjusts remaining lessons based on completion patterns
- Called on interest changes or manual regeneration

## Phase 12: Payments (Polar)

- Create Polar products: Family ($9/mo), Premium ($19/mo)
- Checkout flow from pricing cards
- `polar-webhook` edge function: handle subscription.created → update plan, subscription.cancelled → downgrade
- Gate features by plan (number of children, curriculum features)

## Key UX Principles

- Mobile-first responsive design throughout
- Fun, warm aesthetic — big buttons, colorful cards, playful interactions
- Mark Complete = most satisfying interaction (green flash, streak increment, optional confetti)
- Empty states are encouraging ("Ready for day 1? Let's go!")
- Loading states show fun learning facts
- Badge animations when earned

