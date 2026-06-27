'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/realtime-js';

interface LeaderboardUpdate {
  userId: string;
  previousRank?: number;
  newRank: number;
  streak: number;
}

interface UseRealtimeLeaderboardOptions {
  onStreakUpdate?: (update: LeaderboardUpdate) => void;
  throttleMs?: number;
}

/**
 * Hook for real-time leaderboard updates
 * Subscribes to streaks table changes and notifies when rankings change
 * Includes throttling to prevent excessive updates
 */
export function useRealtimeLeaderboard(options: UseRealtimeLeaderboardOptions = {}) {
  const { onStreakUpdate, throttleMs = 2000 } = options;
  const supabaseRef = useRef(createBrowserClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  const handleStreakUpdate = useCallback(
    (update: LeaderboardUpdate) => {
      const now = Date.now();

      // Throttle to prevent excessive re-renders (max 1 update per 2 seconds)
      if (now - lastUpdateRef.current < throttleMs) {
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }
        throttleTimerRef.current = setTimeout(() => {
          onStreakUpdate?.(update);
          lastUpdateRef.current = Date.now();
        }, throttleMs - (now - lastUpdateRef.current));
      } else {
        onStreakUpdate?.(update);
        lastUpdateRef.current = now;
      }
    },
    [onStreakUpdate, throttleMs]
  );

  useEffect(() => {
    const channel = supabaseRef.current
      .channel('realtime_streaks', {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'streaks' },
        (payload: any) => {
          const { new: newData, old: oldData } = payload;

          // Notify about streak change
          handleStreakUpdate({
            userId: newData.user_id,
            streak: newData.current_daily_streak,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'check_ins' },
        (payload: any) => {
          // When a new check-in is created, streaks will likely be updated
          // This is just a fallback in case we need to react to check-ins directly
          handleStreakUpdate({
            userId: payload.new.user_id,
            streak: 0, // Will be updated when streak table updates
          });
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
  }, [handleStreakUpdate]);

  return { isConnected };
}
