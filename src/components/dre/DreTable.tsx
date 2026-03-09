import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DreLineItem,
  dreMonths,
  calculateAH,
  calculateAV,
} from "@/mock/dreData";
import { formatCurrency } from "@/mock/financialData";
import { cn } from "@/lib/utils";

interface DreTableProps {
  data: DreLineItem[];
}

export function DreTable({ data }: DreTableProps) {
  const netRevenueValues = data.find((item) => item.id === "net_revenue")?.values || [0, 0, 0];

  const getRowStyle = (type: DreLineItem["type"]) => {
    switch (type) {
      case "subtotal":
        return "bg-muted/30 font-semibold";
      case "total":
        return "bg-gradient-to-r from-primary/10 to-secondary/10 font-bold text-lg";
      default:
        return "";
    }
  };

  const getValueColor = (value: number, type: DreLineItem["type"]) => {
    if (type === "subtotal" || type === "total") {
      return value >= 0 ? "text-success" : "text-destructive";
    }
    if (type === "deduction" || type === "expense") {
      return "text-destructive/80";
    }
    if (type === "revenue") {
      return "text-success/80";
    }
    return "";
  };

  const getAHColor = (ah: number) => {
    if (ah > 0) return "text-success";
    if (ah < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/50">
            <TableHead className="font-display font-semibold text-foreground w-[300px]">
              CONTA
            </TableHead>
            {dreMonths.map((month) => (
              <TableHead
                key={month}
                className="font-display font-semibold text-foreground text-right"
              >
                {month}
              </TableHead>
            ))}
            <TableHead className="font-display font-semibold text-foreground text-right w-[80px]">
              AH%
            </TableHead>
            <TableHead className="font-display font-semibold text-foreground text-right w-[80px]">
              AV%
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const ah = calculateAH(item.values[2], item.values[1]);
            const av = calculateAV(item.values[2], netRevenueValues[2]);

            return (
              <TableRow
                key={item.id}
                className={cn(
                  "border-b border-border/50 hover:bg-muted/20 transition-colors",
                  getRowStyle(item.type)
                )}
              >
                <TableCell
                  className={cn(
                    "font-data flex items-center gap-2",
                    item.indent && `pl-${item.indent * 6}`
                  )}
                  style={{ paddingLeft: item.indent ? `${item.indent * 24 + 16}px` : undefined }}
                >
                  <span className={item.type === "total" ? "text-foreground" : ""}>
                    {item.label}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-xs bg-card border-border"
                    >
                      <p className="text-sm font-data">{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                {item.values.map((value, index) => (
                  <TableCell
                    key={index}
                    className={cn(
                      "text-right font-data tabular-nums",
                      getValueColor(value, item.type)
                    )}
                  >
                    {value < 0
                      ? `(${formatCurrency(Math.abs(value))})`
                      : formatCurrency(value)}
                  </TableCell>
                ))}
                <TableCell
                  className={cn(
                    "text-right font-data tabular-nums font-medium",
                    getAHColor(ah)
                  )}
                >
                  {ah > 0 && "+"}
                  {ah.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right font-data tabular-nums text-muted-foreground">
                  {Math.abs(av).toFixed(1)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
