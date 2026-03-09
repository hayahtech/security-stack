import { useState, useEffect, useRef } from "react";

export function useCountUp(end: number, duration = 800, enabled = true) {
  const [value, setValue] = useState(0);
  const prevEnd = useRef(end);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }
    const start = prevEnd.current !== end ? prevEnd.current : 0;
    prevEnd.current = end;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [end, duration, enabled]);

  return value;
}
