'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Award, Lock, Check, Grid3X3, Sparkles } from 'lucide-react';
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
        <div className="animate-spin h-6 w-6 border-2 border-[#C8FF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">BADGES</h1>
        <p className="text-[#888888] text-sm font-medium mt-1">
          {earnedCount}/{allBadges.length} earned. Keep grinding.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-widest text-[#888888]">Collection Progress</span>
          <span className="font-bold text-[#C8FF00]">{Math.round((earnedCount / Math.max(allBadges.length, 1)) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#222222] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#C8FF00] to-[#A8D800] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(200,255,0,0.15)]"
            style={{ width: `${(earnedCount / Math.max(allBadges.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Filter tabs */}
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

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredBadges.map((badge) => {
          const owned = myBadges.has(badge.slug);
          return (
            <Card
              key={badge.slug}
              className={`border-[#222222] transition-all duration-300 ${
                owned
                  ? badge.type === 'exclusive'
                    ? 'badge-exclusive hover:scale-[1.02]'
                    : 'border-[#C8FF00]/15 hover:shadow-[0_0_20px_rgba(200,255,0,0.08)]'
                  : 'opacity-40 grayscale hover:opacity-70 hover:grayscale-[50%]'
              } hover:scale-[1.02]`}
            >
              <CardContent className="p-5 text-center">
                <div className="relative inline-block mb-3">
                  <span className="text-4xl block">{badge.emoji}</span>
                  {owned && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#C8FF00] flex items-center justify-center shadow-[0_0_8px_rgba(200,255,0,0.3)]">
                      <Check className="h-3 w-3 text-[#080808]" />
                    </div>
                  )}
                  {!owned && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#222222] flex items-center justify-center">
                      <Lock className="h-3 w-3 text-[#666666]" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-[#F5F5F5]">{badge.name}</p>
                <p className="text-[10px] text-[#888888] font-medium mt-1 leading-relaxed">{badge.description}</p>
                <span
                  className={`inline-block mt-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    badge.type === 'exclusive'
                      ? 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20'
                      : 'bg-[#1C1C1C] text-[#888888] border border-[#222222]'
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
