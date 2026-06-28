import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "calm" | "warm" | "urgent";
}

const VARIANT_STYLES = {
  default: "bg-surface border-border shadow-sm",
  calm: "bg-calm-50 border-calm-200",
  warm: "bg-warm-50 border-warm-200",
  urgent: "bg-urgent-50 border-urgent-200",
} as const;

export default function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  return (
    <div
      className={`rounded-card border p-4 ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
