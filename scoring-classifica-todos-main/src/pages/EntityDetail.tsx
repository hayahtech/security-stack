import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { EvaluationModal } from "@/components/EvaluationModal";
import { EvaluationHistory, type EvaluationRecord } from "@/components/EvaluationHistory";
import { ScoreChart } from "@/components/ScoreChart";
import { ScoreGauge } from "@/components/ScoreGauge";
import { LevelBadge } from "@/components/LevelBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type EntityType } from "@/lib/scoring";

const EntityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [entity, setEntity] = useState<{ id: string; name: string; type: string; current_score: number | null } | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [evalOpen, setEvalOpen] = useState(false);

  const fetchEntity = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("indi_entities")
      .select("*")
      .eq("id", id)
      .single();
    setEntity(data);
  };

  const fetchEvaluations = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("indi_evaluations")
      .select("*")
      .eq("entity_id", id)
      .order("created_at", { ascending: false });

    setEvaluations(
      (data ?? []).map((d) => ({
        id: d.id,
        total_score: d.total_score,
        scores: (d.scores as Record<string, number>) ?? {},
        created_at: d.created_at,
      }))
    );
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEntity(), fetchEvaluations()]).finally(() => setLoading(false));
  }, [id]);

  const refresh = () => {
    fetchEntity();
    fetchEvaluations();
  };

  const chartData = evaluations
    .slice()
    .reverse()
    .map((ev) => ({
      date: new Date(ev.created_at).toLocaleDateString(),
      score: Math.round(ev.total_score),
    }));

  if (loading) {
    return (
      <AppLayout title="Entity Detail">
        <div className="text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  if (!entity) {
    return (
      <AppLayout title="Entity Detail">
        <div className="text-muted-foreground">Entity not found.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={entity.name}>
      <div className="space-y-6">
        {/* Current Score Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <ScoreGauge score={entity.current_score ?? 0} size={140} />
                <div>
                  <h2 className="text-xl font-semibold">{entity.name}</h2>
                  <p className="text-sm text-muted-foreground capitalize mb-2">{entity.type}</p>
                  {entity.current_score !== null ? (
                    <LevelBadge score={entity.current_score} size="lg" showScore />
                  ) : (
                    <span className="text-muted-foreground">No evaluations yet</span>
                  )}
                </div>
              </div>
              <Button onClick={() => setEvalOpen(true)} size="lg">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                New Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evaluation History</CardTitle>
            </CardHeader>
            <CardContent>
              <EvaluationHistory evaluations={evaluations} />
            </CardContent>
          </Card>
        </div>
      </div>

      <EvaluationModal
        open={evalOpen}
        onOpenChange={setEvalOpen}
        entityId={entity.id}
        entityName={entity.name}
        entityType={entity.type as EntityType}
        previousScore={entity.current_score}
        onSaved={refresh}
      />
    </AppLayout>
  );
};

export default EntityDetail;
