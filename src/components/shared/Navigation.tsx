'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth, useIsAdmin } from '@/hooks/useAuth';
import { logout } from '@/lib/actions';
import {
  LayoutDashboard,
  Newspaper,
  Trophy,
  Shield,
  User,
  Award,
  Bell,
  LogOut,
  Dumbbell,
  Menu,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';

const memberNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/badges', label: 'Badges', icon: Award },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const isAdmin = useIsAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const supabase = createBrowserClient();
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
      .then(({ count }) => setUnreadCount(count || 0));

    // Realtime subscription for new notifications
    const subscription = supabase
      .channel('notification_count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false)
            .then(({ count }) => setUnreadCount(count || 0));
        }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [user]);

  const navItems = isAdmin
    ? [...memberNavItems, { href: '/admin', label: 'Admin', icon: Shield }]
    : memberNavItems;

  return (
    <>
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-black/80 backdrop-blur-lg px-4 h-14 md:hidden">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-emerald-500" />
          <span className="font-bold text-sm">THE GRIND PACT</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-zinc-400 hover:text-zinc-100"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 border-r border-zinc-800 bg-black/95 backdrop-blur-lg transform transition-transform duration-200 md:translate-x-0 md:static md:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="font-bold text-sm">THE GRIND PACT</h1>
              <p className="text-xs text-zinc-500">No excuses.</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Notifications */}
          <div className="px-3 pb-2">
            <Link
              href="/feed"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200 relative"
            >
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>

          {/* User section */}
          <div className="border-t border-zinc-800 p-4 space-y-3">
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <Avatar
                src={profile?.photo_url}
                alt={profile?.display_name || ''}
                fallback={profile?.display_name?.charAt(0)}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.display_name || 'User'}
                </p>
                <p className="text-xs text-zinc-500 capitalize">{profile?.role}</p>
              </div>
            </Link>

            <form action={logout}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-zinc-400 hover:text-red-400"
                type="submit"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
