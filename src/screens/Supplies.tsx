import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  RotateCcw,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import BackLink from "../components/BackLink";
import {
  loadChecklist,
  toggleItem,
  addCustomItem,
  removeItem,
  resetChecklist,
  getProgress,
} from "../lib/supplies";
import type { SupplyItem } from "../lib/supplies";
import { loadPlan } from "../lib/plan-utils";
import type { ActiveProcedureType } from "../lib/types";

export default function Supplies() {
  const navigate = useNavigate();
  const plan = loadPlan();
  const procedureType: ActiveProcedureType = (plan?.procedureType as ActiveProcedureType) ?? "colonoscopy";
  const [items, setItems] = useState<SupplyItem[]>(() => loadChecklist(procedureType));
  const [newLabel, setNewLabel] = useState("");
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const progress = getProgress(items);
  const allDone = progress.checked === progress.total && progress.total > 0;

  function handleToggle(id: string) {
    setItems(toggleItem(items, id));
  }

  function handleAdd() {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    setItems(addCustomItem(items, trimmed));
    setNewLabel("");
  }

  function handleRemove(id: string) {
    setItems(removeItem(items, id));
  }

  function handleReset() {
    setItems(resetChecklist(procedureType));
    setShowConfirmReset(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Back */}
      <BackLink label="Go back" onClick={() => navigate(-1)} className="self-start" />

      {/* Header */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-brand-500" />
          Prep Supplies
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Everything you'll want to have on hand before your prep starts.
          Check items off as you go.
        </p>
      </div>

      {/* Progress */}
      <Card className={allDone ? "bg-calm-50 border-calm-200" : undefined}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            {allDone ? "All set!" : `${progress.checked} of ${progress.total} items ready`}
          </span>
          <span className={`text-lg font-bold ${allDone ? "text-calm-600" : "text-text-primary"}`}>
            {progress.total > 0 ? Math.round((progress.checked / progress.total) * 100) : 0}%
          </span>
        </div>
        <div
          className="w-full h-2 bg-surface-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress.total > 0 ? Math.round((progress.checked / progress.total) * 100) : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress.checked} of ${progress.total} supplies ready`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              allDone ? "bg-calm-500" : "bg-brand-500"
            }`}
            style={{ width: `${progress.total > 0 ? (progress.checked / progress.total) * 100 : 0}%` }}
          />
        </div>
      </Card>

      {/* Checklist */}
      <Card>
        <div className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                className="shrink-0 bg-transparent border-0 cursor-pointer p-0"
                aria-label={item.checked ? `Uncheck ${item.label}` : `Check ${item.label}`}
              >
                {item.checked ? (
                  <CheckCircle2 className="w-5 h-5 text-calm-500" />
                ) : (
                  <Circle className="w-5 h-5 text-text-muted" />
                )}
              </button>

              <span
                className={`flex-1 text-sm leading-relaxed ${
                  item.checked
                    ? "text-text-muted"
                    : "text-text-primary"
                }`}
              >
                {item.label}
              </span>

              {item.custom && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-muted transition-colors bg-transparent border-0 cursor-pointer shrink-0"
                  aria-label={`Remove ${item.label}`}
                >
                  <Trash2 className="w-4 h-4 text-text-muted" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Add custom item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add your own item..."
          aria-label="Add a custom supply item"
          className="flex-1 rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-2 focus:outline-brand-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newLabel.trim()}
          aria-label="Add item"
          className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-0 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Reset */}
      {showConfirmReset ? (
        <Card variant="warm">
          <p className="text-sm text-warm-800 mb-3">
            This will uncheck everything and remove your custom items. Are you sure?
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setShowConfirmReset(false)}
            >
              Cancel
            </Button>
            <Button
              variant="urgent"
              size="sm"
              className="flex-1"
              onClick={handleReset}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset List
            </Button>
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setShowConfirmReset(true)}
          className="flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-secondary bg-transparent border-0 cursor-pointer p-0 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset checklist
        </button>
      )}

      {/* Link to timeline — only for colonoscopy which has a buy-supplies event */}
      {procedureType === "colonoscopy" && (
        <button
          type="button"
          onClick={() => navigate("/event/buy-supplies")}
          className="w-full text-left bg-transparent border-0 cursor-pointer p-0"
        >
          <Card className="hover:bg-surface-muted transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  View the Buy Supplies step
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Tips on what to buy and where to find it
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
            </div>
          </Card>
        </button>
      )}
    </div>
  );
}
