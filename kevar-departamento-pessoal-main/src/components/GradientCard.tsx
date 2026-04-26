import { cn } from "@/lib/utils";

type CardVariant = "std" | "alert" | "payroll" | "esocial" | "charges";

interface GradientCardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  std: "bg-card-std border-kevar-border",
  alert: "bg-card-alert border-kevar-amber border-[1.5px]",
  payroll: "bg-card-payroll border-kevar-border",
  esocial: "bg-card-esocial border-kevar-border",
  charges: "bg-card-charges border-kevar-border",
};

export function GradientCard({ variant = "std", children, className }: GradientCardProps) {
  return (
    <div
      className={cn(
        "rounded-kevar p-6 shadow-sm border transition-all duration-300",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
