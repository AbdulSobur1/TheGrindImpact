-- The Grind Pact 2.0 - Workout System Schema
-- Run this in Supabase SQL Editor after the initial migration

-- 1. Workout Programs
CREATE TABLE IF NOT EXISTS workout_programs (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_category TEXT NOT NULL CHECK (goal_category IN ('bulk', 'cut', 'curves', 'glutes', 'greek_physique', 'sculpt', 'general')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('men', 'women', 'unisex')),
  difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  weeks INT NOT NULL DEFAULT 8,
  days_per_week INT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💪',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Program Days (daily workout structure)
CREATE TABLE IF NOT EXISTS program_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug TEXT NOT NULL REFERENCES workout_programs(slug) ON DELETE CASCADE,
  week_number INT NOT NULL,
  day_number INT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'cardio', 'glutes', 'abs', 'rest')),
  focus_area TEXT,
  note TEXT,
  UNIQUE(program_slug, week_number, day_number)
);

-- 3. Exercise Library
CREATE TABLE IF NOT EXISTS exercises (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL CHECK (muscle_group IN (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'lower_back',
    'full_body', 'cardio'
  )),
  category TEXT NOT NULL CHECK (category IN ('compound', 'isolation', 'bodyweight', 'cardio', 'calisthenics')),
  equipment TEXT NOT NULL CHECK (equipment IN (
    'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'band', 'kettlebell', 'ez_bar', 'none'
  )),
  description TEXT,
  video_url TEXT,
  target_goals TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE
);

-- 4. Program Day Exercises (which exercises on each day, with sets/reps)
CREATE TABLE IF NOT EXISTS program_day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  exercise_slug TEXT NOT NULL REFERENCES exercises(slug) ON DELETE CASCADE,
  sets INT NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '8-12',
  rest_seconds INT DEFAULT 90,
  order_index INT NOT NULL DEFAULT 0,
  notes TEXT,
  UNIQUE(program_day_id, exercise_slug)
);

-- 5. Exercise Logs (what members actually did during a session)
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  exercise_slug TEXT NOT NULL REFERENCES exercises(slug) ON DELETE CASCADE,
  session_number INT NOT NULL CHECK (session_number IN (1, 2)),
  window_date DATE NOT NULL,
  sets_completed INT,
  reps_completed TEXT,
  weight_kg DECIMAL(6,1),
  duration_minutes INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Member Goals
CREATE TABLE IF NOT EXISTS member_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  primary_goal TEXT NOT NULL CHECK (primary_goal IN ('bulk', 'cut', 'curves', 'glutes', 'greek_physique', 'sculpt', 'general_fitness')),
  active_program_slug TEXT REFERENCES workout_programs(slug) ON DELETE SET NULL,
  custom_target TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Progress Photos
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  body_part TEXT NOT NULL CHECK (body_part IN ('front', 'back', 'side', 'arms', 'legs', 'glutes', 'abs', 'full')),
  note TEXT,
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Body Measurements
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,1),
  chest_cm DECIMAL(5,1),
  waist_cm DECIMAL(5,1),
  hips_cm DECIMAL(5,1),
  arms_cm DECIMAL(5,1),
  thighs_cm DECIMAL(5,1),
  glutes_cm DECIMAL(5,1),
  body_fat_pct DECIMAL(4,1),
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, measured_at)
);

-- Enable RLS
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "workout_programs_read_all" ON workout_programs FOR SELECT USING (TRUE);
CREATE POLICY "program_days_read_all" ON program_days FOR SELECT USING (TRUE);
CREATE POLICY "exercises_read_all" ON exercises FOR SELECT USING (TRUE);
CREATE POLICY "program_day_exercises_read_all" ON program_day_exercises FOR SELECT USING (TRUE);

CREATE POLICY "exercise_logs_read_all" ON exercise_logs FOR SELECT USING (TRUE);
CREATE POLICY "exercise_logs_insert_own" ON exercise_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "exercise_logs_update_own" ON exercise_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "member_goals_read_all" ON member_goals FOR SELECT USING (TRUE);
CREATE POLICY "member_goals_insert_own" ON member_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "member_goals_update_own" ON member_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "progress_photos_read_all" ON progress_photos FOR SELECT USING (TRUE);
CREATE POLICY "progress_photos_insert_own" ON progress_photos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "measurements_read_all" ON measurements FOR SELECT USING (TRUE);
CREATE POLICY "measurements_insert_own" ON measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "measurements_update_own" ON measurements FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_date ON exercise_logs(user_id, window_date);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_checkin ON exercise_logs(check_in_id);
CREATE INDEX IF NOT EXISTS idx_program_days_program ON program_days(program_slug, week_number, day_number);
CREATE INDEX IF NOT EXISTS idx_program_day_exercises_day ON program_day_exercises(program_day_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_user ON progress_photos(user_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_measurements_user ON measurements(user_id, measured_at DESC);

-- ═══════════════════════════════════════════════
-- SEED DATA: Exercise Library
-- ═══════════════════════════════════════════════

INSERT INTO exercises (slug, name, muscle_group, category, equipment, description, target_goals) VALUES
-- CHEST
('barbell_bench_press', 'Barbell Bench Press', 'chest', 'compound', 'barbell', 'Flat bench press with barbell. The gold standard for chest development.', ARRAY['bulk', 'greek_physique']),
('dumbbell_incline_press', 'Dumbbell Incline Press', 'chest', 'compound', 'dumbbell', 'Incline dumbbell press targeting upper chest.', ARRAY['greek_physique', 'sculpt']),
('dumbbell_flyes', 'Dumbbell Flyes', 'chest', 'isolation', 'dumbbell', 'Flat dumbbell flyes for chest stretch and contraction.', ARRAY['sculpt', 'greek_physique']),
('cable_crossover', 'Cable Crossover', 'chest', 'isolation', 'cable', 'Cable crossovers for chest definition and inner chest.', ARRAY['sculpt', 'cut']),
('pushups', 'Push-Ups', 'chest', 'bodyweight', 'bodyweight', 'Classic push-ups. Can be done anywhere.', ARRAY['general', 'cut', 'sculpt']),
('decline_bench_press', 'Decline Bench Press', 'chest', 'compound', 'barbell', 'Decline barbell press targeting lower chest.', ARRAY['bulk']),

-- SHOULDERS
('overhead_press', 'Overhead Press (OHP)', 'shoulders', 'compound', 'barbell', 'Standing barbell overhead press. The king of shoulder builders.', ARRAY['greek_physique', 'bulk']),
('lateral_raises', 'Lateral Raises', 'shoulders', 'isolation', 'dumbbell', 'Dumbbell lateral raises for wider, capped shoulders.', ARRAY['greek_physique', 'sculpt', 'hourglass']),
('front_raises', 'Front Raises', 'shoulders', 'isolation', 'dumbbell', 'Dumbbell front raises for anterior delt development.', ARRAY['greek_physique']),
('rear_delt_flyes', 'Rear Delt Flyes', 'shoulders', 'isolation', 'dumbbell', 'Bent-over rear delt flyes for balanced shoulders and posture.', ARRAY['greek_physique', 'sculpt']),
('arnold_press', 'Arnold Press', 'shoulders', 'compound', 'dumbbell', 'Rotational dumbbell press named after the legend.', ARRAY['greek_physique', 'bulk']),
('face_pulls', 'Face Pulls', 'shoulders', 'isolation', 'cable', 'Cable face pulls for rear delts and shoulder health.', ARRAY['general', 'cut']),

-- BACK
('pull_ups', 'Pull-Ups', 'back', 'compound', 'bodyweight', 'Wide-grip pull-ups for lat width.', ARRAY['greek_physique', 'bulk', 'sculpt']),
('barbell_rows', 'Barbell Rows', 'back', 'compound', 'barbell', 'Bent-over barbell rows for back thickness.', ARRAY['bulk', 'greek_physique']),
('lat_pulldown', 'Lat Pulldown', 'back', 'compound', 'cable', 'Cable lat pulldowns for lat development.', ARRAY['greek_physique', 'sculpt']),
('cable_rows', 'Cable Rows', 'back', 'compound', 'cable', 'Seated cable rows for mid-back thickness.', ARRAY['bulk', 'greek_physique']),
('dumbbell_rows', 'Dumbbell Rows', 'back', 'compound', 'dumbbell', 'One-arm dumbbell rows for lat and back thickness.', ARRAY['bulk']),
('deadlifts', 'Deadlifts', 'back', 'compound', 'barbell', 'Conventional deadlifts. Full body strength builder.', ARRAY['bulk', 'greek_physique']),

-- BICEPS
('barbell_curls', 'Barbell Curls', 'biceps', 'isolation', 'barbell', 'Standing barbell curls for overall bicep mass.', ARRAY['greek_physique', 'bulk']),
('dumbbell_hammer_curls', 'Dumbbell Hammer Curls', 'biceps', 'isolation', 'dumbbell', 'Hammer curls for brachialis and forearm development.', ARRAY['greek_physique']),
('incline_dumbbell_curls', 'Incline Dumbbell Curls', 'biceps', 'isolation', 'dumbbell', 'Incline curls for deep bicep stretch.', ARRAY['greek_physique', 'sculpt']),
('cable_curls', 'Cable Curls', 'biceps', 'isolation', 'cable', 'Cable curls for constant tension on biceps.', ARRAY['sculpt']),

-- TRICEPS
('close_grip_bench', 'Close-Grip Bench Press', 'triceps', 'compound', 'barbell', 'Close-grip bench for tricep mass.', ARRAY['greek_physique', 'bulk']),
('tricep_pushdowns', 'Tricep Pushdowns', 'triceps', 'isolation', 'cable', 'Cable tricep pushdowns for tricep definition.', ARRAY['greek_physique', 'sculpt']),
('overhead_tricep_extension', 'Overhead Tricep Extension', 'triceps', 'isolation', 'dumbbell', 'Overhead dumbbell extension for long head of triceps.', ARRAY['greek_physique', 'sculpt']),
('skull_crushers', 'Skull Crushers', 'triceps', 'isolation', 'barbell', 'Lying tricep extensions for tricep mass.', ARRAY['bulk']),

-- QUADS
('barbell_squats', 'Barbell Squats', 'quads', 'compound', 'barbell', 'Full depth barbell back squats. The king of leg exercises.', ARRAY['bulk', 'greek_physique', 'glutes']),
('leg_press', 'Leg Press', 'quads', 'compound', 'machine', 'Leg press for quad mass without spinal loading.', ARRAY['bulk', 'sculpt']),
('bulgarian_split_squats', 'Bulgarian Split Squats', 'quads', 'compound', 'dumbbell', 'Rear foot elevated split squats for quads and glutes.', ARRAY['glutes', 'curves', 'greek_physique']),
('goblet_squats', 'Goblet Squats', 'quads', 'compound', 'dumbbell', 'Dumbbell goblet squats for quad development and form.', ARRAY['sculpt', 'curves']),
('lunges', 'Lunges', 'quads', 'compound', 'dumbbell', 'Walking or stationary lunges for legs and glutes.', ARRAY['glutes', 'curves', 'sculpt']),

-- HAMSTRINGS
('romanian_deadlifts', 'Romanian Deadlifts (RDLs)', 'hamstrings', 'compound', 'barbell', 'RDLs for hamstring and glute development.', ARRAY['glutes', 'greek_physique', 'curves']),
('leg_curls', 'Leg Curls', 'hamstrings', 'isolation', 'machine', 'Seated or lying leg curls for hamstring isolation.', ARRAY['sculpt', 'greek_physique']),
('nordic_curls', 'Nordic Curls', 'hamstrings', 'bodyweight', 'bodyweight', 'Bodyweight nordic curls for hamstring strength.', ARRAY['general']),
('good_mornings', 'Good Mornings', 'hamstrings', 'compound', 'barbell', 'Barbell good mornings for hamstrings and lower back.', ARRAY['bulk']),

-- GLUTES
('hip_thrusts', 'Hip Thrusts', 'glutes', 'compound', 'barbell', 'Barbell hip thrusts for glute growth and activation.', ARRAY['glutes', 'curves']),
('glute_bridge', 'Glute Bridge', 'glutes', 'compound', 'bodyweight', 'Bodyweight glute bridge for activation and warm-up.', ARRAY['glutes', 'curves']),
('cable_kickbacks', 'Cable Kickbacks', 'glutes', 'isolation', 'cable', 'Cable glute kickbacks for glute isolation.', ARRAY['glutes', 'curves']),
('step_ups', 'Step-Ups', 'glutes', 'compound', 'dumbbell', 'Dumbbell step-ups for glutes and quads.', ARRAY['glutes', 'curves']),
('sumo_deadlifts', 'Sumo Deadlifts', 'glutes', 'compound', 'barbell', 'Sumo stance deadlifts for glute and hamstring emphasis.', ARRAY['glutes', 'bulk']),
('cable_side_raises_leg', 'Cable Hip Abductions', 'glutes', 'isolation', 'cable', 'Cable side leg raises for glute medius.', ARRAY['glutes', 'curves']),

-- CALVES
('standing_calf_raises', 'Standing Calf Raises', 'calves', 'isolation', 'machine', 'Standing calf raises for gastrocnemius development.', ARRAY['greek_physique', 'sculpt']),
('seated_calf_raises', 'Seated Calf Raises', 'calves', 'isolation', 'machine', 'Seated calf raises for soleus development.', ARRAY['sculpt']),
('jump_rope', 'Jump Rope', 'cardio', 'cardio', 'bodyweight', 'Jump rope for cardio and calf endurance.', ARRAY['cut', 'general']),

-- ABS
('planks', 'Planks', 'abs', 'isolation', 'bodyweight', 'Core stabilization exercise.', ARRAY['greek_physique', 'sculpt', 'cut']),
('cable_crunches', 'Cable Crunches', 'abs', 'isolation', 'cable', 'Cable crunches for weighted ab development.', ARRAY['greek_physique']),
('hanging_leg_raises', 'Hanging Leg Raises', 'abs', 'isolation', 'bodyweight', 'Hanging leg raises for lower abs and hip flexors.', ARRAY['greek_physique', 'sculpt']),
('russian_twists', 'Russian Twists', 'abs', 'isolation', 'bodyweight', 'Rotational core exercise for obliques.', ARRAY['sculpt', 'cut']),
('ab_wheel', 'Ab Wheel Rollouts', 'abs', 'isolation', 'bodyweight', 'Ab wheel rollouts for deep core strength.', ARRAY['greek_physique']),
('pallof_press', 'Pallof Press', 'abs', 'isolation', 'cable', 'Anti-rotation core exercise for obliques and stability.', ARRAY['general']),

-- CARDIO
('treadmill', 'Treadmill Running', 'cardio', 'cardio', 'machine', 'Treadmill running for cardio conditioning.', ARRAY['cut']),
('cycling', 'Cycling', 'cardio', 'cardio', 'machine', 'Stationary cycling for low-impact cardio.', ARRAY['cut', 'general']),

-- LOWER BACK
('hyperextensions', 'Hyperextensions', 'lower_back', 'isolation', 'bodyweight', 'Back extensions for lower back strength and spinal health.', ARRAY['general', 'bulk']),
('supermans', 'Supermans', 'lower_back', 'isolation', 'bodyweight', 'Floor supermans for lower back and glute activation.', ARRAY['general'])
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════
-- SEED DATA: Workout Programs
-- ═══════════════════════════════════════════════

INSERT INTO workout_programs (slug, name, description, goal_category, target_audience, difficulty, weeks, days_per_week, emoji) VALUES
('greek_god', 'Greek God', 'Sculpt an aesthetic V-taper physique. Broad shoulders, wide back, defined chest, carved abs. Inspired by classical Greek statues — proportional, powerful, and imposing.', 'greek_physique', 'men', 'intermediate', 8, 6, '🏛️'),
('the_anvil', 'The Anvil', 'Raw mass and strength. Heavy compounds, progressive overload, no shortcuts. Build a thick, powerful frame with serious numbers on the bar.', 'bulk', 'men', 'intermediate', 8, 5, '🔨'),
('the_blade', 'The Blade', 'Chisel down to a lean, carved physique. High reps, supersets, and cardio to shed fat while preserving every ounce of muscle. Veins and definition.', 'cut', 'men', 'advanced', 6, 5, '🗡️'),
('hourglass', 'Hourglass', 'Build curves in all the right places. Glute-dominant lower body work + waist-slimming core + posture-focused upper body. The perfect feminine silhouette.', 'curves', 'women', 'intermediate', 8, 5, '⏳'),
('elevate', 'Elevate', 'Glute growth bootcamp. Science-based glute training with progressive overload, mind-muscle connection, and volume targeting all three glute muscles.', 'glutes', 'women', 'intermediate', 8, 4, '🍑'),
('sculpt', 'Sculpt', 'Full body toning and definition. High-rep resistance training mixed with metabolic circuits. Lean, strong, and confident.', 'sculpt', 'women', 'beginner', 6, 5, '✨')
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════
-- PROGRAM DAYS & EXERCISES
-- ═══════════════════════════════════════════════

-- Helper: First week of each program

-- GREEK GOD - PPL Split, 6 days
-- Week 1
DO $$
DECLARE
  d_id UUID;
BEGIN
  -- Day 1: Push (Chest + Shoulders + Triceps)
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('greek_god', 1, 1, 'push', 'Chest & Shoulders', 'Focus on controlled negatives and a deep stretch on every rep')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'barbell_bench_press', 4, '8-10', 120, 1, 'Heavy compound. Add weight each week.'),
    (d_id, 'overhead_press', 4, '8-10', 120, 2, 'Keep core tight. Press straight up.'),
    (d_id, 'dumbbell_incline_press', 3, '10-12', 90, 3, 'Upper chest focus. Deep stretch at bottom.'),
    (d_id, 'lateral_raises', 4, '12-15', 60, 4, 'Light weight, high reps. Feel the burn.'),
    (d_id, 'tricep_pushdowns', 3, '12-15', 60, 5, 'Squeeze at the bottom of each rep.'),
    (d_id, 'face_pulls', 3, '15-20', 45, 6, 'Shoulder health. External rotation at the end.');

  -- Day 2: Pull (Back + Biceps + Rear Delts)
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('greek_god', 1, 2, 'pull', 'Back Width & Thickness', 'Pull with your elbows, not your hands')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'deadlifts', 3, '5-8', 150, 1, 'Start light. Perfect form always.'),
    (d_id, 'pull_ups', 4, '8-12', 90, 2, 'If you can do 12+, add weight.'),
    (d_id, 'barbell_rows', 4, '8-10', 120, 3, 'Pull to your belly button. Squeeze.'),
    (d_id, 'barbell_curls', 3, '10-12', 60, 4, 'No swinging. Strict form.'),
    (d_id, 'rear_delt_flyes', 3, '12-15', 45, 5, 'Light weight. Feel the rear delts.'),
    (d_id, 'dumbbell_hammer_curls', 3, '10-12', 60, 6, 'Palm-facing each other throughout.');

  -- Day 3: Legs (Quads + Glutes + Calves)
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('greek_god', 1, 3, 'legs', 'Quad & Glute Dominance', 'Depth over weight. ATG or nothing')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'barbell_squats', 4, '6-10', 150, 1, 'Ass to grass. Full range of motion.'),
    (d_id, 'romanian_deadlifts', 4, '8-12', 120, 2, 'Feel the hamstring stretch.'),
    (d_id, 'bulgarian_split_squats', 3, '10-12', 90, 3, 'Rear foot elevated. Brutal but effective.'),
    (d_id, 'standing_calf_raises', 4, '12-15', 45, 4, 'Full stretch at the bottom.'),
    (d_id, 'hanging_leg_raises', 3, '12-15', 60, 5, 'Don''t swing. Controlled movement.');

  -- Day 4: Push (Upper Chest + Side Delts Focus)
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('greek_god', 1, 4, 'push', 'Upper Chest & Side Delts', 'Volume day. Higher reps, more isolation')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'dumbbell_incline_press', 4, '10-12', 90, 1, 'Incline for upper chest.'),
    (d_id, 'arnold_press', 3, '10-12', 90, 2, 'Rotate at the top.'),
    (d_id, 'cable_crossover', 3, '12-15', 60, 3, 'Cross past midline.'),
    (d_id, 'lateral_raises', 4, '15-20', 45, 4, 'Drop set the last set.'),
    (d_id, 'overhead_tricep_extension', 3, '12-15', 60, 5, 'Behind the head for long head.');

  -- Day 5: Pull (Width & Rear Delts)
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('greek_god', 1, 5, 'pull', 'Back Width & Rear Delts', 'Mind-muscle connection with your lats')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'lat_pulldown', 4, '10-12', 90, 1, 'Wide grip. Pull to chest.'),
    (d_id, 'cable_rows', 4, '10-12', 90, 2, 'Squeeze at the peak contraction.'),
    (d_id, 'dumbbell_rows', 3, '8-10', 90, 3, 'Heavy but controlled.'),
    (d_id, 'incline_dumbbell_curls', 3, '10-12', 60, 4, 'Deep stretch at the bottom.'),
    (d_id, 'rear_delt_flyes', 3, '15-20', 45, 5, 'High reps for mind-muscle connection.');

  -- Day 6: Legs (Glutes + Hams + Abs)
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('greek_god', 1, 6, 'legs', 'Glutes, Hams & Core', 'Glute activation first, then destroy them')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'hip_thrusts', 4, '10-12', 90, 1, 'Squeeze glutes at the top for 2 seconds.'),
    (d_id, 'leg_press', 4, '10-12', 90, 2, 'Feet high for glute emphasis.'),
    (d_id, 'leg_curls', 3, '12-15', 60, 3, 'Control the negative.'),
    (d_id, 'ab_wheel', 3, '8-12', 60, 4, 'Don''t hyperextend your back.'),
    (d_id, 'planks', 3, '45s', 45, 5, 'Keep your core tight. Straight line from head to heels.');

  -- Day 7: Rest
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('greek_god', 1, 7, 'rest', 'Full Recovery', 'Rest day. Your muscles grow outside the gym.');

  -- HOURGLASS Program - 5 days
  -- Day 1: Glute Focus
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('hourglass', 1, 1, 'glutes', 'Glute Activation & Growth', 'Glute activation first, then progressive overload')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'glute_bridge', 3, '15-20', 45, 1, 'Warm-up. Squeeze at the top.'),
    (d_id, 'hip_thrusts', 4, '10-12', 90, 2, 'Main lift. Add weight each session.'),
    (d_id, 'bulgarian_split_squats', 3, '10-12', 90, 3, 'Glute focus. Lean forward slightly.'),
    (d_id, 'cable_kickbacks', 3, '12-15', 45, 4, 'Isolation. Feel the glute contract.'),
    (d_id, 'cable_side_raises_leg', 3, '12-15', 45, 5, 'Glute medius. Important for the round look.');

  -- Day 2: Upper Body Posture
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('hourglass', 1, 2, 'upper', 'Posture & Upper Body Definition', 'Focus on back, shoulders, and posture')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'lat_pulldown', 3, '12-15', 60, 1, 'Wide grip for v-taper.'),
    (d_id, 'cable_rows', 3, '12-15', 60, 2, 'Squeeze for posture improvement.'),
    (d_id, 'dumbbell_incline_press', 3, '10-12', 60, 3, 'Using incline press for upper chest definition.'),
    (d_id, 'lateral_raises', 3, '12-15', 45, 4, 'Light weight. High reps for shoulder shape.'),
    (d_id, 'face_pulls', 3, '15-20', 45, 5, 'Shoulder health and posture.');

  -- Day 3: Glutes + Hamstrings
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('hourglass', 1, 3, 'glutes', 'Glutes & Hamstring Tie-In', 'Where glutes meet hamstrings — the money spot')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'sumo_deadlifts', 4, '8-10', 120, 1, 'Sumo stance hits glutes harder.'),
    (d_id, 'romanian_deadlifts', 4, '10-12', 90, 2, 'RDLs for hamstring glute tie-in.'),
    (d_id, 'step_ups', 3, '10-12', 60, 3, 'Use a high box. Drive through the heel.'),
    (d_id, 'leg_curls', 3, '12-15', 45, 4, 'Hamstring isolation.');

  -- Day 4: Abs + Cardio
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('hourglass', 1, 4, 'abs', 'Core & Waist Slimming', 'Build core strength while slimming the waist')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'planks', 3, '45s', 45, 1, 'Strict form.'),
    (d_id, 'russian_twists', 3, '15-20', 45, 2, 'Oblique focus.'),
    (d_id, 'hanging_leg_raises', 3, '10-15', 60, 3, 'Lower ab focus.'),
    (d_id, 'pallof_press', 3, '10-12', 45, 4, 'Anti-rotation. Core stability.'),
    (d_id, 'treadmill', 1, '20min', 0, 5, 'LISS cardio. Incline walking.');

  -- Day 5: Glutes + Quads
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('hourglass', 1, 5, 'glutes', 'Glute & Quad Shaping', 'Build the curve from every angle')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'goblet_squats', 4, '12-15', 60, 1, 'Deep squats. Great for form and glutes.'),
    (d_id, 'lunges', 3, '10-12', 60, 2, 'Walking lunges. Long stride for glute focus.'),
    (d_id, 'cable_kickbacks', 3, '15-20', 45, 3, 'Burnout set. Glute isolation.'),
    (d_id, 'cable_side_raises_leg', 3, '15-20', 45, 4, 'Fire that glute med.');

  -- Day 6-7: Rest
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('hourglass', 1, 6, 'rest', 'Recovery', 'Rest day.'),
  ('hourglass', 1, 7, 'rest', 'Full Recovery', 'Rest day.');

  -- ELEVATE Program - 4 days, glute focused
  -- Day 1: Heavy Glutes
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('elevate', 1, 1, 'glutes', 'Heavy Glute Day', 'Low reps, heavy weight for glute strength and size')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'hip_thrusts', 5, '8-10', 120, 1, 'Heavy. Progressive overload each week.'),
    (d_id, 'sumo_deadlifts', 4, '6-8', 120, 2, 'Glute-dominant sumo stance.'),
    (d_id, 'bulgarian_split_squats', 3, '8-10', 90, 3, 'Lean forward for more glute activation.'),
    (d_id, 'standing_calf_raises', 3, '12-15', 45, 4, 'Finisher.');

  -- Day 2: Upper Body + Core
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('elevate', 1, 2, 'upper', 'Upper Body Toning', 'Light upper body work to maintain balance')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'pushups', 3, '12-15', 60, 1, 'Full range of motion.'),
    (d_id, 'cable_rows', 3, '12-15', 60, 2, 'Posture work.'),
    (d_id, 'lateral_raises', 3, '12-15', 45, 3, 'Shoulder shape.'),
    (d_id, 'planks', 3, '45s', 45, 4, 'Core stability.');

  -- Day 3: Glute Hypertrophy
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('elevate', 1, 3, 'glutes', 'Glute Hypertrophy Day', 'Volume day. Higher reps, more time under tension')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'hip_thrusts', 4, '12-15', 90, 1, 'Moderate weight. Squeeze at top.'),
    (d_id, 'romanian_deadlifts', 4, '10-12', 90, 2, 'Feel the stretch.'),
    (d_id, 'lunges', 3, '12-15', 60, 3, 'Walking or stationary. Glute focus.'),
    (d_id, 'cable_kickbacks', 3, '15-20', 45, 4, 'Burnout. High reps.');

  -- Day 4: Glute Activation + Cardio
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('elevate', 1, 4, 'glutes', 'Glute Activation & Conditioning', 'Light day. Activation work and cardio')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'glute_bridge', 3, '15-20', 45, 1, 'Activation.'),
    (d_id, 'step_ups', 3, '10-12', 60, 2, 'Drive through the heel.'),
    (d_id, 'cable_side_raises_leg', 3, '15-20', 45, 3, 'Glute med.'),
    (d_id, 'cable_kickbacks', 3, '15-20', 45, 4, 'Finisher.'),
    (d_id, 'treadmill', 1, '20min', 0, 5, 'Incline walking. 12% incline, 3-4 speed.');

  -- THE ANVIL - Upper/Lower Split, 5 days
  -- Day 1: Upper Heavy
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('the_anvil', 1, 1, 'upper', 'Heavy Upper Body', 'Low reps, heavy weight. Build raw strength')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'barbell_bench_press', 5, '5-8', 150, 1, 'Heavy compound. Bench PR day.'),
    (d_id, 'barbell_rows', 5, '5-8', 150, 2, 'Heavy rows for back thickness.'),
    (d_id, 'overhead_press', 4, '6-8', 120, 3, 'Standing OHP for shoulder strength.'),
    (d_id, 'pull_ups', 3, '8-12', 90, 4, 'Weighted if possible.'),
    (d_id, 'barbell_curls', 3, '8-10', 60, 5, 'Strict curls.'),
    (d_id, 'skull_crushers', 3, '8-10', 60, 6, 'Tricep mass builder.');

  -- Day 2: Lower Heavy
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('the_anvil', 1, 2, 'lower', 'Heavy Lower Body', 'Leg day. No skipping.')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'barbell_squats', 5, '5-8', 150, 1, 'ATG squats. Heavy.'),
    (d_id, 'romanian_deadlifts', 4, '8-10', 120, 2, 'RDLs for posterior chain.'),
    (d_id, 'leg_press', 4, '10-12', 90, 3, 'Foot position mid-plate for quads.'),
    (d_id, 'standing_calf_raises', 4, '10-12', 45, 4, 'Heavy calf raises.'),
    (d_id, 'hanging_leg_raises', 3, '12-15', 60, 5, 'Core work.');

  -- Day 3: Rest
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('the_anvil', 1, 3, 'rest', 'Recovery', 'Rest day. Eat big.');

  -- Day 4: Upper Hypertrophy
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('the_anvil', 1, 4, 'upper', 'Upper Hypertrophy', 'Higher volume for muscle growth')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'dumbbell_incline_press', 4, '10-12', 90, 1, 'Upper chest volume.'),
    (d_id, 'lat_pulldown', 4, '10-12', 90, 2, 'Lat width work.'),
    (d_id, 'cable_rows', 3, '12-15', 60, 3, 'High reps for back pump.'),
    (d_id, 'lateral_raises', 4, '12-15', 45, 4, 'Side delt volume.'),
    (d_id, 'dumbbell_hammer_curls', 3, '10-12', 60, 5, 'Brachialis builder.'),
    (d_id, 'tricep_pushdowns', 3, '12-15', 60, 6, 'Tricep pump.');

  -- Day 5: Lower Hypertrophy
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('the_anvil', 1, 5, 'lower', 'Lower Hypertrophy', 'Volume leg day. Feel the burn.')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'bulgarian_split_squats', 4, '10-12', 90, 1, 'Brutal quad builder.'),
    (d_id, 'hip_thrusts', 4, '10-12', 90, 2, 'Glute volume.'),
    (d_id, 'leg_curls', 3, '12-15', 60, 3, 'Hamstring isolation.'),
    (d_id, 'goblet_squats', 3, '15-20', 45, 4, 'High rep quad finisher.'),
    (d_id, 'seated_calf_raises', 4, '12-15', 45, 5, 'Soleus focus.');

  -- Day 6: Accessory / Weak Point
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('the_anvil', 1, 6, 'full_body', 'Weak Point Training', 'Focus on lagging body parts')
  RETURNING id INTO d_id;
  INSERT INTO program_day_exercises (program_day_id, exercise_slug, sets, reps, rest_seconds, order_index, notes) VALUES
    (d_id, 'deadlifts', 3, '5-8', 150, 1, 'Heavy deadlifts.'),
    (d_id, 'close_grip_bench', 3, '8-10', 90, 2, 'Tricep focus.'),
    (d_id, 'dumbbell_rows', 3, '10-12', 90, 3, 'Unilateral back work.'),
    (d_id, 'incline_dumbbell_curls', 3, '10-12', 60, 4, 'Bicep stretch.'),
    (d_id, 'ab_wheel', 3, '10-12', 60, 5, 'Core strength.');

  -- Day 7: Rest
  INSERT INTO program_days (program_slug, week_number, day_number, session_type, focus_area, note)
  VALUES ('the_anvil', 1, 7, 'rest', 'Full Recovery', 'Rest. Recover. Grow.');

END $$;
