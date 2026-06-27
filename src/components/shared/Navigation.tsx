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
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-[#222222] bg-[#080808]/90 backdrop-blur-xl px-4 h-14 md:hidden">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[#C8FF00]/10 flex items-center justify-center">
            <Dumbbell className="h-3.5 w-3.5 text-[#C8FF00]" />
          </div>
          <span className="font-black text-xs tracking-[0.15em] text-[#F5F5F5]">THE GRIND PACT</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#888888] hover:text-[#F5F5F5] transition-colors rounded-lg hover:bg-[#1C1C1C]"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#080808]/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 border-r border-[#222222] bg-[#080808]/95 backdrop-blur-xl transform transition-transform duration-300 ease-out md:translate-x-0 md:static md:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-7 border-b border-[#222222]">
            <div className="h-10 w-10 rounded-xl bg-[#C8FF00]/10 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-[#C8FF00]" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-[0.1em] text-[#F5F5F5]">THE GRIND PACT</h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888888]">No excuses.</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ease-out',
                    isActive
                      ? 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20 shadow-[0_0_12px_rgba(200,255,0,0.06)]'
                      : 'text-[#888888] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] hover:border hover:border-[#222222]'
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive ? 'text-[#C8FF00]' : '')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Notifications */}
          <div className="px-3 pb-3">
            <Link
              href="/feed"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#888888] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] transition-all duration-200 ease-out relative"
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-[#C8FF00] text-[#080808] text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          </div>

          {/* User section */}
          <div className="border-t border-[#222222] p-4 space-y-3">
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1C1C1C] transition-all duration-200 ease-out group"
            >
              <Avatar
                src={profile?.photo_url}
                alt={profile?.display_name || ''}
                fallback={profile?.display_name?.charAt(0)}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#F5F5F5] truncate group-hover:text-[#C8FF00] transition-colors">
                  {profile?.display_name || 'User'}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#666666] capitalize">{profile?.role}</p>
              </div>
            </Link>

            <form action={logout}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-[#888888] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl"
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
