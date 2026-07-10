import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export default function BackLink({ label, onClick, className = "" }: BackLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 bg-transparent border-0 cursor-pointer p-0 transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
