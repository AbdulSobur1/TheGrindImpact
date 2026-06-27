'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getWorkoutPrograms, getAllExercises, setMemberGoal, getMemberGoal } from '@/lib/actions';
import { Dumbbell, ChevronRight, Users, Clock, Target, Sparkles, Check } from 'lucide-react';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-[#C8FF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#F5F5F5]">WORKOUTS</h1>
        <p className="text-[#888888] text-sm font-medium mt-1">Programs designed for real results</p>
      </div>

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
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('all')}>ALL</Button>
            <Button variant={filter === 'men' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('men')}>MEN</Button>
            <Button variant={filter === 'women' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('women')}>WOMEN</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.map((program) => {
              const isActive = memberGoal === program.slug;
              return (
                <Card
                  key={program.slug}
                  className={`border-[#222222] transition-all duration-200 hover:scale-[1.02] hover:border-[#3F3F3F] ${
                    isActive ? 'ring-2 ring-[#C8FF00]/30 border-[#C8FF00]/20' : ''
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-[#1C1C1C] flex items-center justify-center text-2xl">
                          {program.emoji}
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-[#F5F5F5]">{program.name}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">
                            {program.difficulty} • {program.goal_category.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#888888] font-medium leading-relaxed line-clamp-2">
                      {program.description}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#666666]">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.slug} className="border-[#222222] hover:border-[#3F3F3F] transition-all duration-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#F5F5F5]">{exercise.name}</h4>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      exercise.category === 'compound'
                        ? 'bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/20'
                        : 'bg-[#1C1C1C] text-[#888888] border border-[#222222]'
                    }`}>
                      {exercise.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#888888] font-medium">
                    {MUSCLE_GROUP_LABELS[exercise.muscle_group]} • {exercise.equipment}
                  </p>
                  {exercise.description && (
                    <p className="text-[10px] text-[#666666] leading-relaxed">{exercise.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
