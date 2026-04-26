import React from "react";

interface TimeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ value, onChange, min, max }) => {
  return (
    <div className="absolute top-3 right-16 z-20 glass-panel rounded-xl px-4 py-2 flex items-center gap-3 min-w-[320px]">
      <span className="font-mono text-xs text-muted-foreground">{min}</span>
      <div className="flex-1 relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((value - min) / (max - min)) * 100}%, hsl(var(--border)) ${((value - min) / (max - min)) * 100}%, hsl(var(--border)) 100%)`,
          }}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: hsl(var(--primary));
            box-shadow: 0 0 10px hsla(var(--primary) / 0.5);
            cursor: pointer;
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: hsl(var(--primary));
            box-shadow: 0 0 10px hsla(var(--primary) / 0.5);
            cursor: pointer;
            border: none;
          }
        `}</style>
      </div>
      <span className="font-mono text-xs text-muted-foreground">{max}</span>
      <div className="border-l border-border pl-4">
        <div className="font-display text-lg text-primary">{value}</div>
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Ano</div>
      </div>
    </div>
  );
};

export default TimeSlider;
