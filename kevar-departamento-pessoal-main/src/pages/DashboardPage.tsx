import { FileCheck, Check, CalendarDays } from "lucide-react";
import { GradientCard } from "@/components/GradientCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";

const payrollData = [
  { nome: "Carlos Eduardo Silva", cargo: "Analista Sr.", bruto: 8500, inss: 935, irrf: 1015, liquido: 6550 },
  { nome: "Mariana Costa", cargo: "Gerente", bruto: 12400, inss: 1286, irrf: 1814, liquido: 9300 },
  { nome: "Roberto Oliveira", cargo: "Assistente", bruto: 4200, inss: 378, irrf: 272, liquido: 3550 },
  { nome: "Juliana Mendes", cargo: "Coordenadora", bruto: 7100, inss: 781, irrf: 639, liquido: 5680 },
  { nome: "Fernando Souza", cargo: "Analista Pl.", bruto: 5800, inss: 638, irrf: 342, liquido: 4820 },
];

const totalBruto = payrollData.reduce((s, r) => s + r.bruto, 0);
const totalINSS = payrollData.reduce((s, r) => s + r.inss, 0);
const totalIRRF = payrollData.reduce((s, r) => s + r.irrf, 0);
const totalLiquido = payrollData.reduce((s, r) => s + r.liquido, 0);

const chartData = [
  { mes: "Out/24", folha: 468200, encargos: 142800 },
  { mes: "Nov/24", folha: 471500, encargos: 144200 },
  { mes: "Dez/24", folha: 490000, encargos: 152600 },
  { mes: "Jan/25", folha: 478300, encargos: 146100 },
  { mes: "Fev/25", folha: 482100, encargos: 147500 },
  { mes: "Mar/25", folha: 487320, encargos: 149800 },
];

const esocialEvents = [
  { type: "S-1200", label: "Remuneração", status: "Pendente" as const },
  { type: "S-2200", label: "Admissão", status: "Sucesso" as const },
  { type: "S-2299", label: "Desligamento", status: "Sucesso" as const },
  { type: "S-1000", label: "Empregador", status: "Pendente" as const },
];

const obligations = [
  { label: "Guia FGTS Gerada", done: true },
  { label: "Fechamento IRRF", done: true },
  { label: "Transmissão DCTFWeb", done: false },
  { label: "Relatórios de Provisão", done: false },
];

const calendarEvents = [
  { day: 5, title: "Venc. INSS", type: "alert" as const },
  { day: 7, title: "Venc. FGTS", type: "alert" as const },
  { day: 10, title: "Fechamento Folha", type: "info" as const },
  { day: 15, title: "eSocial S-1200", type: "alert" as const },
  { day: 20, title: "Adiantamento Salarial", type: "info" as const },
  { day: 25, title: "Provisão 13º", type: "info" as const },
  { day: 28, title: "DCTFWeb", type: "alert" as const },
];

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function EventCalendar() {
  const [currentMonth] = useState(new Date(2025, 2)); // March 2025
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDayOfWeek).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getEvent = (day: number) => calendarEvents.find((e) => e.day === day);

  return (
    <GradientCard variant="std" className="!p-5">
      <h4 className="font-nirmala text-lg mb-4 flex items-center justify-between text-foreground">
        Calendário de Eventos — Março/2025
        <CalendarDays size={18} className="text-muted-foreground" />
      </h4>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((day, i) => {
          const evt = day ? getEvent(day) : undefined;
          return (
            <div
              key={i}
              className={`h-10 flex flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                day === null
                  ? ""
                  : evt
                  ? evt.type === "alert"
                    ? "bg-accent/20 text-accent-foreground font-bold border border-accent/40"
                    : "bg-primary/10 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
              title={evt?.title}
            >
              {day && (
                <>
                  <span>{day}</span>
                  {evt && <span className="w-1.5 h-1.5 rounded-full bg-accent mt-0.5" />}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 space-y-2">
        {calendarEvents.map((evt, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-inter">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                evt.type === "alert" ? "bg-accent" : "bg-primary"
              }`}
            />
            <span className="text-muted-foreground">{evt.day}/03</span>
            <span className="text-foreground">{evt.title}</span>
          </div>
        ))}
      </div>
    </GradientCard>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <GradientCard variant="payroll">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 font-inter">Total Folha</p>
          <h3 className="font-nirmala text-3xl text-foreground">R$ 487.320,00</h3>
          <p className="text-[10px] text-blue-500 mt-2 font-medium font-inter">↑ 2.4% vs mês anterior</p>
        </GradientCard>

        <GradientCard variant="std">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 font-inter">Funcionários Ativos</p>
          <h3 className="font-nirmala text-3xl text-foreground">247</h3>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium font-inter">3 novas admissões</p>
        </GradientCard>

        <GradientCard variant="alert">
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 font-inter">eSocial Pendente</p>
          <h3 className="font-nirmala text-3xl text-foreground">4 eventos</h3>
          <p className="text-[10px] text-accent mt-2 font-bold font-inter">Ação necessária imediata</p>
        </GradientCard>

        <GradientCard variant="alert">
          <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1 font-inter">Próx. Vencimento FGTS</p>
          <h3 className="font-nirmala text-3xl text-foreground">07/Abr</h3>
          <p className="text-[10px] text-accent mt-2 font-bold font-inter">Em 12 dias</p>
        </GradientCard>
      </div>

      {/* Table + eSocial + Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <h2 className="font-nirmala text-xl flex items-center gap-2 text-foreground">
            Resumo do Processamento
            <span className="text-xs bg-secondary px-2 py-0.5 rounded-md border border-border font-inter font-normal">
              Março 2025
            </span>
          </h2>

          <div className="bg-card rounded-kevar border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-inter">
                <thead className="bg-secondary border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-muted-foreground font-medium">Colaborador</th>
                    <th className="px-6 py-4 text-muted-foreground font-medium">Bruto</th>
                    <th className="px-6 py-4 text-muted-foreground font-medium">INSS</th>
                    <th className="px-6 py-4 text-muted-foreground font-medium">IRRF</th>
                    <th className="px-6 py-4 text-foreground font-bold">Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payrollData.map((row, i) => (
                    <tr key={i} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{row.nome}</span>
                        <br />
                        <span className="text-[11px] text-muted-foreground">{row.cargo}</span>
                      </td>
                      <td className="px-6 py-4 font-nirmala">R$ {fmt(row.bruto)}</td>
                      <td className="px-6 py-4 font-nirmala text-destructive">- R$ {fmt(row.inss)}</td>
                      <td className="px-6 py-4 font-nirmala text-destructive">- R$ {fmt(row.irrf)}</td>
                      <td className="px-6 py-4 font-nirmala font-bold text-foreground">R$ {fmt(row.liquido)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-secondary/80 border-t-2 border-border">
                  <tr className="font-semibold text-foreground">
                    <td className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 font-nirmala">R$ {fmt(totalBruto)}</td>
                    <td className="px-6 py-4 font-nirmala text-destructive">- R$ {fmt(totalINSS)}</td>
                    <td className="px-6 py-4 font-nirmala text-destructive">- R$ {fmt(totalIRRF)}</td>
                    <td className="px-6 py-4 font-nirmala font-bold">R$ {fmt(totalLiquido)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* eSocial + Checklist + Calendar */}
        <div className="space-y-6">
          <EventCalendar />

          <GradientCard variant="esocial" className="!p-5">
            <h4 className="font-nirmala text-lg mb-4 flex items-center justify-between text-foreground">
              Monitor eSocial
              <FileCheck size={18} className="text-green-600" />
            </h4>
            <div className="space-y-3">
              {esocialEvents.map((evt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-card/50 p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase font-inter">{evt.type}</p>
                    <p className="text-xs font-medium text-foreground font-inter">{evt.label}</p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-inter ${
                      evt.status === "Pendente"
                        ? "bg-accent text-accent-foreground"
                        : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    }`}
                  >
                    {evt.status}
                  </span>
                </div>
              ))}
            </div>
          </GradientCard>

          <div className="bg-card rounded-kevar border border-border p-5 shadow-sm">
            <h4 className="font-nirmala text-lg mb-4 text-foreground">Obrigações do Mês</h4>
            <div className="space-y-4">
              {obligations.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      item.done
                        ? "bg-green-500 border-green-500"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {item.done && <Check size={12} className="text-white" />}
                  </div>
                  <span
                    className={`text-sm font-inter ${
                      item.done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        <h2 className="font-nirmala text-xl text-foreground">Custo de Folha — Últimos 6 Meses</h2>
        <GradientCard variant="std" className="!p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fontFamily: "Inter" }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                tick={{ fontSize: 11, fontFamily: "Inter" }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`R$ ${fmt(value)}`, ""]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  fontFamily: "Inter",
                  fontSize: 12,
                  backgroundColor: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Legend wrapperStyle={{ fontFamily: "Inter", fontSize: 12 }} />
              <Bar dataKey="folha" name="Folha Bruta" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="encargos" name="Encargos" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GradientCard>
      </div>
    </div>
  );
}
