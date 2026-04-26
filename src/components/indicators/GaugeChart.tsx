import { cn } from "@/lib/utils";

interface GaugeChartProps {
  value: number;
  max: number;
  benchmarkExcellent: number;
  benchmarkAdequate: number;
  label: string;
  size?: number;
}

export function GaugeChart({
  value,
  max,
  benchmarkExcellent,
  benchmarkAdequate,
  label,
  size = 160,
}: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180;
  const radius = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Arc path
  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = ((deg - 180) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (startAngle: number, endAngle: number, r: number) => {
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const status =
    value >= benchmarkExcellent ? "excellent" : value >= benchmarkAdequate ? "adequate" : "attention";

  const statusColor = {
    excellent: "hsl(152, 100%, 50%)",
    adequate: "hsl(45, 100%, 50%)",
    attention: "hsl(354, 100%, 64%)",
  }[status];

  const needleEnd = polarToCartesian(cx, cy, radius - 8, angle);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background arc */}
        <path d={arcPath(0, 180, radius)} fill="none" stroke="hsl(222, 30%, 20%)" strokeWidth={10} strokeLinecap="round" />
        {/* Value arc */}
        <path d={arcPath(0, angle, radius)} fill="none" stroke={statusColor} strokeWidth={10} strokeLinecap="round" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke="hsl(210, 40%, 98%)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={4} fill="hsl(210, 40%, 98%)" />
        {/* Value text */}
        <text x={cx} y={cy - 15} textAnchor="middle" fill={statusColor} fontSize="24" fontWeight="bold" fontFamily="Sora">
          {value.toFixed(2)}
        </text>
      </svg>
      <span className="text-xs text-muted-foreground font-data mt-1">{label}</span>
    </div>
  );
}
