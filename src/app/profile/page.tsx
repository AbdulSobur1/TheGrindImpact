'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { getMemberStats } from '@/lib/actions';
import { formatTime } from '@/lib/utils';
import {
  User,
  Flame,
  Trophy,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  TrendingUp,
  Target,
  Award,
  Sparkles,
} from 'lucide-react';
import type { MemberStats } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile: currentProfile, loading } = useAuth();
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'badges'>('overview');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadStats(user.id);
    }
  }, [user]);

  async function loadStats(userId: string) {
    const data = await getMemberStats(userId);
    setStats(data as unknown as MemberStats);
  }

  if (loading || !stats) {
    return (
      <div className="space-y-6 md:space-y-8 animate-fade-in">
        {/* Profile header skeleton */}
        <div className="rounded-2xl border border-[#242424] bg-[#141414] overflow-hidden">
          <Skeleton className="h-28 w-full rounded-none" />
          <div className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14">
              <Skeleton className="h-20 w-20 rounded-full border-4 border-[#0D0D0D]" />
              <div className="flex-1 pt-14 sm:pt-0 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center space-y-1">
                    <Skeleton className="h-5 w-5 mx-auto rounded-full" />
                    <Skeleton className="h-6 w-8 mx-auto" />
                    <Skeleton className="h-3 w-14 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <hr className="hr-accent" />
        {/* Overview grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div className="rounded-2xl border border-[#242424] bg-[#141414] p-5 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl border border-[#242424] bg-[#141414] p-5 space-y-4">
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const profile = stats.profile;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Profile Header */}
      <Card className="border-[#242424] overflow-hidden">
        {/* Banner gradient */}
        <div className="h-28 bg-gradient-to-r from-[#FF5C00]/10 via-[#FF5C00]/5 to-transparent" />
        <CardContent className="relative px-5 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14">
            <Avatar
              src={profile.photo_url}
              alt={profile.display_name}
              fallback={profile.display_name?.charAt(0)}
              size="xl"
              className="border-4 border-[#0D0D0D] ring-2 ring-[#FF5C00]/20"
            />
            <div className="flex-1 pt-14 sm:pt-0">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">{profile.display_name}</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-[#999999] capitalize mt-1">{profile.role}</p>
            </div>
            <div className="flex gap-5">
              <div className="text-center space-y-1">
                <Flame className="h-5 w-5 text-[#FF9F0A] mx-auto" />
                <p className="text-xl font-black text-white">{stats.streaks?.current_daily_streak || 0}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#555555]">Day Streak</p>
              </div>
              <div className="text-center space-y-1">
                <Trophy className="h-5 w-5 text-[#C8FF00] mx-auto" />
                <p className="text-xl font-black text-white">{stats.streaks?.current_weekly_streak || 0}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#555555]">Week Streak</p>
              </div>
              <div className="text-center space-y-1">
                <Calendar className="h-5 w-5 text-[#34C759] mx-auto" />
                <p className="text-xl font-black text-white">{stats.total_days_active}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#555555]">Days Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview', 'history', 'badges'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      <hr className="hr-accent" />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {/* Session Windows */}
          <Card className="border-[#242424]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#FF5C00]">
                <Clock className="h-4 w-4" />
                Session Windows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">Session 1 (Morning)</p>
                </div>
                <p className="text-sm font-bold text-white">
                  {formatTime(profile.session_1_start)} — {formatTime(profile.session_1_end)}
                </p>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">Session 2 (Evening)</p>
                </div>
                <p className="text-sm font-bold text-white">
                  {formatTime(profile.session_2_start)} — {formatTime(profile.session_2_end)}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">Timezone:</span>
                <span className="text-xs font-bold text-[#999999]">{profile.timezone || 'UTC'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Best Records */}
          <Card className="border-[#242424]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#FF9F0A]">
                <Trophy className="h-4 w-4" />
                Best Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#FF9F0A]/5 border border-[#FF9F0A]/10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">Best Daily Streak</p>
                  <p className="text-lg font-black text-[#FF9F0A]">{stats.best_streak_ever} days</p>
                </div>
                <Flame className="h-6 w-6 text-[#FF9F0A]" />
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#C8FF00]/5 border border-[#C8FF00]/10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">Best Weekly Streak</p>
                  <p className="text-lg font-black text-[#C8FF00]">{stats.streaks?.best_weekly_streak || 0} weeks</p>
                </div>
                <TrendingUp className="h-6 w-6 text-[#C8FF00]" />
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#34C759]/5 border border-[#34C759]/10">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">Total Days Active</p>
                  <p className="text-lg font-black text-[#34C759]">{stats.total_days_active} days</p>
                </div>
                <Target className="h-6 w-6 text-[#34C759]" />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card className="border-[#242424] md:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#999999]">
                Weekly Progress (Last 4 Weeks)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.weekly_history.length > 0 ? (
                stats.weekly_history.map((week, i) => {
                  const total = week.completed + week.missed;
                  const pct = total > 0 ? Math.round((week.completed / total) * 100) : 0;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#999999]">
                          Week of {week.week?.substring(5) || '...'}
                        </span>
                        <span className="text-xs font-bold text-[#FF5C00]">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#242424] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#FF5C00] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-[#34C759] font-bold">✅ {week.completed}</span>
                        <span className="text-[#FF3B30] font-bold">❌ {week.missed}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[#999999] font-medium text-center py-4">No weekly data yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className="border-[#242424]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#999999]">
              Session Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.session_log.length > 0 ? (
              stats.session_log.slice(0, 30).map((day, i) => (
                <div
                  key={day.date}
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    i > 0 ? 'border-t border-[#242424]' : ''
                  } hover:bg-[#1A1A1A]/50 transition-colors`}
                >
                  <span className="text-sm font-bold text-white">{day.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-[10px] uppercase tracking-widest text-[#555555]">S1</span>
                      {day.session_1?.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-[#34C759]" />
                      ) : day.session_1?.status === 'late' ? (
                        <Clock className="h-4 w-4 text-[#FF9F0A]" />
                      ) : day.session_1?.status === 'missed' ? (
                        <XCircle className="h-4 w-4 text-[#FF3B30]" />
                      ) : (
                        <span className="text-[#555555]">—</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <span className="text-[10px] uppercase tracking-widest text-[#555555]">S2</span>
                      {day.session_2?.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-[#34C759]" />
                      ) : day.session_2?.status === 'late' ? (
                        <Clock className="h-4 w-4 text-[#FF9F0A]" />
                      ) : day.session_2?.status === 'missed' ? (
                        <XCircle className="h-4 w-4 text-[#FF3B30]" />
                      ) : (
                        <span className="text-[#555555]">—</span>
                      )}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                    <Clock className="h-8 w-8 text-[#555555]" />
                  </div>
                </div>
                <p className="text-lg font-black uppercase tracking-tight text-white mb-1">No sessions yet</p>
                <p className="text-sm text-[#999999] font-medium">Start your first session to begin tracking.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {stats.badges.length > 0 ? (
            stats.badges.map((mb) => (
              <Card key={mb.id} className={`border-[#242424] transition-all duration-200 hover:scale-[1.02] ${mb.badge?.type === 'exclusive' ? 'badge-exclusive' : ''}`}>
                <CardContent className="p-5 text-center space-y-2">
                  <span className="text-4xl block mb-2">{mb.badge?.emoji || '🏅'}</span>
                  <p className="text-xs font-bold text-white">{mb.badge?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-[#999999] font-medium mt-1">{mb.badge?.description || ''}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                  <Award className="h-8 w-8 text-[#555555]" />
                </div>
              </div>
              <p className="text-lg font-black uppercase tracking-tight text-white mb-1">No badges yet</p>
              <p className="text-sm text-[#999999] font-medium">Get grinding to earn your first one.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
