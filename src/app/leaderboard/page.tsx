'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getLeaderboard } from '@/lib/actions';
import { Trophy, Flame, Medal, Crown, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';

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
    if (rank === 1) return <Crown className="h-5 w-5 text-[#FF9500]" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-[#A3A3A3]" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-[#CD7F32]" />;
    return null;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-[#FF9500]/5 border-[#FF9500]/20';
    if (rank === 2) return 'bg-[#A3A3A3]/5 border-[#A3A3A3]/15';
    if (rank === 3) return 'bg-[#CD7F32]/5 border-[#CD7F32]/15';
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-[#C8FF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">LEADERBOARD</h1>
        <p className="text-[#888888] text-sm font-medium mt-1">Ranked by streak. No sympathy.</p>
      </div>

      <Separator />

      <Card className="border-[#222222] overflow-hidden">
        <CardHeader className="pb-0">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-[#FF9500]">
            <Trophy className="h-4 w-4" />
            The Pecking Order
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table header - desktop only */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#666666] border-b border-[#222222]">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Member</div>
            <div className="col-span-2 text-center">Streak</div>
            <div className="col-span-2 text-center">Weekly</div>
            <div className="col-span-2 text-center">Total</div>
            <div className="col-span-2 text-center">Weekly %</div>
          </div>

          {entries.map((entry) => (
            <div
              key={entry.member.user_id}
              className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center border-t border-[#222222] transition-all duration-200 hover:bg-[#1C1C1C]/50 ${getRankBg(entry.rank)}`}
            >
              {/* Mobile layout */}
              <div className="flex items-center gap-3 md:col-span-4">
                <div className="col-span-1 flex items-center justify-center w-8 h-8 rounded-xl bg-[#1C1C1C] border border-[#222222]">
                  {getRankIcon(entry.rank) || (
                    <span className="text-sm font-black text-[#666666]">{entry.rank}</span>
                  )}
                </div>
                <div className="col-span-3 flex items-center gap-3">
                  <Avatar
                    src={entry.member.photo_url}
                    alt={entry.member.display_name}
                    fallback={entry.member.display_name?.charAt(0)}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#F5F5F5]">{entry.member.display_name}</p>
                    {entry.rank === 1 && (
                      <Badge variant="gold" className="text-[9px] px-2 py-0.5 mt-1">
                        👑 Weekly MVP
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop stats */}
              <div className="hidden md:flex col-span-2 items-center justify-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-[#FF9500]" />
                <span className="text-sm font-black text-[#F5F5F5]">{entry.current_streak}</span>
              </div>
              <div className="hidden md:flex col-span-2 items-center justify-center">
                <span className="text-sm font-bold text-[#F5F5F5]">{entry.weekly_streak}</span>
              </div>
              <div className="hidden md:flex col-span-2 items-center justify-center gap-1">
                <span className="text-sm font-bold text-[#F5F5F5]">{entry.total_sessions}</span>
                <span className="text-[10px] text-[#666666] font-medium">
                  ({entry.missed_sessions} missed)
                </span>
              </div>
              <div className="hidden md:flex col-span-2 items-center justify-center">
                <span className={`text-sm font-black ${
                  entry.weekly_percentage >= 80
                    ? 'text-[#30D158]'
                    : entry.weekly_percentage >= 50
                    ? 'text-[#FF9500]'
                    : 'text-[#FF3B30]'
                }`}>
                  {entry.weekly_percentage}%
                </span>
              </div>

              {/* Mobile stats row */}
              <div className="flex gap-3 md:hidden mt-2">
                <span className="flex items-center gap-1 text-xs text-[#888888] font-medium">
                  <Flame className="h-3 w-3 text-[#FF9500]" /> {entry.current_streak}
                </span>
                <span className={`text-xs font-bold ${
                  entry.weekly_percentage >= 80
                    ? 'text-[#30D158]'
                    : entry.weekly_percentage >= 50
                    ? 'text-[#FF9500]'
                    : 'text-[#FF3B30]'
                }`}>
                  {entry.weekly_percentage}%
                </span>
                <span className="text-xs text-[#888888] font-medium">
                  🏋️ {entry.total_sessions}
                </span>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="py-16 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-[#666666]" />
                </div>
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-tight text-[#F5F5F5] mb-1">No members yet</p>
                <p className="text-sm text-[#888888] font-medium">Invite some!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
