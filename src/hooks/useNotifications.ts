'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/realtime-js';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  [key: string]: any;
}

interface UseNotificationsOptions {
  userId: string;
  onNewNotification?: (notification: Notification) => void;
  onNotificationRead?: (notificationId: string) => void;
}

/**
 * Hook for real-time notifications
 * Subscribes to user's notifications and handles reading/marking
 */
export function useNotifications(options: UseNotificationsOptions) {
  const { userId, onNewNotification, onNotificationRead } = options;
  const supabaseRef = useRef(createBrowserClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
      onNewNotification?.(notification);
    },
    [onNewNotification]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    const supabase = supabaseRef.current;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      onNotificationRead?.(notificationId);
    }
  }, [onNotificationRead]);

  const markAllAsRead = useCallback(async () => {
    const supabase = supabaseRef.current;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (!error) {
      setUnreadCount(0);
    }
  }, [userId]);

  useEffect(() => {
    const channel = supabaseRef.current
      .channel(`notifications:${userId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          handleNewNotification(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          // Handle notification status updates
          if (payload.new.read && !payload.old.read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [userId, handleNewNotification]);

  return {
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
