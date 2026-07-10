import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Heart,
  Trash2,
  Clock,
  Siren,
  ShieldAlert,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import BackLink from "../components/BackLink";
import {
  MILD_SYMPTOMS,
  SEVERE_SYMPTOMS,
  loadSymptomLog,
  addSymptom,
  removeSymptom,
} from "../lib/symptoms";
import type { SymptomOption, SymptomEntry } from "../lib/symptoms";
import { loadPlan } from "../lib/plan-utils";
import {
  evaluateSymptom,
  getEscalationVariant,
  type EscalationResult,
} from "../lib/escalation";

export default function SymptomTracker() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<SymptomEntry[]>(loadSymptomLog);
  const [lastResult, setLastResult] = useState<EscalationResult | null>(null);
  const [lastSymptomId, setLastSymptomId] = useState<string | null>(null);
  const plan = loadPlan();

  useEffect(() => {
    if (!plan) navigate("/", { replace: true });
  }, [plan, navigate]);

  if (!plan) return null;

  function handleLog(option: SymptomOption) {
    const updated = addSymptom(option);
    setEntries(updated);
    const result = evaluateSymptom(option.id);
    setLastResult(result);
    setLastSymptomId(option.id);
  }

  function handleRemove(entryId: string) {
    const updated = removeSymptom(entryId);
    setEntries(updated);
    const removed = entries.find((e) => e.id === entryId);
    if (removed && removed.symptomId === lastSymptomId) {
      setLastResult(null);
      setLastSymptomId(null);
    }
  }

  function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatDateLabel(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86_400_000).toDateString();
    if (d.toDateString() === today) return "Today";
    if (d.toDateString() === yesterday) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  const variant = lastResult ? getEscalationVariant(lastResult.level) : null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Back */}
      <BackLink label="Back to Dashboard" onClick={() => navigate("/dashboard")} className="self-start" />

      {/* Header */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary">
          How Are You Feeling?
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Tap anything you're experiencing — this is just for your own
          reference so you can keep track during prep.
        </p>
      </div>

      {/* Escalation feedback */}
      {lastResult && lastResult.level !== "normal" && (
        <Card variant={variant === "default" || variant === null ? undefined : variant}>
          <div role="alert" className="flex items-start gap-3">
            {lastResult.level === "urgent-care" ? (
              <Siren className="w-5 h-5 text-urgent-600 shrink-0 mt-0.5" />
            ) : lastResult.level === "contact-clinic" ? (
              <ShieldAlert className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
            ) : (
              <Heart className="w-5 h-5 text-calm-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`text-sm font-semibold ${
                lastResult.level === "urgent-care"
                  ? "text-urgent-800"
                  : lastResult.level === "contact-clinic"
                    ? "text-warm-800"
                    : "text-calm-800"
              }`}>
                {lastResult.headline}
              </h3>
              <p className={`text-sm mt-1 leading-relaxed ${
                lastResult.level === "urgent-care"
                  ? "text-urgent-700"
                  : lastResult.level === "contact-clinic"
                    ? "text-warm-700"
                    : "text-calm-700"
              }`}>
                {lastResult.guidance}
              </p>

              {lastResult.show911 && (
                <a
                  href="tel:911"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-urgent-800 hover:text-urgent-900 mt-2"
                >
                  <Phone className="w-4 h-4" />
                  Call 911
                </a>
              )}
              {lastResult.showClinicPhone && !lastResult.show911 && plan.clinicPhone && (
                <a
                  href={`tel:${plan.clinicPhone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-800 hover:text-warm-900 mt-2"
                >
                  <Phone className="w-4 h-4" />
                  Call {plan.clinicPhone}
                </a>
              )}
              {lastResult.show911 && plan.clinicPhone && (
                <a
                  href={`tel:${plan.clinicPhone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-urgent-700 hover:text-urgent-800 mt-1 ml-0"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Or call your clinic: {plan.clinicPhone}
                </a>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Mild symptoms */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2.5">
          Common during prep
        </h3>
        <div className="flex flex-wrap gap-2">
          {MILD_SYMPTOMS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleLog(s)}
              className="px-3.5 py-2 rounded-full border border-calm-200 bg-calm-50 text-sm font-medium text-calm-700 hover:bg-calm-100 hover:border-calm-300 transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severe symptoms */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2.5">
          Worth calling your clinic about
        </h3>
        <div className="flex flex-wrap gap-2">
          {SEVERE_SYMPTOMS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleLog(s)}
              className="px-3.5 py-2 rounded-full border border-warm-200 bg-warm-50 text-sm font-medium text-warm-700 hover:bg-warm-100 hover:border-warm-300 transition-colors cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {entries.length === 0 && !lastResult && (
        <Card variant="calm" className="text-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-card bg-calm-100 flex items-center justify-center">
              <Heart className="w-7 h-7 text-calm-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-calm-800">
                Nothing logged yet — that's totally fine
              </h3>
              <p className="text-xs text-calm-700 mt-1 max-w-xs mx-auto leading-relaxed">
                Most prep side effects are mild and temporary. If you notice
                anything, just tap above to keep a record for yourself.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Log history */}
      {entries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Your log
            </h3>
            <span className="text-xs text-text-muted">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <Card>
            <div className="flex flex-col divide-y divide-border">
              {entries.slice(0, 20).map((entry) => {
                const entryLevel = evaluateSymptom(entry.symptomId).level;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        entryLevel === "urgent-care"
                          ? "bg-urgent-500"
                          : entryLevel === "contact-clinic"
                            ? "bg-warm-500"
                            : entryLevel === "caution"
                              ? "bg-calm-400"
                              : "bg-surface-muted"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {entry.label}
                      </p>
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateLabel(entry.timestamp)} at{" "}
                        {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(entry.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-muted transition-colors bg-transparent border-0 cursor-pointer shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-text-muted" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Back button */}
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      {/* Safety note */}
      <p className="text-xs text-text-muted text-center py-2">
        This is for your own reference — it's not a medical assessment. When in doubt, call your clinic.
      </p>
    </div>
  );
}
