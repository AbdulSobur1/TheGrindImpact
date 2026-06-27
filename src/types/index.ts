// Database types matching Supabase schema

export type Role = 'admin' | 'member';

export type CheckInStatus = 'completed' | 'missed' | 'late';

export type FeedPostType = 'completed' | 'missed' | 'callout' | 'system' | 'badge' | 'mvp';

export type CalloutReason = 'Slacking' | 'Missing Sessions' | 'Too Quiet' | 'Just Because';

export type BadgeType = 'universal' | 'exclusive';

export type NotificationType =
  | 'pre_session_reminder'
  | 'mid_window_nudge'
  | 'last_chance_alert'
  | 'missed_session'
  | 'daily_summary'
  | 'weekly_summary'
  | 'callout'
  | 'badge_earned'
  | 'system';

export type RestDayScope = 'global' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  photo_url: string | null;
  role: Role;
  session_1_start: string | null;
  session_1_end: string | null;
  session_2_start: string | null;
  session_2_end: string | null;
  timezone: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  session_number: 1 | 2;
  status: CheckInStatus;
  photo_url: string | null;
  sarcasm_message: string | null;
  checked_in_at: string;
  window_date: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_daily_streak: number;
  best_daily_streak: number;
  current_weekly_streak: number;
  best_weekly_streak: number;
  last_updated: string;
}

export interface FeedPost {
  id: string;
  user_id: string;
  check_in_id: string | null;
  type: FeedPostType;
  sarcasm_message: string | null;
  reactions: Record<string, string[]> | null;
  created_at: string;
  // Joined fields
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

export interface InviteLink {
  id: string;
  created_by: string;
  token: string;
  used_by: string | null;
  used_at: string | null;
  expires_at: string;
}

export interface RestDay {
  id: string;
  date: string;
  reason: string;
  scope: RestDayScope;
  created_by: string;
}

export interface Callout {
  id: string;
  caller_id: string;
  target_id: string;
  reason: CalloutReason;
  created_at: string;
}

export interface Badge {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  type: BadgeType;
}

export interface MemberBadge {
  id: string;
  user_id: string;
  badge_slug: string;
  earned_at: string;
  active: boolean;
}

export interface WeeklyMvp {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  awarded_at: string;
}

// UI types
export interface LeaderboardEntry {
  rank: number;
  member: Profile;
  badges: (MemberBadge & { badge: Badge })[];
  current_streak: number;
  weekly_streak: number;
  total_sessions: number;
  missed_sessions: number;
  weekly_percentage: number;
}

export interface MemberStats {
  profile: Profile;
  badges: (MemberBadge & { badge: Badge })[];
  streaks: Streak | null;
  total_days_active: number;
  best_streak_ever: number;
  session_log: { date: string; session_1: CheckIn | null; session_2: CheckIn | null }[];
  weekly_history: { week: string; completed: number; missed: number }[];
}

// ─── WORKOUT TYPES ───

export type GoalCategory = 'bulk' | 'cut' | 'curves' | 'glutes' | 'greek_physique' | 'sculpt' | 'general' | 'general_fitness';
export type TargetAudience = 'men' | 'women' | 'unisex';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type SessionType = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'cardio' | 'glutes' | 'abs' | 'rest';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'abs' | 'lower_back' | 'full_body' | 'cardio';
export type ExerciseCategory = 'compound' | 'isolation' | 'bodyweight' | 'cardio' | 'calisthenics';
export type BodyPart = 'front' | 'back' | 'side' | 'arms' | 'legs' | 'glutes' | 'abs' | 'full';

export interface WorkoutProgram {
  slug: string;
  name: string;
  description: string;
  goal_category: GoalCategory;
  target_audience: TargetAudience;
  difficulty: Difficulty;
  weeks: number;
  days_per_week: number;
  emoji: string;
  is_active: boolean;
  created_at: string;
}

export interface ProgramDay {
  id: string;
  program_slug: string;
  week_number: number;
  day_number: number;
  session_type: SessionType;
  focus_area: string | null;
  note: string | null;
  exercises?: ProgramDayExercise[];
}

export interface Exercise {
  slug: string;
  name: string;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
  equipment: string;
  description: string | null;
  target_goals: string[];
  is_active: boolean;
}

export interface ProgramDayExercise {
  id: string;
  program_day_id: string;
  exercise_slug: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  order_index: number;
  notes: string | null;
  exercise?: Exercise;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  check_in_id: string | null;
  exercise_slug: string;
  session_number: 1 | 2;
  window_date: string;
  sets_completed: number | null;
  reps_completed: string | null;
  weight_kg: number | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  exercise?: Exercise;
}

export interface MemberGoal {
  id: string;
  user_id: string;
  primary_goal: GoalCategory | 'general_fitness';
  active_program_slug: string | null;
  custom_target: string | null;
  start_date: string;
  updated_at: string;
  program?: WorkoutProgram;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  body_part: BodyPart;
  note: string | null;
  taken_at: string;
  created_at: string;
}

export interface Measurement {
  id: string;
  user_id: string;
  weight_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arms_cm: number | null;
  thighs_cm: number | null;
  glutes_cm: number | null;
  body_fat_pct: number | null;
  measured_at: string;
  created_at: string;
}

// Goal display helpers
export const GOAL_LABELS: Record<string, string> = {
  bulk: 'The Anvil — Bulk Up',
  cut: 'The Blade — Cut & Define',
  greek_physique: 'Greek God — Aesthetic',
  curves: 'Hourglass — Curves',
  glutes: 'Elevate — Glute Growth',
  sculpt: 'Sculpt — Tone & Define',
  general_fitness: 'General Fitness',
  general: 'General',
};

export const GOAL_EMOJIS: Record<string, string> = {
  bulk: '🔨',
  cut: '🗡️',
  greek_physique: '🏛️',
  curves: '⏳',
  glutes: '🍑',
  sculpt: '✨',
  general_fitness: '💪',
};

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  abs: 'Abs',
  lower_back: 'Lower Back',
  full_body: 'Full Body',
  cardio: 'Cardio',
};
