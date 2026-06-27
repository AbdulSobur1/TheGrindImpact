'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { completeOnboarding, updateProfilePhoto } from '@/lib/actions';
import { Dumbbell, Camera } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [session1Start, setSession1Start] = useState('06:00');
  const [session1End, setSession1End] = useState('08:00');
  const [session2Start, setSession2Start] = useState('17:00');
  const [session2End, setSession2End] = useState('19:00');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detect timezone
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && profile?.session_1_start) {
      // Already onboarded
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  function validateSessionTimes(): string | null {
    const s1Start = parseInt(session1Start.split(':')[0]) * 60 + parseInt(session1Start.split(':')[1]);
    const s1End = parseInt(session1End.split(':')[0]) * 60 + parseInt(session1End.split(':')[1]);
    const s2Start = parseInt(session2Start.split(':')[0]) * 60 + parseInt(session2Start.split(':')[1]);
    const s2End = parseInt(session2End.split(':')[0]) * 60 + parseInt(session2End.split(':')[1]);

    // Session 1 must end before 2PM (14:00)
    if (s1End > 14 * 60) return 'Session 1 must end before 2:00 PM';
    if (s1Start >= s1End) return 'Session 1 end time must be after start time';

    // Session 2 must start after 2PM (14:00)
    if (s2Start < 14 * 60) return 'Session 2 must start after 2:00 PM';
    if (s2Start >= s2End) return 'Session 2 end time must be after start time';

    return null;
  }

  async function handleComplete() {
    setError('');
    const timeError = validateSessionTimes();
    if (timeError) {
      setError(timeError);
      return;
    }
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setSubmitting(true);

    // Upload photo if provided
    if (photoFile) {
      const formData = new FormData();
      formData.append('photo', photoFile);
      await updateProfilePhoto(formData);
    }

    const result = await completeOnboarding({
      displayName: displayName.trim(),
      session1Start,
      session1End,
      session2Start,
      session2End,
      timezone,
    });

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to The Grind Pact</h1>
          <p className="text-zinc-400">Set up your profile before we get started</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? 'bg-emerald-500' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Profile Setup'}
              {step === 2 && 'Session Window 1 (Morning)'}
              {step === 3 && 'Session Window 2 (Evening)'}
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {step === 1 && 'Set your display name and optional profile photo'}
              {step === 2 && 'Morning session must complete before 2:00 PM'}
              {step === 3 && 'Evening session must start after 2:00 PM'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="flex justify-center">
                  <label className="relative cursor-pointer group">
                    <Avatar
                      src={photoPreview}
                      alt="Profile"
                      fallback={displayName?.charAt(0) || '?'}
                      size="xl"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-zinc-100" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How the Pact will know you"
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  Timezone detected: {timezone}
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Window Start</label>
                    <Input
                      type="time"
                      value={session1Start}
                      onChange={(e) => setSession1Start(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Window End</label>
                    <Input
                      type="time"
                      value={session1End}
                      onChange={(e) => setSession1End(e.target.value)}
                    />
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400">
                    ⏰ Must end before 2:00 PM. This is your morning/early session.
                    Workouts are every day except Sunday.
                  </p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Window Start</label>
                    <Input
                      type="time"
                      value={session2Start}
                      onChange={(e) => setSession2Start(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Window End</label>
                    <Input
                      type="time"
                      value={session2End}
                      onChange={(e) => setSession2End(e.target.value)}
                    />
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400">
                    ⏰ Must start after 2:00 PM. This is your afternoon/evening session.
                    Complete both sessions daily to maintain your streak.
                  </p>
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} className="flex-1">
                  Next
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={submitting} className="flex-1">
                  {submitting ? 'Setting up...' : "Let's Go"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
