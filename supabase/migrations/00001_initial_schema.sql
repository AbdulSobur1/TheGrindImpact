-- The Grind Pact - Database Schema
-- Run this in Supabase SQL Editor

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  session_1_start TIME,
  session_1_end TIME,
  session_2_start TIME,
  session_2_end TIME,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Check-ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  session_number INT NOT NULL CHECK (session_number IN (1, 2)),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'missed', 'late')),
  photo_url TEXT,
  sarcasm_message TEXT,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  window_date DATE NOT NULL,
  UNIQUE(user_id, session_number, window_date)
);

-- 3. Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  current_daily_streak INT DEFAULT 0,
  best_daily_streak INT DEFAULT 0,
  current_weekly_streak INT DEFAULT 0,
  best_weekly_streak INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Feed posts table
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES check_ins(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('completed', 'missed', 'callout', 'system', 'badge', 'mvp')),
  sarcasm_message TEXT,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Invite links table
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  used_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- 7. Rest days table
CREATE TABLE IF NOT EXISTS rest_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  reason TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'admin' CHECK (scope IN ('global', 'admin')),
  created_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE
);

-- 8. Callouts table
CREATE TABLE IF NOT EXISTS callouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('Slacking', 'Missing Sessions', 'Too Quiet', 'Just Because')),
  callout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Badges catalog table
CREATE TABLE IF NOT EXISTS badges (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('universal', 'exclusive'))
);

-- 10. Member badges table
CREATE TABLE IF NOT EXISTS member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  badge_slug TEXT NOT NULL REFERENCES badges(slug) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, badge_slug)
);

-- 11. Weekly MVP table
CREATE TABLE IF NOT EXISTS weekly_mvp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE rest_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE callouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_mvp ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read all profiles, update their own
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Check-ins: users can read all, insert own, update own
CREATE POLICY "check_ins_read_all" ON check_ins FOR SELECT USING (TRUE);
CREATE POLICY "check_ins_insert_own" ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "check_ins_update_own" ON check_ins FOR UPDATE USING (auth.uid() = user_id);

-- Streaks: users can read all, update own
CREATE POLICY "streaks_read_all" ON streaks FOR SELECT USING (TRUE);
CREATE POLICY "streaks_insert_own" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_update_own" ON streaks FOR UPDATE USING (auth.uid() = user_id);

-- Feed posts: everyone can read, auth users can insert
CREATE POLICY "feed_posts_read_all" ON feed_posts FOR SELECT USING (TRUE);
CREATE POLICY "feed_posts_insert_auth" ON feed_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: users can read and update their own
CREATE POLICY "notifications_read_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Invite links: admin can insert/read, anyone can read by token
CREATE POLICY "invite_links_read_admin" ON invite_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "invite_links_insert_admin" ON invite_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "invite_links_update_admin" ON invite_links FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Rest days: everyone can read, admin can insert
CREATE POLICY "rest_days_read_all" ON rest_days FOR SELECT USING (TRUE);
CREATE POLICY "rest_days_insert_admin" ON rest_days FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Callouts: everyone can read, auth users can insert
CREATE POLICY "callouts_read_all" ON callouts FOR SELECT USING (TRUE);
CREATE POLICY "callouts_insert_auth" ON callouts FOR INSERT WITH CHECK (auth.uid() = caller_id);

-- Badges: everyone can read
CREATE POLICY "badges_read_all" ON badges FOR SELECT USING (TRUE);

-- Member badges: everyone can read, system can insert
CREATE POLICY "member_badges_read_all" ON member_badges FOR SELECT USING (TRUE);

-- Weekly MVP: everyone can read
CREATE POLICY "weekly_mvp_read_all" ON weekly_mvp FOR SELECT USING (TRUE);

-- Triggers / Functions

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );

  -- Initialize streaks
  INSERT INTO public.streaks (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Seed badges
INSERT INTO badges (slug, name, emoji, description, type) VALUES
  ('first_blood', 'First Blood', '🔥', 'Complete your very first session', 'universal'),
  ('day_one_done', 'Day One Done', '✅', 'Complete both sessions on your first active day', 'universal'),
  ('day_7_warrior', '7 Day Warrior', '📅', '7 day daily streak', 'universal'),
  ('fortnight_grind', 'Fortnight Grind', '💪', '14 day daily streak', 'universal'),
  ('day_30_beast', '30 Day Beast', '🏔️', '30 day daily streak', 'universal'),
  ('unbreakable', 'Unbreakable', '🧱', '60 day daily streak', 'universal'),
  ('no_days_off', 'No Days Off', '🌑', 'Complete a full week (6/6 days, both sessions)', 'universal'),
  ('month_locked_in', 'Month Locked In', '📆', 'Complete a full calendar month with no misses', 'universal'),
  ('early_riser', 'Early Riser', '🌅', 'Check in Session 1 within first 10 mins of window, 5 days in a row', 'universal'),
  ('speed_run', 'Speed Run', '⚡', 'Check in both sessions within 30 mins of each window opening, 3 days in a row', 'universal'),
  ('clean_week', 'Clean Week', '🎯', '7 days, zero late check-ins', 'universal'),
  ('ghost_mode', 'Ghost Mode', '👻', 'Complete full week with zero reactions on feed posts', 'universal'),
  ('resurrection', 'Resurrection', '💀', 'Reset streak to 0, then hit 7 consecutive days again', 'universal'),
  ('back_from_dead', 'Back From The Dead', '🔁', 'Reset streak to 0 twice, come back both times with 7 day streaks', 'universal'),
  ('proof_or_it_didnt_happen', 'Proof Or It Didnt Happen', '📸', 'Upload check-in photo 10 sessions in a row', 'universal'),
  ('called_out_showed_up', 'Called Out, Showed Up', '🤐', 'Get called out and then complete both sessions that same day', 'universal'),
  ('the_enforcer', 'The Enforcer', '🗣️', 'Successfully callout 5 different members in a week', 'universal'),
  ('weekly_mvp', 'Weekly MVP', '👑', 'Awarded to the most consistent member of the week', 'exclusive'),
  ('top_of_pact', 'Top of The Pact', '🥇', 'Hold the #1 leaderboard spot for 2 consecutive weeks', 'exclusive'),
  ('ice_cold', 'Ice Cold', '🧊', 'Never miss a session in the first 30 days after joining', 'exclusive'),
  ('callout_king', 'Callout King', '⚔️', 'Most callouts issued in a single month (min 10)', 'exclusive'),
  ('untouchable', 'Untouchable', '🎖️', 'Longest active daily streak in the group at any point', 'exclusive'),
  ('season_champion', 'Season Champion', '🏆', 'Most total sessions completed across a full month', 'exclusive')
ON CONFLICT (slug) DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, window_date);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invite_links_token ON invite_links(token);
CREATE INDEX IF NOT EXISTS idx_member_badges_user ON member_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_callouts_date ON callouts(callout_date);

-- Create storage buckets (run in Supabase Dashboard > Storage > Create Bucket)
-- Bucket: profile-photos (public, file size limit: 5MB, allowed MIME types: image/*)
-- Bucket: check-in-photos (public, file size limit: 10MB, allowed MIME types: image/*)

-- Storage bucket policies (run after creating buckets in dashboard)
-- NOTE: These need to be executed in Supabase SQL Editor after creating the buckets via UI
/*
-- Profile photos bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "profile_photos_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_insert_own" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "profile_photos_update_own" ON storage.objects FOR UPDATE USING (
  bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Check-in photos bucket policies
INSERT INTO storage.buckets (id, name, public) VALUES ('check-in-photos', 'check-in-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "checkin_photos_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'check-in-photos');
CREATE POLICY "checkin_photos_insert_own" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "checkin_photos_update_own" ON storage.objects FOR UPDATE USING (
  bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
*/
