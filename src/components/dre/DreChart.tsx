import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DreLineItem, dreMonths } from "@/mock/dreData";
import { formatCompact } from "@/mock/financialData";

interface DreChartProps {
  data: DreLineItem[];
}

export function DreChart({ data }: DreChartProps) {
  const netRevenue = data.find((d) => d.id === "net_revenue")?.values || [];
  const ebitda = data.find((d) => d.id === "ebitda")?.values || [];
  const netIncome = data.find((d) => d.id === "net_income")?.values || [];

  const chartData = dreMonths.map((month, index) => ({
    month,
    "Receita Líquida": netRevenue[index] || 0,
    EBITDA: ebitda[index] || 0,
    "Lucro Líquido": netIncome[index] || 0,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Evolução dos Resultados
        </h3>
        <p className="text-sm text-muted-foreground font-data">
          Comparativo mensal
        </p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(222, 30%, 20%)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompact(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 35%, 13%)",
                border: "1px solid hsl(222, 30%, 20%)",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              }}
              labelStyle={{ color: "hsl(210, 40%, 98%)", fontFamily: "Sora" }}
              formatter={(value: number) => [formatCompact(value), ""]}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey="Receita Líquida"
              fill="hsl(187, 100%, 50%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="EBITDA"
              fill="hsl(252, 100%, 69%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="Lucro Líquido"
              fill="hsl(152, 100%, 50%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
