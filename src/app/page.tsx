'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Dumbbell } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-[#FF5C00]/10 flex items-center justify-center animate-pulse-glow">
            <Dumbbell className="h-8 w-8 text-[#FF5C00]" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[#999999] text-sm font-bold uppercase tracking-widest animate-pulse">Loading</p>
          <p className="text-[#555555] text-xs font-medium">THE GRIND PACT</p>
        </div>
      </div>
    </div>
  );
}
