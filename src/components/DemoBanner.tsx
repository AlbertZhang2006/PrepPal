import { useLocation, useNavigate } from "react-router-dom";
import { Play, X, RotateCcw, Lightbulb } from "lucide-react";
import {
  isDemoMode,
  exitDemo,
  createDemoPlan,
  getDemoHint,
  setDemoMode,
} from "../lib/demo";
import { savePlan, loadPlan } from "../lib/plan-utils";
import type { ActiveProcedureType } from "../lib/types";

export default function DemoBanner() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!isDemoMode()) return null;

  const hideOnPaths = ["/", "/upload", "/setup", "/review"];
  if (hideOnPaths.includes(location.pathname)) return null;

  const { hint } = getDemoHint(location.pathname);

  function handleReset() {
    const currentPlan = loadPlan();
    const procedureType = (currentPlan?.procedureType as ActiveProcedureType) ?? "colonoscopy";
    exitDemo();
    const plan = createDemoPlan(procedureType);
    savePlan(plan);
    setDemoMode(true);
    localStorage.setItem("preppal-raw-instructions", plan.rawInstructionText);
    navigate("/dashboard");
    window.location.reload();
  }

  function handleExit() {
    exitDemo();
    navigate("/");
    window.location.reload();
  }

  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-500 text-white">
      <div className="max-w-2xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Play className="w-3 h-3" />
            </div>
            <span className="text-sm font-semibold">Demo Mode</span>
            <span className="text-xs opacity-75 hidden sm:inline">
              · Sample Patient
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-white/20 transition-colors bg-transparent border-0 cursor-pointer text-white"
              title="Reset demo data"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium hover:bg-white/20 transition-colors bg-transparent border-0 cursor-pointer text-white"
              title="Exit demo"
            >
              <X className="w-3 h-3" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
        <div className="flex items-start gap-2 mt-1.5 pb-0.5">
          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
          <p className="text-xs leading-relaxed opacity-90">{hint}</p>
        </div>
      </div>
    </div>
  );
}
