'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import {
  getWatchouts,
  getIsTodayRestDay,
  logSession,
  getMemberStats,
} from '@/lib/actions';
import { formatTime, getWindowStatus, isSunday } from '@/lib/utils';
import {
  Zap,
  Flame,
  Trophy,
  AlertTriangle,
  Camera,
  Dumbbell,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { getTodaysWorkout } from '@/lib/actions';
import { MUSCLE_GROUP_LABELS, type GoalCategory } from '@/types';
import { SarcasmEngine } from '@/lib/sarcasm';
import type { Profile, WorkoutProgram, ProgramDay, ProgramDayExercise, Exercise, MemberGoal } from '@/types';

interface WatchoutItem {
  user: Profile;
  type: string;
  message: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [watchouts, setWatchouts] = useState<WatchoutItem[]>([]);
  const [isRestDay, setIsRestDay] = useState(false);
  const [logging, setLogging] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoFileS2, setPhotoFileS2] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef2 = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<{
    current_daily_streak: number;
    current_weekly_streak: number;
    total_sessions: number;
    missed_sessions: number;
  } | null>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<{
    program: WorkoutProgram;
    day: ProgramDay | null;
    exercises: (ProgramDayExercise & { exercise: Exercise })[];
    weekNumber: number;
    dayOfWeek: number;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && profile && !profile.session_1_start) {
      router.push('/onboarding');
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    if (!user) return;
    try {
      const [w, restDay, memberStats] = await Promise.all([
        getWatchouts(),
        getIsTodayRestDay(),
        getMemberStats(user.id).catch(() => null),
      ]);
      setWatchouts(w as WatchoutItem[]);
      setIsRestDay(restDay);
      const workout = await getTodaysWorkout();
      setTodaysWorkout(workout as any);
      if (memberStats) {
        const totalCheckIns = memberStats.session_log?.reduce(
          (acc: number, day: any) => {
            let count = 0;
            if (day.session_1 && day.session_1.status !== 'missed') count++;
            if (day.session_2 && day.session_2.status !== 'missed') count++;
            return acc + count;
          }, 0
        ) || 0;
        const missedCheckIns = memberStats.session_log?.reduce(
          (acc: number, day: any) => {
            let count = 0;
            if (day.session_1?.status === 'missed') count++;
            if (day.session_2?.status === 'missed') count++;
            return acc + count;
          }, 0
        ) || 0;
        setStats({
          current_daily_streak: memberStats.streaks?.current_daily_streak || 0,
          current_weekly_streak: memberStats.streaks?.current_weekly_streak || 0,
          total_sessions: totalCheckIns,
          missed_sessions: missedCheckIns,
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  }

  async function handleLogSession(sessionNumber: 1 | 2) {
    setLogging(sessionNumber);
    setMessage(null);
    try {
      const photo = sessionNumber === 1 ? photoFile : photoFileS2;
      const result = await logSession(sessionNumber, photo);
      if (result.error) {
        setMessage({ text: result.error, type: 'error' });
        setTimeout(() => setMessage(null), 4000);
      } else {
        if (result.sarcasm_message) {
          setMessage({ text: result.sarcasm_message, type: 'success' });
          setTimeout(() => setMessage(null), 4000);
        }
        if (sessionNumber === 1) {
          setPhotoFile(null);
          if (photoInputRef.current) photoInputRef.current.value = '';
        } else {
          setPhotoFileS2(null);
          if (photoInputRef2.current) photoInputRef2.current.value = '';
        }
        loadDashboard();
      }
    } catch (err) {
      setMessage({ text: 'Something went wrong', type: 'error' });
      setTimeout(() => setMessage(null), 4000);
    }
    setLogging(null);
  }

  const s1Status = profile ? getWindowStatus(profile.session_1_start, profile.session_1_end) : 'closed';
  const s2Status = profile ? getWindowStatus(profile.session_2_start, profile.session_2_end) : 'closed';
  const completedCount = [s1Status, s2Status].filter(s => s === 'closed').length;
  const totalSessions = 2;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-[#FF5C00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* ─── HEADER SECTION ─── */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white">
            {profile?.display_name
              ? `WELCOME BACK${profile.display_name.split(' ')[0] ? `, ${profile.display_name.split(' ')[0].toUpperCase()}` : ''}`
              : 'WELCOME BACK'}
          </h1>
          <p className="text-[#999999] text-sm font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Avatar
          src={profile?.photo_url}
          alt={profile?.display_name || ''}
          fallback={profile?.display_name?.charAt(0)}
          size="md"
          className="ring-2 ring-[#FF5C00]/20"
        />
      </div>

      {/* Accent horizontal rule */}
      <hr className="hr-accent" />

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm animate-slide-up ${
            message.type === 'error'
              ? 'bg-[#FF3B30]/8 border-[#FF3B30]/15 text-[#FF3B30]'
              : 'bg-[#34C759]/8 border-[#34C759]/15 text-[#34C759]'
          }`}
        >
          <span className="text-lg">{message.type === 'error' ? '⚠️' : '✅'}</span>
          <p className="font-medium sarcasm-text">{message.text}</p>
        </div>
      )}

      {/* ─── TODAY'S WORKOUT ─── */}
      {!isSunday() && !isRestDay && todaysWorkout?.day && todaysWorkout.day.session_type !== 'rest' && (
        <Card className="border-[#242424] bg-[#1A1A1A]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2 text-[#FF5C00]">
                <Target className="h-4 w-4" />
                TODAY'S WORKOUT — {todaysWorkout.program.name}
              </CardTitle>
              <Link href={`/workouts/${todaysWorkout.program.slug}`}>
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-[#999999]">
                  VIEW <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20">
                WEEK {todaysWorkout.weekNumber} · DAY {todaysWorkout.dayOfWeek}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">
                {todaysWorkout.day.session_type.toUpperCase()}{todaysWorkout.day.focus_area ? ` · ${todaysWorkout.day.focus_area}` : ''}
              </span>
            </div>
            {todaysWorkout.day.note && (
              <p className="text-[11px] text-[#999999] italic">💡 {todaysWorkout.day.note}</p>
            )}
            <div className="space-y-2">
              {todaysWorkout.exercises.slice(0, 5).map((ex) => (
                <div key={ex.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#141414] border border-[#242424]">
                  <div>
                    <p className="text-sm font-bold text-white">{ex.exercise?.name || ex.exercise_slug}</p>
                    <p className="text-[10px] text-[#999999] font-medium">{ex.sets} × {ex.reps} · {ex.rest_seconds}s rest</p>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#999999] border border-[#242424]">
                    {ex.exercise?.muscle_group ? MUSCLE_GROUP_LABELS[ex.exercise.muscle_group] || ex.exercise.muscle_group : ''}
                  </span>
                </div>
              ))}
              {todaysWorkout.exercises.length > 5 && (
                <p className="text-xs text-[#555555] text-center font-medium">+{todaysWorkout.exercises.length - 5} more exercises</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── TODAY'S SESSIONS ─── */}
      {!isSunday() && !isRestDay && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#999999]">TODAY'S SESSIONS</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Session 1 Card */}
            <Card className={`border-[#242424] transition-all duration-200 hover:scale-[1.02] hover:brightness-110 ${
              s1Status === 'open'
                ? 'live-card-glow'
                : s1Status === 'closed'
                ? 'closed-session'
                : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold uppercase tracking-widest text-white">
                    SESSION 1
                  </CardTitle>
                  {s1Status === 'open' ? (
                    <span className="live-badge">
                      <span className="live-dot" />
                      LIVE
                    </span>
                  ) : s1Status === 'upcoming' ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20">
                      UPCOMING
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#1A1A1A] text-[#555555] border border-[#242424]">
                      CLOSED
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#999999] font-medium">
                  Window: {formatTime(profile?.session_1_start)} — {formatTime(profile?.session_1_end)}
                </p>

                {s1Status === 'open' && (
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#242424] cursor-pointer hover:border-[#3F3F3F] hover:bg-[#1A1A1A] transition-all duration-200 group">
                    <Camera className="h-4 w-4 text-[#555555] group-hover:text-[#FF5C00] transition-colors" />
                    <span className="text-xs text-[#999999] group-hover:text-white transition-colors">
                      {photoFile ? photoFile.name : 'Add photo (optional, required Mon)'}
                    </span>
                    <input
                      id="session1-photo"
                      name="session1_photo"
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}

                <Button
                  onClick={() => handleLogSession(1)}
                  disabled={s1Status !== 'open' || logging === 1}
                  className={`w-full h-12 text-sm font-bold uppercase tracking-widest ${
                    s1Status === 'open'
                      ? 'bg-[#FF5C00] text-white hover:bg-[#FF5C00]/90 shadow-lg shadow-[#FF5C00]/15'
                      : 'bg-[#1A1A1A] text-[#555555] border border-[#242424] cursor-not-allowed'
                  }`}
                >
                  {logging === 1 ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      LOGGING...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {s1Status === 'open' ? 'START SESSION' : s1Status === 'upcoming' ? 'NOT YET' : 'WINDOW CLOSED'}
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Session 2 Card */}
            <Card className={`border-[#242424] transition-all duration-200 hover:scale-[1.02] hover:brightness-110 ${
              s2Status === 'open'
                ? 'live-card-glow'
                : s2Status === 'closed'
                ? 'closed-session'
                : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold uppercase tracking-widest text-white">
                    SESSION 2
                  </CardTitle>
                  {s2Status === 'open' ? (
                    <span className="live-badge">
                      <span className="live-dot" />
                      LIVE
                    </span>
                  ) : s2Status === 'upcoming' ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20">
                      UPCOMING
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-[#1A1A1A] text-[#555555] border border-[#242424]">
                      CLOSED
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#999999] font-medium">
                  Window: {formatTime(profile?.session_2_start)} — {formatTime(profile?.session_2_end)}
                </p>

                {s2Status === 'open' && (
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#242424] cursor-pointer hover:border-[#3F3F3F] hover:bg-[#1A1A1A] transition-all duration-200 group">
                    <Camera className="h-4 w-4 text-[#555555] group-hover:text-[#FF5C00] transition-colors" />
                    <span className="text-xs text-[#999999] group-hover:text-white transition-colors">
                      {photoFileS2 ? photoFileS2.name : 'Add photo (optional, required Mon)'}
                    </span>
                    <input
                      id="session2-photo"
                      name="session2_photo"
                      ref={photoInputRef2}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setPhotoFileS2(e.target.files?.[0] || null)}
                    />
                  </label>
                )}

                <Button
                  onClick={() => handleLogSession(2)}
                  disabled={s2Status !== 'open' || logging === 2}
                  className={`w-full h-12 text-sm font-bold uppercase tracking-widest ${
                    s2Status === 'open'
                      ? 'bg-[#FF5C00] text-white hover:bg-[#FF5C00]/90 shadow-lg shadow-[#FF5C00]/15'
                      : 'bg-[#1A1A1A] text-[#555555] border border-[#242424] cursor-not-allowed'
                  }`}
                >
                  {logging === 2 ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      LOGGING...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {s2Status === 'open' ? 'START SESSION' : s2Status === 'upcoming' ? 'NOT YET' : 'WINDOW CLOSED'}
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── PROGRESS BAR ─── */}
      {!isSunday() && !isRestDay && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#999999]">TODAY'S PROGRESS</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#555555]">
              {[s1Status, s2Status].filter(s => s === 'closed').length}/{totalSessions} SESSIONS
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#242424] overflow-hidden">
            <div
              className="progress-fill"
              style={{ width: `${([s1Status, s2Status].filter(s => s === 'closed').length / totalSessions) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── REST DAY ─── */}
      {(isSunday() || isRestDay) && (
        <Card className="border-[#242424] bg-[#1A1A1A]">
          <CardContent className="py-12 text-center space-y-5">
            <div className="text-6xl">😴</div>
            <div className="space-y-2">
              <p className="text-2xl font-black uppercase tracking-tight text-white">REST DAY</p>
              <p className="text-sm text-[#999999] font-medium max-w-md mx-auto">
                {isSunday()
                  ? "Your streak is safe. The grind will be here tomorrow."
                  : "The admin declared a rest day. Enjoy it while it lasts."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── WATCHOUTS ─── */}
      {watchouts.length > 0 && (
        <Card className="border-[#FF3B30]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#FF3B30]">
              <AlertTriangle className="h-4 w-4" />
              WATCHOUTS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {watchouts.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FF3B30]/5 border border-[#FF3B30]/10 hover:bg-[#FF3B30]/8 transition-colors"
              >
                <Avatar
                  src={w.user.photo_url}
                  alt={w.user.display_name}
                  fallback={w.user.display_name?.charAt(0)}
                  size="sm"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{w.user.display_name}</p>
                  <p className="text-xs text-[#999999] font-medium sarcasm-text">{w.message}</p>
                </div>
                <span className="text-lg">⚠️</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── STATS GRID ─── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#999999]">YOUR STATS</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Day Streak */}
          <Card className="border-[#242424] hover:border-[#FF9F0A]/20 transition-all duration-200 hover:shadow-[0_0_16px_rgba(255,159,10,0.06)] hover:scale-[1.02]">
            <CardContent className="p-5 text-center space-y-2">
              <Flame className="h-6 w-6 text-[#FF9F0A] mx-auto" />
              <p className="text-4xl md:text-5xl font-black tabular-nums text-white stat-glow">{stats?.current_daily_streak ?? 0}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555555]">Day Streak</p>
            </CardContent>
          </Card>

          {/* Week Streak */}
          <Card className="border-[#242424] hover:border-[#C8FF00]/20 transition-all duration-200 hover:shadow-[0_0_16px_rgba(200,255,0,0.06)] hover:scale-[1.02]">
            <CardContent className="p-5 text-center space-y-2">
              <Trophy className="h-6 w-6 text-[#C8FF00] mx-auto" />
              <p className="text-4xl md:text-5xl font-black tabular-nums text-white stat-glow-lime">{stats?.current_weekly_streak ?? 0}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555555]">Week Streak</p>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="border-[#242424] hover:border-[#34C759]/20 transition-all duration-200 hover:shadow-[0_0_16px_rgba(52,199,89,0.06)] hover:scale-[1.02]">
            <CardContent className="p-5 text-center space-y-2">
              <CheckCircle2 className="h-6 w-6 text-[#34C759] mx-auto" />
              <p className="text-4xl md:text-5xl font-black tabular-nums text-white">{stats?.total_sessions ?? 0}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555555]">Completed</p>
            </CardContent>
          </Card>

          {/* Missed */}
          <Card className="border-[#242424] hover:border-[#FF3B30]/20 transition-all duration-200 hover:shadow-[0_0_16px_rgba(255,59,48,0.06)] hover:scale-[1.02]">
            <CardContent className="p-5 text-center space-y-2">
              <XCircle className="h-6 w-6 text-[#FF3B30] mx-auto" />
              <p className="text-4xl md:text-5xl font-black tabular-nums text-white">{stats?.missed_sessions ?? 0}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555555]">Missed</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
