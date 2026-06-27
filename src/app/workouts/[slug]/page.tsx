'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getWorkoutProgram, setMemberGoal } from '@/lib/actions';
import { ArrowLeft, Dumbbell, Clock, Users, Check, ChevronDown, ChevronUp, Target } from 'lucide-react';
import Link from 'next/link';
import type { ProgramDay, ProgramDayExercise } from '@/types';

interface WorkoutProgramDetail {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  weeks: number;
  days_per_week: number;
  difficulty: string;
  goal_category: string;
  target_audience: string;
  days: (ProgramDay & { exercises: (ProgramDayExercise & { exercise: any })[] })[];
}

export default function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [program, setProgram] = useState<WorkoutProgramDetail | null>(null);
  const [week, setWeek] = useState(1);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [slug, setSlug] = useState('');

  useEffect(() => {
    async function resolve() {
      const p = await params;
      setSlug(p.slug);
    }
    resolve();
  }, [params]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && slug) {
      loadProgram();
    }
  }, [user, slug]);

  async function loadProgram() {
    const data = await getWorkoutProgram(slug);
    if (data) {
      setProgram(data as unknown as WorkoutProgramDetail);
    }
  }

  async function handleStart() {
    if (!program) return;
    await setMemberGoal(program.goal_category, program.slug);
    router.push('/dashboard');
  }

  const weeks = program ? Array.from({ length: program.weeks }, (_, i) => i + 1) : [];
  const weekDays = program?.days.filter((d) => d.week_number === week) || [];

  if (loading || !program) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-[#FF5C00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Back button */}
      <Link href="/workouts" className="inline-flex items-center gap-2 text-sm text-[#999999] hover:text-white transition-colors font-medium">
        <ArrowLeft className="h-4 w-4" />
        BACK TO WORKOUTS
      </Link>

      {/* Program header */}
      <div className="flex flex-col md:flex-row items-start gap-5">
        <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-3xl shrink-0 border border-[#242424]">
          {program.emoji}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase text-white">{program.name}</h1>
          <p className="text-[#999999] text-sm font-medium mt-2 leading-relaxed">{program.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-widest text-[#555555]">
            <span className="px-2.5 py-1 rounded-full bg-[#1A1A1A] border border-[#242424]">{program.difficulty}</span>
            <span className="px-2.5 py-1 rounded-full bg-[#1A1A1A] border border-[#242424]">{program.weeks} weeks</span>
            <span className="px-2.5 py-1 rounded-full bg-[#1A1A1A] border border-[#242424]">{program.days_per_week}/week</span>
            <span className="px-2.5 py-1 rounded-full bg-[#1A1A1A] border border-[#242424] capitalize">{program.goal_category.replace('_', ' ')}</span>
          </div>
        </div>
        <Button onClick={handleStart} className="shrink-0 gap-2">
          <Check className="h-4 w-4" />
          START PROGRAM
        </Button>
      </div>

      <hr className="hr-accent" />

      {/* Week selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#999999]">Week</span>
        <div className="flex gap-1">
          {weeks.map((w) => (
            <Button
              key={w}
              variant={week === w ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setWeek(w)}
              className="h-8 min-w-[2.5rem]"
            >
              {w}
            </Button>
          ))}
        </div>
      </div>

      {/* Week overview */}
      <div className="space-y-3">
        {weekDays.map((day) => {
          const isRest = day.session_type === 'rest';
          const isExpanded = expandedDays.has(day.id);
          return (
            <Card
              key={day.id}
              className={`border-[#242424] transition-all duration-200 ${
                isRest ? 'opacity-50' : 'hover:border-[#3F3F3F]'
              }`}
            >
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => {
                  const next = new Set(expandedDays);
                  if (isExpanded) next.delete(day.id);
                  else next.add(day.id);
                  setExpandedDays(next);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black ${
                      isRest ? 'text-[#555555]' : 'text-[#FF5C00]'
                    }`}>
                      DAY {day.day_number}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                      isRest
                        ? 'bg-[#1A1A1A] text-[#555555] border border-[#242424]'
                        : 'bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20'
                    }`}>
                      {isRest ? 'REST' : day.session_type.toUpperCase()}
                    </span>
                    {day.focus_area && !isRest && (
                      <span className="text-xs text-[#999999] font-medium hidden md:inline">
                        {day.focus_area}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#555555]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#555555]" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && !isRest && (
                <CardContent className="space-y-3 animate-slide-up">
                  {day.note && (
                    <p className="text-[10px] text-[#FF5C00]/80 font-medium italic">💡 {day.note}</p>
                  )}
                  <div className="space-y-2">
                    {day.exercises?.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#141414] border border-[#242424]"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{ex.exercise?.name || ex.exercise_slug}</p>
                          <p className="text-[10px] text-[#999999] font-medium">
                            {ex.sets} × {ex.reps} · {ex.rest_seconds}s rest
                            {ex.exercise?.muscle_group && ` · ${ex.exercise.muscle_group}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ex.exercise?.category && (
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              ex.exercise.category === 'compound'
                                ? 'bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20'
                                : 'bg-[#1A1A1A] text-[#555555] border border-[#242424]'
                            }`}>
                              {ex.exercise.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              {isExpanded && isRest && (
                <CardContent className="animate-slide-up">
                  <div className="px-4 py-6 text-center rounded-xl bg-[#141414] border border-[#242424]">
                    <p className="text-lg mb-1">😴</p>
                    <p className="text-sm text-[#999999] font-medium">{day.note || 'Recovery day. Your muscles grow outside the gym.'}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
