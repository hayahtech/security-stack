import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  Users,
  Clock,
  TrendingUp,
  Plus,
  Calculator,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { MotionDiv, staggerContainer, fadeUp, scaleIn } from "@/lib/motion";

const STATUS_COLORS: Record<string, string> = {
  "Em andamento": "hsl(187, 100%, 45%)",
  "Concluído": "hsl(145, 70%, 45%)",
  "Pausado": "hsl(45, 100%, 55%)",
  "Cancelado": "hsl(350, 85%, 55%)",
};

const PIE_COLORS = [
  "hsl(187, 100%, 45%)",
  "hsl(270, 70%, 55%)",
  "hsl(45, 100%, 55%)",
  "hsl(145, 70%, 45%)",
  "hsl(25, 95%, 55%)",
  "hsl(350, 85%, 55%)",
  "hsl(200, 80%, 50%)",
  "hsl(320, 70%, 50%)",
];

type RecentProject = {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  clients: { name: string } | null;
};

type ProjectForChart = {
  id: string;
  status: string;
  clients: { name: string } | null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalClients: 0,
    upcomingDeadlines: 0,
    totalRevenue: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectForChart[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [projectsRes, clientsRes, upcomingRes, recentRes, revenueRes, allProjRes] = await Promise.all([
        supabase.from("projects").select("id, status", { count: "exact" }).eq("user_id", user.id),
        supabase.from("clients").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase
          .from("projects")
          .select("id")
          .eq("user_id", user.id)
          .gte("deadline", new Date().toISOString().split("T")[0])
          .lte("deadline", new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]),
        supabase
          .from("projects")
          .select("id, name, status, deadline, clients(name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("projects").select("value").eq("user_id", user.id),
        supabase.from("projects").select("id, status, clients(name)").eq("user_id", user.id),
      ]);

      const active = projectsRes.data?.filter((p) => p.status === "Em andamento").length ?? 0;
      const totalRevenue = revenueRes.data?.reduce((sum, p) => sum + (p.value ?? 0), 0) ?? 0;

      setStats({
        totalProjects: projectsRes.count ?? 0,
        activeProjects: active,
        totalClients: clientsRes.count ?? 0,
        upcomingDeadlines: upcomingRes.data?.length ?? 0,
        totalRevenue,
      });
      setRecentProjects((recentRes.data ?? []) as RecentProject[]);
      setAllProjects((allProjRes.data ?? []) as ProjectForChart[]);
    };

    fetchData();
  }, [user]);

  const formattedRevenue = useMemo(() => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalRevenue);
  }, [stats.totalRevenue]);

  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    allProjects.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count, fill: STATUS_COLORS[status] || "hsl(215, 25%, 40%)" }));
  }, [allProjects]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    allProjects.forEach(p => {
      const name = p.clients?.name || "Sem cliente";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allProjects]);

  const cards = [
    { label: "Total Projetos", value: stats.totalProjects, icon: FolderKanban, gradient: "dark:from-cyan-500/20 dark:via-cyan-600/10 dark:to-transparent from-cyan-400 via-cyan-500 to-cyan-600" },
    { label: "Projetos Ativos", value: stats.activeProjects, icon: TrendingUp, gradient: "dark:from-emerald-500/20 dark:via-emerald-600/10 dark:to-transparent from-emerald-400 via-emerald-500 to-emerald-600" },
    { label: "Faturamento Total", value: formattedRevenue, icon: DollarSign, gradient: "dark:from-violet-500/20 dark:via-violet-600/10 dark:to-transparent from-violet-400 via-violet-500 to-violet-600" },
    { label: "Total Clientes", value: stats.totalClients, icon: Users, gradient: "dark:from-amber-500/20 dark:via-amber-600/10 dark:to-transparent from-amber-400 via-amber-500 to-amber-600" },
    { label: "Prazos Próximos", value: stats.upcomingDeadlines, icon: Clock, gradient: "dark:from-rose-500/20 dark:via-rose-600/10 dark:to-transparent from-rose-400 via-rose-500 to-rose-600" },
  ];

  const cardIconColors = [
    "text-cyan-400 dark:text-cyan-400 text-white",
    "text-emerald-400 dark:text-emerald-400 text-white",
    "text-violet-400 dark:text-violet-400 text-white",
    "text-amber-400 dark:text-amber-400 text-white",
    "text-rose-400 dark:text-rose-400 text-white",
  ];

  const cardIconBgs = [
    "bg-cyan-500/15 dark:bg-cyan-500/15 bg-white/20",
    "bg-emerald-500/15 dark:bg-emerald-500/15 bg-white/20",
    "bg-violet-500/15 dark:bg-violet-500/15 bg-white/20",
    "bg-amber-500/15 dark:bg-amber-500/15 bg-white/20",
    "bg-rose-500/15 dark:bg-rose-500/15 bg-white/20",
  ];

  const customTooltipStyle: React.CSSProperties = {
    backgroundColor: "hsl(215, 40%, 13%)",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "12px",
    fontFamily: "'Manrope', sans-serif",
  };

  const customTooltipLabelStyle: React.CSSProperties = { color: "#ffffff", fontWeight: 500 };
  const customTooltipItemStyle: React.CSSProperties = { color: "#ffffff" };

  return (
    <MotionDiv className="space-y-10" initial="hidden" animate="show" variants={staggerContainer}>
      <MotionDiv variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm font-light text-muted-foreground">Visão geral dos seus projetos</p>
        </div>
      </MotionDiv>

      {/* Stats cards */}
      <MotionDiv variants={staggerContainer} initial="hidden" animate="show" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card, index) => (
          <MotionDiv key={card.label} variants={fadeUp}>
            <Card className={cn(
              "border-border/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/5 overflow-hidden relative bg-gradient-to-br",
              card.gradient
            )}>
              <CardContent className="flex flex-col items-center justify-between p-7 text-center h-full gap-4 relative z-10">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", cardIconBgs[index])}>
                  <card.icon className={cn("h-6 w-6", cardIconColors[index])} />
                </div>
                <p className="text-sm font-medium text-white/80 dark:text-muted-foreground">{card.label}</p>
                <p className="text-3xl font-extrabold text-white dark:text-foreground break-words leading-tight">{card.value}</p>
              </CardContent>
            </Card>
          </MotionDiv>
        ))}
      </MotionDiv>

      {/* Charts */}
      <MotionDiv variants={staggerContainer} initial="hidden" animate="show" className="grid gap-7 lg:grid-cols-2">
        <MotionDiv variants={scaleIn}>
          <Card className="border-border transition-all duration-200 hover:shadow-lg hover:border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Projetos por Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {barData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto cadastrado.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} margin={{ top: 10, right: 15, left: -5, bottom: 10 }}>
                    <XAxis dataKey="status" tick={{ fill: "hsl(210, 15%, 55%)", fontSize: 11, fontFamily: "'Manrope', sans-serif", fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "hsl(210, 15%, 55%)", fontSize: 11, fontFamily: "'Manrope', sans-serif" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={customTooltipStyle} labelStyle={customTooltipLabelStyle} itemStyle={customTooltipItemStyle} cursor={{ fill: "hsl(215, 25%, 18%)" }} />
                    <Bar dataKey="count" name="Projetos" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={scaleIn}>
          <Card className="border-border transition-all duration-200 hover:shadow-lg hover:border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Distribuição por Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto cadastrado.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} labelStyle={customTooltipLabelStyle} itemStyle={customTooltipItemStyle} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ color: "hsl(0, 0%, 85%)", fontSize: "11px", fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>

      {/* Quick actions + Recent */}
      <MotionDiv variants={staggerContainer} initial="hidden" animate="show" className="grid gap-7 lg:grid-cols-3">
        <MotionDiv variants={fadeUp}>
          <Card className="border-border transition-all duration-200 hover:shadow-lg hover:border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start gap-2 font-medium" variant="secondary">
                <Link to="/projects/new"><Plus className="h-4 w-4" /> Novo Projeto</Link>
              </Button>
              <Button asChild className="w-full justify-start gap-2 font-medium" variant="secondary">
                <Link to="/calculator"><Calculator className="h-4 w-4" /> Calculadora</Link>
              </Button>
            </CardContent>
          </Card>
        </MotionDiv>

        <MotionDiv variants={fadeUp} className="lg:col-span-2">
          <Card className="border-border transition-all duration-200 hover:shadow-lg hover:border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Projetos Recentes</CardTitle>
              <Button asChild variant="ghost" size="sm" className="font-medium">
                <Link to="/projects">Ver todos <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>
              ) : (
                <div className="space-y-3">
                  {recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-secondary hover:shadow-sm hover:border-primary/20"
                    >
                      <div>
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.clients?.name ?? "Sem cliente"}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {project.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  );
};

export default Dashboard;
