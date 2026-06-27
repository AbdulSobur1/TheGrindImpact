'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { login } from '@/lib/actions';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ email, password });
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
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
            THE GRIND PACT
          </CardTitle>
          <CardDescription className="text-[#999999] text-sm font-medium mt-1">
            No excuses. Just results.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Email</label>
              <Input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Password</label>
              <Input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF3B30]/8 border border-[#FF3B30]/15">
                <Zap className="h-4 w-4 text-[#FF3B30] shrink-0" />
                <p className="text-sm text-[#FF3B30] font-medium">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  SIGNING IN...
                </span>
              ) : (
                'SIGN IN'
              )}
            </Button>

            <p className="text-center text-xs font-medium text-[#555555]">
              Only invited members can join.{' '}
              <span className="text-[#FF5C00]">Ask the admin for an invite link.</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
