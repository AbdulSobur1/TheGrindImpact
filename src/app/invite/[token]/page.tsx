'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { signupWithInvite } from '@/lib/actions';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [linkValid, setLinkValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setToken(resolved.token);
      await verifyToken(resolved.token);
    }
    resolveParams();
  }, [params]);

  async function verifyToken(tokenStr: string) {
    const supabase = createBrowserClient();
    const { data, error: fetchError } = await supabase
      .from('invite_links')
      .select('*')
      .eq('token', tokenStr)
      .single();

    if (fetchError || !data) {
      setLinkValid(false);
      setVerifying(false);
      return;
    }

    if (data.used_by) {
      setError('This link has already been used.');
      setLinkValid(false);
      setVerifying(false);
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setError('This link has expired.');
      setLinkValid(false);
      setVerifying(false);
      return;
    }

    setLinkValid(true);
    setVerifying(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    const result = await signupWithInvite(token, { email, password, name: name.trim() });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Sign them in
      const supabase = createBrowserClient();
      await supabase.auth.signInWithPassword({ email, password });
      router.push('/onboarding');
      router.refresh();
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Verifying invite link...
        </div>
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <Card className="w-full max-w-md border-red-500/20 bg-zinc-900/50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Dead Link</CardTitle>
            <CardDescription className="text-zinc-400">
              This link is dead. Ask the admin for a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-6xl">💀</div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Dumbbell className="h-7 w-7 text-emerald-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">You're Invited</CardTitle>
          <CardDescription className="text-zinc-400">
            Join The Grind Pact. No excuses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Join The Pact'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
