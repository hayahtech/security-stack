import { getLevel } from "@/lib/levels";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function LevelBadge({ score, size = "md", showScore = false }: LevelBadgeProps) {
  const level = getLevel(score);
  const isAAA = level.name === "AAA";

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide",
        sizeClasses[size],
        isAAA && "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20"
      )}
      style={{
        backgroundColor: level.color,
        color: level.number >= 9 && level.number <= 11 ? "#1a1a1a" : "#ffffff",
      }}
    >
      {isAAA && <span>✨</span>}
      {level.name}
      {showScore && (
        <span className="opacity-80 text-[0.85em]">({Math.round(score)})</span>
      )}
    </span>
  );
}
