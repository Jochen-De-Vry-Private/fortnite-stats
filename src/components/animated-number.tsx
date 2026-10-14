"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/** Counts up from 0 to `value` when scrolled into view. */
export function AnimatedNumber({ value, format }: { value: number; format: "int" | "dec2" | "dec1" | "pct" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const render = (v: number) => {
      el.textContent = formatValue(v, format);
    };
    if (!inView || reduce) {
      render(value);
      return;
    }
    const controls = animate(0, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: render });
    return () => controls.stop();
  }, [value, format, inView, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatValue(value, format)}
    </span>
  );
}

function formatValue(v: number, format: "int" | "dec2" | "dec1" | "pct") {
  switch (format) {
    case "int":
      return Math.round(v).toLocaleString("en-US");
    case "dec2":
      return v.toFixed(2);
    case "dec1":
      return v.toFixed(1);
    case "pct":
      return `${v.toFixed(1)}%`;
  }
}
