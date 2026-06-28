import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Phone,
  Car,
  FileText,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import { loadPlan, formatEventTime } from "../lib/plan-utils";
import { loadChecklist } from "../lib/supplies";
import type { PrepPlan, ActiveProcedureType } from "../lib/types";
import type { SupplyItem } from "../lib/supplies";
import { getTemplate } from "../lib/procedure-templates";
import PrepPalIcon from "../components/PrepPalIcon";

const SUMMARY_STORAGE_KEY = "preppal-summary-info";

interface SummaryInfo {
  patientName: string;
  caregiverName: string;
  caregiverPhone: string;
  rideNotes: string;
}

function loadSummaryInfo(): SummaryInfo {
  const raw = localStorage.getItem(SUMMARY_STORAGE_KEY);
  if (!raw) return { patientName: "", caregiverName: "", caregiverPhone: "", rideNotes: "" };
  try {
    return JSON.parse(raw) as SummaryInfo;
  } catch {
    return { patientName: "", caregiverName: "", caregiverPhone: "", rideNotes: "" };
  }
}

function saveSummaryInfo(info: SummaryInfo): void {
  localStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(info));
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatTimelineDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getSafetyReminders(procedureType: ActiveProcedureType): readonly string[] {
  return getTemplate(procedureType).safetyNotes;
}

const DISCLAIMER =
  "This summary organizes your confirmed prep instructions. PrepPal does not replace medical advice. Always follow your healthcare team's official instructions.";

function buildPlainText(plan: PrepPlan, supplies: SupplyItem[], info: SummaryInfo): string {
  const lines: string[] = [];

  lines.push("PROCEDURE PREP SUMMARY");
  lines.push("========================");
  if (info.patientName) lines.push(`Patient: ${info.patientName}`);
  lines.push(`Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
  lines.push("");

  lines.push("PROCEDURE DETAILS");
  lines.push("-----------------");
  lines.push(`Date: ${fmtDate(plan.procedureDate)}`);
  lines.push(`Procedure time: ${fmtTime(plan.procedureTime)}`);
  lines.push(`Arrival time: ${fmtTime(plan.arrivalTime)}`);
  if (plan.location) lines.push(`Location: ${plan.location}`);
  if (plan.clinicPhone) lines.push(`Clinic phone: ${plan.clinicPhone}`);
  lines.push(`Prep type: ${plan.prepName}`);
  lines.push("");

  lines.push("PREP TIMELINE");
  lines.push("-------------");
  for (const event of plan.events) {
    const time = formatEventTime(event.startTime);
    const date = formatTimelineDate(event.startTime);
    const end = event.endTime ? ` – ${formatEventTime(event.endTime)}` : "";
    lines.push(`${date} at ${time}${end}`);
    lines.push(`  ${event.title}`);
    const firstSentence = event.guidance.whatToDo.match(/^[^.!?]+[.!?]/);
    lines.push(`  ${firstSentence ? firstSentence[0] : event.guidance.whatToDo}`);
    lines.push("");
  }

  lines.push("SUPPLIES CHECKLIST");
  lines.push("------------------");
  for (const item of supplies) {
    lines.push(`[${item.checked ? "x" : " "}] ${item.label}`);
  }
  lines.push("");

  if (info.caregiverName || info.caregiverPhone || info.rideNotes) {
    lines.push("RIDE HOME / CAREGIVER");
    lines.push("---------------------");
    if (info.caregiverName) lines.push(`Caregiver: ${info.caregiverName}`);
    if (info.caregiverPhone) lines.push(`Phone: ${info.caregiverPhone}`);
    if (info.rideNotes) lines.push(`Notes: ${info.rideNotes}`);
    lines.push("");
  }

  lines.push("SAFETY REMINDERS");
  lines.push("-----------------");
  const safetyReminders = getSafetyReminders((plan.procedureType as ActiveProcedureType) ?? "colonoscopy");
  for (const reminder of safetyReminders) {
    lines.push(`• ${reminder}`);
  }
  lines.push("");

  lines.push(DISCLAIMER);

  return lines.join("\n");
}

function InfoField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary bg-surface placeholder:text-text-muted focus:outline-2 focus:outline-brand-500 print:border-0 print:px-0 print:py-0"
      />
    </div>
  );
}

export default function PrintSummary() {
  const navigate = useNavigate();
  const plan = loadPlan();
  const procedureType: ActiveProcedureType = (plan?.procedureType as ActiveProcedureType) ?? "colonoscopy";
  const supplies = loadChecklist(procedureType);
  const summaryRef = useRef<HTMLDivElement>(null);

  const [info, setInfo] = useState<SummaryInfo>(loadSummaryInfo);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!plan) navigate("/", { replace: true });
  }, [plan, navigate]);

  useEffect(() => {
    saveSummaryInfo(info);
  }, [info]);

  if (!plan) return null;

  function updateInfo(key: keyof SummaryInfo, value: string) {
    setInfo((prev) => ({ ...prev, [key]: value }));
  }

  function handlePrint() {
    window.print();
  }

  async function handleCopy() {
    const text = buildPlainText(plan!, supplies, info);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const suppliesChecked = supplies.filter((s) => s.checked).length;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Back + actions (hidden in print) */}
      <div className="flex items-center justify-between no-print">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 bg-transparent border-0 cursor-pointer p-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary border border-border hover:bg-surface-muted transition-colors cursor-pointer bg-surface"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-calm-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Text"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors cursor-pointer border-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Printable content ── */}
      <div ref={summaryRef}>
        {/* Header */}
        <div className="text-center mb-6 print-summary">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PrepPalIcon size={32} />
            <h1 className="text-xl font-bold text-text-primary">PrepPal — Prep Summary</h1>
          </div>
          <p className="text-sm text-text-secondary">
            {fmtDate(plan.procedureDate)}
          </p>
        </div>

        {/* Patient name */}
        <div className="print-summary mb-5">
          <InfoField
            label="Patient name (optional)"
            value={info.patientName}
            onChange={(v) => updateInfo("patientName", v)}
            placeholder="Your name — helpful if sharing with a caregiver"
          />
        </div>

        {/* Procedure details */}
        <Card className="print-summary mb-4">
          <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" />
            Procedure Details
          </h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-text-muted">Date</dt>
            <dd className="text-text-primary font-medium">{fmtDate(plan.procedureDate)}</dd>

            <dt className="text-text-muted">Procedure</dt>
            <dd className="text-text-primary font-medium">{fmtTime(plan.procedureTime)}</dd>

            <dt className="text-text-muted">Arrival</dt>
            <dd className="text-text-primary font-medium">{fmtTime(plan.arrivalTime)}</dd>

            {plan.location && (
              <>
                <dt className="text-text-muted">Location</dt>
                <dd className="text-text-primary font-medium">{plan.location}</dd>
              </>
            )}

            {plan.clinicPhone && (
              <>
                <dt className="text-text-muted">Clinic phone</dt>
                <dd className="text-text-primary font-medium">{plan.clinicPhone}</dd>
              </>
            )}

            <dt className="text-text-muted">Prep type</dt>
            <dd className="text-text-primary font-medium">{plan.prepName}</dd>
          </dl>
        </Card>

        {/* Timeline */}
        <Card className="print-summary mb-4">
          <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-500" />
            Prep Timeline
          </h2>
          <div className="flex flex-col divide-y divide-border">
            {plan.events.map((event) => {
              const firstSentence = event.guidance.whatToDo.match(/^[^.!?]+[.!?]/);
              return (
                <div key={event.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{event.title}</p>
                    <p className="text-xs text-text-muted whitespace-nowrap shrink-0">
                      {formatTimelineDate(event.startTime)} · {formatEventTime(event.startTime)}
                      {event.endTime && ` – ${formatEventTime(event.endTime)}`}
                    </p>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                    {firstSentence ? firstSentence[0] : event.guidance.whatToDo}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Supplies */}
        <Card className="print-summary mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-500" />
              Supplies Checklist
            </h2>
            <span className="text-xs text-text-muted">{suppliesChecked}/{supplies.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {supplies.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                {item.checked ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-calm-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                )}
                <span className={`text-xs leading-relaxed ${item.checked ? "text-text-muted" : "text-text-primary"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Caregiver / ride info */}
        <Card className="print-summary mb-4">
          <h2 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <Car className="w-4 h-4 text-brand-500" />
            Ride Home &amp; Caregiver
          </h2>
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">
            You'll need a responsible adult to drive you home after the procedure.
            Fill in the details so they're easy to find on procedure day.
          </p>
          <div className="flex flex-col gap-3">
            <InfoField
              label="Caregiver / driver name"
              value={info.caregiverName}
              onChange={(v) => updateInfo("caregiverName", v)}
              placeholder="Who is driving you home?"
            />
            <InfoField
              label="Caregiver phone"
              value={info.caregiverPhone}
              onChange={(v) => updateInfo("caregiverPhone", v)}
              placeholder="(555) 123-4567"
              type="tel"
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-muted">Notes</label>
              <textarea
                value={info.rideNotes}
                onChange={(e) => updateInfo("rideNotes", e.target.value)}
                placeholder="Pickup time, meeting spot, or anything your driver should know"
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-text-primary bg-surface placeholder:text-text-muted focus:outline-2 focus:outline-brand-500 resize-y print:border-0 print:px-0 print:py-0"
              />
            </div>
          </div>
        </Card>

        {/* Safety reminders */}
        <Card variant="warm" className="print-summary mb-4">
          <h2 className="text-sm font-bold text-warm-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-warm-600" />
            Important Safety Reminders
          </h2>
          <ul className="flex flex-col gap-2">
            {getSafetyReminders((plan.procedureType as ActiveProcedureType) ?? "colonoscopy").map((reminder) => (
              <li key={reminder} className="flex items-start gap-2 text-xs text-warm-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-warm-400 shrink-0 mt-1.5" />
                {reminder}
              </li>
            ))}
          </ul>
          {plan.clinicPhone && (
            <div className="mt-3 pt-3 border-t border-warm-200">
              <a
                href={`tel:${plan.clinicPhone}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-800 hover:text-warm-900 print:no-underline"
              >
                <Phone className="w-3.5 h-3.5" />
                Clinic: {plan.clinicPhone}
              </a>
            </div>
          )}
        </Card>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 py-3 border-t border-border print-summary">
          <ShieldCheck className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            {DISCLAIMER}
          </p>
        </div>
      </div>

      {/* Bottom actions (hidden in print) */}
      <div className="flex flex-col gap-2.5 no-print">
        <Button className="w-full" onClick={handlePrint}>
          <Printer className="w-4 h-4" />
          Print Summary
        </Button>
        <Button variant="secondary" className="w-full" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied to Clipboard" : "Copy as Text"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
