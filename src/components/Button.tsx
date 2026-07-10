import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "urgent" | "ghost";
  size?: "sm" | "md" | "lg";
}

const VARIANT_STYLES = {
  primary:
    "bg-gradient-to-b from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 active:from-brand-700 active:to-brand-800 shadow-card",
  secondary:
    "bg-surface text-text-primary border border-border hover:bg-surface-muted active:bg-surface-dim shadow-card",
  urgent:
    "bg-urgent-600 text-white hover:bg-urgent-700 active:bg-urgent-800 shadow-card",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-muted",
} as const;

const SIZE_STYLES = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
} as const;

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
