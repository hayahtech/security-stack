import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth,
  isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  client_name?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Em andamento": { bg: "bg-[hsl(var(--neon-cyan)/0.15)]", text: "text-[hsl(var(--neon-cyan))]" },
  "Concluído": { bg: "bg-[hsl(var(--neon-green)/0.15)]", text: "text-[hsl(var(--neon-green))]" },
  "Pausado": { bg: "bg-[hsl(var(--neon-yellow)/0.15)]", text: "text-[hsl(var(--neon-yellow))]" },
  "Cancelado": { bg: "bg-[hsl(var(--neon-red)/0.15)]", text: "text-[hsl(var(--neon-red))]" },
};

const getStatusStyle = (status: string) => STATUS_COLORS[status] || { bg: "bg-muted", text: "text-muted-foreground" };

const AgendaPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, status, deadline, clients(name)")
        .eq("user_id", user.id)
        .not("deadline", "is", null)
        .order("deadline");
      setProjects(
        (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          deadline: p.deadline,
          client_name: p.clients?.name || null,
        }))
      );
    };
    fetch();
  }, [user]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const projectsByDate = useMemo(() => {
    const map: Record<string, Project[]> = {};
    for (const p of projects) {
      if (!p.deadline) continue;
      const key = p.deadline;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [projects]);

  const getProjectsForDay = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    return projectsByDate[key] || [];
  };

  const selectedProjects = selectedDate ? getProjectsForDay(selectedDate) : [];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week header */}
            <div className="grid grid-cols-7 mb-1">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayProjects = getProjectsForDay(day);
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const selected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`relative min-h-[72px] sm:min-h-[90px] p-1 border border-border/50 text-left transition-colors
                      ${!inMonth ? "opacity-30" : ""}
                      ${today ? "bg-primary/5" : ""}
                      ${selected ? "ring-2 ring-primary ring-inset" : "hover:bg-muted/30"}
                    `}
                  >
                    <span className={`text-xs font-medium ${today ? "text-primary font-bold" : "text-foreground"}`}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayProjects.slice(0, 2).map(p => {
                        const style = getStatusStyle(p.status);
                        return (
                          <div key={p.id} className={`text-[9px] sm:text-[10px] leading-tight px-1 py-0.5 rounded truncate ${style.bg} ${style.text}`}>
                            {p.name}
                          </div>
                        );
                      })}
                      {dayProjects.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">+{dayProjects.length - 2}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDate && <p className="text-sm text-muted-foreground">Clique em um dia do calendário para ver os projetos com prazo nessa data.</p>}
            {selectedDate && selectedProjects.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum prazo nesta data.</p>
            )}
            {selectedProjects.map(p => {
              const style = getStatusStyle(p.status);
              return (
                <div key={p.id} className="rounded-lg border border-border p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <Badge className={`${style.bg} ${style.text} border-0 text-[10px] shrink-0`}>{p.status}</Badge>
                  </div>
                  {p.client_name && (
                    <p className="text-xs text-muted-foreground">Cliente: {p.client_name}</p>
                  )}
                </div>
              );
            })}

            {/* Legend */}
            <div className="pt-4 border-t border-border space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legenda</p>
              {Object.entries(STATUS_COLORS).map(([status, style]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-sm ${style.bg} border ${style.text}`} />
                  <span className="text-xs text-muted-foreground">{status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgendaPage;
