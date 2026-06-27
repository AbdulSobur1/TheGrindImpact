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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-xl bg-emerald-500/10 flex items-center justify-center animate-pulse">
            <Dumbbell className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <p className="text-zinc-400 text-sm">Loading The Grind Pact...</p>
      </div>
    </div>
  );
}
