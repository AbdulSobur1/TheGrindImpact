'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExerciseLogForm, type ExerciseLogData } from './ExerciseLogForm';
import { logExercises } from '@/lib/actions';
import { Dumbbell, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ProgramDayExercise, Exercise } from '@/types';

interface WorkoutSessionTrackerProps {
  exercises: (ProgramDayExercise & { exercise: Exercise })[];
  windowDate: string;
  sessionNumber: 1 | 2;
  programDayId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * WorkoutSessionTracker Component
 * Main component for tracking a complete workout session
 * Integrates exercise logging with check-in flow
 */
export function WorkoutSessionTracker({
  exercises,
  windowDate,
  sessionNumber,
  programDayId,
  onComplete,
  onCancel,
}: WorkoutSessionTrackerProps) {
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'view' | 'log'>('view');

  const handleSaveExerciseLogs = async (logs: ExerciseLogData[]) => {
    setIsLogging(true);
    setError(null);

    try {
      await logExercises(logs);
      setSuccess(true);
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exercise logs');
      setIsLogging(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-gradient-to-br from-emerald-950 to-emerald-900 border-emerald-700">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
          <h2 className="text-2xl font-bold text-emerald-300">Workout Logged!</h2>
          <p className="text-emerald-200">Your exercise data has been saved successfully.</p>
        </CardContent>
      </Card>
    );
  }

  if (step === 'log') {
    return (
      <ExerciseLogForm
        exercises={exercises}
        windowDate={windowDate}
        onSave={handleSaveExerciseLogs}
        isSaving={isLogging}
        onCancel={() => {
          setStep('view');
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Session Overview */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 rounded-lg">
              <Dumbbell size={24} className="text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Session {sessionNumber} Workout</CardTitle>
              <p className="text-sm text-slate-400 mt-1">{exercises.length} exercises planned</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-950/50 border border-red-700/50 rounded-lg flex gap-3 text-red-200">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Exercises List */}
          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div
                key={ex.id}
                className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{ex.exercise.name}</h4>
                    <p className="text-sm text-slate-400">
                      {ex.sets} sets × {ex.reps || '∞'} reps
                      {ex.weight && ` @ ${ex.weight}${ex.unit || 'kg'}`}
                    </p>
                    {ex.exercise.description && (
                      <p className="text-xs text-slate-500 mt-1">{ex.exercise.description}</p>
                    )}
                  </div>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded capitalize">
                    {ex.exercise.category}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3 text-center p-3 bg-slate-900/50 rounded-lg">
            <div>
              <p className="text-2xl font-bold text-emerald-400">
                {exercises.reduce((sum, ex) => sum + ex.sets, 0)}
              </p>
              <p className="text-xs text-slate-400">Total Sets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{exercises.length}</p>
              <p className="text-xs text-slate-400">Exercises</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                ~{Math.round((exercises.length * 3) / 2) * 5}
              </p>
              <p className="text-xs text-slate-400">Est. Min</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={() => setStep('log')}
          disabled={isLogging}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
        >
          <Dumbbell size={16} />
          Log Exercises
        </Button>
        {onCancel && (
          <Button onClick={onCancel} disabled={isLogging} variant="outline">
            Skip for Now
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-950/30 border border-blue-700/50 rounded-lg text-sm text-blue-200">
        💡 <span className="ml-2">Log your exercises to track progression and monitor PRs</span>
      </div>
    </div>
  );
}
