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
import { Newspaper, ThumbsUp, AlertTriangle } from 'lucide-react';
import type { FeedPost, Profile, CalloutReason } from '@/types';
import { Separator } from '@/components/ui/separator';

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
      className={`border-zinc-800 transition-all duration-200 hover:border-zinc-700 ${
        isMissed ? 'border-red-500/20 bg-red-500/5' : ''
      } ${isSystem ? 'border-yellow-500/20 bg-yellow-500/5' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {!isSystem ? (
            <Avatar
              src={post.profile?.photo_url}
              alt={post.profile?.display_name || ''}
              fallback={post.profile?.display_name?.charAt(0)}
              size="md"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
              <span className="text-lg">📢</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!isSystem ? (
                <span className="font-medium text-sm">{post.profile?.display_name || 'Unknown'}</span>
              ) : (
                <span className="font-medium text-sm text-yellow-400">The Grind Pact</span>
              )}
              <span className="text-xs text-zinc-600">
                {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {post.type === 'callout' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  Callout
                </span>
              )}
              {post.type === 'badge' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  Badge
                </span>
              )}
              {post.type === 'mvp' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  👑 MVP
                </span>
              )}
            </div>

            {post.sarcasm_message && (
              <p
                className={`text-sm ${
                  isMissed
                    ? 'text-red-300'
                    : isSystem
                    ? 'text-yellow-300'
                    : 'text-zinc-300'
                } ${post.type === 'completed' || post.type === 'missed' ? 'sarcasm-text' : ''}`}
              >
                {post.sarcasm_message}
              </p>
            )}

            {/* Reactions */}
            {!isSystem && (
              <div className="flex items-center gap-1 mt-3 flex-wrap">
                {EMOJIS.map((emoji) => {
                  const count = reactionCounts[emoji] || 0;
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact(emoji)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all duration-200 ${
                        post.reactions && (post.reactions as Record<string, string[]>)[emoji]?.length
                          ? 'bg-zinc-700/50 hover:bg-zinc-700'
                          : 'hover:bg-zinc-800/50 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span className="text-zinc-400">{count}</span>}
                    </button>
                  );
                })}

                {/* Callout button */}
                {post.profile && onCallout && (
                  <button
                    onClick={() => onCallout(post.profile!.user_id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-400 hover:bg-red-500/10 transition-all duration-200 ml-auto"
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
        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feed</h1>
          <p className="text-zinc-400 text-sm mt-1">See what the Pact is up to</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Separator />

      {posts.length === 0 ? (
        <Card className="border-zinc-800">
          <CardContent className="p-12 text-center">
            <Newspaper className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-sm text-zinc-500">
              Check-ins, callouts, and achievements will show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {calloutMessage && (
            <div className="px-4 py-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
              {calloutMessage}
            </div>
          )}

          {/* Callout dialog */}
          {calloutTarget && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">
                  Call out this member — why?
                </p>
                <select
                  value={calloutReason}
                  onChange={(e) => setCalloutReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 mb-3"
                >
                  {CALLOUT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {calloutError && (
                  <p className="text-sm text-red-400 mb-3">{calloutError}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={submitCallout}>
                    Call Out
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCalloutTarget(null)}>
                    Cancel
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
