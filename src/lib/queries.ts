'use server';

import { createServerSupabaseClient } from './supabase-server';
import { CACHE_TAGS } from './cache';
import type { Profile, CheckIn, Streak } from '@/types';

/**
 * Optimized query functions with built-in caching tags for Next.js 16
 * These functions use Supabase PostgREST for efficient querying
 */

// ─── PROFILE QUERIES ───

export async function getProfile(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getAllProfiles() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data as Profile[];
}

// ─── CHECK-IN QUERIES ───

/**
 * Get check-ins for a user with pagination (cursor-based)
 */
export async function getUserCheckIns(
  userId: string,
  limit: number = 30,
  cursor?: string
) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('window_date', { ascending: false })
    .order('session_number', { ascending: false })
    .limit(limit);

  // Cursor-based pagination
  if (cursor) {
    query = query.lt('window_date', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as CheckIn[];
}

export async function getCheckInByDate(userId: string, date: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('window_date', date);

  if (error) throw error;
  return data as CheckIn[];
}

export async function getTodayCheckIn(userId: string, sessionNumber: 1 | 2) {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .eq('window_date', today)
    .eq('session_number', sessionNumber)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as CheckIn | null;
}

// ─── STREAKS QUERIES ───

export async function getUserStreak(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as Streak;
}

/**
 * Get all streaks sorted by current daily streak (for leaderboard)
 */
export async function getAllStreaksSorted() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('streaks')
    .select(
      `
      *,
      user:profiles(display_name, photo_url)
    `
    )
    .order('current_daily_streak', { ascending: false })
    .order('best_daily_streak', { ascending: false });

  if (error) throw error;
  return data;
}

// ─── FEED QUERIES ───

/**
 * Get feed posts with pagination (cursor-based)
 */
export async function getFeedPosts(limit: number = 20, cursor?: string) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('feed_posts')
    .select(
      `
      *,
      user:profiles(id, display_name, photo_url),
      check_in:check_ins(status, session_number, window_date)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  // Cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

// ─── NOTIFICATIONS QUERIES ───

/**
 * Get unread notifications for user
 */
export async function getUnreadNotifications(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

/**
 * Get notifications with pagination
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  cursor?: string
) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

// ─── EXERCISE LOGS QUERIES ───

export async function getExerciseHistory(userId: string, limit: number = 50) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('exercise_logs')
    .select(
      `
      *,
      exercise:exercises(name, category)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get exercise logs for a specific window date
 */
export async function getExerciseLogsByDate(userId: string, date: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('exercise_logs')
    .select(
      `
      *,
      exercise:exercises(name, category)
    `
    )
    .eq('user_id', userId)
    .eq('window_date', date)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// ─── BADGE QUERIES ───

export async function getUserBadges(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('member_badges')
    .select(
      `
      *,
      badge:badges(name, emoji, description)
    `
    )
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ─── WORKOUT QUERIES ───

export async function getWorkoutProgram(programId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (error) throw error;
  return data;
}

export async function getProgramDays(programId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('program_days')
    .select('*')
    .eq('workout_program_id', programId)
    .order('day_of_week', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProgramDayExercises(programDayId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('program_day_exercises')
    .select(
      `
      *,
      exercise:exercises(id, name, category, description)
    `
    )
    .eq('program_day_id', programDayId)
    .order('order', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get exercise with all related info
 */
export async function getExerciseById(exerciseId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();

  if (error) throw error;
  return data;
}

// ─── MEASUREMENT & PROGRESS QUERIES ───

export async function getUserMeasurements(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProgressPhotos(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
