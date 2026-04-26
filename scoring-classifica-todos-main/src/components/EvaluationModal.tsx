import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LevelBadge } from "@/components/LevelBadge";
import { ScoreGauge } from "@/components/ScoreGauge";
import { calculateWeightedScore, getCriteriaForType, type EntityType, type ScoringCriterion } from "@/lib/scoring";
import { getLevel } from "@/lib/levels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  previousScore: number | null;
  onSaved: () => void;
}

export function EvaluationModal({
  open,
  onOpenChange,
  entityId,
  entityName,
  entityType,
  previousScore,
  onSaved,
}: EvaluationModalProps) {
  const criteria = getCriteriaForType(entityType);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [levelChangeBanner, setLevelChangeBanner] = useState<{
    type: "upgrade" | "downgrade";
    oldLevel: string;
    newLevel: string;
  } | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setScores(Object.fromEntries(criteria.map((c) => [c.key, 5])));
      setNotes("");
      setLevelChangeBanner(null);
    }
  }, [open, entityType]);

  const totalScore = calculateWeightedScore(scores, criteria);
  const currentLevel = getLevel(totalScore);
  const previousLevel = previousScore !== null ? getLevel(previousScore) : null;

  const handleChange = (key: string, value: number[]) => {
    setScores((prev) => ({ ...prev, [key]: value[0] }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      // Save evaluation
      const { error: evalError } = await supabase
        .from("indi_evaluations")
        .insert({
          entity_id: entityId,
          scores: { ...scores, notes } as any,
          total_score: totalScore,
        });
      if (evalError) throw evalError;

      // Update entity current score
      await supabase
        .from("indi_entities")
        .update({ current_score: totalScore })
        .eq("id", entityId);

      // Log to score history
      await supabase
        .from("indi_score_history")
        .insert({ entity_id: entityId, score: totalScore });

      const newLevel = getLevel(totalScore);

      // Show success toast with score and level
      toast.success(
        `Evaluation saved! Score: ${Math.round(totalScore)} — Level: ${newLevel.name}`,
        { duration: 4000 }
      );

      // Check for level change
      if (previousLevel && previousLevel.name !== newLevel.name) {
        const isUpgrade = newLevel.number > previousLevel.number;
        setLevelChangeBanner({
          type: isUpgrade ? "upgrade" : "downgrade",
          oldLevel: previousLevel.name,
          newLevel: newLevel.name,
        });

        // Auto-dismiss banner after 5 seconds then close
        setTimeout(() => {
          setLevelChangeBanner(null);
          onOpenChange(false);
          onSaved();
        }, 4000);
      } else {
        onOpenChange(false);
        onSaved();
      }
    } catch (err) {
      toast.error("Failed to save evaluation");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Evaluate {entityName}</span>
            <span className="text-xs text-muted-foreground capitalize">{entityType}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Level change banner */}
        {levelChangeBanner && (
          <div
            className={cn(
              "rounded-lg p-4 text-center font-semibold text-sm animate-in fade-in slide-in-from-top-2 duration-500",
              levelChangeBanner.type === "upgrade"
                ? "bg-success/15 text-success border border-success/30"
                : "bg-destructive/15 text-destructive border border-destructive/30"
            )}
          >
            {levelChangeBanner.type === "upgrade" ? "🎉" : "⚠️"}{" "}
            {entityName} moved from {levelChangeBanner.oldLevel} to {levelChangeBanner.newLevel}!
          </div>
        )}

        {/* Live score preview */}
        <div className="flex items-center justify-center gap-4 py-3 border-b">
          <ScoreGauge score={totalScore} size={90} />
          <div className="text-center">
            <LevelBadge score={totalScore} size="lg" showScore />
            <p className="text-xs text-muted-foreground mt-1">
              {previousScore !== null
                ? `Previous: ${Math.round(previousScore)} (${previousLevel?.name})`
                : "First evaluation"}
            </p>
          </div>
        </div>

        {/* Criteria sliders */}
        <div className="space-y-5 py-2">
          {criteria.map((crit) => (
            <CriterionSlider
              key={crit.key}
              criterion={crit}
              value={scores[crit.key] ?? 5}
              onChange={(v) => handleChange(crit.key, [v])}
            />
          ))}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="eval-notes">Notes (optional)</Label>
          <Textarea
            id="eval-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any observations or context..."
            rows={3}
          />
        </div>

        {/* Save button */}
        <Button onClick={handleSave} className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : "Save Evaluation"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CriterionSlider({
  criterion,
  value,
  onChange,
}: {
  criterion: ScoringCriterion;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {criterion.label}
          {criterion.inverted && (
            <span className="text-muted-foreground ml-1 text-xs">(inverted)</span>
          )}
          <span className="text-muted-foreground ml-1">({criterion.weight}%)</span>
        </span>
        <span className="font-bold tabular-nums text-base w-8 text-right">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        max={10}
        min={0}
        step={1}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
}
