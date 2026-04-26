import React from "react";
import { getGenerationLabel } from "@/types/database";

interface GenerationFilterProps {
  value: number | null;
  onChange: (gen: number | null) => void;
  generations: number[];
}

const GenerationFilter: React.FC<GenerationFilterProps> = ({ value, onChange, generations }) => {
  const options: { label: string; val: number | null }[] = [
    { label: "Todos", val: null },
    ...generations.map(g => ({ label: getGenerationLabel(g), val: g })),
  ];

  return (
    <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
      {options.map((opt) => {
        const active = value === opt.val;
        return (
          <button
            key={opt.label}
            onClick={() => onChange(opt.val)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-display uppercase tracking-wider whitespace-nowrap transition-all duration-200
              ${active
                ? "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default GenerationFilter;
