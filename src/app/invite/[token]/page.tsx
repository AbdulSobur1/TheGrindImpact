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
      const supabase = createBrowserClient();
      await supabase.auth.signInWithPassword({ email, password });
      router.push('/onboarding');
      router.refresh();
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="flex items-center gap-3 text-[#999999] font-bold uppercase tracking-widest text-xs">
          <div className="h-5 w-5 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
          Verifying invite link...
        </div>
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4">
        <Card className="w-full max-w-md border-[#FF3B30]/20 bg-[#141414]/90 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">💀</div>
            <CardTitle className="text-xl text-[#FF3B30]">DEAD LINK</CardTitle>
            <CardDescription className="text-[#999999]">
              This link is dead. Ask the admin for a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF3B30]/8 border border-[#FF3B30]/15">
                <p className="text-sm text-[#FF3B30] font-medium">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FF5C00]/3 blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md border-[#242424] bg-[#141414]/90 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-2xl bg-[#FF5C00]/10 flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-[#FF5C00]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight uppercase text-white">
            YOU&apos;RE INVITED
          </CardTitle>
          <CardDescription className="text-[#999999] text-sm font-medium mt-1">
            Join The Grind Pact. No excuses.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="invite-name" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Display Name</label>
              <Input
                id="invite-name"
                name="display_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="invite-email" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Email</label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="invite-password" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Password</label>
              <Input
                id="invite-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF3B30]/8 border border-[#FF3B30]/15">
                <p className="text-sm text-[#FF3B30] font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  CREATING ACCOUNT...
                </span>
              ) : (
                'JOIN THE PACT'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
