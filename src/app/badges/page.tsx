'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Award, Lock, Check, Grid3X3, Sparkles, Trophy } from 'lucide-react';
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
        <div className="animate-spin h-6 w-6 border-2 border-[#FF5C00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white">BADGES</h1>
        <p className="text-[#999999] text-sm font-medium mt-1">
          {earnedCount}/{allBadges.length} earned. Keep grinding.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-widest text-[#999999]">Collection Progress</span>
          <span className="font-bold text-[#FF5C00]">{Math.round((earnedCount / Math.max(allBadges.length, 1)) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#242424] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF5C00] to-[#FF8C38] transition-all duration-700 ease-out shadow-[0_0_12px_rgba(255,92,0,0.15)]"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {filteredBadges.map((badge) => {
          const owned = myBadges.has(badge.slug);
          return (
            <Card
              key={badge.slug}
              className={`border-[#242424] transition-all duration-300 ${
                owned
                  ? badge.type === 'exclusive'
                    ? 'badge-exclusive hover:scale-[1.02]'
                    : 'border-[#FF5C00]/15 hover:shadow-[0_0_20px_rgba(255,92,0,0.08)]'
                  : 'opacity-40 grayscale hover:opacity-70 hover:grayscale-[50%]'
              } hover:scale-[1.02]`}
            >
              <CardContent className="p-5 text-center space-y-2">
                <div className="relative inline-block mb-2">
                  <span className="text-4xl block">{badge.emoji}</span>
                  {owned && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#FF5C00] flex items-center justify-center shadow-[0_0_8px_rgba(255,92,0,0.3)]">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {!owned && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#242424] flex items-center justify-center">
                      <Lock className="h-3 w-3 text-[#555555]" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-bold text-white">{badge.name}</p>
                <p className="text-[10px] text-[#999999] font-medium mt-1 leading-relaxed">{badge.description}</p>
                <span
                  className={`inline-block mt-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    badge.type === 'exclusive'
                      ? 'bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20'
                      : 'bg-[#1A1A1A] text-[#999999] border border-[#242424]'
                  }`}
                >
                  {badge.type}
                </span>
              </CardContent>
            </Card>
          );
        })}

        {filteredBadges.length === 0 && (
          <div className="col-span-full py-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                <Award className="h-8 w-8 text-[#555555]" />
              </div>
            </div>
            <p className="text-lg font-black uppercase tracking-tight text-white mb-1">No badges found</p>
            <p className="text-sm text-[#999999] font-medium">Check back for new badges.</p>
          </div>
        )}
      </div>
    </div>
  );
}
