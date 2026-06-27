'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getLeaderboard } from '@/lib/actions';
import { Trophy, Flame, Medal, Crown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  member: { user_id: string; display_name: string; photo_url: string | null };
  current_streak: number;
  weekly_streak: number;
  total_sessions: number;
  missed_sessions: number;
  weekly_percentage: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user]);

  async function loadLeaderboard() {
    const data = await getLeaderboard();
    setEntries(data as unknown as LeaderboardEntry[]);
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-zinc-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm text-zinc-500 w-5 text-center">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Ranked by streak. No sympathy.</p>
      </div>

      <Separator />

      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            The Pecking Order
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs text-zinc-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Member</div>
            <div className="col-span-2 text-center">Streak</div>
            <div className="col-span-2 text-center">Weekly</div>
            <div className="col-span-2 text-center">Total</div>
            <div className="col-span-2 text-center">Weekly %</div>
          </div>

          {entries.map((entry, index) => (
            <div
              key={entry.member.user_id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center border-t border-zinc-800 ${
                entry.rank <= 3 ? 'bg-yellow-500/5' : ''
              } hover:bg-zinc-800/30 transition-colors`}
            >
              {/* Mobile view */}
              <div className="flex items-center gap-3 md:col-span-4 md:contents">
                <div className="col-span-1 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="col-span-3 flex items-center gap-3">
                  <Avatar
                    src={entry.member.photo_url}
                    alt={entry.member.display_name}
                    fallback={entry.member.display_name?.charAt(0)}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium">{entry.member.display_name}</p>
                    {entry.rank === 1 && (
                      <Badge variant="gold" className="text-[10px]">
                        👑 Weekly MVP
                      </Badge>
                    )}
                    <div className="flex gap-2 mt-1 md:hidden">
                      <span className="text-xs text-zinc-500">
                        <Flame className="h-3 w-3 inline text-orange-500" /> {entry.current_streak}
                      </span>
                      <span className="text-xs text-zinc-500">
                        📊 {entry.weekly_percentage}%
                      </span>
                      <span className="text-xs text-zinc-500">
                        🏋️ {entry.total_sessions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop columns */}
              <div className="hidden md:block col-span-2 text-center">
                <span className="flex items-center justify-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {entry.current_streak}
                </span>
              </div>
              <div className="hidden md:block col-span-2 text-center text-sm">
                {entry.weekly_streak}
              </div>
              <div className="hidden md:block col-span-2 text-center text-sm">
                {entry.total_sessions}
                <span className="text-zinc-600 text-xs ml-1">
                  ({entry.missed_sessions} missed)
                </span>
              </div>
              <div className="hidden md:block col-span-2 text-center">
                <span
                  className={`text-sm font-medium ${
                    entry.weekly_percentage >= 80
                      ? 'text-emerald-400'
                      : entry.weekly_percentage >= 50
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {entry.weekly_percentage}%
                </span>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="p-12 text-center">
              <Trophy className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No members yet. Invite some!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
