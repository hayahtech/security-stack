import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ScoreChartProps {
  data: { date: string; score: number }[];
}

export function ScoreChart({ data }: ScoreChartProps) {
  if (data.length === 0) {
    return <div className="text-muted-foreground py-6 text-center text-sm">No score history to display.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--accent))"
          strokeWidth={2.5}
          dot={{ fill: "hsl(var(--accent))", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
