import { useState } from "react";
import { calculateWeightedScore, getCriteriaForType, type EntityType, type ScoringCriterion } from "@/lib/scoring";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LevelBadge } from "@/components/LevelBadge";
import { ScoreGauge } from "@/components/ScoreGauge";

interface EvaluationFormProps {
  entityType: EntityType;
  onSubmit: (scores: Record<string, number>, totalScore: number) => void;
  loading?: boolean;
}

export function EvaluationForm({ entityType, onSubmit, loading }: EvaluationFormProps) {
  const criteria = getCriteriaForType(entityType);
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(criteria.map((c) => [c.key, 5]))
  );

  const totalScore = calculateWeightedScore(scores, criteria);

  const handleChange = (key: string, value: number[]) => {
    setScores((prev) => ({ ...prev, [key]: value[0] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quick Evaluation</span>
          <div className="flex items-center gap-3">
            <ScoreGauge score={totalScore} size={80} />
            <LevelBadge score={totalScore} size="lg" showScore />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {criteria.map((cat) => (
          <div key={cat.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {cat.label}
                {cat.inverted && <span className="text-muted-foreground ml-1 text-xs">(inverted)</span>}
                <span className="text-muted-foreground ml-1">({cat.weight}%)</span>
              </span>
              <span className="font-bold tabular-nums w-8 text-right">{scores[cat.key]}</span>
            </div>
            <Slider
              value={[scores[cat.key]]}
              onValueChange={(v) => handleChange(cat.key, v)}
              max={10}
              min={0}
              step={1}
            />
          </div>
        ))}
        <Button onClick={() => onSubmit(scores, totalScore)} className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Submit Evaluation"}
        </Button>
      </CardContent>
    </Card>
  );
}
