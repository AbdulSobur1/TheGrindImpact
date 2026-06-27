'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useIsAdmin } from '@/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-emerald-500" />
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-zinc-400 text-sm mt-1">Control the Pact. Use your power wisely.</p>
        </div>
      </div>

      <Separator />

      {message && (
        <div
          className={`px-4 py-3 rounded-lg border text-sm ${
            message.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Invite Section */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4 text-emerald-500" />
            Invite New Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-500">
            Generate a one-time invite link. Expires in 48 hours.
          </p>
          <Button onClick={handleGenerateLink} className="w-full">
            Generate Invite Link
          </Button>
          {inviteLink && (
            <div className="flex items-center gap-2">
              <Input value={inviteLink} readOnly className="flex-1 text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Force Rest Day */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarX className="h-4 w-4 text-yellow-500" />
            Force Rest Day
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-500">
            Declare a rest day for the entire group. No streaks affected.
          </p>
          <Input type="date" value={restDate} onChange={(e) => setRestDate(e.target.value)} />
          <Input
            placeholder="Reason for rest day"
            value={restReason}
            onChange={(e) => setRestReason(e.target.value)}
          />
          <Button onClick={handleForceRestDay} disabled={!restDate || !restReason.trim()}>
            Declare Rest Day
          </Button>
        </CardContent>
      </Card>

      {/* Announcement */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-blue-500" />
            Announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-zinc-500">
            Post a message to the feed as The Grind Pact.
          </p>
          <Input
            placeholder="Message to the Pact..."
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />
          <Button onClick={handleAnnouncement} disabled={!announcement.trim()}>
            Post Announcement
          </Button>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-6 py-3 border-t border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={member.photo_url}
                  alt={member.display_name}
                  fallback={member.display_name?.charAt(0)}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium">{member.display_name}</p>
                  <p className="text-xs text-zinc-500 capitalize">{member.role}</p>
                </div>
              </div>
              {member.role !== 'admin' && (
                <div className="flex items-center gap-2">
                  {removeUserId === member.user_id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Reason..."
                        value={removeReason}
                        onChange={(e) => setRemoveReason(e.target.value)}
                        className="w-40"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={!removeReason.trim()}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setRemoveUserId(null); setRemoveReason(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => setRemoveUserId(member.user_id)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
