import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Clock,
  Pill,
  CheckCircle2,
  Info,
} from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import { generatePlan, type ManualSetupInput } from "../lib/generate-plan";
import { savePlan } from "../lib/plan-utils";
import { loadSelectedProcedure } from "./ProcedureSelect";
import { getTemplate } from "../lib/procedure-templates";

type Step = "schedule" | "prep" | "review";

const PREP_OPTIONS = [
  {
    value: "suprep",
    label: "Suprep",
    description: "Sodium sulfate solution — two small bottles",
  },
  {
    value: "golytely",
    label: "GoLYTELY / NuLYTELY",
    description: "PEG solution — large volume jug",
  },
  {
    value: "miralax",
    label: "MiraLAX + Gatorade",
    description: "Over-the-counter combination",
  },
  {
    value: "clenpiq",
    label: "Clenpiq",
    description: "Sodium picosulfate — two small bottles",
  },
  {
    value: "other",
    label: "Other / Not sure",
    description: "We'll use general guidance for your timeline",
  },
] as const;

interface FieldProps {
  label: string;
  htmlFor: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, htmlFor, helper, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-urgent-500 ml-0.5">*</span>}
      </label>
      {children}
      {helper && <p className="text-xs text-text-muted">{helper}</p>}
    </div>
  );
}

function inputClass(hasError: boolean = false) {
  return `w-full rounded-lg border px-3 py-2.5 text-sm text-text-primary bg-surface placeholder:text-text-muted focus:outline-2 focus:outline-brand-500 focus:border-brand-500 transition-colors ${
    hasError ? "border-urgent-300 bg-urgent-50" : "border-border"
  }`;
}

const STEP_META: Record<Step, { number: number; title: string; icon: typeof Calendar }> = {
  schedule: { number: 1, title: "When Is Your Procedure?", icon: Calendar },
  prep: { number: 2, title: "Your Prep Schedule", icon: Pill },
  review: { number: 3, title: "Looks Good?", icon: CheckCircle2 },
};

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ManualSetup() {
  const navigate = useNavigate();
  const selectedProcedure = loadSelectedProcedure();
  const template = getTemplate(selectedProcedure);
  const [step, setStep] = useState<Step>("schedule");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [procedureDate, setProcedureDate] = useState("");
  const [procedureTime, setProcedureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [prepType, setPrepType] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");

  const [clearLiquidStartTime, setClearLiquidStartTime] = useState("08:00");
  const [dose1Time, setDose1Time] = useState("18:00");
  const [dose2Time, setDose2Time] = useState("");
  const [stopLiquidsTime, setStopLiquidsTime] = useState("");
  const [stopEatingTime, setStopEatingTime] = useState("22:00");

  const isEgd = selectedProcedure === "egd";

  function validateSchedule(): boolean {
    const errs: Record<string, string> = {};
    if (!procedureDate) errs.procedureDate = "Please enter your procedure date.";
    if (procedureDate && procedureDate < getTomorrow())
      errs.procedureDate = "Procedure date should be in the future.";
    if (!procedureTime) errs.procedureTime = "Please enter your procedure time.";
    if (!isEgd && !prepType) errs.prepType = "Please select your prep type.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validatePrep(): boolean {
    const errs: Record<string, string> = {};
    if (isEgd) {
      if (!stopEatingTime) errs.stopEatingTime = "Required.";
      if (!stopLiquidsTime) errs.stopLiquidsTime = "Required.";
    } else {
      if (!clearLiquidStartTime) errs.clearLiquidStartTime = "Required.";
      if (!dose1Time) errs.dose1Time = "Required.";
      if (!dose2Time) errs.dose2Time = "Required.";
      if (!stopLiquidsTime) errs.stopLiquidsTime = "Required.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === "schedule") {
      if (!validateSchedule()) return;

      if (isEgd) {
        if (!stopLiquidsTime && procedureTime) {
          const [h, m] = procedureTime.split(":").map(Number);
          const d = new Date(2000, 0, 1, h, m);
          d.setHours(d.getHours() - 2);
          setStopLiquidsTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
        }
      } else {
        if (!dose2Time && procedureTime) {
          const [h, m] = procedureTime.split(":").map(Number);
          const d = new Date(2000, 0, 1, h, m);
          d.setHours(d.getHours() - 5);
          setDose2Time(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
        }
        if (!stopLiquidsTime && procedureTime) {
          const [h, m] = procedureTime.split(":").map(Number);
          const d = new Date(2000, 0, 1, h, m);
          d.setHours(d.getHours() - 2);
          setStopLiquidsTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
        }
      }

      setStep("prep");
    } else if (step === "prep") {
      if (!validatePrep()) return;
      setStep("review");
    }
  }

  function handleBack() {
    setErrors({});
    if (step === "prep") setStep("schedule");
    else if (step === "review") setStep("prep");
    else navigate("/select-procedure?next=setup");
  }

  const [submitError, setSubmitError] = useState("");

  function handleSubmit() {
    setSubmitError("");
    try {
      const input: ManualSetupInput = {
        procedureDate,
        procedureTime,
        arrivalTime,
        prepType,
        clearLiquidStartTime,
        dose1Time,
        dose2Time,
        stopLiquidsTime,
        stopEatingTime,
        clinicPhone,
      };
      const plan = generatePlan(input, selectedProcedure);
      savePlan(plan);
      navigate("/dashboard");
    } catch {
      setSubmitError(
        "We couldn't generate your timeline. Please go back and double-check your dates and times, then try again."
      );
    }
  }

  function fmtTimeDisplay(t: string): string {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function fmtDateDisplay(d: string): string {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 self-start bg-transparent border-0 cursor-pointer p-0"
      >
        <ArrowLeft className="w-4 h-4" />
        {step === "schedule" ? "Change Procedure" : "Back"}
      </button>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {(["schedule", "prep", "review"] as Step[]).map((s, i) => {
          const meta = STEP_META[s];
          const isCurrent = s === step;
          const isPast =
            (step === "prep" && s === "schedule") ||
            (step === "review" && (s === "schedule" || s === "prep"));

          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isPast
                    ? "bg-calm-500 text-white"
                    : isCurrent
                      ? "bg-brand-600 text-white"
                      : "bg-surface-muted text-text-muted border border-border"
                }`}
              >
                {isPast ? <CheckCircle2 className="w-4 h-4" /> : meta.number}
              </div>
              {i < 2 && (
                <div
                  className={`h-0.5 flex-1 rounded ${
                    isPast ? "bg-calm-300" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div>
        <p className="text-xs font-medium text-brand-600 mb-1">
          {template.displayName}
        </p>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          {(() => { const Icon = STEP_META[step].icon; return <Icon className="w-5 h-5 text-brand-500" />; })()}
          {step === "prep" && isEgd ? "Your Fasting Schedule" : STEP_META[step].title}
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          {step === "schedule" && "Let's start with the basics from your instruction sheet."}
          {step === "prep" && (isEgd
            ? "These fasting times are on your instruction sheet from your clinic."
            : "These times are on your instruction sheet from your clinic.")}
          {step === "review" && "Take a quick look — we'll build your plan from these details."}
        </p>
      </div>

      {/* Step 1: Schedule */}
      {step === "schedule" && (
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex flex-col gap-4">
              <Field
                label="Procedure date"
                htmlFor="procedureDate"
                required
              >
                <input
                  type="date"
                  id="procedureDate"
                  value={procedureDate}
                  min={getTomorrow()}
                  onChange={(e) => setProcedureDate(e.target.value)}
                  className={inputClass(!!errors.procedureDate)}
                  aria-required="true"
                  aria-invalid={!!errors.procedureDate}
                  aria-describedby={errors.procedureDate ? "procedureDate-error" : undefined}
                />
                {errors.procedureDate && (
                  <p id="procedureDate-error" role="alert" className="text-xs text-urgent-600">{errors.procedureDate}</p>
                )}
              </Field>

              <Field
                label="Procedure time"
                htmlFor="procedureTime"
                required
                helper="The time your procedure is scheduled to begin."
              >
                <input
                  type="time"
                  id="procedureTime"
                  value={procedureTime}
                  onChange={(e) => setProcedureTime(e.target.value)}
                  className={inputClass(!!errors.procedureTime)}
                  aria-required="true"
                  aria-invalid={!!errors.procedureTime}
                  aria-describedby={errors.procedureTime ? "procedureTime-error" : undefined}
                />
                {errors.procedureTime && (
                  <p id="procedureTime-error" role="alert" className="text-xs text-urgent-600">{errors.procedureTime}</p>
                )}
              </Field>

              <Field
                label="Arrival time"
                htmlFor="arrivalTime"
                helper="Leave blank and we'll default to 1 hour before your procedure."
              >
                <input
                  type="time"
                  id="arrivalTime"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className={inputClass()}
                />
              </Field>
            </div>
          </Card>

          {!isEgd && (
            <Card>
              <Field
                label="Prep type"
                htmlFor="prepType"
                required
                helper="Select the prep solution your clinic prescribed."
              >
                <div className="flex flex-col gap-2 mt-1">
                  {PREP_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        prepType === opt.value
                          ? "border-brand-400 bg-brand-50"
                          : "border-border bg-surface hover:bg-surface-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="prepType"
                        value={opt.value}
                        checked={prepType === opt.value}
                        onChange={(e) => setPrepType(e.target.value)}
                        className="mt-0.5 accent-brand-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-text-primary">
                          {opt.label}
                        </span>
                        <p className="text-xs text-text-muted mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.prepType && (
                  <p id="prepType-error" role="alert" className="text-xs text-urgent-600 mt-1">{errors.prepType}</p>
                )}
              </Field>
            </Card>
          )}

          <Card>
            <Field
              label="Clinic phone number"
              htmlFor="clinicPhone"
              helper="Optional — we'll show this on your emergency screen."
            >
              <input
                type="tel"
                id="clinicPhone"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className={inputClass()}
              />
            </Field>
          </Card>
        </div>
      )}

      {/* Step 2: Prep timing */}
      {step === "prep" && (
        <div className="flex flex-col gap-5">
          <Card variant="calm" className="flex gap-3 items-start">
            <Info className="w-5 h-5 text-calm-600 shrink-0 mt-0.5" />
            <div className="text-sm text-calm-800">
              <p className="font-medium">Where to find these times</p>
              <p className="mt-1 text-calm-700">
                {isEgd
                  ? "These fasting times are in your instruction sheet from your clinic. We've pre-filled common defaults — adjust them to match your specific instructions."
                  : "These are in your prep instruction sheet from your clinic. We've pre-filled common defaults — adjust them to match your specific instructions."}
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4">
              {isEgd ? (
                <>
                  <Field
                    label="Stop eating solid food"
                    htmlFor="stopEatingTime"
                    required
                    helper="When to stop eating — usually the evening before your procedure."
                  >
                    <input
                      type="time"
                      id="stopEatingTime"
                      value={stopEatingTime}
                      onChange={(e) => setStopEatingTime(e.target.value)}
                      className={inputClass(!!errors.stopEatingTime)}
                      aria-required="true"
                      aria-invalid={!!errors.stopEatingTime}
                      aria-describedby={errors.stopEatingTime ? "stopEatingTime-error" : undefined}
                    />
                    {errors.stopEatingTime && (
                      <p id="stopEatingTime-error" role="alert" className="text-xs text-urgent-600">{errors.stopEatingTime}</p>
                    )}
                  </Field>

                  <Field
                    label="Stop all liquids"
                    htmlFor="stopLiquidsTime"
                    required
                    helper="Nothing by mouth after this time — this is a safety step for sedation."
                  >
                    <input
                      type="time"
                      id="stopLiquidsTime"
                      value={stopLiquidsTime}
                      onChange={(e) => setStopLiquidsTime(e.target.value)}
                      className={inputClass(!!errors.stopLiquidsTime)}
                      aria-required="true"
                      aria-invalid={!!errors.stopLiquidsTime}
                      aria-describedby={errors.stopLiquidsTime ? "stopLiquidsTime-error" : undefined}
                    />
                    {errors.stopLiquidsTime && (
                      <p id="stopLiquidsTime-error" role="alert" className="text-xs text-urgent-600">{errors.stopLiquidsTime}</p>
                    )}
                  </Field>
                </>
              ) : (
                <>
                  <Field
                    label="Clear liquid diet starts"
                    htmlFor="clearLiquidStartTime"
                    required
                    helper="When to stop eating solid food and switch to clear liquids only."
                  >
                    <input
                      type="time"
                      id="clearLiquidStartTime"
                      value={clearLiquidStartTime}
                      onChange={(e) => setClearLiquidStartTime(e.target.value)}
                      className={inputClass(!!errors.clearLiquidStartTime)}
                      aria-required="true"
                      aria-invalid={!!errors.clearLiquidStartTime}
                      aria-describedby={errors.clearLiquidStartTime ? "clearLiquidStartTime-error" : undefined}
                    />
                    {errors.clearLiquidStartTime && (
                      <p id="clearLiquidStartTime-error" role="alert" className="text-xs text-urgent-600">{errors.clearLiquidStartTime}</p>
                    )}
                  </Field>

                  <Field
                    label="Dose 1 time (evening before)"
                    htmlFor="dose1Time"
                    required
                    helper="When to start drinking your first dose of prep solution."
                  >
                    <input
                      type="time"
                      id="dose1Time"
                      value={dose1Time}
                      onChange={(e) => setDose1Time(e.target.value)}
                      className={inputClass(!!errors.dose1Time)}
                      aria-required="true"
                      aria-invalid={!!errors.dose1Time}
                      aria-describedby={errors.dose1Time ? "dose1Time-error" : undefined}
                    />
                    {errors.dose1Time && (
                      <p id="dose1Time-error" role="alert" className="text-xs text-urgent-600">{errors.dose1Time}</p>
                    )}
                  </Field>

                  <Field
                    label="Dose 2 time (morning of procedure)"
                    htmlFor="dose2Time"
                    required
                    helper="When to start your second dose. We pre-filled 5 hours before your procedure."
                  >
                    <input
                      type="time"
                      id="dose2Time"
                      value={dose2Time}
                      onChange={(e) => setDose2Time(e.target.value)}
                      className={inputClass(!!errors.dose2Time)}
                      aria-required="true"
                      aria-invalid={!!errors.dose2Time}
                      aria-describedby={errors.dose2Time ? "dose2Time-error" : undefined}
                    />
                    {errors.dose2Time && (
                      <p id="dose2Time-error" role="alert" className="text-xs text-urgent-600">{errors.dose2Time}</p>
                    )}
                  </Field>

                  <Field
                    label="Stop all liquids"
                    htmlFor="stopLiquidsTime"
                    required
                    helper="Nothing by mouth after this time — this is a safety step for sedation."
                  >
                    <input
                      type="time"
                      id="stopLiquidsTime"
                      value={stopLiquidsTime}
                      onChange={(e) => setStopLiquidsTime(e.target.value)}
                      className={inputClass(!!errors.stopLiquidsTime)}
                      aria-required="true"
                      aria-invalid={!!errors.stopLiquidsTime}
                      aria-describedby={errors.stopLiquidsTime ? "stopLiquidsTime-error" : undefined}
                    />
                    {errors.stopLiquidsTime && (
                      <p id="stopLiquidsTime-error" role="alert" className="text-xs text-urgent-600">{errors.stopLiquidsTime}</p>
                    )}
                  </Field>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              Procedure Details
            </h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-text-muted">Date</dt>
              <dd className="text-text-primary font-medium">{fmtDateDisplay(procedureDate)}</dd>
              <dt className="text-text-muted">Type</dt>
              <dd className="text-text-primary font-medium">{template.displayName}</dd>
              <dt className="text-text-muted">Procedure</dt>
              <dd className="text-text-primary font-medium">{fmtTimeDisplay(procedureTime)}</dd>
              <dt className="text-text-muted">Arrival</dt>
              <dd className="text-text-primary font-medium">
                {arrivalTime ? fmtTimeDisplay(arrivalTime) : (() => {
                  const [h, m] = procedureTime.split(":").map(Number);
                  const d = new Date(2000, 0, 1, h, m);
                  d.setHours(d.getHours() - 1);
                  return `${fmtTimeDisplay(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`)} (1 hr before)`;
                })()}
              </dd>
              {!isEgd && (
                <>
                  <dt className="text-text-muted">Prep</dt>
                  <dd className="text-text-primary font-medium">
                    {PREP_OPTIONS.find((o) => o.value === prepType)?.label ?? prepType}
                  </dd>
                </>
              )}
              {clinicPhone && (
                <>
                  <dt className="text-text-muted">Clinic</dt>
                  <dd className="text-text-primary font-medium">{clinicPhone}</dd>
                </>
              )}
            </dl>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              {isEgd ? "Fasting Schedule" : "Prep Timing"}
            </h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {isEgd ? (
                <>
                  <dt className="text-text-muted">Stop eating</dt>
                  <dd className="text-text-primary font-medium">{fmtTimeDisplay(stopEatingTime)} (evening before)</dd>
                  <dt className="text-text-muted">Stop liquids</dt>
                  <dd className="text-text-primary font-medium">{fmtTimeDisplay(stopLiquidsTime)} (morning of)</dd>
                </>
              ) : (
                <>
                  <dt className="text-text-muted">Clear liquids</dt>
                  <dd className="text-text-primary font-medium">{fmtTimeDisplay(clearLiquidStartTime)} (day before)</dd>
                  <dt className="text-text-muted">Dose 1</dt>
                  <dd className="text-text-primary font-medium">{fmtTimeDisplay(dose1Time)} (evening before)</dd>
                  <dt className="text-text-muted">Dose 2</dt>
                  <dd className="text-text-primary font-medium">{fmtTimeDisplay(dose2Time)} (morning of)</dd>
                  <dt className="text-text-muted">Stop liquids</dt>
                  <dd className="text-text-primary font-medium">{fmtTimeDisplay(stopLiquidsTime)} (morning of)</dd>
                </>
              )}
            </dl>
          </Card>

          <Card variant="calm" className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-calm-600 shrink-0 mt-0.5" />
            <p className="text-sm text-calm-800">
              {isEgd
                ? "We'll generate a personalized timeline with 4 events, including fasting cutoffs, arrival, and your procedure. Each event includes guidance on what to do, what to expect, and when to contact your clinic."
                : "We'll generate a personalized timeline with 9 events, including supply shopping, diet changes, both prep doses, and your arrival. Each event includes guidance on what to do, what to expect, and when to contact your clinic."}
            </p>
          </Card>

          {submitError && (
            <Card variant="warm" className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
              <div className="text-sm text-warm-800">
                <p className="font-medium">Timeline could not be generated</p>
                <p className="mt-1 text-warm-700">{submitError}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {step === "review" ? (
          <Button className="flex-1" onClick={handleSubmit}>
            <CheckCircle2 className="w-4 h-4" />
            Build My Timeline
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleNext}>
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-text-muted text-center">
        Your information stays on this device and is never sent to any server.
      </p>
    </div>
  );
}
