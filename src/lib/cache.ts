'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Cache tags for Next.js data revalidation
 * Using revalidatePath with 'max' cache life for optimal SWR behavior
 */
export const CACHE_TAGS = {
  // User data
  PROFILE: (userId: string) => `profile:${userId}`,
  PROFILES_ALL: 'profiles:all',

  // Check-ins
  CHECK_INS: (userId: string) => `check-ins:${userId}`,
  CHECK_IN_BY_DATE: (userId: string, date: string) => `check-in:${userId}:${date}`,

  // Streaks
  STREAKS: (userId: string) => `streaks:${userId}`,
  STREAKS_ALL: 'streaks:all',

  // Feed
  FEED: 'feed:all',
  FEED_USER: (userId: string) => `feed:${userId}`,

  // Notifications
  NOTIFICATIONS: (userId: string) => `notifications:${userId}`,

  // Leaderboard
  LEADERBOARD: 'leaderboard',
  LEADERBOARD_WEEKLY: 'leaderboard:weekly',

  // Workouts & Exercises
  WORKOUTS: (userId: string) => `workouts:${userId}`,
  WORKOUT_PROGRAM: (programId: string) => `workout-program:${programId}`,
  EXERCISES: 'exercises',
  EXERCISE_LOGS: (userId: string) => `exercise-logs:${userId}`,

  // Badges
  BADGES: 'badges',
  MEMBER_BADGES: (userId: string) => `member-badges:${userId}`,

  // Progress
  PROGRESS_PHOTOS: (userId: string) => `progress-photos:${userId}`,
  MEASUREMENTS: (userId: string) => `measurements:${userId}`,
};

/**
 * Invalidate cache for user profile and related data
 */
export async function invalidateUserCache(userId: string) {
  revalidateTag(CACHE_TAGS.PROFILE(userId));
  revalidateTag(CACHE_TAGS.CHECK_INS(userId));
  revalidateTag(CACHE_TAGS.STREAKS(userId));
  revalidateTag(CACHE_TAGS.EXERCISE_LOGS(userId));
  revalidateTag(CACHE_TAGS.MEMBER_BADGES(userId));
}

/**
 * Invalidate cache when check-in is updated
 */
export async function invalidateCheckInCache(userId: string, date: string) {
  revalidateTag(CACHE_TAGS.CHECK_INS(userId));
  revalidateTag(CACHE_TAGS.CHECK_IN_BY_DATE(userId, date));
  revalidateTag(CACHE_TAGS.LEADERBOARD);
  revalidateTag(CACHE_TAGS.FEED);
}

/**
 * Invalidate cache when streak is updated
 */
export async function invalidateStreakCache() {
  revalidateTag(CACHE_TAGS.LEADERBOARD);
  revalidateTag(CACHE_TAGS.LEADERBOARD_WEEKLY);
  revalidateTag(CACHE_TAGS.STREAKS_ALL);
}

/**
 * Invalidate cache for feed updates
 */
export async function invalidateFeedCache() {
  revalidateTag(CACHE_TAGS.FEED);
}

/**
 * Invalidate cache for notifications
 */
export async function invalidateNotificationCache(userId: string) {
  revalidateTag(CACHE_TAGS.NOTIFICATIONS(userId));
}

/**
 * Invalidate cache for badges
 */
export async function invalidateBadgeCache(userId: string) {
  revalidateTag(CACHE_TAGS.MEMBER_BADGES(userId));
  revalidateTag(CACHE_TAGS.LEADERBOARD);
  revalidateTag(CACHE_TAGS.FEED);
}

/**
 * Invalidate cache for exercise logs
 */
export async function invalidateExerciseLogsCache(userId: string) {
  revalidateTag(CACHE_TAGS.EXERCISE_LOGS(userId));
  revalidateTag(CACHE_TAGS.WORKOUTS(userId));
}

/**
 * Invalidate cache for measurements
 */
export async function invalidateMeasurementsCache(userId: string) {
  revalidateTag(CACHE_TAGS.MEASUREMENTS(userId));
}
