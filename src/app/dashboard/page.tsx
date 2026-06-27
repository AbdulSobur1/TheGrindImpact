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
        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {isSunday()
              ? "It's Sunday. Rest day. You're welcome."
              : isRestDay
              ? "Rest day declared. Don't get used to it."
              : 'Two sessions. No excuses.'}
          </p>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm ${
            message.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          <p className="sarcasm-text">{message.text}</p>
        </div>
      )}

      {/* Quick Actions - Session Logging */}
      {!isSunday() && !isRestDay && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`border-zinc-800 ${
              s1Status === 'open'
                ? 'window-open border-emerald-500/30'
                : s1Status === 'closed'
                ? 'opacity-60'
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                Session 1 {s1Status === 'open' ? '(Open)' : s1Status === 'upcoming' ? '(Upcoming)' : '(Closed)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-500">
                Window: {formatTime(profile?.session_1_start)} - {formatTime(profile?.session_1_end)}
              </p>

              {/* Photo upload */}
              {s1Status === 'open' && (
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                  <Camera className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs text-zinc-400">
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
                className="w-full"
                variant={s1Status === 'open' ? 'default' : 'secondary'}
              >
                {logging === 1 ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                    Logging...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {s1Status === 'open' ? 'Log Session 1' : s1Status === 'upcoming' ? 'Not Yet' : 'Window Closed'}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`border-zinc-800 ${
              s2Status === 'open'
                ? 'window-open border-emerald-500/30'
                : s2Status === 'closed'
                ? 'opacity-60'
                : ''
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Session 2 {s2Status === 'open' ? '(Open)' : s2Status === 'upcoming' ? '(Upcoming)' : '(Closed)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-zinc-500">
                Window: {formatTime(profile?.session_2_start)} - {formatTime(profile?.session_2_end)}
              </p>

              {/* Photo upload */}
              {s2Status === 'open' && (
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                  <Camera className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs text-zinc-400">
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
                className="w-full"
                variant={s2Status === 'open' ? 'default' : 'secondary'}
              >
                {logging === 2 ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                    Logging...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {s2Status === 'open' ? 'Log Session 2' : s2Status === 'upcoming' ? 'Not Yet' : 'Window Closed'}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {(isSunday() || isRestDay) && (
        <Card className="border-zinc-800 bg-zinc-900/30">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-3">😴</div>
            <p className="text-zinc-400">
              {isSunday()
                ? "Rest day. Your streak is safe. The grind will be here tomorrow."
                : "The admin declared a rest day. Enjoy it while it lasts."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Watchouts */}
      {watchouts.length > 0 && (
        <Card className="border-red-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Watchouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {watchouts.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10"
              >
                <Avatar
                  src={w.user.photo_url}
                  alt={w.user.display_name}
                  fallback={w.user.display_name?.charAt(0)}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium">{w.user.display_name}</p>
                  <p className="text-xs text-zinc-400 sarcasm-text">{w.message}</p>
                </div>
                <span className="ml-auto text-lg">⚠️</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-zinc-800">
          <CardContent className="p-4 text-center">
            <Flame className="h-5 w-5 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.current_daily_streak ?? 0}</p>
            <p className="text-xs text-zinc-500">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-4 text-center">
            <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.current_weekly_streak ?? 0}</p>
            <p className="text-xs text-zinc-500">Week Streak</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.total_sessions ?? 0}</p>
            <p className="text-xs text-zinc-500">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800">
          <CardContent className="p-4 text-center">
            <XCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats?.missed_sessions ?? 0}</p>
            <p className="text-xs text-zinc-500">Missed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
