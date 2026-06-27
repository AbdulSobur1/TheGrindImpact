'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { completeOnboarding, updateProfilePhoto } from '@/lib/actions';
import { Dumbbell, Camera, ArrowRight, Check, ChevronRight } from 'lucide-react';

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

  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && profile?.session_1_start) {
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

    if (s1End > 14 * 60) return 'Session 1 must end before 2:00 PM';
    if (s1Start >= s1End) return 'Session 1 end time must be after start time';
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
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
        <div className="animate-spin h-6 w-6 border-2 border-[#FF5C00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] px-4 py-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-2xl bg-[#FF5C00]/10 flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-[#FF5C00]" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-white mb-2">WELCOME TO THE GRIND PACT</h1>
          <p className="text-[#999999] text-sm font-medium">Set up your profile before we get started</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-300 ${
                  s <= step
                    ? 'bg-[#FF5C00] text-white shadow-lg shadow-[#FF5C00]/15'
                    : 'bg-[#1A1A1A] text-[#555555] border border-[#242424]'
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`h-0.5 w-12 rounded-full transition-colors duration-300 ${s < step ? 'bg-[#FF5C00]' : 'bg-[#242424]'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-[#242424] bg-[#141414]/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight uppercase text-white">
              {step === 1 && 'PROFILE SETUP'}
              {step === 2 && 'MORNING SESSION'}
              {step === 3 && 'EVENING SESSION'}
            </CardTitle>
            <CardDescription className="text-[#999999] mt-1">
              {step === 1 && 'Set your display name and optional profile photo'}
              {step === 2 && 'Morning session must complete before 2:00 PM'}
              {step === 3 && 'Evening session must start after 2:00 PM'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
                    <div className="absolute inset-0 rounded-full bg-[#0D0D0D]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                    <input
                      id="profile-photo"
                      name="profile_photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <label htmlFor="onboarding-name" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Display Name</label>
                  <Input
                    id="onboarding-name"
                    name="display_name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How the Pact will know you"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                  <span className="text-xs text-[#999999]">🕐 Timezone detected:</span>
                  <span className="text-xs font-bold text-white">{timezone}</span>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="session1-start" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Window Start</label>
                    <Input
                      id="session1-start"
                      name="session1_start"
                      type="time"
                      value={session1Start}
                      onChange={(e) => setSession1Start(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="session1-end" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Window End</label>
                    <Input
                      id="session1-end"
                      name="session1_end"
                      type="time"
                      value={session1End}
                      onChange={(e) => setSession1End(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                  <span className="text-sm mt-0.5">⏰</span>
                  <p className="text-xs text-[#999999] leading-relaxed">
                    Must end before <strong className="text-white">2:00 PM</strong>. This is your morning/early session. Workouts are every day except Sunday.
                  </p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="session2-start" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Window Start</label>
                    <Input
                      id="session2-start"
                      name="session2_start"
                      type="time"
                      value={session2Start}
                      onChange={(e) => setSession2Start(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="session2-end" className="text-xs font-bold uppercase tracking-widest text-[#999999]">Window End</label>
                    <Input
                      id="session2-end"
                      name="session2_end"
                      type="time"
                      value={session2End}
                      onChange={(e) => setSession2End(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#242424]">
                  <span className="text-sm mt-0.5">⏰</span>
                  <p className="text-xs text-[#999999] leading-relaxed">
                    Must start after <strong className="text-white">2:00 PM</strong>. This is your afternoon/evening session. Complete both sessions daily to maintain your streak.
                  </p>
                </div>
              </>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#FF3B30]/8 border border-[#FF3B30]/15">
                <p className="text-sm text-[#FF3B30] font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 h-12"
                >
                  BACK
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} className="flex-1 h-12">
                  <span className="flex items-center gap-2">
                    NEXT <ChevronRight className="h-4 w-4" />
                  </span>
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={submitting} className="flex-1 h-12">
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      SETTING UP...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      LET&apos;S GO <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
