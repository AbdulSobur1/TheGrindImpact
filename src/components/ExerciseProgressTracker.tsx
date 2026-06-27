'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getExerciseHistoryWithProgression, calculateExercisePR } from '@/lib/actions';
import { TrendingUp, Trophy, Zap, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

interface ExerciseProgressProps {
  exerciseId: string;
  exerciseName: string;
}

interface ProgressMetric {
  date: string;
  maxWeight: number;
  totalReps: number;
  setCount: number;
}

/**
 * ExerciseProgressTracker Component
 * Displays exercise progression with weight trends, PRs, and session history
 */
export function ExerciseProgressTracker({ exerciseId, exerciseName }: ExerciseProgressProps) {
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [pr, setPR] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [exerciseId]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const [historyData, prData] = await Promise.all([
        getExerciseHistoryWithProgression(exerciseId, 20),
        calculateExercisePR(exerciseId),
      ]);

      const progressMetrics = historyData.map((log: any) => ({
        date: log.window_date,
        maxWeight: log.maxWeight || 0,
        totalReps: log.totalReps || 0,
        setCount: log.sets?.length || 0,
      }));

      setMetrics(progressMetrics);
      setPR(prData);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-800 rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const progressTrend = metrics.length > 0 && metrics[metrics.length - 1]
    ? ((metrics[0].maxWeight - metrics[metrics.length - 1].maxWeight) / metrics[metrics.length - 1].maxWeight) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* PR Card */}
      {pr && (
        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-300">
              <Trophy size={20} />
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-purple-300/70">Max Weight</p>
              <p className="text-2xl font-bold text-purple-200">{pr.maxWeight} kg</p>
            </div>
            <div>
              <p className="text-xs text-purple-300/70">Max Reps</p>
              <p className="text-2xl font-bold text-purple-200">{pr.maxReps}</p>
            </div>
            <div>
              <p className="text-xs text-purple-300/70">Total Sessions</p>
              <p className="text-2xl font-bold text-purple-200">{pr.volume}</p>
            </div>
            <div>
              <p className="text-xs text-purple-300/70">Trend</p>
              <p className={`text-2xl font-bold ${progressTrend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {Math.abs(progressTrend).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      {metrics.length > 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-300">
              <BarChart3 size={20} />
              Recent Session History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.slice(0, 5).map((metric, idx) => (
              <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-300 font-medium">
                      {format(new Date(metric.date), 'MMM d')}
                    </p>
                    <p className="text-xs text-slate-500">{metric.setCount} sets</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{metric.maxWeight} kg</p>
                    <p className="text-xs text-slate-400">{metric.totalReps} total reps</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {metrics.length === 0 && (
        <Card className="bg-slate-900 border-slate-700">
          <CardContent className="p-6 text-center text-slate-400">
            <TrendingUp size={32} className="mx-auto mb-3 opacity-50" />
            <p>No exercise logs yet. Start tracking {exerciseName} to see your progress!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
