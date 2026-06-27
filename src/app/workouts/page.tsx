'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { getWorkoutPrograms, getAllExercises, setMemberGoal, getMemberGoal } from '@/lib/actions';
import { Dumbbell, ChevronRight, Users, Clock, Target, Sparkles, Check, Search } from 'lucide-react';
import type { WorkoutProgram, Exercise, MuscleGroup } from '@/types';
import { MUSCLE_GROUP_LABELS } from '@/types';

export default function WorkoutsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeTab, setActiveTab] = useState<'programs' | 'exercises'>('programs');
  const [filter, setFilter] = useState<string>('all');
  const [memberGoal, setMemberGoalState] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    const [progs, exs, goal] = await Promise.all([
      getWorkoutPrograms(),
      getAllExercises(),
      getMemberGoal(),
    ]);
    setPrograms(progs);
    setExercises(exs);
    if (goal?.active_program_slug) setMemberGoalState(goal.active_program_slug);
  }

  async function handleSetActive(slug: string) {
    const program = programs.find((p) => p.slug === slug);
    if (!program) return;
    await setMemberGoal(program.goal_category, slug);
    setMemberGoalState(slug);
  }

  const filteredPrograms = filter === 'all'
    ? programs
    : programs.filter((p) => p.target_audience === filter);

  const muscleGroups = [...new Set(exercises.map((e) => e.muscle_group))];
  const filteredExercises = selectedMuscle === 'all'
    ? exercises
    : exercises.filter((e) => e.muscle_group === selectedMuscle);

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8 animate-fade-in">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <hr className="hr-accent" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="h-8 w-14 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[#242424] bg-[#141414] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white">WORKOUTS</h1>
        <p className="text-[#999999] text-sm font-medium mt-1">Programs designed for real results</p>
      </div>

      <hr className="hr-accent" />

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'programs' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('programs')}
          className="gap-2"
        >
          <Target className="h-4 w-4" />
          PROGRAMS
        </Button>
        <Button
          variant={activeTab === 'exercises' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('exercises')}
          className="gap-2"
        >
          <Dumbbell className="h-4 w-4" />
          EXERCISES
        </Button>
      </div>

      <Separator />

      {activeTab === 'programs' && (
        <>
          {/* Audience filter */}
          <div className="flex gap-2 flex-wrap">
            <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('all')}>ALL</Button>
            <Button variant={filter === 'men' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('men')}>MEN</Button>
            <Button variant={filter === 'women' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('women')}>WOMEN</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filteredPrograms.map((program) => {
              const isActive = memberGoal === program.slug;
              return (
                <Card
                  key={program.slug}
                  className={`border-[#242424] transition-all duration-200 hover:scale-[1.02] hover:border-[#3F3F3F] ${
                    isActive ? 'ring-2 ring-[#FF5C00]/30 border-[#FF5C00]/20' : ''
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-2xl border border-[#242424]">
                          {program.emoji}
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-white">{program.name}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">
                            {program.difficulty} • {program.goal_category.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#999999] font-medium leading-relaxed line-clamp-2">
                      {program.description}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#555555]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {program.weeks} weeks
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {program.target_audience === 'unisex' ? 'All' : program.target_audience}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {program.days_per_week}/week
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        onClick={() => handleSetActive(program.slug)}
                        className="flex-1 h-9 text-xs"
                      >
                        {isActive ? (
                          <span className="flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            ACTIVE
                          </span>
                        ) : (
                          'START PROGRAM'
                        )}
                      </Button>
                      <Link href={`/workouts/${program.slug}`} className="shrink-0">
                        <Button size="sm" variant="ghost" className="h-9">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredPrograms.length === 0 && (
              <div className="col-span-full py-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                    <Dumbbell className="h-8 w-8 text-[#555555]" />
                  </div>
                </div>
                <p className="text-lg font-black uppercase tracking-tight text-white mb-1">No programs found</p>
                <p className="text-sm text-[#999999] font-medium">Check back later for new programs.</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'exercises' && (
        <>
          {/* Muscle group filter */}
          <div className="flex gap-2 flex-wrap">
            <Button variant={selectedMuscle === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setSelectedMuscle('all')}>ALL</Button>
            {muscleGroups.map((mg) => (
              <Button
                key={mg}
                variant={selectedMuscle === mg ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMuscle(mg)}
                className="capitalize"
              >
                {MUSCLE_GROUP_LABELS[mg] || mg}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.slug} className="border-[#242424] hover:border-[#3F3F3F] transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{exercise.name}</h4>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      exercise.category === 'compound'
                        ? 'bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20'
                        : 'bg-[#1A1A1A] text-[#999999] border border-[#242424]'
                    }`}>
                      {exercise.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#999999] font-medium">
                    {MUSCLE_GROUP_LABELS[exercise.muscle_group]} • {exercise.equipment}
                  </p>
                  {exercise.description && (
                    <p className="text-[10px] text-[#555555] leading-relaxed">{exercise.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredExercises.length === 0 && (
              <div className="col-span-full py-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center border border-[#242424]">
                    <Search className="h-8 w-8 text-[#555555]" />
                  </div>
                </div>
                <p className="text-lg font-black uppercase tracking-tight text-white mb-1">No exercises found</p>
                <p className="text-sm text-[#999999] font-medium">Try a different muscle group.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
