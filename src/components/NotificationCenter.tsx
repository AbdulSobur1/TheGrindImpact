'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bell,
  Award,
  Trophy,
  Zap,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationItem extends Notification {
  icon?: React.ReactNode;
  color?: string;
}

/**
 * NotificationCenter Component
 * Displays real-time notifications from Supabase with proper categorization
 * Supports marking as read and automatic dismissal
 */
export function NotificationCenter() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [displayNotifications, setDisplayNotifications] = useState<NotificationItem[]>([]);

  const { isConnected, unreadCount, markAsRead, markAllAsRead } = useNotifications({
    userId: user?.id || '',
    onNewNotification: (notification) => {
      const enriched = enrichNotification(notification);
      setNotifications((prev) => [enriched, ...prev].slice(0, 50));
      setDisplayNotifications((prev) => [enriched, ...prev].slice(0, 5));
    },
  });

  useEffect(() => {
    // Auto-hide notification after 5 seconds
    if (displayNotifications.length === 0) return;

    const timer = setTimeout(() => {
      setDisplayNotifications((prev) => prev.slice(1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [displayNotifications]);

  const enrichNotification = (n: Notification): NotificationItem => {
    let icon = <Bell size={20} />;
    let color = 'bg-blue-950';

    switch (n.type) {
      case 'badge':
        icon = <Award size={20} />;
        color = 'bg-yellow-950';
        break;
      case 'mvp':
        icon = <Trophy size={20} />;
        color = 'bg-purple-950';
        break;
      case 'callout':
        icon = <AlertCircle size={20} />;
        color = 'bg-red-950';
        break;
      case 'streak':
        icon = <Zap size={20} />;
        color = 'bg-orange-950';
        break;
      case 'achievement':
        icon = <CheckCircle2 size={20} />;
        color = 'bg-emerald-950';
        break;
    }

    return { ...n, icon, color };
  };

  if (!user) return null;

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {displayNotifications.map((notif) => (
          <div
            key={notif.id}
            className={`${notif.color} border border-opacity-50 rounded-lg p-4 shadow-lg animate-slide-up pointer-events-auto max-w-sm`}
          >
            <div className="flex gap-3 items-start">
              <div className="text-yellow-400 flex-shrink-0">{notif.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{notif.message}</p>
              </div>
              <button
                onClick={() => setDisplayNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Bell Button */}
      <button
        onClick={() => setVisible(!visible)}
        className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <Bell size={20} className="text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {visible && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setVisible(false)} />
      )}

      <div
        className={`fixed md:absolute top-14 right-0 w-full md:w-96 max-h-96 overflow-y-auto z-50 transition-all duration-300 ${
          visible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-[-20px] opacity-0 pointer-events-none'
        } md:top-full md:translate-y-2`}
      >
        <Card className="bg-slate-900 border-slate-700 rounded-none md:rounded-lg">
          <CardHeader className="border-b border-slate-700 flex-row items-center justify-between">
            <CardTitle className="text-white">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="ghost"
                size="sm"
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      notif.read ? 'opacity-60' : 'bg-slate-800/30'
                    }`}
                    onClick={() => {
                      if (!notif.read) markAsRead(notif.id);
                    }}
                  >
                    <div className="flex gap-3 items-start">
                      <div
                        className={`mt-0.5 flex-shrink-0 ${
                          notif.type === 'badge'
                            ? 'text-yellow-400'
                            : notif.type === 'mvp'
                              ? 'text-purple-400'
                              : notif.type === 'callout'
                                ? 'text-red-400'
                                : notif.type === 'streak'
                                  ? 'text-orange-400'
                                  : 'text-blue-400'
                        }`}
                      >
                        {notif.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white break-words">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
