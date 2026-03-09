import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { monthlyEvolution, formatCompact } from "@/mock/financialData";

export function RevenueChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Evolução Mensal
        </h3>
        <p className="text-sm text-muted-foreground font-data">
          Últimos 12 meses
        </p>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={monthlyEvolution}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(252, 100%, 69%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(252, 100%, 69%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 100%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(152, 100%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="grossRevenue"
              name="Faturamento Bruto"
              stroke="hsl(187, 100%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGross)"
            />
            <Area
              type="monotone"
              dataKey="netRevenue"
              name="Faturamento Líquido"
              stroke="hsl(252, 100%, 69%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorNet)"
            />
            <Area
              type="monotone"
              dataKey="netProfit"
              name="Lucro Líquido"
              stroke="hsl(152, 100%, 50%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
