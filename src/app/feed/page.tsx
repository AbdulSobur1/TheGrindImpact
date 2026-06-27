'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { getFeedPosts, addReaction, createCallout } from '@/lib/actions';
import { formatTime } from '@/lib/utils';
import { Newspaper, ThumbsUp, AlertTriangle, RefreshCw, ChevronDown, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { FeedPost, Profile, CalloutReason } from '@/types';

const EMOJIS = ['💪', '🔥', '😂', '👀'];

function FeedCard({ post, onReact, onCallout }: { post: FeedPost; onReact: (emoji: string) => void; onCallout?: (userId: string) => void }) {
  const isMissed = post.type === 'missed';
  const isSystem = post.type === 'system' || post.type === 'badge' || post.type === 'mvp';

  const reactionCounts = post.reactions
    ? Object.entries(post.reactions as Record<string, string[]>).reduce(
        (acc, [emoji, users]) => {
          acc[emoji] = users.length;
          return acc;
        },
        {} as Record<string, number>
      )
    : {};

  return (
    <Card
      className={`border-[#242424] transition-all duration-200 hover:border-[#3F3F3F] hover:scale-[1.01] ${
        isMissed ? 'border-[#FF3B30]/20 bg-[#FF3B30]/3' : ''
      } ${isSystem ? 'border-[#FF5C00]/15 bg-[#FF5C00]/3' : ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {!isSystem ? (
            <Avatar
              src={post.profile?.photo_url}
              alt={post.profile?.display_name || ''}
              fallback={post.profile?.display_name?.charAt(0)}
              size="md"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#FF5C00]/10 flex items-center justify-center shrink-0 border border-[#FF5C00]/20">
              <span className="text-lg">📢</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {!isSystem ? (
                <span className="font-bold text-sm text-white">{post.profile?.display_name || 'Unknown'}</span>
              ) : (
                <span className="font-bold text-sm text-[#FF5C00]">THE GRIND PACT</span>
              )}
              <span className="text-xs text-[#555555] font-medium">
                {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {post.type === 'callout' && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
                  Callout
                </span>
              )}
              {post.type === 'badge' && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20">
                  Badge
                </span>
              )}
              {post.type === 'mvp' && (
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] border border-[#FF9F0A]/20">
                  👑 MVP
                </span>
              )}
            </div>

            {post.sarcasm_message && (
              <p
                className={`text-sm font-medium leading-relaxed ${
                  isMissed
                    ? 'text-[#FF3B30]/80'
                    : isSystem
                    ? 'text-[#FF5C00]/80'
                    : 'text-[#B3B3B3]'
                } ${post.type === 'completed' || post.type === 'missed' ? 'sarcasm-text' : ''}`}
              >
                {post.sarcasm_message}
              </p>
            )}

            {/* Reactions */}
            {!isSystem && (
              <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                {EMOJIS.map((emoji) => {
                  const count = reactionCounts[emoji] || 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact(emoji)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        count > 0
                          ? 'bg-[#1A1A1A] border border-[#242424] hover:bg-[#242424]'
                          : 'hover:bg-[#1A1A1A] opacity-40 hover:opacity-100 border border-transparent hover:border-[#242424]'
                      }`}
                    >
                      <span className="text-sm">{emoji}</span>
                      {count > 0 && <span className="text-[#999999]">{count}</span>}
                    </button>
                  );
                })}

                {/* Callout button */}
                {post.profile && onCallout && (
                  <button
                    onClick={() => onCallout(post.profile!.user_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all duration-200 ml-auto border border-transparent hover:border-[#FF3B30]/20"
                    title="Call out this member"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Call Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CALLOUT_REASONS = ['Slacking', 'Missing Sessions', 'Too Quiet', 'Just Because'] as const;

export default function FeedPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [calloutTarget, setCalloutTarget] = useState<string | null>(null);
  const [calloutReason, setCalloutReason] = useState<string>('Slacking');
  const [calloutError, setCalloutError] = useState('');
  const [calloutMessage, setCalloutMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadPosts = useCallback(async () => {
    const data = await getFeedPosts(50);
    setPosts(data as FeedPost[]);
  }, []);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user, loadPosts]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const supabase = createBrowserClient();
    const subscription = supabase
      .channel('feed_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadPosts]);

  async function handleReact(postId: string, emoji: string) {
    await addReaction(postId, emoji);
    await loadPosts();
  }

  async function handleCallout(targetId: string) {
    setCalloutTarget(targetId);
    setCalloutReason('Slacking');
    setCalloutError('');
    setCalloutMessage('');
  }

  async function submitCallout() {
    if (!calloutTarget) return;
    setCalloutError('');
    setCalloutMessage('');
    const result = await createCallout(calloutTarget, calloutReason as CalloutReason);
    if (result.error) {
      setCalloutError(result.error);
    } else {
      setCalloutMessage(result.message || 'Callout posted!');
      setCalloutTarget(null);
      setTimeout(() => setCalloutMessage(''), 3000);
      loadPosts();
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadPosts();
    setTimeout(() => setRefreshing(false), 500);
  }

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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white">FEED</h1>
          <p className="text-[#999999] text-sm font-medium mt-1">See what the Pact is up to</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'REFRESHING...' : 'REFRESH'}
        </Button>
      </div>

      <hr className="hr-accent" />

      {posts.length === 0 ? (
        <Card className="border-[#242424]">
          <CardContent className="py-16 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                <Newspaper className="h-8 w-8 text-[#555555]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">No activity yet</h3>
              <p className="text-sm text-[#999999] font-medium">
                Check-ins, callouts, and achievements will show up here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {calloutMessage && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#34C759]/15 bg-[#34C759]/8 text-[#34C759] text-sm font-medium animate-slide-up">
              <span>✅</span>
              {calloutMessage}
            </div>
          )}

          {/* Callout dialog */}
          {calloutTarget && (
            <Card className="border-[#FF3B30]/20 bg-[#FF3B30]/3 animate-slide-up">
              <CardContent className="p-5">
                <p className="text-sm font-bold uppercase tracking-wider text-[#FF3B30] mb-4">
                  Call out this member — why?
                </p>
                <div className="relative mb-4">
                  <select
                    id="callout-reason"
                    name="callout_reason"
                    value={calloutReason}
                    onChange={(e) => setCalloutReason(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#242424] bg-[#141414] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FF5C00] focus:border-transparent appearance-none"
                    aria-label="Callout reason"
                  >
                    {CALLOUT_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#999999] pointer-events-none" />
                </div>
                {calloutError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF3B30]/8 border border-[#FF3B30]/15 mb-4">
                    <p className="text-sm text-[#FF3B30] font-medium">{calloutError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={submitCallout} className="h-10 px-5">
                    CALL OUT
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCalloutTarget(null)} className="h-10 px-5">
                    CANCEL
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {posts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              onReact={(emoji) => handleReact(post.id, emoji)}
              onCallout={post.profile ? () => handleCallout(post.profile!.user_id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
