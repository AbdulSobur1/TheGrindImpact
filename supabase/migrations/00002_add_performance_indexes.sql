-- Performance Optimization - Add Indexes
-- Run this in Supabase SQL Editor

-- Check-ins indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_user_date ON check_ins(user_id, window_date DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_created ON check_ins(user_id, checked_in_at DESC);

-- Feed posts indexes
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_user_created ON feed_posts(user_id, created_at DESC);

-- Exercise logs indexes
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON exercise_logs(user_id, window_date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_created ON exercise_logs(user_id, created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Streaks indexes
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);

-- Member badges indexes
CREATE INDEX IF NOT EXISTS idx_member_badges_user ON member_badges(user_id, earned_at DESC);

-- Callouts indexes
CREATE INDEX IF NOT EXISTS idx_callouts_target ON callouts(target_id, callout_date DESC);
CREATE INDEX IF NOT EXISTS idx_callouts_caller ON callouts(caller_id, created_at DESC);

-- Weekly MVP indexes
CREATE INDEX IF NOT EXISTS idx_weekly_mvp_user_week ON weekly_mvp(user_id, week_start DESC);

-- REST DAYS indexes
CREATE INDEX IF NOT EXISTS idx_rest_days_date ON rest_days(date DESC);
