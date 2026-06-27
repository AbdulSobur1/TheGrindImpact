'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useIsAdmin } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  generateInviteLink,
  removeMember,
  declareForceRestDay,
  adminAnnouncement,
} from '@/lib/actions';
import {
  Shield,
  Link2,
  Copy,
  UserX,
  CalendarX,
  Megaphone,
  Users,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  Send,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const [members, setMembers] = useState<any[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Remove member
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState('');

  // Force rest day
  const [restDate, setRestDate] = useState('');
  const [restReason, setRestReason] = useState('');

  // Announcement
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && profile && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) {
      loadMembers();
    }
  }, [user, isAdmin]);

  async function loadMembers() {
    if (!user) return;
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setMembers(data || []);
  }

  async function handleGenerateLink() {
    setMessage(null);
    const result = await generateInviteLink();
    if (result.error) {
      setMessage({ text: result.error, type: 'error' });
    } else {
      setInviteLink(result.link ?? null);
      setCopied(false);
      setMessage({ text: 'Invite link generated!', type: 'success' });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  function handleCopyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!removeReason.trim()) return;
    setMessage(null);
    const result = await removeMember(userId, removeReason);
    if (result.error) {
      setMessage({ text: result.error, type: 'error' });
    } else {
      setMessage({ text: 'Member removed.', type: 'success' });
      setRemoveUserId(null);
      setRemoveReason('');
      loadMembers();
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleForceRestDay() {
    if (!restDate || !restReason.trim()) return;
    setMessage(null);
    const result = await declareForceRestDay(restDate, restReason);
    if (result.error) {
      setMessage({ text: result.error, type: 'error' });
    } else {
      setMessage({ text: 'Rest day declared!', type: 'success' });
      setRestDate('');
      setRestReason('');
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleAnnouncement() {
    if (!announcement.trim()) return;
    setMessage(null);
    const result = await adminAnnouncement(announcement);
    if (result.error) {
      setMessage({ text: result.error, type: 'error' });
    } else {
      setMessage({ text: 'Announcement posted!', type: 'success' });
      setAnnouncement('');
    }
    setTimeout(() => setMessage(null), 3000);
  }

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <hr className="hr-accent" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[#242424] bg-[#141414] p-5 space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        {/* Members list skeleton */}
        <div className="rounded-2xl border border-[#242424] bg-[#141414] overflow-hidden">
          <div className="p-5 pb-4">
            <Skeleton className="h-4 w-32" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 border-t border-[#242424]">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-[#FF5C00]/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-[#FF5C00]" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-white">ADMIN PANEL</h1>
          <p className="text-[#999999] text-sm font-medium mt-1">Control the Pact. Use your power wisely.</p>
        </div>
      </div>

      <hr className="hr-accent" />

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium animate-slide-up ${
            message.type === 'error'
              ? 'bg-[#FF3B30]/8 border-[#FF3B30]/15 text-[#FF3B30]'
              : 'bg-[#34C759]/8 border-[#34C759]/15 text-[#34C759]'
          }`}
        >
          <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
          {message.text}
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {/* Invite Section */}
        <Card className="border-[#242424]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#FF5C00]">
              <Link2 className="h-4 w-4" />
              Invite Member
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#999999] font-medium">
              Generate a one-time invite link. Expires in 48 hours.
            </p>
            <Button onClick={handleGenerateLink} className="w-full h-11 gap-2">
              <Plus className="h-4 w-4" />
              GENERATE LINK
            </Button>
            {inviteLink && (
              <div className="flex items-center gap-2 animate-slide-up">
                <Input
                  id="invite-link"
                  name="invite_link"
                  value={inviteLink}
                  readOnly
                  className="flex-1 text-xs font-mono"
                  aria-label="Generated invite link"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-[#34C759]" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Force Rest Day */}
        <Card className="border-[#242424]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#FF9F0A]">
              <CalendarX className="h-4 w-4" />
              Force Rest Day
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#999999] font-medium">
              Declare a rest day for the entire group. No streaks affected.
            </p>
            <Input
              id="rest-date"
              name="rest_date"
              type="date"
              value={restDate}
              onChange={(e) => setRestDate(e.target.value)}
              aria-label="Rest day date"
            />
            <Input
              id="rest-reason"
              name="rest_reason"
              placeholder="Reason for rest day"
              value={restReason}
              onChange={(e) => setRestReason(e.target.value)}
              aria-label="Reason for rest day"
            />
            <Button
              onClick={handleForceRestDay}
              disabled={!restDate || !restReason.trim()}
              className="w-full h-11"
              variant="secondary"
            >
              DECLARE REST DAY
            </Button>
          </CardContent>
        </Card>

        {/* Announcement */}
        <Card className="border-[#242424]">
          <CardHeader className="pb-4">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#34C759]">
              <Megaphone className="h-4 w-4" />
              Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#999999] font-medium">
              Post a message to the feed as The Grind Pact.
            </p>
            <div className="relative">
              <Input
                id="announcement"
                name="announcement"
                placeholder="Message to the Pact..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                aria-label="Announcement message"
                className="pr-12"
              />
              <button
                onClick={handleAnnouncement}
                disabled={!announcement.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-[#FF5C00] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FF5C00]/90 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card className="border-[#242424]">
        <CardHeader className="pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-[#999999]">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                  <Users className="h-8 w-8 text-[#555555]" />
                </div>
              </div>
              <p className="text-lg font-black uppercase tracking-tight text-white mb-1">No members yet</p>
              <p className="text-sm text-[#999999] font-medium">Invite some!</p>
            </div>
          ) : (
            members.map((member, i) => (
              <div
                key={member.id}
                className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-[#242424]' : ''} hover:bg-[#1A1A1A]/50 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={member.photo_url}
                    alt={member.display_name}
                    fallback={member.display_name?.charAt(0)}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">{member.display_name}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555555] capitalize">{member.role}</p>
                  </div>
                </div>
                {member.role !== 'admin' && (
                  <div className="flex items-center gap-2">
                    {removeUserId === member.user_id ? (
                      <div className="flex items-center gap-2 animate-slide-up">
                        <Input
                          id="remove-reason"
                          name="remove_reason"
                          placeholder="Reason..."
                          value={removeReason}
                          onChange={(e) => setRemoveReason(e.target.value)}
                          className="w-36 h-9 text-xs"
                          aria-label="Reason for removal"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={!removeReason.trim()}
                          className="h-9"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setRemoveUserId(null); setRemoveReason(''); }}
                          className="h-9"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#999999] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl"
                        onClick={() => setRemoveUserId(member.user_id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
