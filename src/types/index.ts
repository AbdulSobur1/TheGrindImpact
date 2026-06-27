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
