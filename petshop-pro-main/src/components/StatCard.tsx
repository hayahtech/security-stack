import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "primary" | "success" | "accent" | "warning";
  subtitle?: string;
}

const gradientMap = {
  primary: "bg-gradient-to-br from-[hsl(210,78%,55%)] to-[hsl(210,85%,40%)]",
  success: "bg-gradient-to-br from-[hsl(122,39%,49%)] to-[hsl(140,45%,35%)]",
  accent: "bg-gradient-to-br from-[hsl(330,90%,65%)] to-[hsl(340,80%,50%)]",
  warning: "bg-gradient-to-br from-[hsl(42,100%,55%)] to-[hsl(30,95%,50%)]",
};

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${gradientMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-2xl font-bold font-heading text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
