'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Plus } from 'lucide-react';

export interface SetLog {
  setNumber: number;
  reps: number;
  weight?: number;
  duration?: number;
  notes?: string;
  completed: boolean;
}

interface SetTrackerProps {
  exerciseName: string;
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
  unit?: 'kg' | 'lbs';
  category?: string;
  onSetsUpdate: (sets: SetLog[]) => void;
  initialSets?: SetLog[];
}

/**
 * SetTracker Component
 * Visual interface for tracking sets, reps, and weight for a single exercise
 * Supports progressive overload indicators and completion tracking
 */
export function SetTracker({
  exerciseName,
  targetSets,
  targetReps,
  targetWeight,
  unit = 'kg',
  category = 'strength',
  onSetsUpdate,
  initialSets = [],
}: SetTrackerProps) {
  const [sets, setSets] = useState<SetLog[]>(
    initialSets.length > 0
      ? initialSets
      : Array.from({ length: targetSets }, (_, i) => ({
          setNumber: i + 1,
          reps: targetReps || 0,
          weight: targetWeight,
          completed: false,
        }))
  );

  const handleSetUpdate = (setNumber: number, updates: Partial<SetLog>) => {
    const updatedSets = sets.map((set) =>
      set.setNumber === setNumber ? { ...set, ...updates } : set
    );
    setSets(updatedSets);
    onSetsUpdate(updatedSets);
  };

  const toggleSetComplete = (setNumber: number) => {
    handleSetUpdate(setNumber, {
      completed: !sets.find((s) => s.setNumber === setNumber)?.completed,
    });
  };

  const addSet = () => {
    const newSet: SetLog = {
      setNumber: Math.max(...sets.map((s) => s.setNumber)) + 1,
      reps: targetReps || 0,
      weight: targetWeight,
      completed: false,
    };
    setSets([...sets, newSet]);
    onSetsUpdate([...sets, newSet]);
  };

  const completedCount = sets.filter((s) => s.completed).length;
  const isStrengthExercise = category === 'strength' || targetWeight !== undefined;
  const isCardio = category === 'cardio' || !isStrengthExercise;

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white text-lg">{exerciseName}</h3>
            <p className="text-sm text-slate-400 capitalize">{category}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
            <p className="text-xs text-slate-400">of {targetSets} sets</p>
          </div>
        </div>

        {/* Sets Grid */}
        <div className="space-y-2">
          {sets.map((set, idx) => (
            <div
              key={set.setNumber}
              className={`grid grid-cols-12 gap-2 p-3 rounded-lg border transition-all ${
                set.completed
                  ? 'bg-emerald-950/30 border-emerald-700/50'
                  : 'bg-slate-900/50 border-slate-700/50'
              }`}
            >
              {/* Set Number & Completion */}
              <div className="col-span-2 flex items-center gap-2">
                <button
                  onClick={() => toggleSetComplete(set.setNumber)}
                  className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                    set.completed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {set.completed ? (
                    <Check size={16} />
                  ) : (
                    <div className="w-4 h-4 border-2 border-current rounded" />
                  )}
                </button>
                <span className="text-sm font-semibold text-slate-300">Set {set.setNumber}</span>
              </div>

              {/* Reps Input */}
              <div className="col-span-3 flex flex-col gap-1">
                <label className="text-xs text-slate-400">Reps</label>
                <Input
                  type="number"
                  min={0}
                  value={set.reps}
                  onChange={(e) =>
                    handleSetUpdate(set.setNumber, { reps: parseInt(e.target.value) || 0 })
                  }
                  className="bg-slate-800 border-slate-600 text-white h-8 text-center"
                  placeholder="0"
                />
              </div>

              {/* Weight Input (Strength exercises) */}
              {isStrengthExercise && (
                <div className="col-span-3 flex flex-col gap-1">
                  <label className="text-xs text-slate-400">{unit}</label>
                  <Input
                    type="number"
                    step={0.5}
                    min={0}
                    value={set.weight || ''}
                    onChange={(e) =>
                      handleSetUpdate(set.setNumber, { weight: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-slate-800 border-slate-600 text-white h-8 text-center"
                    placeholder="0"
                  />
                </div>
              )}

              {/* Duration Input (Cardio) */}
              {isCardio && (
                <div className="col-span-3 flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Min</label>
                  <Input
                    type="number"
                    min={0}
                    value={set.duration || ''}
                    onChange={(e) =>
                      handleSetUpdate(set.setNumber, { duration: parseInt(e.target.value) || 0 })
                    }
                    className="bg-slate-800 border-slate-600 text-white h-8 text-center"
                    placeholder="0"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="col-span-4 flex flex-col gap-1">
                <label className="text-xs text-slate-400">Notes</label>
                <Input
                  type="text"
                  value={set.notes || ''}
                  onChange={(e) => handleSetUpdate(set.setNumber, { notes: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white h-8 text-xs"
                  placeholder="Add notes..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Set Button */}
        <Button
          onClick={addSet}
          variant="outline"
          className="w-full h-9 border-slate-600 hover:bg-slate-800 text-slate-300 gap-2"
        >
          <Plus size={16} />
          Add Set
        </Button>

        {/* Progress Indicators */}
        {set && (
          <div className="flex gap-2 flex-wrap text-xs">
            {targetReps && (
              <div className="px-2 py-1 rounded bg-blue-950/50 border border-blue-700/50 text-blue-300">
                Target: {targetReps} reps
              </div>
            )}
            {targetWeight && (
              <div className="px-2 py-1 rounded bg-purple-950/50 border border-purple-700/50 text-purple-300">
                Target: {targetWeight} {unit}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
