import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LevelBadge } from "@/components/LevelBadge";
import { supabase } from "@/integrations/supabase/client";
import { getLevel, LEVELS } from "@/lib/levels";
import { type EntityType } from "@/lib/scoring";
import { Users, Truck, UserCheck, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EntityData {
  id: string;
  name: string;
  type: string;
  current_score: number | null;
  created_at: string;
}

interface ScoreHistoryRow {
  id: string;
  entity_id: string;
  score: number;
  created_at: string;
}

interface TypeSummary {
  total: number;
  avgScore: number;
  topLevel: string;
  topLevelScore: number;
}

interface ActivityItem {
  id: string;
  entityName: string;
  entityType: string;
  score: number;
  previousScore: number | null;
  date: string;
}

const TYPE_ICONS: Record<string, typeof Users> = {
  client: Users,
  supplier: Truck,
  employee: UserCheck,
};

const TYPE_COLORS: Record<string, string> = {
  client: "#0ea5e9",
  supplier: "#f59e0b",
  employee: "#8b5cf6",
};

const Index = () => {
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [history, setHistory] = useState<ScoreHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      const [entRes, histRes] = await Promise.all([
        supabase.from("indi_entities").select("*"),
        supabase.from("indi_score_history").select("*").order("created_at", { ascending: false }),
      ]);
      setEntities(entRes.data ?? []);
      setHistory(histRes.data ?? []);
      setLoading(false);
    }
    fetchAll();
  }, []);

  // --- 1. SUMMARY CARDS ---
  const getSummary = (type: string): TypeSummary => {
    const items = entities.filter((e) => e.type === type);
    const scored = items.filter((e) => e.current_score !== null);
    const avgScore = scored.length > 0
      ? scored.reduce((s, e) => s + (e.current_score ?? 0), 0) / scored.length
      : 0;
    const topItem = scored.reduce<EntityData | null>(
      (best, e) => (!best || (e.current_score ?? 0) > (best.current_score ?? 0) ? e : best),
      null
    );
    const topLevel = topItem ? getLevel(topItem.current_score ?? 0) : null;
    return {
      total: items.length,
      avgScore,
      topLevel: topLevel?.name ?? "—",
      topLevelScore: topItem?.current_score ?? 0,
    };
  };

  const summaries: { type: EntityType; label: string; icon: typeof Users; summary: TypeSummary }[] = [
    { type: "client", label: "Clients", icon: Users, summary: getSummary("client") },
    { type: "supplier", label: "Suppliers", icon: Truck, summary: getSummary("supplier") },
    { type: "employee", label: "Employees", icon: UserCheck, summary: getSummary("employee") },
  ];

  // --- 2. DISTRIBUTION CHART ---
  const distributionData = LEVELS.map((level) => {
    const row: any = { level: level.name, color: level.color };
    (["client", "supplier", "employee"] as const).forEach((type) => {
      row[type] = entities.filter(
        (e) => e.type === type && e.current_score !== null && getLevel(e.current_score).name === level.name
      ).length;
    });
    return row;
  });

  // --- 3. LEADERBOARD ---
  const getTop5 = (type: string) => {
    return entities
      .filter((e) => e.type === type && e.current_score !== null)
      .sort((a, b) => (b.current_score ?? 0) - (a.current_score ?? 0))
      .slice(0, 5)
      .map((e) => {
        const latestHist = history.find((h) => h.entity_id === e.id);
        return {
          ...e,
          lastEvalDate: latestHist?.created_at ?? e.created_at,
          level: getLevel(e.current_score ?? 0),
        };
      });
  };

  // --- 4. ACTIVITY FEED ---
  const activityFeed: ActivityItem[] = (() => {
    // Group history by entity, sorted by date desc
    const recent = history.slice(0, 50); // take enough to find last 10 unique
    const items: ActivityItem[] = [];

    for (const h of recent) {
      if (items.length >= 10) break;
      const entity = entities.find((e) => e.id === h.entity_id);
      if (!entity) continue;

      // Find previous score for this entity (the one right before this entry)
      const entityHistory = history.filter((x) => x.entity_id === h.entity_id);
      const idx = entityHistory.findIndex((x) => x.id === h.id);
      const previousScore = idx < entityHistory.length - 1 ? entityHistory[idx + 1].score : null;

      items.push({
        id: h.id,
        entityName: entity.name,
        entityType: entity.type,
        score: h.score,
        previousScore,
        date: h.created_at,
      });
    }
    return items;
  })();

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* 1. SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaries.map(({ type, label, icon: Icon, summary }) => (
            <Card key={type} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total {label}</p>
                    <p className="text-3xl font-bold">{loading ? "—" : summary.total}</p>
                    {!loading && summary.total > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Avg Score:</span>
                          <span className="font-semibold">{Math.round(summary.avgScore)}</span>
                          <LevelBadge score={summary.avgScore} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Top Level:</span>
                          <LevelBadge score={summary.topLevelScore} size="sm" />
                        </div>
                      </div>
                    )}
                  </div>
                  <Icon className="h-10 w-10 text-accent opacity-60" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 2. SCORE DISTRIBUTION CHART */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution by Level</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distributionData} barCategoryGap="15%">
                <XAxis
                  dataKey="level"
                  tick={{ fontSize: 9 }}
                  stroke="hsl(var(--muted-foreground))"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "0.8rem",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
                <Bar dataKey="client" name="Clients" fill={TYPE_COLORS.client} radius={[2, 2, 0, 0]} />
                <Bar dataKey="supplier" name="Suppliers" fill={TYPE_COLORS.supplier} radius={[2, 2, 0, 0]} />
                <Bar dataKey="employee" name="Employees" fill={TYPE_COLORS.employee} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 3. TOP 5 LEADERBOARD */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="client">
                <TabsList className="w-full">
                  <TabsTrigger value="client" className="flex-1">Clients</TabsTrigger>
                  <TabsTrigger value="supplier" className="flex-1">Suppliers</TabsTrigger>
                  <TabsTrigger value="employee" className="flex-1">Employees</TabsTrigger>
                </TabsList>
                {(["client", "supplier", "employee"] as const).map((type) => (
                  <TabsContent key={type} value={type}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Last Eval</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getTop5(type).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                              No data yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          getTop5(type).map((item, i) => (
                            <TableRow
                              key={item.id}
                              className={cn(
                                "cursor-pointer",
                                item.level.name === "AAA" && "bg-yellow-50/80 dark:bg-yellow-900/10"
                              )}
                              onClick={() => navigate(`/entity/${item.id}`)}
                            >
                              <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell className="font-bold tabular-nums">
                                {Math.round(item.current_score ?? 0)}
                              </TableCell>
                              <TableCell>
                                <LevelBadge score={item.current_score ?? 0} size="sm" />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(item.lastEvalDate).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* 4. RECENT ACTIVITY FEED */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityFeed.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No recent evaluations.</p>
              ) : (
                <div className="space-y-3">
                  {activityFeed.map((item) => {
                    const Icon = TYPE_ICONS[item.entityType] ?? Users;
                    const currentLevel = getLevel(item.score);
                    const prevLevel = item.previousScore !== null ? getLevel(item.previousScore) : null;

                    let changeType: "up" | "down" | "same" = "same";
                    if (prevLevel) {
                      if (currentLevel.number > prevLevel.number) changeType = "up";
                      else if (currentLevel.number < prevLevel.number) changeType = "down";
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.entityName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString()}{" "}
                            {new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {prevLevel && (
                            <>
                              <LevelBadge score={item.previousScore!} size="sm" />
                              {changeType === "up" && <ArrowUp className="h-4 w-4 text-success" />}
                              {changeType === "down" && <ArrowDown className="h-4 w-4 text-destructive" />}
                              {changeType === "same" && <Minus className="h-4 w-4 text-muted-foreground" />}
                            </>
                          )}
                          <LevelBadge score={item.score} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
