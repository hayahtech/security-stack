import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck, UserCheck, TrendingUp } from "lucide-react";
import { LevelBadge } from "@/components/LevelBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { LEVELS } from "@/lib/levels";

interface StatsData {
  totalClients: number;
  totalSuppliers: number;
  totalEmployees: number;
  avgScore: number;
  levelDistribution: { level: string; count: number; color: string }[];
}

interface DashboardStatsProps {
  stats: StatsData;
  loading?: boolean;
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
  const cards = [
    { label: "Clients", value: stats.totalClients, icon: Users, color: "text-accent" },
    { label: "Suppliers", value: stats.totalSuppliers, icon: Truck, color: "text-accent" },
    { label: "Employees", value: stats.totalEmployees, icon: UserCheck, color: "text-accent" },
    { label: "Avg Score", value: Math.round(stats.avgScore), icon: TrendingUp, color: "text-accent", isScore: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{loading ? "—" : card.value}</p>
                    {card.isScore && !loading && stats.avgScore > 0 && (
                      <LevelBadge score={stats.avgScore} size="sm" />
                    )}
                  </div>
                </div>
                <card.icon className={`h-8 w-8 ${card.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.levelDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.levelDistribution}>
                <XAxis dataKey="level" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.levelDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
