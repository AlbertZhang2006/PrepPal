import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ScanSearch,
  PenLine,
  RotateCcw,
  Check,
  ShieldCheck,
  Phone,
  Info,
  CircleAlert,
  FileSearch,
  ClipboardList,
} from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import { generatePlan, type ManualSetupInput } from "../lib/generate-plan";
import { savePlan } from "../lib/plan-utils";
import { loadSelectedProcedure } from "./ProcedureSelect";
import type { ActiveProcedureType } from "../lib/types";
import type {
  ParsedPrepInstructions,
  FieldConfidence,
  ParseWarning,
} from "../lib/ai-parse-service";
import { detectValueConflicts } from "../lib/ai-parse-service";

// ── Field definitions ─────────────────────────────────────────

interface FieldDef {
  sourceKey: keyof ParsedPrepInstructions;
  planKey: keyof ManualSetupInput;
  label: string;
  type: "date" | "time" | "select" | "tel";
  required: boolean;
  helperText: string;
  whenMissing: string;
}

const COLONOSCOPY_FIELDS: FieldDef[] = [
  {
    sourceKey: "procedureDate",
    planKey: "procedureDate",
    label: "Procedure Date",
    type: "date",
    required: true,
    helperText: "Your entire prep timeline is built around this date.",
    whenMissing: "We need this to build your timeline. Check your instruction sheet or appointment confirmation.",
  },
  {
    sourceKey: "procedureTime",
    planKey: "procedureTime",
    label: "Procedure Time",
    type: "time",
    required: true,
    helperText: "This determines when your dose schedule, stop-liquids cutoff, and arrival time appear.",
    whenMissing: "Without this, we can't calculate your dose and fasting schedule. Check your appointment details.",
  },
  {
    sourceKey: "arrivalTime",
    planKey: "arrivalTime",
    label: "Arrival Time",
    type: "time",
    required: false,
    helperText: "When to show up at the facility. We'll estimate 1 hour before your procedure if left blank.",
    whenMissing: "",
  },
  {
    sourceKey: "prepType",
    planKey: "prepType",
    label: "Prep Type",
    type: "select",
    required: true,
    helperText: "Different preps have different instructions. This helps us give you the right guidance.",
    whenMissing: "Please select your prep so we can tailor the guidance to your specific medication.",
  },
  {
    sourceKey: "clearLiquidStart",
    planKey: "clearLiquidStartTime",
    label: "Clear Liquid Diet Starts",
    type: "time",
    required: false,
    helperText: "When to stop solid food and switch to clear liquids. Usually the morning before your procedure.",
    whenMissing: "",
  },
  {
    sourceKey: "dose1",
    planKey: "dose1Time",
    label: "Dose 1 (Evening Before)",
    type: "time",
    required: true,
    helperText: "Your first dose of prep solution. Getting this time right is important for the prep to work well.",
    whenMissing: "This is essential — check your instruction sheet for when to start your first dose.",
  },
  {
    sourceKey: "dose2",
    planKey: "dose2Time",
    label: "Dose 2 (Morning Of)",
    type: "time",
    required: true,
    helperText: "This is often time-sensitive — confirm it matches your clinic's instructions exactly.",
    whenMissing: "Most split-dose preps require this early morning dose. Check your instructions carefully.",
  },
  {
    sourceKey: "stopLiquids",
    planKey: "stopLiquidsTime",
    label: "Stop All Liquids",
    type: "time",
    required: false,
    helperText: "Follow your clinic's instructions exactly for when to stop drinking — this is a safety requirement for sedation.",
    whenMissing: "",
  },
  {
    sourceKey: "clinicPhone",
    planKey: "clinicPhone",
    label: "Clinic Phone",
    type: "tel",
    required: false,
    helperText: "We'll show this throughout the app so it's easy to call if you have questions.",
    whenMissing: "",
  },
];

const EGD_FIELDS: FieldDef[] = [
  {
    sourceKey: "procedureDate",
    planKey: "procedureDate",
    label: "Procedure Date",
    type: "date",
    required: true,
    helperText: "Your entire prep timeline is built around this date.",
    whenMissing: "We need this to build your timeline. Check your instruction sheet or appointment confirmation.",
  },
  {
    sourceKey: "procedureTime",
    planKey: "procedureTime",
    label: "Procedure Time",
    type: "time",
    required: true,
    helperText: "This determines when your fasting cutoffs and arrival time appear.",
    whenMissing: "Without this, we can't calculate your fasting schedule. Check your appointment details.",
  },
  {
    sourceKey: "arrivalTime",
    planKey: "arrivalTime",
    label: "Arrival Time",
    type: "time",
    required: false,
    helperText: "When to show up at the facility. We'll estimate 1 hour before your procedure if left blank.",
    whenMissing: "",
  },
  {
    sourceKey: "clearLiquidStart",
    planKey: "stopEatingTime",
    label: "Stop Eating Solid Food",
    type: "time",
    required: true,
    helperText: "When to stop eating — usually the evening before your procedure.",
    whenMissing: "This is essential — check your instruction sheet for when to stop eating.",
  },
  {
    sourceKey: "stopLiquids",
    planKey: "stopLiquidsTime",
    label: "Stop All Liquids",
    type: "time",
    required: true,
    helperText: "Follow your clinic's instructions exactly for when to stop drinking — this is a safety requirement for sedation.",
    whenMissing: "This is a safety requirement. Check your instruction sheet for when to stop all liquids.",
  },
  {
    sourceKey: "clinicPhone",
    planKey: "clinicPhone",
    label: "Clinic Phone",
    type: "tel",
    required: false,
    helperText: "We'll show this throughout the app so it's easy to call if you have questions.",
    whenMissing: "",
  },
];

function getFieldsForProcedure(procedureType: ActiveProcedureType): FieldDef[] {
  return procedureType === "egd" ? EGD_FIELDS : COLONOSCOPY_FIELDS;
}

const PREP_LABELS: Record<string, string> = {
  suprep: "Suprep",
  golytely: "GoLYTELY / NuLYTELY",
  miralax: "MiraLAX + Gatorade",
  clenpiq: "Clenpiq",
  other: "Other",
};

// ── Confidence badge styles ───────────────────────────────────

const CONFIDENCE_STYLES: Record<
  FieldConfidence,
  { bg: string; text: string; label: string; border: string }
> = {
  high: { bg: "bg-calm-100", text: "text-calm-700", label: "Looks good", border: "border-calm-200" },
  medium: { bg: "bg-warm-100", text: "text-warm-700", label: "Please verify", border: "border-warm-200" },
  low: { bg: "bg-urgent-100", text: "text-urgent-700", label: "Needs review", border: "border-urgent-200" },
  missing: { bg: "bg-surface-muted", text: "text-text-muted", label: "Not found", border: "border-border" },
};

const CONFIDENCE_ICON: Record<FieldConfidence, typeof CheckCircle2> = {
  high: CheckCircle2,
  medium: AlertTriangle,
  low: CircleAlert,
  missing: PenLine,
};

const SEVERITY_STYLES: Record<
  ParseWarning["severity"],
  { icon: typeof AlertTriangle; card: "urgent" | "warm" | "calm"; text: string }
> = {
  error: { icon: CircleAlert, card: "urgent", text: "text-urgent-800" },
  warning: { icon: AlertTriangle, card: "warm", text: "text-warm-800" },
  info: { icon: Info, card: "calm", text: "text-calm-800" },
};

// ── Formatting ────────────────────────────────────────────────

function fmtTime(t: string): string {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(d: string): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatValue(field: FieldDef, value: string): string {
  if (!value) return "—";
  if (field.type === "date") return fmtDate(value);
  if (field.type === "time") return fmtTime(value);
  if (field.type === "select") return PREP_LABELS[value] ?? value;
  return value;
}

// ── Load parse result from localStorage ───────────────────────

function loadParseResult(): ParsedPrepInstructions | null {
  const raw = localStorage.getItem("preppal-parse-result");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedPrepInstructions;
  } catch {
    return null;
  }
}

function loadLegacyScanResult(): ParsedPrepInstructions | null {
  const raw = localStorage.getItem("preppal-scan-result");
  if (!raw) return null;
  try {
    const old = JSON.parse(raw) as ManualSetupInput;
    return {
      procedureDate: old.procedureDate,
      procedureTime: old.procedureTime,
      arrivalTime: old.arrivalTime,
      prepType: old.prepType,
      regimenType: "split-dose",
      clearLiquidStart: old.clearLiquidStartTime,
      dose1: old.dose1Time,
      dose2: old.dose2Time,
      stopLiquids: old.stopLiquidsTime,
      clinicPhone: old.clinicPhone,
      confidence: {
        procedureDate: old.procedureDate ? "high" : "missing",
        procedureTime: old.procedureTime ? "high" : "missing",
        arrivalTime: old.arrivalTime ? "medium" : "missing",
        prepType: old.prepType ? "high" : "missing",
        regimenType: "medium",
        clearLiquidStart: old.clearLiquidStartTime ? "high" : "missing",
        dose1: old.dose1Time ? "high" : "missing",
        dose2: old.dose2Time ? "medium" : "missing",
        stopLiquids: old.stopLiquidsTime ? "high" : "missing",
        clinicPhone: old.clinicPhone ? "medium" : "missing",
      },
      overallConfidence: "partial",
      warnings: [],
      missingFields: [],
      rawText: "",
    };
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────

export default function ReviewParsed() {
  const navigate = useNavigate();
  const parseResult = loadParseResult() ?? loadLegacyScanResult();
  const selectedProcedure = loadSelectedProcedure();
  const FIELDS = getFieldsForProcedure(selectedProcedure);

  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!parseResult) return {};
    const v: Record<string, string> = {};
    for (const f of FIELDS) {
      v[f.planKey] = String(parseResult[f.sourceKey] ?? "");
    }
    return v;
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editAll, setEditAll] = useState(false);

  if (!parseResult) {
    return (
      <div className="flex flex-col gap-5 items-center py-12 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center">
          <ScanSearch className="w-8 h-8 text-text-muted" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-text-primary">
            No scanned details found
          </h3>
          <p className="text-sm text-text-secondary mt-1.5 max-w-xs mx-auto leading-relaxed">
            Upload your prep instructions and we'll extract the key details
            for you to review.
          </p>
        </div>
        <Button onClick={() => navigate("/upload")}>
          Upload Instructions
        </Button>
      </div>
    );
  }

  const { confidence, warnings, missingFields, overallConfidence } = parseResult;

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleConfirm() {
    const input: ManualSetupInput = {
      procedureDate: values.procedureDate ?? "",
      procedureTime: values.procedureTime ?? "",
      arrivalTime: values.arrivalTime ?? "",
      prepType: values.prepType ?? "",
      clearLiquidStartTime: values.clearLiquidStartTime ?? "",
      dose1Time: values.dose1Time ?? "",
      dose2Time: values.dose2Time ?? "",
      stopLiquidsTime: values.stopLiquidsTime ?? "",
      stopEatingTime: values.stopEatingTime ?? "",
      clinicPhone: values.clinicPhone ?? "",
    };
    const plan = generatePlan(input, selectedProcedure);
    plan.source = "ai-scan";
    plan.rawInstructionText =
      parseResult?.rawText ||
      localStorage.getItem("preppal-raw-instructions") ||
      "";
    savePlan(plan);
    localStorage.removeItem("preppal-parse-result");
    localStorage.removeItem("preppal-scan-result");
    navigate("/dashboard");
  }

  function isFieldEditing(key: string): boolean {
    return editAll || editingField === key;
  }

  function getFieldConfidence(field: FieldDef): FieldConfidence {
    const key = field.sourceKey as keyof typeof confidence;
    return confidence[key] ?? "missing";
  }

  function renderInput(field: FieldDef) {
    const base =
      "w-full rounded-lg border border-border px-3 py-2.5 text-sm text-text-primary bg-surface focus:outline-2 focus:outline-brand-500 focus:border-brand-500 transition-colors";

    if (field.type === "select") {
      return (
        <select
          value={values[field.planKey] ?? ""}
          onChange={(e) => update(field.planKey, e.target.value)}
          className={base}
        >
          <option value="">Select prep type</option>
          <option value="suprep">Suprep</option>
          <option value="golytely">GoLYTELY / NuLYTELY</option>
          <option value="miralax">MiraLAX + Gatorade</option>
          <option value="clenpiq">Clenpiq</option>
          <option value="other">Other / Not sure</option>
        </select>
      );
    }

    return (
      <input
        type={field.type}
        value={values[field.planKey] ?? ""}
        onChange={(e) => update(field.planKey, e.target.value)}
        placeholder={field.type === "tel" ? "(555) 123-4567" : ""}
        className={base}
        autoFocus={editingField === field.planKey}
      />
    );
  }

  const requiredMissing = FIELDS.filter(
    (f) => f.required && !values[f.planKey],
  );

  const fieldsNeedingAttention = FIELDS.filter((f) => {
    const conf = getFieldConfidence(f);
    return conf === "low" || conf === "medium" || (f.required && conf === "missing");
  });

  const conflicts = detectValueConflicts(values);
  const errorConflicts = conflicts.filter((c) => c.severity === "error");
  const warningConflicts = conflicts.filter((c) => c.severity === "warning");
  const conflictFieldKeys = new Set(conflicts.flatMap((c) => c.affectedFields));

  // ── Overall confidence banner ──

  const overallBannerVariant =
    overallConfidence === "high"
      ? "calm"
      : overallConfidence === "partial"
        ? "warm"
        : "urgent";

  const overallBannerText =
    overallConfidence === "high"
      ? "We found most of your details. Please double-check that everything matches your printed instructions."
      : overallConfidence === "partial"
        ? "We found some details but couldn't read everything clearly. Please review and fill in any blanks."
        : "We had trouble reading this document. Please check each field below and fill in anything that's missing.";

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <button
        type="button"
        onClick={() => navigate("/upload")}
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 self-start bg-transparent border-0 cursor-pointer p-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Upload
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <ScanSearch className="w-5 h-5 text-brand-500" />
          <h2 className="text-xl font-bold text-text-primary">
            Review Your Details
          </h2>
        </div>
        <p className="text-text-secondary text-sm">
          We pulled these details from your document. Please check that
          everything looks right before we build your prep plan.
        </p>
      </div>

      {/* Overall confidence banner */}
      <Card variant={overallBannerVariant} className="flex gap-3 items-start">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">
            {overallConfidence === "high"
              ? "We read your document clearly"
              : overallConfidence === "partial"
                ? "Some details need your help"
                : "This document was hard to read"}
          </p>
          <p className="mt-1 opacity-80">{overallBannerText}</p>
        </div>
      </Card>

      {/* Warnings from the parser */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {warnings.map((w, i) => {
            const sev = SEVERITY_STYLES[w.severity];
            const Icon = sev.icon;
            return (
              <Card key={`${w.field}-${i}`} variant={sev.card}>
                <div className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                  <p className={`text-sm ${sev.text}`}>{w.message}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Missing fields summary */}
      {missingFields.length > 0 && (
        <Card variant="warm" className="flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
          <div className="text-sm text-warm-800">
            <p className="font-medium">
              {missingFields.length} {missingFields.length === 1 ? "detail" : "details"}{" "}
              couldn't be found
            </p>
            <p className="mt-1 text-warm-700">
              We couldn't find: {missingFields.join(", ")}. Tap the pencil icon
              to fill {missingFields.length > 1 ? "them" : "it"} in from your instruction sheet.
            </p>
          </div>
        </Card>
      )}

      {/* Quick action: edit all fields at once */}
      {fieldsNeedingAttention.length > 0 && !editAll && (
        <button
          type="button"
          onClick={() => { setEditAll(true); setEditingField(null); }}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 bg-transparent border-0 cursor-pointer p-0 self-start"
        >
          <PenLine className="w-4 h-4" />
          Edit all fields at once
        </button>
      )}

      {/* Field-by-field review */}
      <div className="flex flex-col gap-3">
        {FIELDS.map((field) => {
          const conf = getFieldConfidence(field);
          const confStyle = CONFIDENCE_STYLES[conf];
          const ConfIcon = CONFIDENCE_ICON[conf];
          const editing = isFieldEditing(field.planKey);
          const value = values[field.planKey] ?? "";
          const isEmpty = !value;
          const needsAttention = conf === "low" || conf === "medium" || (field.required && isEmpty);
          const hasConflict = conflictFieldKeys.has(field.planKey);

          const cardBorder = hasConflict
            ? "border-2 border-warm-300 shadow-sm shadow-warm-100"
            : needsAttention
              ? `border ${confStyle.border}`
              : isEmpty && !field.required
                ? "border border-border border-dashed"
                : "border border-border";

          return (
            <div
              key={field.planKey}
              id={`field-${field.planKey}`}
              className={`rounded-xl ${cardBorder} bg-surface p-4 transition-colors`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {field.label}
                  </span>
                  {field.required && (
                    <span className="text-xs font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Confidence badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${confStyle.bg} ${confStyle.text}`}
                  >
                    <ConfIcon className="w-2.5 h-2.5" />
                    {confStyle.label}
                  </span>

                  {/* Edit toggle */}
                  {!editAll && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingField(editing ? null : field.planKey)
                      }
                      className="p-1.5 rounded-lg text-text-muted hover:text-brand-600 hover:bg-brand-50 transition-colors bg-transparent border-0 cursor-pointer"
                      title={editing ? "Done" : "Edit"}
                    >
                      {editing ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <PenLine className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Value or input */}
              {editing ? (
                <div className="mt-1.5">
                  {renderInput(field)}
                  {editAll && (
                    <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                      {field.helperText}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p
                    className={`text-sm ${
                      value ? "font-medium text-text-primary" : "text-text-muted italic"
                    }`}
                  >
                    {value ? formatValue(field, value) : (
                      field.required ? "Not found — please add this" : "Not found (optional)"
                    )}
                  </p>

                  {/* Show helper text when the field needs attention or is missing */}
                  {(needsAttention || (isEmpty && field.required)) && field.whenMissing && (
                    <p className="text-xs text-warm-600 mt-1.5 leading-relaxed flex items-start gap-1">
                      <Info className="w-3 h-3 shrink-0 mt-0.5" />
                      {field.whenMissing}
                    </p>
                  )}

                  {/* Show gentle helper when field has a value but confidence isn't high */}
                  {value && conf !== "high" && (
                    <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                      {field.helperText}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Conflicts section ── */}
      {conflicts.length > 0 && (
        <div className="flex flex-col gap-3">
          <Card variant="warm">
            <div className="flex items-start gap-3">
              <FileSearch className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
              <div className="text-sm text-warm-800">
                <p className="font-semibold">
                  Some details need review before we can build your timeline
                </p>
                <p className="mt-1 text-warm-700 leading-relaxed">
                  We noticed {conflicts.length === 1 ? "a potential issue" : `${conflicts.length} potential issues`} with
                  the times or details below. These could be scanning errors or differences
                  from your printed instructions.
                </p>
              </div>
            </div>
          </Card>

          {/* Individual conflict cards */}
          {conflicts.map((conflict) => (
            <Card
              key={conflict.id}
              variant={conflict.severity === "error" ? "urgent" : "warm"}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <CircleAlert className={`w-4 h-4 shrink-0 mt-0.5 ${
                    conflict.severity === "error" ? "text-urgent-500" : "text-warm-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold ${
                      conflict.severity === "error" ? "text-urgent-800" : "text-warm-800"
                    }`}>
                      {conflict.title}
                    </h4>
                    <p className={`text-sm mt-1 leading-relaxed ${
                      conflict.severity === "error" ? "text-urgent-700" : "text-warm-700"
                    }`}>
                      {conflict.description}
                    </p>
                  </div>
                </div>

                {/* Suggestion */}
                <div className={`text-xs leading-relaxed rounded-lg px-3 py-2 flex items-start gap-2 ${
                  conflict.severity === "error"
                    ? "bg-urgent-50 text-urgent-700"
                    : "bg-warm-50 text-warm-700"
                }`}>
                  <ClipboardList className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {conflict.suggestion}
                </div>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const firstField = conflict.affectedFields[0];
                      if (firstField) {
                        setEditAll(false);
                        setEditingField(firstField);
                        document.getElementById(`field-${firstField}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer bg-surface ${
                      conflict.severity === "error"
                        ? "border-urgent-200 text-urgent-700 hover:bg-urgent-50"
                        : "border-warm-200 text-warm-700 hover:bg-warm-50"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <PenLine className="w-3 h-3" />
                      Edit {conflict.affectedFields.length > 1 ? "these fields" : "this field"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/setup")}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer bg-surface"
                  >
                    Enter manually instead
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {/* Additional options when there are conflicts */}
          <div className="flex flex-col gap-2 px-1">
            <p className="text-xs font-medium text-text-muted">Not sure what's right?</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const raw = parseResult?.rawText || localStorage.getItem("preppal-raw-instructions") || "";
                  if (raw) {
                    navigate("/instructions");
                  }
                }}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-transparent border-0 cursor-pointer p-0 flex items-center gap-1"
              >
                <FileSearch className="w-3.5 h-3.5" />
                Check my instruction sheet
              </button>
              <span className="text-text-muted text-xs">·</span>
              <button
                type="button"
                onClick={() => navigate("/emergency")}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-transparent border-0 cursor-pointer p-0 flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                Contact my clinic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confidence legend */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-text-muted text-center">What do the badges mean?</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {(["high", "medium", "low", "missing"] as FieldConfidence[]).map(
            (c) => {
              const s = CONFIDENCE_STYLES[c];
              const Icon = CONFIDENCE_ICON[c];
              return (
                <span
                  key={c}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}
                >
                  <Icon className="w-3 h-3" />
                  {s.label}
                </span>
              );
            },
          )}
        </div>
      </div>

      {/* What happens next */}
      <Card variant="calm" className="flex gap-3 items-start">
        <CheckCircle2 className="w-5 h-5 text-calm-600 shrink-0 mt-0.5" />
        <p className="text-sm text-calm-800">
          Once you confirm, we'll build your personalized prep plan with
          guidance for each step — what to buy, when to eat, when to take your
          prep, and when to arrive. Nothing is final until you say it looks right.
        </p>
      </Card>

      {/* Required fields still missing */}
      {requiredMissing.length > 0 && (
        <Card variant="warm" className="flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
          <div className="text-sm text-warm-800">
            <p className="font-medium">
              {requiredMissing.length === 1
                ? "1 required detail is still missing"
                : `${requiredMissing.length} required details are still missing`}
            </p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {requiredMissing.map((f) => (
                <li key={f.planKey} className="flex items-center gap-1.5 text-warm-700">
                  <span className="w-1 h-1 rounded-full bg-warm-400 shrink-0" />
                  {f.label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-warm-600 text-xs">
              Tap the pencil icon next to each field to add it.
            </p>
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5">
        <Button
          size="lg"
          className="w-full"
          onClick={handleConfirm}
          disabled={requiredMissing.length > 0 || errorConflicts.length > 0}
        >
          <CheckCircle2 className="w-5 h-5" />
          {requiredMissing.length > 0
            ? `Fill in ${requiredMissing.length} required ${requiredMissing.length === 1 ? "field" : "fields"} to continue`
            : errorConflicts.length > 0
              ? `Resolve ${errorConflicts.length} ${errorConflicts.length === 1 ? "conflict" : "conflicts"} to continue`
              : warningConflicts.length > 0
                ? "Review Warnings & Build My Prep Plan"
                : "Looks Good — Build My Prep Plan"}
        </Button>

        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              setEditAll(!editAll);
              setEditingField(null);
            }}
          >
            <PenLine className="w-4 h-4" />
            {editAll ? "Done Editing" : "Edit All Fields"}
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => navigate("/")}
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted py-1">
        <Phone className="w-3 h-3" />
        When in doubt, call your clinic to double-check.
      </div>
    </div>
  );
}
