'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const profile = stats.profile;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-zinc-800 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-500/20 to-blue-500/20" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            <Avatar
              src={profile.photo_url}
              alt={profile.display_name}
              fallback={profile.display_name?.charAt(0)}
              size="xl"
              className="border-4 border-black"
            />
            <div className="flex-1 pt-12 sm:pt-0">
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <p className="text-sm text-zinc-400 capitalize">{profile.role}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{stats.streaks?.current_daily_streak || 0}</p>
                <p className="text-xs text-zinc-500">Day Streak</p>
              </div>
              <div className="text-center">
                <Trophy className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{stats.streaks?.current_weekly_streak || 0}</p>
                <p className="text-xs text-zinc-500">Week Streak</p>
              </div>
              <div className="text-center">
                <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold">{stats.total_days_active}</p>
                <p className="text-xs text-zinc-500">Days Active</p>
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

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Windows */}
          <Card className="border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                Session Windows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Session 1 (Morning)</p>
                <p className="text-sm">
                  {formatTime(profile.session_1_start)} - {formatTime(profile.session_1_end)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Session 2 (Evening)</p>
                <p className="text-sm">
                  {formatTime(profile.session_2_start)} - {formatTime(profile.session_2_end)}
                </p>
              </div>
              <p className="text-xs text-zinc-500">Timezone: {profile.timezone || 'UTC'}</p>
            </CardContent>
          </Card>

          {/* Best Streaks */}
          <Card className="border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Best Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Best Daily Streak</p>
                <p className="text-lg font-bold">{stats.best_streak_ever} days</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Best Weekly Streak</p>
                <p className="text-lg font-bold">{stats.streaks?.best_weekly_streak || 0} weeks</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Total Days Active</p>
                <p className="text-lg font-bold">{stats.total_days_active} days</p>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card className="border-zinc-800 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Weekly Progress (Last 4 Weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.weekly_history.map((week, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-24">
                      Week of {week.week?.substring(5) || '...'}
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${week.completed + week.missed > 0
                            ? (week.completed / (week.completed + week.missed)) * 100
                            : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-16 text-right">
                      {week.completed}/{week.completed + week.missed}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Session Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {stats.session_log.slice(0, 30).map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between px-6 py-3 border-t border-zinc-800"
              >
                <span className="text-sm">{day.date}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs">
                    S1:{' '}
                    {day.session_1?.status === 'completed' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : day.session_1?.status === 'late' ? (
                      <Clock className="h-3.5 w-3.5 text-yellow-500" />
                    ) : day.session_1?.status === 'missed' ? (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    S2:{' '}
                    {day.session_2?.status === 'completed' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : day.session_2?.status === 'late' ? (
                      <Clock className="h-3.5 w-3.5 text-yellow-500" />
                    ) : day.session_2?.status === 'missed' ? (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {stats.badges.map((mb) => (
            <Card key={mb.id} className={`border-zinc-800 ${mb.badge?.type === 'exclusive' ? 'badge-exclusive' : ''}`}>
              <CardContent className="p-4 text-center">
                <span className="text-3xl block mb-2">{mb.badge?.emoji || '🏅'}</span>
                <p className="text-xs font-medium">{mb.badge?.name || 'Unknown'}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{mb.badge?.description || ''}</p>
              </CardContent>
            </Card>
          ))}
          {stats.badges.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-zinc-500">No badges earned yet. Get grinding.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
