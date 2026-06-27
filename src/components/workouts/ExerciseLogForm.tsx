'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SetTracker, type SetLog } from './SetTracker';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';
import type { ProgramDayExercise, Exercise } from '@/types';

interface ExerciseLogFormProps {
  exercises: (ProgramDayExercise & { exercise: Exercise })[];
  windowDate: string;
  onSave: (logs: ExerciseLogData[]) => Promise<void>;
  isSaving?: boolean;
  onCancel?: () => void;
}

export interface ExerciseLogData {
  exerciseId: string;
  windowDate: string;
  sets: SetLog[];
  notes?: string;
}

/**
 * ExerciseLogForm Component
 * Multi-step form for logging all exercises from a program day
 * Navigate between exercises with previous/next buttons
 */
export function ExerciseLogForm({
  exercises,
  windowDate,
  onSave,
  isSaving = false,
  onCancel,
}: ExerciseLogFormProps) {
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [allExerciseLogs, setAllExerciseLogs] = useState<ExerciseLogData[]>(
    exercises.map((ex) => ({
      exerciseId: ex.exercise.id,
      windowDate,
      sets: [],
    }))
  );

  const currentExercise = exercises[currentExerciseIdx];
  const currentLog = allExerciseLogs[currentExerciseIdx];

  const handleSetUpdate = (sets: SetLog[]) => {
    const updated = [...allExerciseLogs];
    updated[currentExerciseIdx] = {
      ...updated[currentExerciseIdx],
      sets,
    };
    setAllExerciseLogs(updated);
  };

  const handleNext = () => {
    if (currentExerciseIdx < exercises.length - 1) {
      setCurrentExerciseIdx(currentExerciseIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentExerciseIdx > 0) {
      setCurrentExerciseIdx(currentExerciseIdx - 1);
    }
  };

  const handleSave = async () => {
    await onSave(allExerciseLogs.filter((log) => log.sets.length > 0));
  };

  const completedExercises = allExerciseLogs.filter((log) => log.sets.length > 0).length;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Exercise Logger</h2>
            <div className="text-sm text-slate-400">
              Exercise {currentExerciseIdx + 1} of {exercises.length}
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
              style={{
                width: `${((currentExerciseIdx + 1) / exercises.length) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exercise Logger */}
      {currentExercise && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-xl text-white">{currentExercise.exercise.name}</CardTitle>
            {currentExercise.exercise.description && (
              <p className="text-sm text-slate-400 mt-2">{currentExercise.exercise.description}</p>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <SetTracker
              exerciseName={currentExercise.exercise.name}
              targetSets={currentExercise.sets}
              targetReps={currentExercise.reps}
              targetWeight={currentExercise.weight}
              category={currentExercise.exercise.category}
              onSetsUpdate={handleSetUpdate}
              initialSets={currentLog.sets}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation & Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handlePrev}
          disabled={currentExerciseIdx === 0 || isSaving}
          variant="outline"
          className="gap-2"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentExerciseIdx === exercises.length - 1 || isSaving}
          variant="outline"
          className="gap-2 flex-1"
        >
          Next
          <ChevronRight size={16} />
        </Button>

        <Button
          onClick={handleSave}
          disabled={isSaving || completedExercises === 0}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Save size={16} />
          Save Logs ({completedExercises})
        </Button>

        {onCancel && (
          <Button onClick={onCancel} disabled={isSaving} variant="ghost">
            Cancel
          </Button>
        )}
      </div>

      {/* Summary */}
      <Card className="bg-slate-900/50 border-slate-700 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Logged Exercises</p>
            <p className="text-2xl font-bold text-emerald-400">
              {completedExercises}/{exercises.length}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Total Sets</p>
            <p className="text-2xl font-bold text-blue-400">
              {allExerciseLogs.reduce((sum, log) => sum + log.sets.length, 0)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
