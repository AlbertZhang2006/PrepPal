import { useNavigate } from "react-router-dom";
import { Upload, PenLine, Play, ChevronRight, Lock } from "lucide-react";
import Button from "../components/Button";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Setup panel */}
      <div className="border border-border rounded-card bg-surface p-5">
        <h1 className="text-lg font-semibold text-text-primary">
          Create your prep timeline from your clinic's instructions
        </h1>

        {/* Upload — primary */}
        <div className="mt-4 border border-brand-200 rounded-lg bg-brand-50/40 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-brand-600 shrink-0" />
            <h2 className="text-sm font-medium text-text-primary">
              Upload instructions
            </h2>
          </div>
          <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
            Use a PDF, screenshot, or photo. PrepPal extracts dates, times, and
            steps for you to review.
          </p>
          <Button
            size="md"
            className="w-full mt-3"
            onClick={() => navigate("/select-procedure?next=upload")}
          >
            Upload Instructions
          </Button>
        </div>

        {/* Secondary actions */}
        <div className="mt-2.5 border border-border rounded-lg divide-y divide-border">
          <button
            type="button"
            onClick={() => navigate("/select-procedure?next=setup")}
            className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-surface-muted focus-within:bg-surface-muted transition-colors cursor-pointer bg-transparent border-0 group"
          >
            <PenLine className="w-4 h-4 text-text-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                Enter details manually
              </p>
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-200">
                <p className="text-xs text-text-muted leading-snug overflow-hidden">
                  <span className="block mt-0.5">
                    Best if you already know your procedure time and prep steps.
                  </span>
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted/40 group-hover:text-text-muted transition-colors shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/select-procedure?next=demo")}
            className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-surface-muted focus-within:bg-surface-muted transition-colors cursor-pointer bg-transparent border-0 group"
          >
            <Play className="w-4 h-4 text-text-muted shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">Try demo</p>
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-200">
                <p className="text-xs text-text-muted leading-snug overflow-hidden">
                  <span className="block mt-0.5">
                    Sample colonoscopy or EGD timeline — no personal info needed.
                  </span>
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted/40 group-hover:text-text-muted transition-colors shrink-0" />
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="px-1 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-text-muted mb-1.5">
            How it works
          </p>
          <ol className="flex flex-col gap-1">
            {[
              "Add your clinic instructions",
              "Review the extracted details",
              "Follow your personalized timeline",
            ].map((step, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-text-muted tabular-nums">
                  {i + 1}.
                </span>
                <span className="text-sm text-text-secondary">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="text-[11px] text-text-muted bg-surface-muted border border-border rounded px-1.5 py-px">
              Colonoscopy
            </span>
            <span className="text-[11px] text-text-muted bg-surface-muted border border-border rounded px-1.5 py-px">
              EGD
            </span>
          </div>
          <div className="flex items-center gap-1 text-text-muted">
            <Lock className="w-3 h-3" />
            <span className="text-[11px]">Data stored on your device</span>
          </div>
        </div>
      </div>
    </div>
  );
}
