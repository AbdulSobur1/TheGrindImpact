'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/realtime-js';

interface FeedPost {
  id: string;
  user_id: string;
  type: string;
  created_at: string;
  [key: string]: any;
}

interface UseRealtimeFeedOptions {
  onNewPost?: (post: FeedPost) => void;
  onPostDeleted?: (postId: string) => void;
  throttleMs?: number;
}

/**
 * Hook for real-time feed updates using Supabase realtime
 * Automatically subscribes to feed_posts changes and triggers callbacks
 * Includes throttling to prevent excessive re-renders
 */
export function useRealtimeFeed(options: UseRealtimeFeedOptions = {}) {
  const { onNewPost, onPostDeleted, throttleMs = 1000 } = options;
  const supabaseRef = useRef(createBrowserClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  const handleNewPost = useCallback(
    (post: FeedPost) => {
      const now = Date.now();

      // Throttle updates to prevent excessive re-renders
      if (now - lastUpdateRef.current < throttleMs) {
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }
        throttleTimerRef.current = setTimeout(() => {
          onNewPost?.(post);
          lastUpdateRef.current = Date.now();
        }, throttleMs - (now - lastUpdateRef.current));
      } else {
        onNewPost?.(post);
        lastUpdateRef.current = now;
      }
    },
    [onNewPost, throttleMs]
  );

  useEffect(() => {
    const channel = supabaseRef.current
      .channel('feed_posts', {
        config: {
          broadcast: { self: false },
          presence: { key: 'feed_feed_users' },
        },
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        (payload: any) => {
          handleNewPost(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'feed_posts' },
        (payload: any) => {
          onPostDeleted?.(payload.old.id);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      supabaseRef.current.removeChannel(channel);
    };
  }, [handleNewPost, onPostDeleted]);

  return { isConnected };
}
