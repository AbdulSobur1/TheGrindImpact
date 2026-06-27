'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getWorkoutProgram, setMemberGoal } from '@/lib/actions';
import { ArrowLeft, Dumbbell, Clock, Users, Check, ChevronDown, ChevronUp } from 'lucide-react';
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
        <div className="animate-spin h-6 w-6 border-2 border-[#C8FF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Link href="/workouts" className="inline-flex items-center gap-2 text-sm text-[#888888] hover:text-[#F5F5F5] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        BACK TO WORKOUTS
      </Link>

      {/* Program header */}
      <div className="flex items-start gap-5">
        <div className="h-16 w-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center text-3xl shrink-0 border border-[#222222]">
          {program.emoji}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">{program.name}</h1>
          <p className="text-[#888888] text-sm font-medium mt-2 leading-relaxed">{program.description}</p>
          <div className="flex items-center gap-4 mt-3 text-[10px] font-bold uppercase tracking-widest text-[#666666]">
            <span>{program.difficulty}</span>
            <span>{program.weeks} weeks</span>
            <span>{program.days_per_week}/week</span>
            <span className="capitalize">{program.goal_category.replace('_', ' ')}</span>
          </div>
        </div>
        <Button onClick={handleStart} className="shrink-0 gap-2">
          <Check className="h-4 w-4" />
          START PROGRAM
        </Button>
      </div>

      <Separator />

      {/* Week selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#888888]">Week</span>
        <div className="flex gap-1">
          {weeks.map((w) => (
            <Button
              key={w}
              variant={week === w ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setWeek(w)}
              className="h-8 min-w-[2rem]"
            >
              {w}
            </Button>
          ))}
        </div>
      </div>

      {/* Week overview */}
      <div className="flex gap-2 flex-wrap">
        {weekDays.map((day) => {
          const isRest = day.session_type === 'rest';
          const isExpanded = expandedDays.has(day.id);
          return (
            <Card
              key={day.id}
              className={`border-[#222222] w-full transition-all duration-200 ${
                isRest ? 'opacity-50' : ''
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
                      isRest ? 'text-[#666666]' : 'text-[#C8FF00]'
                    }`}>
                      DAY {day.day_number}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      isRest
                        ? 'bg-[#1C1C1C] text-[#666666] border border-[#222222]'
                        : 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20'
                    }`}>
                      {isRest ? 'REST' : day.session_type.toUpperCase()}
                    </span>
                    {day.focus_area && !isRest && (
                      <span className="text-xs text-[#888888] font-medium hidden md:inline">
                        {day.focus_area}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-[#666666]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#666666]" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && !isRest && (
                <CardContent className="space-y-3 animate-slide-up">
                  {day.note && (
                    <p className="text-[10px] text-[#C8FF00]/80 font-medium italic">💡 {day.note}</p>
                  )}
                  <div className="space-y-2">
                    {day.exercises?.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1C1C] border border-[#222222]"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#F5F5F5]">{ex.exercise?.name || ex.exercise_slug}</p>
                          <p className="text-[10px] text-[#888888] font-medium">
                            {ex.sets} × {ex.reps} · {ex.rest_seconds}s rest
                            {ex.exercise?.muscle_group && ` · ${ex.exercise.muscle_group}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ex.exercise?.category && (
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              ex.exercise.category === 'compound'
                                ? 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20'
                                : 'bg-[#1C1C1C] text-[#666666] border border-[#222222]'
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
                  <div className="px-4 py-6 text-center rounded-xl bg-[#1C1C1C] border border-[#222222]">
                    <p className="text-lg mb-1">😴</p>
                    <p className="text-sm text-[#888888] font-medium">{day.note || 'Recovery day. Your muscles grow outside the gym.'}</p>
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
