'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import type { Profile } from '@/types';

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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<{
    current_daily_streak: number;
    current_weekly_streak: number;
    total_sessions: number;
    missed_sessions: number;
  } | null>(null);
  const [loggingSession, setLoggingSession] = useState<number | null>(null);

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
      const result = await logSession(sessionNumber, photoFile);
      if (result.error) {
        setMessage({ text: result.error, type: 'error' });
        setTimeout(() => setMessage(null), 4000);
      } else {
        if (result.sarcasm_message) {
          setMessage({ text: result.sarcasm_message, type: 'success' });
          setTimeout(() => setMessage(null), 4000);
        }
        setPhotoFile(null);
        if (photoInputRef.current) photoInputRef.current.value = '';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-[#C8FF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - Big greeting */}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">
          {profile?.display_name ? `HEY, ${profile.display_name.split(' ')[0].toUpperCase()}` : 'WELCOME BACK'}
        </h1>
        <p className="text-[#888888] text-sm font-medium mt-1">
          {isSunday()
            ? "It's Sunday. Rest day. You're welcome."
            : isRestDay
            ? "Rest day declared. Don't get used to it."
            : 'Two sessions. Show up. No excuses.'}
        </p>
      </div>

      {/* Today's goals indicator */}
      {!isSunday() && !isRestDay && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-widest text-[#888888]">Today's Goals</span>
            <span className="font-bold text-[#C8FF00]">2 SESSIONS</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#222222] overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#C8FF00] to-[#C8FF00]/40 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(200,255,0,0.15)]" />
          </div>
        </div>
      )}

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm animate-slide-up ${
            message.type === 'error'
              ? 'bg-[#FF3B30]/8 border-[#FF3B30]/15 text-[#FF3B30]'
              : 'bg-[#30D158]/8 border-[#30D158]/15 text-[#30D158]'
          }`}
        >
          <span className="text-lg">{message.type === 'error' ? '⚠️' : '✅'}</span>
          <p className="font-medium sarcasm-text">{message.text}</p>
        </div>
      )}

      {/* Session Cards - Workout Modules */}
      {!isSunday() && !isRestDay && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card
            className={`border-[#222222] transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${
              s1Status === 'open'
                ? 'window-open border-[#C8FF00]/20'
                : s1Status === 'closed'
                ? 'opacity-50'
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${s1Status === 'open' ? 'text-[#C8FF00]' : s1Status === 'upcoming' ? 'text-[#FF9500]' : 'text-[#666666]'}`} />
                  SESSION 1
                </CardTitle>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  s1Status === 'open'
                    ? 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20'
                    : s1Status === 'upcoming'
                    ? 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20'
                    : 'bg-[#1C1C1C] text-[#666666] border border-[#222222]'
                }`}>
                  {s1Status === 'open' ? '● LIVE' : s1Status === 'upcoming' ? 'UPCOMING' : 'CLOSED'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-[#888888] font-medium">
                <span>Window: {formatTime(profile?.session_1_start)} — {formatTime(profile?.session_1_end)}</span>
              </div>

              {s1Status === 'open' && (
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#222222] cursor-pointer hover:border-[#3F3F3F] hover:bg-[#1C1C1C] transition-all duration-200 group">
                  <Camera className="h-4 w-4 text-[#666666] group-hover:text-[#C8FF00] transition-colors" />
                  <span className="text-xs text-[#888888] group-hover:text-[#F5F5F5] transition-colors">
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
                className="w-full h-12 text-sm"
                variant={s1Status === 'open' ? 'default' : 'secondary'}
              >
                {logging === 1 ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-[#080808] border-t-transparent rounded-full" />
                    LOGGING...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {s1Status === 'open' ? 'LOG SESSION 1' : s1Status === 'upcoming' ? 'NOT YET' : 'WINDOW CLOSED'}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`border-[#222222] transition-all duration-300 hover:scale-[1.02] hover:brightness-110 ${
              s2Status === 'open'
                ? 'window-open border-[#C8FF00]/20'
                : s2Status === 'closed'
                ? 'opacity-50'
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${s2Status === 'open' ? 'text-[#C8FF00]' : s2Status === 'upcoming' ? 'text-[#FF9500]' : 'text-[#666666]'}`} />
                  SESSION 2
                </CardTitle>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  s2Status === 'open'
                    ? 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20'
                    : s2Status === 'upcoming'
                    ? 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20'
                    : 'bg-[#1C1C1C] text-[#666666] border border-[#222222]'
                }`}>
                  {s2Status === 'open' ? '● LIVE' : s2Status === 'upcoming' ? 'UPCOMING' : 'CLOSED'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-[#888888] font-medium">
                <span>Window: {formatTime(profile?.session_2_start)} — {formatTime(profile?.session_2_end)}</span>
              </div>

              {s2Status === 'open' && (
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#222222] cursor-pointer hover:border-[#3F3F3F] hover:bg-[#1C1C1C] transition-all duration-200 group">
                  <Camera className="h-4 w-4 text-[#666666] group-hover:text-[#C8FF00] transition-colors" />
                  <span className="text-xs text-[#888888] group-hover:text-[#F5F5F5] transition-colors">
                    {photoFile ? photoFile.name : 'Add photo (optional, required Mon)'}
                  </span>
                  <input
                    id="session2-photo"
                    name="session2_photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}

              <Button
                onClick={() => handleLogSession(2)}
                disabled={s2Status !== 'open' || logging === 2}
                className="w-full h-12 text-sm"
                variant={s2Status === 'open' ? 'default' : 'secondary'}
              >
                {logging === 2 ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-[#080808] border-t-transparent rounded-full" />
                    LOGGING...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {s2Status === 'open' ? 'LOG SESSION 2' : s2Status === 'upcoming' ? 'NOT YET' : 'WINDOW CLOSED'}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rest day card */}
      {(isSunday() || isRestDay) && (
        <Card className="border-[#222222] bg-[#111111]/50">
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-5xl">😴</div>
            <div>
              <p className="text-lg font-black uppercase tracking-tight text-[#F5F5F5] mb-1">REST DAY</p>
              <p className="text-sm text-[#888888] font-medium">
                {isSunday()
                  ? "Your streak is safe. The grind will be here tomorrow."
                  : "The admin declared a rest day. Enjoy it while it lasts."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Watchouts */}
      {watchouts.length > 0 && (
        <Card className="border-[#FF3B30]/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-[#FF3B30]">
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
                  <p className="text-sm font-bold text-[#F5F5F5]">{w.user.display_name}</p>
                  <p className="text-xs text-[#888888] font-medium sarcasm-text">{w.message}</p>
                </div>
                <span className="text-lg">⚠️</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats Row - Scoreboard style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="border-[#222222] hover:border-[#FF9500]/20 transition-all duration-200 hover:shadow-[0_0_16px_rgba(255,149,0,0.06)] hover:scale-[1.02]">
          <CardContent className="p-5 text-center space-y-1">
            <Flame className="h-5 w-5 text-[#FF9500] mx-auto" />
            <p className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5] stat-glow">{stats?.current_daily_streak ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="border-[#222222] hover:border-[#FF9500]/20 transition-all duration-200 hover:shadow-[0_0_16px_rgba(255,149,0,0.06)] hover:scale-[1.02]">
          <CardContent className="p-5 text-center space-y-1">
            <Trophy className="h-5 w-5 text-[#FF9500] mx-auto" />
            <p className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">{stats?.current_weekly_streak ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Week Streak</p>
          </CardContent>
        </Card>
        <Card className="border-[#222222] hover:border-[#30D158]/20 transition-all duration-200 hover:shadow-[0_0_16px_rgba(48,209,88,0.06)] hover:scale-[1.02]">
          <CardContent className="p-5 text-center space-y-1">
            <CheckCircle2 className="h-5 w-5 text-[#30D158] mx-auto" />
            <p className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">{stats?.total_sessions ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-[#222222] hover:border-[#FF3B30]/20 transition-all duration-200 hover:shadow-[0_0_16px_rgba(255,59,48,0.06)] hover:scale-[1.02]">
          <CardContent className="p-5 text-center space-y-1">
            <XCircle className="h-5 w-5 text-[#FF3B30] mx-auto" />
            <p className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">{stats?.missed_sessions ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Missed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
