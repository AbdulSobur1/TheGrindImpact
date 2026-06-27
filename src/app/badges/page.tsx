'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Award, Lock, Check } from 'lucide-react';
import type { Badge, MemberBadge } from '@/types';

export default function BadgesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'universal' | 'exclusive'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  async function loadBadges() {
    const supabase = createBrowserClient();

    const { data: badges } = await supabase.from('badges').select('*').order('type');
    setAllBadges((badges as Badge[]) || []);

    const { data: memberBadges } = await supabase
      .from('member_badges')
      .select('badge_slug')
      .eq('user_id', user!.id);

    const owned = new Set((memberBadges as MemberBadge[])?.map((mb) => mb.badge_slug) || []);
    setMyBadges(owned);
  }

  const filteredBadges = allBadges.filter((badge) => {
    if (filter === 'all') return true;
    return badge.type === filter;
  });

  const earnedCount = allBadges.filter((b) => myBadges.has(b.slug)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Badges</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {earnedCount}/{allBadges.length} earned. Keep grinding.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${(earnedCount / Math.max(allBadges.length, 1)) * 100}%` }}
        />
      </div>

      <div className="flex gap-2">
        {(['all', 'universal', 'exclusive'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <Separator />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredBadges.map((badge) => {
          const owned = myBadges.has(badge.slug);
          return (
            <Card
              key={badge.slug}
              className={`border-zinc-800 transition-all duration-200 ${
                owned
                  ? badge.type === 'exclusive'
                    ? 'badge-exclusive'
                    : 'border-emerald-500/20'
                  : 'opacity-60 grayscale'
              } hover:opacity-100 hover:grayscale-0`}
            >
              <CardContent className="p-4 text-center">
                <div className="relative">
                  <span className="text-4xl block mb-3">{badge.emoji}</span>
                  {owned && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-black" />
                    </div>
                  )}
                  {!owned && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center">
                      <Lock className="h-3 w-3 text-zinc-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium">{badge.name}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{badge.description}</p>
                <span
                  className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${
                    badge.type === 'exclusive'
                      ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {badge.type}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
