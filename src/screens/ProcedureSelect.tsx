import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Stethoscope, ChevronRight, Search, AlertTriangle } from "lucide-react";
import Card from "../components/Card";
import BackLink from "../components/BackLink";
import { getAllActiveTemplates } from "../lib/procedure-templates";
import { createDemoPlan, setDemoMode } from "../lib/demo";
import { savePlan } from "../lib/plan-utils";
import type { ActiveProcedureType } from "../lib/types";

const PROCEDURE_DESCRIPTIONS: Record<ActiveProcedureType, string> = {
  colonoscopy:
    "Prep involving bowel preparation, clear liquids, dose timing, and procedure arrival.",
  egd:
    "Prep involving fasting, liquid cutoffs, medication caution, sedation planning, and arrival timing.",
};

const PROCEDURE_KEYWORDS: Record<ActiveProcedureType, readonly string[]> = {
  colonoscopy: ["colonoscopy", "colon", "bowel", "lower gi", "lower endoscopy"],
  egd: [
    "egd",
    "upper endoscopy",
    "endoscopy",
    "gastroscopy",
    "upper gi",
    "esophagogastroduodenoscopy",
  ],
};

const STORAGE_KEY = "preppal-selected-procedure";

export function loadSelectedProcedure(): ActiveProcedureType {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "colonoscopy" || stored === "egd") return stored;
  return "colonoscopy";
}

export default function ProcedureSelect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") ?? "setup";
  const [query, setQuery] = useState("");

  const templates = getAllActiveTemplates();

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTemplates = normalizedQuery
    ? templates.filter((template) => {
        const haystack = [
          template.displayName,
          PROCEDURE_DESCRIPTIONS[template.procedureType],
          ...PROCEDURE_KEYWORDS[template.procedureType],
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : templates;

  function handleSelect(procedureType: ActiveProcedureType) {
    localStorage.setItem(STORAGE_KEY, procedureType);
    if (next === "demo") {
      const plan = createDemoPlan(procedureType);
      savePlan(plan);
      setDemoMode(true);
      localStorage.setItem("preppal-raw-instructions", plan.rawInstructionText);
      navigate("/dashboard");
    } else if (next === "upload") {
      navigate("/upload");
    } else {
      navigate("/setup");
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <BackLink label="Back to Welcome" onClick={() => navigate("/")} className="self-start" />

      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-brand-500" />
          What procedure are you prepping for?
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Select your procedure type so we can tailor your prep plan.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for your procedure..."
          aria-label="Search for your procedure"
          className="w-full rounded-card border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-2 focus:outline-brand-500"
        />
      </div>

      {filteredTemplates.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredTemplates.map((template) => (
            <button
              key={template.procedureType}
              type="button"
              onClick={() => handleSelect(template.procedureType)}
              className="w-full text-left bg-transparent border-0 cursor-pointer p-0"
            >
              <Card className="hover:bg-surface-muted hover:border-brand-200 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-text-primary">
                      {template.displayName}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                      {PROCEDURE_DESCRIPTIONS[template.procedureType]}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
                </div>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <Card variant="warm" className="flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
          <div className="text-sm text-warm-800">
            <p className="font-medium">We don't support that procedure yet</p>
            <p className="mt-1 text-warm-700 leading-relaxed">
              PrepPal currently supports Colonoscopy and Upper Endoscopy (EGD)
              prep. If your procedure isn't listed, check with your clinic for
              guidance — we hope to support more procedures soon.
            </p>
          </div>
        </Card>
      )}

      {filteredTemplates.length > 0 && (
        <p className="text-xs text-text-muted text-center">
          More procedure types may be supported in the future.
        </p>
      )}
    </div>
  );
}
