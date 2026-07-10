import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, PenLine, Play, ChevronRight, ChevronDown, Lock } from "lucide-react";
import Button from "../components/Button";

export default function Welcome() {
  const navigate = useNavigate();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Header zone */}
      <div className="px-1 pt-2">
        <h1 className="font-serif text-2xl font-semibold leading-snug text-text-primary">
          Create your prep timeline from your clinic's instructions
        </h1>
      </div>

      {/* Setup panel */}
      <div className="border border-border rounded-card bg-surface p-6 shadow-card">
        {/* Upload — primary */}
        <div className="border border-brand-200 rounded-card bg-brand-50/40 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-brand-600" />
            </div>
            <h2 className="text-sm font-medium text-text-primary">
              Upload instructions
            </h2>
          </div>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
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
        <div className="mt-3 border border-border rounded-card divide-y divide-border">
          <button
            type="button"
            onClick={() => navigate("/select-procedure?next=setup")}
            className="w-full text-left px-3.5 py-3.5 flex items-center gap-3 hover:bg-surface-muted focus-within:bg-surface-muted transition-colors cursor-pointer bg-transparent border-0 group"
          >
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
              <PenLine className="w-4 h-4 text-text-muted" />
            </div>
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
            className="w-full text-left px-3.5 py-3.5 flex items-center gap-3 hover:bg-surface-muted focus-within:bg-surface-muted transition-colors cursor-pointer bg-transparent border-0 group"
          >
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-text-muted" />
            </div>
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
      <div className="px-1 flex flex-col">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowHowItWorks((v) => !v)}
            aria-expanded={showHowItWorks}
            className="flex items-center gap-1.5 text-sm font-semibold text-text-primary bg-transparent border-0 cursor-pointer p-0"
          >
            How it works
            <ChevronDown
              className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
                showHowItWorks ? "rotate-180" : ""
              }`}
            />
          </button>
          <div className="flex items-center gap-1 text-text-muted">
            <Lock className="w-3 h-3" />
            <span className="text-[11px]">Data stored on your device</span>
          </div>
        </div>
        <div
          className={`grid transition-[grid-template-rows] duration-200 ${
            showHowItWorks ? "grid-rows-[1fr] mt-2" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <ol className="flex flex-col gap-2">
              {[
                "Add your clinic instructions",
                "Review the extracted details",
                "Follow your personalized timeline",
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-secondary">{step}</span>
                </li>
              ))}
            </ol>

            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-text-muted">Supports:</span>
              <span className="text-[11px] text-text-muted bg-surface-muted border border-border rounded-full px-2 py-0.5">
                Colonoscopy
              </span>
              <span className="text-[11px] text-text-muted bg-surface-muted border border-border rounded-full px-2 py-0.5">
                EGD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
