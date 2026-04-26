import { LevelBadge } from "@/components/LevelBadge";

export interface EvaluationRecord {
  id: string;
  total_score: number;
  scores: Record<string, number>;
  created_at: string;
}

interface EvaluationHistoryProps {
  evaluations: EvaluationRecord[];
  loading?: boolean;
}

export function EvaluationHistory({ evaluations, loading }: EvaluationHistoryProps) {
  if (loading) {
    return <div className="text-muted-foreground py-6 text-center">Loading history...</div>;
  }

  if (evaluations.length === 0) {
    return <div className="text-muted-foreground py-6 text-center">No evaluations yet.</div>;
  }

  return (
    <div className="space-y-3">
      {evaluations.map((ev) => (
        <div key={ev.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date(ev.created_at).toLocaleDateString()} at{" "}
              {new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tabular-nums">{Math.round(ev.total_score)}</span>
            <LevelBadge score={ev.total_score} size="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
