import type { ReactNode } from "react";

interface CelebrationAccentProps {
  children: ReactNode;
  className?: string;
}

const DOTS = [
  { cx: 10, cy: 14, r: 3, fill: "var(--color-calm-300)" },
  { cx: 88, cy: 10, r: 2.5, fill: "var(--color-brand-300)" },
  { cx: 95, cy: 55, r: 3.5, fill: "var(--color-warm-200)" },
  { cx: 6, cy: 62, r: 2.5, fill: "var(--color-brand-200)" },
  { cx: 50, cy: 2, r: 2, fill: "var(--color-calm-200)" },
  { cx: 80, cy: 85, r: 2.5, fill: "var(--color-calm-300)" },
] as const;

export default function CelebrationAccent({ children, className = "" }: CelebrationAccentProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 90"
        className="absolute inset-0 w-full h-full overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        {DOTS.map((dot, i) => (
          <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill={dot.fill} />
        ))}
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
