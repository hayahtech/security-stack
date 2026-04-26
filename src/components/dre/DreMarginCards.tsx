import { Percent, TrendingUp, Target, PiggyBank } from "lucide-react";
import { DreLineItem } from "@/mock/dreData";
import { cn } from "@/lib/utils";

interface DreMarginCardsProps {
  data: DreLineItem[];
}

export function DreMarginCards({ data }: DreMarginCardsProps) {
  const getLatestValue = (id: string) => {
    const item = data.find((d) => d.id === id);
    return item?.values[2] || 0;
  };

  const netRevenue = getLatestValue("net_revenue");
  const grossProfit = getLatestValue("gross_profit");
  const ebitda = getLatestValue("ebitda");
  const ebit = getLatestValue("ebit");
  const netIncome = getLatestValue("net_income");

  const margins = [
    {
      title: "Margem Bruta",
      value: ((grossProfit / netRevenue) * 100).toFixed(1),
      icon: Percent,
      color: "from-primary/20 to-primary/5 border-primary/30",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Margem EBITDA",
      value: ((ebitda / netRevenue) * 100).toFixed(1),
      icon: TrendingUp,
      color: "from-secondary/20 to-secondary/5 border-secondary/30",
      iconBg: "bg-secondary/10 text-secondary",
    },
    {
      title: "Margem Operacional",
      value: ((ebit / netRevenue) * 100).toFixed(1),
      icon: Target,
      color: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
      iconBg: "bg-yellow-500/10 text-yellow-500",
    },
    {
      title: "Margem Líquida",
      value: ((netIncome / netRevenue) * 100).toFixed(1),
      icon: PiggyBank,
      color: "from-success/20 to-success/5 border-success/30",
      iconBg: "bg-success/10 text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {margins.map((margin) => (
        <div
          key={margin.title}
          className={cn(
            "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02]",
            margin.color
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-data">
                {margin.title}
              </p>
              <p className="text-3xl font-display font-bold text-foreground">
                {margin.value}%
              </p>
            </div>
            <div className={cn("p-3 rounded-lg", margin.iconBg)}>
              <margin.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
