import { useNavigate, useSearchParams } from "react-router-dom";
import { Stethoscope, ChevronRight } from "lucide-react";
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

  const templates = getAllActiveTemplates();

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

      <div className="flex flex-col gap-3">
        {templates.map((template) => (
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

      <p className="text-xs text-text-muted text-center">
        More procedure types may be supported in the future.
      </p>
    </div>
  );
}
