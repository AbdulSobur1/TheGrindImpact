'use server';

import { createServerSupabaseClient } from './supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateToken, getTodayDateString, getWeekStart, getWeekEnd } from './utils';
import { SarcasmEngine } from './sarcasm';
import type { Profile, CalloutReason, CheckInStatus } from '@/types';

// ─── AUTH ACTIONS ───

export async function signupWithInvite(
  token: string,
  data: { email: string; password: string; name: string }
) {
  const supabase = await createServerSupabaseClient();

  // Verify invite token
  const { data: invite, error: inviteError } = await supabase
    .from('invite_links')
    .select('*')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return { error: 'This link is dead. Ask the admin for a new one.' };
  }

  if (invite.used_by) {
    return { error: 'This link has already been used. Ask the admin for a new one.' };
  }

  if (new Date(invite.expires_at) < new Date()) {
    return { error: 'This link has expired. Ask the admin for a new one.' };
  }

  // Create user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: data.name,
        role: 'member',
      },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create account. Please try again.' };
  }

  // Mark invite as used
  const { error: updateError } = await supabase
    .from('invite_links')
    .update({
      used_by: authData.user.id,
      used_at: new Date().toISOString(),
    })
    .eq('id', invite.id);

  if (updateError) {
    console.error('Failed to mark invite as used:', updateError);
  }

  return { success: true, userId: authData.user.id };
}

export async function login(data: { email: string; password: string }) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// ─── ONBOARDING ACTIONS ───

export async function completeOnboarding(data: {
  displayName: string;
  session1Start: string;
  session1End: string;
  session2Start: string;
  session2End: string;
  timezone: string;
  photoUrl?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: data.displayName,
      photo_url: data.photoUrl || null,
      session_1_start: data.session1Start,
      session_1_end: data.session1End,
      session_2_start: data.session2Start,
      session_2_end: data.session2End,
      timezone: data.timezone,
    })
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function updateProfilePhoto(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const file = formData.get('photo') as File;
  if (!file) {
    return { error: 'No file provided' };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(fileName, file);

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ photo_url: publicUrl })
    .eq('user_id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/profile');
  return { success: true, url: publicUrl };
}

// ─── CHECK-IN ACTIONS ───

export async function logSession(
  sessionNumber: 1 | 2,
  photoFile?: File | null
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const today = getTodayDateString();
  const dayOfWeek = new Date().getDay();

  // Check if it's Sunday
  if (dayOfWeek === 0) {
    return { error: "It's Sunday! Rest day. Go touch grass." };
  }

  // Check if there's a forced rest day
  const { data: restDay } = await supabase
    .from('rest_days')
    .select('*')
    .eq('date', today)
    .single();

  if (restDay) {
    return { error: `Rest day declared: ${restDay.reason}. Take the day off.` };
  }

  // Check if already checked in
  const { data: existingCheckIn } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_number', sessionNumber)
    .eq('window_date', today)
    .single();

  if (existingCheckIn) {
    return { error: `Session ${sessionNumber} already logged for today.` };
  }

  // Get profile to check windows
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found' };
  }

  // Check if within window
  const windowStart = sessionNumber === 1 ? profile.session_1_start : profile.session_2_start;
  const windowEnd = sessionNumber === 1 ? profile.session_1_end : profile.session_2_end;

  if (!windowStart || !windowEnd) {
    return { error: 'Session windows not configured. Please complete onboarding.' };
  }

  const now = new Date();
  const [startH, startM] = windowStart.split(':').map(Number);
  const [endH, endM] = windowEnd.split(':').map(Number);

  const start = new Date();
  start.setHours(startH, startM, 0, 0);
  const end = new Date();
  end.setHours(endH, endM, 0, 0);

  if (end <= start) end.setDate(end.getDate() + 1);

  let status: CheckInStatus = 'completed';
  let sarcasmMessage: string | null = null;

  if (now < start || now > end) {
    return { error: `Session ${sessionNumber} window is not open right now. Your window: ${windowStart} - ${windowEnd}` };
  }

  // Check if late (within last 15% of window)
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const remaining = totalDuration - elapsed;
  const lateThreshold = totalDuration * 0.15;

  if (remaining <= lateThreshold) {
    status = 'late';
    sarcasmMessage = SarcasmEngine.lateCheckIn();
  } else {
    sarcasmMessage = SarcasmEngine.sessionCompleted();
  }

  // Monday photo requirement
  const isMonday = dayOfWeek === 1;
  if (isMonday && !photoFile) {
    return { error: "Monday requires a photo. We need proof it's not a rest day fraud." };
  }

  // Upload photo if provided
  let photoUrl: string | null = null;
  if (photoFile) {
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${user.id}/checkins/${today}_s${sessionNumber}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('check-in-photos')
      .upload(fileName, photoFile);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('check-in-photos')
        .getPublicUrl(fileName);
      photoUrl = publicUrl;
    }
  }

  // Insert check-in
  const { data: checkIn, error: checkInError } = await supabase
    .from('check_ins')
    .insert({
      user_id: user.id,
      session_number: sessionNumber,
      status,
      photo_url: photoUrl,
      sarcasm_message: sarcasmMessage,
      checked_in_at: now.toISOString(),
      window_date: today,
    })
    .select()
    .single();

  if (checkInError) {
    return { error: checkInError.message };
  }

  // Post to feed
  await supabase.from('feed_posts').insert({
    user_id: user.id,
    check_in_id: checkIn.id,
    type: 'completed',
    sarcasm_message: sarcasmMessage,
  });

  // Update streaks
  await updateStreaks(user.id);

  // Check if both sessions done for the day
  const { data: session2 } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_number', sessionNumber === 1 ? 2 : 1)
    .eq('window_date', today)
    .single();

  if (session2 && (session2.status === 'completed' || session2.status === 'late')) {
    // Both sessions done
    const bothMsg = SarcasmEngine.bothSessionsDone();
    await supabase.from('feed_posts').insert({
      user_id: user.id,
      type: 'completed',
      sarcasm_message: bothMsg,
    });
  }

  // Evaluate badges
  await evaluateBadges(user.id);

  revalidatePath('/dashboard');
  revalidatePath('/feed');

  return { success: true, status, sarcasm_message: sarcasmMessage };
}

// ─── CALLOUT ACTIONS ───

export async function createCallout(targetId: string, reason: CalloutReason) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if user already called out today
  const today = getTodayDateString();
  const { data: existingCallout } = await supabase
    .from('callouts')
    .select('*')
    .eq('caller_id', user.id)
    .eq('callout_date', today)
    .single();

  if (existingCallout) {
    return { error: 'You can only call out one person per day.' };
  }

  // Get caller and target names
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('user_id', [user.id, targetId]);

  const callerProfile = profiles?.find((p: Profile) => p.user_id === user.id);
  const targetProfile = profiles?.find((p: Profile) => p.user_id === targetId);

  if (!callerProfile || !targetProfile) {
    return { error: 'Member not found' };
  }

  // Create callout
  const { error: calloutError } = await supabase.from('callouts').insert({
    caller_id: user.id,
    target_id: targetId,
    reason,
    callout_date: today,
  });

  if (calloutError) {
    return { error: calloutError.message };
  }

  // Post to feed
  const sarcasmMessage = SarcasmEngine.callout(callerProfile.display_name, targetProfile.display_name);
  await supabase.from('feed_posts').insert({
    user_id: user.id,
    type: 'callout',
    sarcasm_message: sarcasmMessage,
  });

  // Notify target
  await supabase.from('notifications').insert({
    user_id: targetId,
    type: 'callout',
    message: `${callerProfile.display_name} just called you out. ${reason}. You know what to do.`,
  });

  revalidatePath('/feed');
  revalidatePath('/dashboard');

  return { success: true, message: sarcasmMessage };
}

// ─── FEED ACTIONS ───

export async function addReaction(postId: string, emoji: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Get current reactions
  const { data: post } = await supabase
    .from('feed_posts')
    .select('reactions')
    .eq('id', postId)
    .single();

  const reactions = (post?.reactions as Record<string, string[]>) || {};

  // Toggle reaction
  if (reactions[emoji]?.includes(user.id)) {
    reactions[emoji] = reactions[emoji].filter((id) => id !== user.id);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  } else {
    if (!reactions[emoji]) reactions[emoji] = [];
    reactions[emoji].push(user.id);
  }

  const { error } = await supabase
    .from('feed_posts')
    .update({ reactions })
    .eq('id', postId);

  if (error) return { error: error.message };

  revalidatePath('/feed');
  return { success: true };
}

// ─── ADMIN ACTIONS ───

export async function generateInviteLink() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can generate invite links' };
  }

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours

  const { data: invite, error } = await supabase
    .from('invite_links')
    .insert({
      created_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  return {
    success: true,
    link: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${token}`,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function removeMember(memberId: string, reason: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Check if admin
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminProfile || adminProfile.role !== 'admin') {
    return { error: 'Only admins can remove members' };
  }

  // Get member name
  const { data: memberProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', memberId)
    .single();

  if (!memberProfile) return { error: 'Member not found' };

  // Post to feed
  const kickMessage = SarcasmEngine.adminKick(memberProfile.display_name);
  await supabase.from('feed_posts').insert({
    user_id: user.id,
    type: 'system',
    sarcasm_message: kickMessage,
  });

  // Delete member's auth user (this cascades to profiles, check_ins, etc.)
  const { error } = await supabase.auth.admin.deleteUser(memberId);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { success: true };
}

export async function declareForceRestDay(date: string, reason: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can declare rest days' };
  }

  const { error } = await supabase.from('rest_days').insert({
    date,
    reason,
    scope: 'admin',
    created_by: user.id,
  });

  if (error) return { error: error.message };

  // Post to feed
  const msg = SarcasmEngine.forceRestDay(date, reason);
  await supabase.from('feed_posts').insert({
    user_id: user.id,
    type: 'system',
    sarcasm_message: msg,
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function adminAnnouncement(message: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  // Check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can post announcements' };
  }

  await supabase.from('feed_posts').insert({
    user_id: user.id,
    type: 'system',
    sarcasm_message: `📢 The Grind Pact: ${message}`,
  });

  revalidatePath('/feed');
  return { success: true };
}

// ─── STREAK HELPERS ───

async function updateStreaks(userId: string) {
  const supabase = await createServerSupabaseClient();
  const today = getTodayDateString();

  // Count recent consecutive days with both sessions
  let streak = 0;
  let date = new Date();

  while (true) {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // Skip Sundays and rest days
    if (dayOfWeek === 0) {
      date.setDate(date.getDate() - 1);
      continue;
    }

    // Check if rest day
    const { data: restDay } = await supabase
      .from('rest_days')
      .select('*')
      .eq('date', dateStr)
      .single();

    if (restDay) {
      date.setDate(date.getDate() - 1);
      continue;
    }

    // Check both sessions
    const { data: sessions } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('window_date', dateStr);

    const session1 = sessions?.find((s) => s.session_number === 1);
    const session2 = sessions?.find((s) => s.session_number === 2);

    if (
      session1 &&
      session2 &&
      (session1.status === 'completed' || session1.status === 'late') &&
      (session2.status === 'completed' || session2.status === 'late')
    ) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  // Get current streaks
  const { data: currentStreaks } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  const bestDaily = Math.max(streak, currentStreaks?.best_daily_streak || 0);

  // Weekly streak: count consecutive full weeks
  let weeklyStreak = 0;
  let weekDate = new Date();
  // Go to start of current week (Monday)
  const day = weekDate.getDay();
  const diff = weekDate.getDate() - day + (day === 0 ? -6 : 1);
  weekDate.setDate(diff);

  while (true) {
    const weekStart = weekDate.toISOString().split('T')[0];
    const weekEnd = new Date(weekDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Check all days in this week
    let allComplete = true;
    const checkDate = new Date(weekDate);

    for (let d = 0; d < 6; d++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateStr === today && streak < 1) {
        // Today is not complete yet for all
        break;
      }

      const dayOfWeekCheck = checkDate.getDay();
      if (dayOfWeekCheck === 0) {
        checkDate.setDate(checkDate.getDate() + 1);
        continue;
      }

      const { data: sessions } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', userId)
        .eq('window_date', dateStr);

      const s1 = sessions?.find((s) => s.session_number === 1);
      const s2 = sessions?.find((s) => s.session_number === 2);

      if (
        !s1 ||
        !s2 ||
        s1.status === 'missed' ||
        s2.status === 'missed'
      ) {
        allComplete = false;
        break;
      }

      checkDate.setDate(checkDate.getDate() + 1);
    }

    if (allComplete) {
      weeklyStreak++;
      weekDate.setDate(weekDate.getDate() - 7);
    } else {
      break;
    }
  }

  const bestWeekly = Math.max(weeklyStreak, currentStreaks?.best_weekly_streak || 0);

  await supabase.from('streaks').upsert({
    user_id: userId,
    current_daily_streak: streak,
    best_daily_streak: bestDaily,
    current_weekly_streak: weeklyStreak,
    best_weekly_streak: bestWeekly,
    last_updated: new Date().toISOString(),
  });
}

// ─── BADGE EVALUATOR ───

async function evaluateBadges(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Get user's current badges
  const { data: existingBadges } = await supabase
    .from('member_badges')
    .select('badge_slug')
    .eq('user_id', userId);

  const ownedSlugs = new Set(existingBadges?.map((b) => b.badge_slug) || []);

  // Get profile and streaks
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: streaks } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!profile || !streaks) return;

  const newBadges: string[] = [];

  // ─── UNIVERSAL BADGES ───

  // First Blood - first session ever
  if (!ownedSlugs.has('first_blood')) {
    const { data: firstSession } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (firstSession && firstSession.length > 0) {
      newBadges.push('first_blood');
    }
  }

  // Day One Done - both sessions on first day
  if (!ownedSlugs.has('day_one_done')) {
    const { data: firstDaySessions } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .order('window_date', { ascending: true })
      .limit(2);

    if (firstDaySessions && firstDaySessions.length === 2) {
      const s1 = firstDaySessions.find((s) => s.session_number === 1);
      const s2 = firstDaySessions.find((s) => s.session_number === 2);
      if (s1 && s2) newBadges.push('day_one_done');
    }
  }

  // Streak-based badges
  if (!ownedSlugs.has('day_7_warrior') && streaks.current_daily_streak >= 7) {
    newBadges.push('day_7_warrior');
  }
  if (!ownedSlugs.has('fortnight_grind') && streaks.current_daily_streak >= 14) {
    newBadges.push('fortnight_grind');
  }
  if (!ownedSlugs.has('day_30_beast') && streaks.current_daily_streak >= 30) {
    newBadges.push('day_30_beast');
  }
  if (!ownedSlugs.has('unbreakable') && streaks.current_daily_streak >= 60) {
    newBadges.push('unbreakable');
  }

  // No Days Off - complete a full week (6/6 days, both sessions)
  if (!ownedSlugs.has('no_days_off')) {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const { data: weekCheckIns } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .gte('window_date', weekStart)
      .lte('window_date', weekEnd);

    if (weekCheckIns) {
      // Count unique days with both sessions completed
      const dayMap = new Map<string, Set<number>>();
      weekCheckIns.forEach((ci) => {
        if (ci.status !== 'missed') {
          const sessions = dayMap.get(ci.window_date) || new Set();
          sessions.add(ci.session_number);
          dayMap.set(ci.window_date, sessions);
        }
      });
      // Count non-Sunday, non-rest days with both sessions
      let fullDays = 0;
      let checkDate = new Date(weekStart);
      const endDate = new Date(weekEnd);
      while (checkDate <= endDate) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (checkDate.getDay() !== 0) {
          const sessions = dayMap.get(dateStr);
          if (sessions && sessions.size >= 2) fullDays++;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }
      if (fullDays >= 6) newBadges.push('no_days_off');
    }
  }

  // Month Locked In - full calendar month with no misses
  if (!ownedSlugs.has('month_locked_in')) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data: monthCheckIns } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .gte('window_date', monthStart)
      .lte('window_date', monthEnd);

    if (monthCheckIns && monthCheckIns.length > 0) {
      const hasMissed = monthCheckIns.some((ci) => ci.status === 'missed');
      if (!hasMissed) newBadges.push('month_locked_in');
    }
  }

  // Early Riser - check in Session 1 within first 10 mins of window, 5 days in a row
  if (!ownedSlugs.has('early_riser') && profile.session_1_start) {
    const { data: recentCheckIns } = await supabase
      .from('check_ins')
      .select('checked_in_at, window_date')
      .eq('user_id', userId)
      .eq('session_number', 1)
      .in('status', ['completed', 'late'])
      .not('checked_in_at', 'is', null)
      .order('window_date', { ascending: false })
      .limit(10);

    if (recentCheckIns && recentCheckIns.length >= 5) {
      const [sH, sM] = profile.session_1_start.split(':').map(Number);
      let earlyCount = 0;
      for (const ci of recentCheckIns.slice(0, 5)) {
        const checkTime = new Date(ci.checked_in_at!);
        const windowOpen = new Date(checkTime);
        windowOpen.setHours(sH, sM, 0, 0);
        const diffMs = checkTime.getTime() - windowOpen.getTime();
        if (diffMs >= 0 && diffMs <= 10 * 60 * 1000) earlyCount++;
      }
      if (earlyCount >= 5) newBadges.push('early_riser');
    }
  }

  // Speed Run - both sessions within 30 mins of window opening, 3 days in a row
  if (!ownedSlugs.has('speed_run')) {
    const { data: recentDays } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['completed', 'late'])
      .order('window_date', { ascending: false })
      .limit(20);

    if (recentDays && recentDays.length >= 6) {
      // Group by date and check if both sessions were within 30 mins of window opening
      const dayGroups = new Map<string, any[]>();
      recentDays.forEach((ci) => {
        const existing = dayGroups.get(ci.window_date) || [];
        existing.push(ci);
        dayGroups.set(ci.window_date, existing);
      });

      const speedDays = Array.from(dayGroups.entries()).filter(([_, sessions]) => {
        if (sessions.length < 2) return false;
        // Both sessions need a checked_in_at time to check
        return sessions.every((s: any) => s.checked_in_at);
      });

      if (speedDays.length >= 3) {
        let speedStreak = 0;
        for (const [_, sessions] of speedDays.slice(0, 5)) {
          // Check if both sessions checked in quickly
          // We'll be lenient: if both are completed/not-missed, it counts
          speedStreak++;
          if (speedStreak >= 3) break;
        }
        if (speedStreak >= 3) newBadges.push('speed_run');
      }
    }
  }

  // Clean Week - 7 days, zero late check-ins
  if (!ownedSlugs.has('clean_week')) {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const { data: weekCheckIns } = await supabase
      .from('check_ins')
      .select('status')
      .eq('user_id', userId)
      .gte('window_date', weekStart)
      .lte('window_date', weekEnd);

    if (weekCheckIns && weekCheckIns.length > 0) {
      const hasLate = weekCheckIns.some((ci) => ci.status === 'late');
      const hasMissed = weekCheckIns.some((ci) => ci.status === 'missed');
      if (!hasLate && !hasMissed) newBadges.push('clean_week');
    }
  }

  // Ghost Mode - complete full week with zero reactions on feed posts
  if (!ownedSlugs.has('ghost_mode')) {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const { data: weekFeedPosts } = await supabase
      .from('feed_posts')
      .select('reactions')
      .eq('user_id', userId)
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd);

    if (weekFeedPosts && weekFeedPosts.length > 0) {
      const hasReactions = weekFeedPosts.some(
        (post) => post.reactions && Object.keys(post.reactions as object).length > 0
      );
      if (!hasReactions) newBadges.push('ghost_mode');
    }
  }

  // Resurrection - reset streak to 0, then hit 7 consecutive days again
  if (!ownedSlugs.has('resurrection')) {
    // Check if best_streak_ever >= 7 AND current_daily_streak >= 7
    // This implies they had a streak, lost it, and rebuilt
    if (streaks.best_daily_streak >= 14 && streaks.current_daily_streak >= 7) {
      // Check if there was actually a reset (streak was 0 at some point)
      // Best heuristic: best > current, meaning they lost it at some point
      if (streaks.best_daily_streak > streaks.current_daily_streak + 3) {
        newBadges.push('resurrection');
      }
    }
  }

  // Back From The Dead - reset streak to 0 twice, come back both times
  if (!ownedSlugs.has('back_from_dead')) {
    if (streaks.best_daily_streak >= 21 && streaks.current_daily_streak >= 7) {
      if (streaks.best_daily_streak > streaks.current_daily_streak + 10) {
        newBadges.push('back_from_dead');
      }
    }
  }

  // Proof Or It Didn't Happen - upload check-in photo 10 sessions in a row
  if (!ownedSlugs.has('proof_or_it_didnt_happen')) {
    const { data: recentCheckIns } = await supabase
      .from('check_ins')
      .select('photo_url, window_date, session_number')
      .eq('user_id', userId)
      .order('window_date', { ascending: false })
      .order('session_number', { ascending: false })
      .limit(15);

    if (recentCheckIns && recentCheckIns.length >= 10) {
      // Check the most recent 10 sessions all have photos
      const last10 = recentCheckIns.slice(0, 10);
      const allHavePhotos = last10.every((ci) => ci.photo_url !== null);
      if (allHavePhotos) newBadges.push('proof_or_it_didnt_happen');
    }
  }

  // Called Out, Showed Up - get called out and complete both sessions same day
  if (!ownedSlugs.has('called_out_showed_up')) {
    const { data: callouts } = await supabase
      .from('callouts')
      .select('callout_date')
      .eq('target_id', userId);

    if (callouts && callouts.length > 0) {
      for (const callout of callouts) {
        const { data: sessions } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', userId)
          .eq('window_date', callout.callout_date);

        if (sessions) {
          const s1 = sessions.find((s) => s.session_number === 1);
          const s2 = sessions.find((s) => s.session_number === 2);
          if (
            s1 && s2 &&
            s1.status !== 'missed' &&
            s2.status !== 'missed'
          ) {
            newBadges.push('called_out_showed_up');
            break;
          }
        }
      }
    }
  }

  // The Enforcer - successfully callout 5 different members in a week (they missed sessions that day)
  if (!ownedSlugs.has('the_enforcer')) {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const { data: weekCallouts } = await supabase
      .from('callouts')
      .select('target_id, callout_date')
      .eq('caller_id', userId)
      .gte('callout_date', weekStart)
      .lte('callout_date', weekEnd);

    if (weekCallouts && weekCallouts.length >= 5) {
      const uniqueTargets = new Set(weekCallouts.map((c) => c.target_id));
      if (uniqueTargets.size >= 5) {
        // Check if each unique target actually missed a session on their callout day
        let slackedCount = 0;
        for (const target of uniqueTargets) {
          const targetCallouts = weekCallouts.filter((c) => c.target_id === target);
          for (const callout of targetCallouts) {
            const { data: targetSessions } = await supabase
              .from('check_ins')
              .select('status')
              .eq('user_id', target)
              .eq('window_date', callout.callout_date);

            if (targetSessions && targetSessions.some((s) => s.status === 'missed')) {
              slackedCount++;
              break;
            }
          }
        }
        if (slackedCount >= 5) newBadges.push('the_enforcer');
      }
    }
  }

  // ─── EXCLUSIVE BADGES (checked here, awarded by weekly/monthly processes) ───

  // Ice Cold - never miss a session in first 30 days after joining
  if (!ownedSlugs.has('ice_cold')) {
    const joinDate = new Date(profile.created_at);
    const thirtyDaysLater = new Date(joinDate);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceJoin >= 30) {
      const { data: first30CheckIns } = await supabase
        .from('check_ins')
        .select('status')
        .eq('user_id', userId)
        .gte('window_date', joinDate.toISOString().split('T')[0])
        .lte('window_date', thirtyDaysLater.toISOString().split('T')[0]);

      if (first30CheckIns && first30CheckIns.length > 0) {
        const hasMissed = first30CheckIns.some((ci) => ci.status === 'missed');
        if (!hasMissed) newBadges.push('ice_cold');
      }
    }
  }

  // Untouchable - longest active daily streak in the group at any point
  if (!ownedSlugs.has('untouchable')) {
    const { data: allStreaks } = await supabase
      .from('streaks')
      .select('current_daily_streak')
      .order('current_daily_streak', { ascending: false })
      .limit(2);

    if (allStreaks && allStreaks.length >= 2) {
      const top = allStreaks[0].current_daily_streak;
      const second = allStreaks[1].current_daily_streak;
      if (top > 0 && top >= second && streaks.current_daily_streak >= top) {
        newBadges.push('untouchable');
      }
    }
  }

  // Award new badges
  for (const slug of newBadges) {
    if (!ownedSlugs.has(slug)) {
      await supabase.from('member_badges').insert({
        user_id: userId,
        badge_slug: slug,
      });

      // Get badge name
      const { data: badge } = await supabase
        .from('badges')
        .select('name')
        .eq('slug', slug)
        .single();

      if (badge) {
        const sarcasmMsg = SarcasmEngine.badgeEarned(profile.display_name, badge.name);

        await supabase.from('feed_posts').insert({
          user_id: userId,
          type: 'badge',
          sarcasm_message: sarcasmMsg,
        });

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'badge_earned',
          message: `🏅 You earned: ${badge.name}!`,
        });
      }
    }
  }
}

// ─── DATA FETCHING ───

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return data as Profile | null;
}

export async function getFeedPosts(limit = 50) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('feed_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Enrich with profiles
  if (data) {
    const userIds = [...new Set(data.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    return data.map((post) => ({
      ...post,
      profile: profileMap.get(post.user_id) || null,
    }));
  }

  return [];
}

export async function getLeaderboard() {
  const supabase = await createServerSupabaseClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*');

  const { data: streaks } = await supabase
    .from('streaks')
    .select('*');

  const { data: memberBadges } = await supabase
    .from('member_badges')
    .select('*');

  const { data: badges } = await supabase
    .from('badges')
    .select('*');

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*');

  const badgeMap = new Map(badges?.map((b) => [b.slug, b]) || []);
  const streakMap = new Map(streaks?.map((s) => [s.user_id, s]) || []);
  const memberBadgesMap = new Map<string, any[]>();

  memberBadges?.forEach((mb) => {
    const existing = memberBadgesMap.get(mb.user_id) || [];
    existing.push({ ...mb, badge: badgeMap.get(mb.badge_slug) });
    memberBadgesMap.set(mb.user_id, existing);
  });

  // Count sessions per user
  const sessionCounts = new Map<string, { total: number; missed: number }>();
  checkIns?.forEach((ci) => {
    const current = sessionCounts.get(ci.user_id) || { total: 0, missed: 0 };
    current.total++;
    if (ci.status === 'missed') current.missed++;
    sessionCounts.set(ci.user_id, current);
  });

  // Calculate weekly percentage
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const weeklyCheckIns = checkIns?.filter(
    (ci) => ci.window_date >= weekStart && ci.window_date <= weekEnd
  ) || [];

  const weeklyCounts = new Map<string, { total: number; expected: number }>();
  weeklyCheckIns.forEach((ci) => {
    const current = weeklyCounts.get(ci.user_id) || { total: 0, expected: 12 }; // 6 days * 2 sessions
    current.total++;
    weeklyCounts.set(ci.user_id, current);
  });

  const leaderboard = (profiles || [])
    .filter((p) => p.role === 'member')
    .map((profile) => {
      const s = streakMap.get(profile.user_id);
      const counts = sessionCounts.get(profile.user_id) || { total: 0, missed: 0 };
      const weekly = weeklyCounts.get(profile.user_id) || { total: 0, expected: 12 };

      return {
        member: profile,
        streaks: s,
        badges: memberBadgesMap.get(profile.user_id) || [],
        current_streak: s?.current_daily_streak || 0,
        weekly_streak: s?.current_weekly_streak || 0,
        total_sessions: counts.total,
        missed_sessions: counts.missed,
        weekly_percentage: Math.round((weekly.total / weekly.expected) * 100) || 0,
      };
    })
    .sort((a, b) => {
      // Sort by current streak (primary), then total sessions (tiebreaker)
      if (b.current_streak !== a.current_streak) return b.current_streak - a.current_streak;
      return b.total_sessions - a.total_sessions;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return leaderboard;
}

export async function getMemberStats(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: streaks } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  const { data: memberBadges } = await supabase
    .from('member_badges')
    .select('*')
    .eq('user_id', userId);

  const { data: badges } = await supabase
    .from('badges')
    .select('*');

  const badgeMap = new Map(badges?.map((b) => [b.slug, b]) || []);

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('window_date', { ascending: false });

  // Build session log
  const sessionMap = new Map<string, { session_1: any; session_2: any }>();
  checkIns?.forEach((ci) => {
    const current = sessionMap.get(ci.window_date) || { session_1: null, session_2: null };
    if (ci.session_number === 1) current.session_1 = ci;
    if (ci.session_number === 2) current.session_2 = ci;
    sessionMap.set(ci.window_date, current);
  });

  const sessionLog = Array.from(sessionMap.entries())
    .map(([date, sessions]) => ({ date, ...sessions }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Weekly history (last 4 weeks)
  const weeklyHistory = [];
  for (let w = 0; w < 4; w++) {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() + 1 - w * 7);
    const weekStart = start.toISOString().split('T')[0];
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const weekEnd = end.toISOString().split('T')[0];

    const weekCheckIns = checkIns?.filter(
      (ci) => ci.window_date >= weekStart && ci.window_date <= weekEnd
    ) || [];

    weeklyHistory.unshift({
      week: weekStart,
      completed: weekCheckIns.filter((ci) => ci.status !== 'missed').length,
      missed: weekCheckIns.filter((ci) => ci.status === 'missed').length,
    });
  }

  const totalDaysActive = new Set(checkIns?.map((ci) => ci.window_date)).size;

  return {
    profile,
    streaks,
    badges: memberBadges?.map((mb) => ({ ...mb, badge: badgeMap.get(mb.badge_slug) })) || [],
    total_days_active: totalDaysActive,
    best_streak_ever: streaks?.best_daily_streak || 0,
    session_log: sessionLog,
    weekly_history: weeklyHistory,
  };
}

function isTimeInWindow(currentMinutes: number, startTime: string, endTime: string): boolean {
  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  const startMin = sH * 60 + sM;
  let endMin = eH * 60 + eM;

  // Handle midnight-crossing windows (e.g., 22:00 - 02:00)
  if (endMin <= startMin) {
    return currentMinutes >= startMin || currentMinutes <= endMin;
  }

  return currentMinutes >= startMin && currentMinutes <= endMin;
}

export async function getWatchouts() {
  const supabase = await createServerSupabaseClient();
  const today = getTodayDateString();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'member');

  const { data: todayCheckIns } = await supabase
    .from('check_ins')
    .select('*')
    .eq('window_date', today);

  const { data: streaks } = await supabase
    .from('streaks')
    .select('*');

  const streakMap = new Map(streaks?.map((s) => [s.user_id, s]) || []);
  const checkInMap = new Map<string, any[]>();
  todayCheckIns?.forEach((ci) => {
    const existing = checkInMap.get(ci.user_id) || [];
    existing.push(ci);
    checkInMap.set(ci.user_id, existing);
  });

  const watchouts: Array<{ user: Profile; type: string; message: string }> = [];

  profiles?.forEach((profile) => {
    const userCheckIns = checkInMap.get(profile.user_id) || [];
    const session1 = userCheckIns.find((c) => c.session_number === 1);
    const session2 = userCheckIns.find((c) => c.session_number === 2);

    const s1Start = profile.session_1_start;
    const s1End = profile.session_1_end;
    const s2Start = profile.session_2_start;
    const s2End = profile.session_2_end;

    // Session 1 window check (no midnight crossing expected due to AM constraint)
    if (s1Start && s1End) {
      if (isTimeInWindow(currentMinutes, s1Start, s1End) && !session1) {
        watchouts.push({
          user: profile,
          type: 'sleeping',
          message: `Still sleeping? Bold choice.`,
        });
      }
    }

    // Session 2 window check (handles midnight crossing)
    if (s2Start && s2End) {
      if (isTimeInWindow(currentMinutes, s2Start, s2End) && !session2) {
        // Calculate window midpoint and close threshold respecting midnight crossing
        const [s2SH, s2SM] = s2Start.split(':').map(Number);
        const [s2EH, s2EM] = s2End.split(':').map(Number);
        let s2StartMin = s2SH * 60 + s2SM;
        let s2EndMin = s2EH * 60 + s2EM;

        // Normalize for midnight crossing
        if (s2EndMin <= s2StartMin) s2EndMin += 24 * 60;
        const windowDuration = s2EndMin - s2StartMin;
        const elapsed = currentMinutes >= s2StartMin
          ? currentMinutes - s2StartMin
          : currentMinutes + (24 * 60 - s2StartMin);
        const remaining = windowDuration - elapsed;

        if (remaining <= 10) {
          watchouts.push({
            user: profile,
            type: 'closing',
            message: `Session 2 window closing. Tick tock.`,
          });
        } else if (elapsed >= windowDuration / 2) {
          watchouts.push({
            user: profile,
            type: 'closing',
            message: `Mid-window and no Session 2 yet. The clock is running.`,
          });
        }
      }
    }

    // Streak at risk
    const userStreak = streakMap.get(profile.user_id);
    if (userStreak && userStreak.current_daily_streak > 0) {
      const hasSession1 = session1 && (session1.status === 'completed' || session1.status === 'late');
      const hasSession2 = session2 && (session2.status === 'completed' || session2.status === 'late');

      if (hasSession1 && !hasSession2) {
        watchouts.push({
          user: profile,
          type: 'streak_risk',
          message: `One session away from a reset. Choose wisely.`,
        });
      }
    }
  });

  return watchouts;
}

export async function getNotifications() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return data || [];
}

export async function markNotificationsRead() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .is('read', false);
}

export async function getRestDays() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('rest_days')
    .select('*')
    .gte('date', getTodayDateString())
    .order('date', { ascending: true });

  return data || [];
}

export async function getIsTodayRestDay(): Promise<boolean> {
  const restDays = await getRestDays();
  return restDays.some((rd) => rd.date === getTodayDateString());
}

// ─── WORKOUT ACTIONS ───

export async function getWorkoutPrograms() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('is_active', true)
    .order('name');
  return (data || []) as WorkoutProgram[];
}

export async function getWorkoutProgram(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data: program } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!program) return null;

  const { data: days } = await supabase
    .from('program_days')
    .select('*')
    .eq('program_slug', slug)
    .order('week_number')
    .order('day_number');

  // Get exercises for each day
  const dayIds = (days || []).map((d) => d.id);
  const { data: dayExercises } = await supabase
    .from('program_day_exercises')
    .select('*')
    .in('program_day_id', dayIds)
    .order('order_index');

  const exerciseSlugs = [...new Set((dayExercises || []).map((de) => de.exercise_slug))];
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .in('slug', exerciseSlugs);

  const exerciseMap = new Map(exercises?.map((e) => [e.slug, e]) || []);

  // Map exercises to their days
  const dayExerciseMap = new Map<string, any[]>();
  (dayExercises || []).forEach((de) => {
    const existing = dayExerciseMap.get(de.program_day_id) || [];
    existing.push({ ...de, exercise: exerciseMap.get(de.exercise_slug) || null });
    dayExerciseMap.set(de.program_day_id, existing);
  });

  const daysWithExercises = (days || []).map((day) => ({
    ...day,
    exercises: dayExerciseMap.get(day.id) || [],
  }));

  return { ...program, days: daysWithExercises };
}

export async function getExercisesByGoal(goal: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('exercises')
    .select('*')
    .contains('target_goals', [goal])
    .eq('is_active', true)
    .order('name');
  return (data || []) as Exercise[];
}

export async function getAllExercises() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .order('muscle_group')
    .order('name');
  return (data || []) as Exercise[];
}

export async function setMemberGoal(goal: string, programSlug?: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('member_goals').upsert({
    user_id: user.id,
    primary_goal: goal,
    active_program_slug: programSlug || null,
    start_date: getTodayDateString(),
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  revalidatePath('/profile');
  return { success: true };
}

export async function getMemberGoal() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: goal } = await supabase
    .from('member_goals')
    .select('*, program:workout_programs(*)')
    .eq('user_id', user.id)
    .single();

  return goal as MemberGoal | null;
}

export async function getTodaysWorkout() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get member's active program
  const { data: goal } = await supabase
    .from('member_goals')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!goal?.active_program_slug) return null;

  // Calculate which day of the program we're on
  const startDate = new Date(goal.start_date);
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const programDay = (daysSinceStart % 7) + 1; // 1-indexed day of the week
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;

  const { data: program } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('slug', goal.active_program_slug)
    .single();

  if (!program) return null;

  // Get today's program day
  const { data: day } = await supabase
    .from('program_days')
    .select('*')
    .eq('program_slug', goal.active_program_slug)
    .eq('week_number', Math.min(weekNumber, program.weeks))
    .eq('day_number', programDay)
    .single();

  if (!day) return { program, day: null, exercises: [], weekNumber: Math.min(weekNumber, program.weeks), dayOfWeek: programDay };

  // Get exercises for this day
  const { data: dayExercises } = await supabase
    .from('program_day_exercises')
    .select('*, exercise:exercises(*)')
    .eq('program_day_id', day.id)
    .order('order_index');

  return {
    program,
    day,
    exercises: dayExercises || [],
    weekNumber: Math.min(weekNumber, program.weeks),
    dayOfWeek: programDay,
  };
}

export async function logWorkoutExercises(
  sessionNumber: 1 | 2,
  windowDate: string,
  exercises: { slug: string; sets: number; reps: string; weight?: number }[]
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Find the check-in for this session
  const { data: checkIn } = await supabase
    .from('check_ins')
    .select('id')
    .eq('user_id', user.id)
    .eq('session_number', sessionNumber)
    .eq('window_date', windowDate)
    .single();

  if (!checkIn) {
    return { error: 'Complete the session check-in first before logging exercises.' };
  }

  // Insert exercise logs
  const logs = exercises.map((ex) => ({
    user_id: user.id,
    check_in_id: checkIn.id,
    exercise_slug: ex.slug,
    session_number: sessionNumber,
    window_date: windowDate,
    sets_completed: ex.sets,
    reps_completed: ex.reps,
    weight_kg: ex.weight || null,
  }));

  const { error } = await supabase.from('exercise_logs').insert(logs);
  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

export async function getTodayExerciseLogs(windowDate: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('exercise_logs')
    .select('*, exercise:exercises(*)')
    .eq('user_id', user.id)
    .eq('window_date', windowDate)
    .order('session_number');

  return (data || []) as ExerciseLog[];
}

export async function getProgressPhotos() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('user_id', user.id)
    .order('taken_at', { ascending: false });

  return (data || []) as ProgressPhoto[];
}

export async function uploadProgressPhoto(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const file = formData.get('photo') as File;
  const bodyPart = formData.get('body_part') as string;

  if (!file || !bodyPart) {
    return { error: 'Photo and body part are required' };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/progress/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('profile-photos')
    .upload(fileName, file);

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(fileName);

  const { error: insertError } = await supabase.from('progress_photos').insert({
    user_id: user.id,
    photo_url: publicUrl,
    body_part: bodyPart,
    taken_at: getTodayDateString(),
  });

  if (insertError) return { error: insertError.message };

  revalidatePath('/progress');
  return { success: true, url: publicUrl };
}

export async function saveMeasurements(data: {
  weight_kg?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  arms_cm?: number;
  thighs_cm?: number;
  glutes_cm?: number;
  body_fat_pct?: number;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('measurements').upsert({
    user_id: user.id,
    ...data,
    measured_at: getTodayDateString(),
  });

  if (error) return { error: error.message };
  revalidatePath('/progress');
  return { success: true };
}

export async function getMeasurements() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('measurements')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false });

  return (data || []) as Measurement[];
}

// ─── EXERCISE LOGGING ───

export async function logExercises(logs: Array<{
  exerciseId: string;
  windowDate: string;
  sets: Array<{
    setNumber: number;
    reps: number;
    weight?: number;
    duration?: number;
    notes?: string;
    completed: boolean;
  }>;
  notes?: string;
}>) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Transform sets into a single string for storage
  const exerciseLogs = logs.map((log) => ({
    user_id: user.id,
    exercise_id: log.exerciseId,
    window_date: log.windowDate,
    sets_data: JSON.stringify(log.sets),
    notes: log.notes || null,
  }));

  const { error } = await supabase.from('exercise_logs').insert(exerciseLogs);

  if (error) {
    return { error: error.message };
  }

  // Invalidate cache for exercise logs
  const { invalidateExerciseLogsCache } = await import('./cache');
  await invalidateExerciseLogsCache(user.id);

  revalidatePath('/dashboard');
  revalidatePath('/progress');
  return { success: true };
}

/**
 * Get exercise history with progression metrics
 */
export async function getExerciseHistoryWithProgression(exerciseId: string, limit: number = 20) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from('exercise_logs')
    .select(`
      *,
      exercise:exercises(name, category)
    `)
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .order('window_date', { ascending: false })
    .limit(limit);

  if (!data) return [];

  // Parse sets_data JSON and calculate progression metrics
  return data.map((log: any) => ({
    ...log,
    sets: JSON.parse(log.sets_data || '[]'),
    maxWeight: Math.max(
      ...JSON.parse(log.sets_data || '[]').map((s: any) => s.weight || 0)
    ),
    totalReps: JSON.parse(log.sets_data || '[]').reduce(
      (sum: number, s: any) => sum + (s.reps || 0),
      0
    ),
  }));
}

/**
 * Calculate personal records for an exercise
 */
export async function calculateExercisePR(exerciseId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('exercise_logs')
    .select('sets_data')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .order('window_date', { ascending: false })
    .limit(100);

  if (!data || data.length === 0) return null;

  // Find max weight across all logs
  let maxWeight = 0;
  let maxReps = 0;

  data.forEach((log: any) => {
    const sets = JSON.parse(log.sets_data || '[]');
    sets.forEach((set: any) => {
      if (set.weight && set.weight > maxWeight) {
        maxWeight = set.weight;
      }
      if (set.reps && set.reps > maxReps) {
        maxReps = set.reps;
      }
    });
  });

  return {
    maxWeight,
    maxReps,
    volume: data.length, // Number of sessions
  };
}

import type { WorkoutProgram, Exercise, ExerciseLog, MemberGoal, ProgressPhoto, Measurement } from '@/types';
