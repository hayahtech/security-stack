import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Target, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Calendar,
  ChevronDown, ChevronUp, MessageSquare, Plus,
} from "lucide-react";
import { objectives, quarterScore } from "@/mock/goalsData";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, { color: string; label: string }> = {
  achieved: { color: "bg-success/20 text-success border-success/30", label: "✅ Meta batida" },
  on_track: { color: "bg-primary/20 text-primary border-primary/30", label: "🔄 No ritmo" },
  at_risk: { color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", label: "🟡 Em risco" },
  behind: { color: "bg-destructive/20 text-destructive border-destructive/30", label: "🔴 Abaixo" },
};

export default function Metas() {
  const [expandedKR, setExpandedKR] = useState<string | null>(null);
  const [checkinKR, setCheckinKR] = useState<string | null>(null);

  const allKRs = objectives.flatMap((o) => o.keyResults);
  const achieved = allKRs.filter((kr) => kr.status === "achieved").length;
  const total = allKRs.length;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Metas & OKRs Financeiros</h1>
          <p className="text-muted-foreground font-data text-sm">Q1 2025 — Janeiro a Março</p>
        </div>
        <Button size="sm" className="gap-1 text-xs"><Plus className="w-3 h-3" /> Novo Objetivo</Button>
      </div>

      {/* Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-primary/30 bg-primary/5 md:col-span-2">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
              <span className="font-display text-2xl font-bold text-primary">{quarterScore}%</span>
            </div>
            <div>
              <p className="text-sm font-data font-semibold text-foreground">Score do Trimestre</p>
              <p className="text-xs text-muted-foreground font-data">Bom progresso, atenção ao churn e inadimplência</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-3 pb-3 px-4">
            <p className="text-[11px] text-muted-foreground font-data">KRs Atingidos</p>
            <p className="text-lg font-bold font-data text-success">{achieved}/{total}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-3 pb-3 px-4">
            <p className="text-[11px] text-muted-foreground font-data">Objetivos</p>
            <p className="text-lg font-bold font-data text-foreground">{objectives.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Objectives */}
      {objectives.map((obj) => (
        <Card key={obj.id} className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-data flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> OBJETIVO {obj.id}: {obj.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {obj.keyResults.map((kr) => {
              const st = statusStyles[kr.status];
              const isExpanded = expandedKR === kr.id;
              return (
                <div key={kr.id} className="border border-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedKR(isExpanded ? null : kr.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-data font-semibold text-foreground">KR {kr.id}</span>
                        <span className="text-xs font-data text-muted-foreground">{kr.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={kr.progress} className={cn("h-2 flex-1",
                          kr.status === "achieved" ? "[&>div]:bg-success" :
                          kr.status === "behind" ? "[&>div]:bg-destructive" :
                          kr.status === "at_risk" ? "[&>div]:bg-yellow-500" : ""
                        )} />
                        <span className="text-xs font-data text-muted-foreground whitespace-nowrap">{kr.progress}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-data font-semibold">{kr.current}</p>
                        <p className="text-[10px] text-muted-foreground font-data">Meta: {kr.target}</p>
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px] bg-primary/20 text-primary">{kr.responsible.initials}</AvatarFallback>
                      </Avatar>
                      <Badge className={cn("text-[10px]", st.color)}>{st.label}</Badge>
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-3 bg-muted/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-data font-semibold text-foreground">Check-ins</p>
                        <Button size="sm" variant="outline" className="text-xs h-6 gap-1" onClick={() => setCheckinKR(kr.id)}>
                          <MessageSquare className="w-3 h-3" /> Atualizar
                        </Button>
                      </div>
                      {kr.checkins.map((ci, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-card/50">
                          <Calendar className="w-3 h-3 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-data text-muted-foreground">{ci.date}</span>
                              <span className="text-[10px] font-data font-semibold text-foreground">{ci.value}</span>
                            </div>
                            <p className="text-[10px] font-data text-muted-foreground">{ci.comment}</p>
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] font-data text-muted-foreground italic">
                        Responsável: {kr.responsible.name}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
