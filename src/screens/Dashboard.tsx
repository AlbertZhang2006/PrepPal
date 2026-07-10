import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  ChevronRight,
  Pill,
  ShoppingCart,
  UtensilsCrossed,
  Droplets,
  Ban,
  MapPin,
  Stethoscope,
  AlertCircle,
  MessageCircle,
  Phone,
  Activity,
  X,
  Bell,
  BellRing,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import FocusStepCard from "../components/FocusStepCard";
import CelebrationAccent from "../components/CelebrationAccent";
import type { PrepPlan, EventCategory, ActiveProcedureType } from "../lib/types";
import {
  loadPlan,
  savePlan,
  toggleEventCompleted,
  getNextUpcomingEvent,
  getCurrentEvent,
  getTimelineProgress,
  getTimeUntilProcedure,
  formatEventTime,
  getSupportingEvents,
  getEventPriority,
} from "../lib/plan-utils";
import { loadSymptomLog } from "../lib/symptoms";
import { evaluateSymptomLog } from "../lib/escalation";
import { loadChecklist, getProgress as getSuppliesProgress } from "../lib/supplies";
import { isDemoMode } from "../lib/demo";
import { loadReminderPrefs, getSimulatedReminders } from "../lib/reminders";

const CATEGORY_ICONS: Record<EventCategory, typeof Clock> = {
  preparation: ShoppingCart,
  diet: UtensilsCrossed,
  medication: Pill,
  hydration: Droplets,
  restriction: Ban,
  arrival: MapPin,
  procedure: Stethoscope,
};

type DashboardStatus =
  | "not-started"
  | "on-track"
  | "upcoming-soon"
  | "attention-needed"
  | "contact-clinic"
  | "completed";

function getDashboardStatus(plan: PrepPlan, now: Date): DashboardStatus {
  const { completed, total } = getTimelineProgress(plan.events);

  if (completed === total && total > 0) return "completed";

  const nowMs = now.getTime();

  const hasAnyCompleted = completed > 0;
  const firstEventStart = plan.events.length > 0
    ? new Date(plan.events[0].startTime).getTime()
    : Infinity;
  if (!hasAnyCompleted && nowMs < firstEventStart) return "not-started";

  const overdueRequired = plan.events.filter(
    (e) =>
      e.required &&
      !e.completed &&
      e.endTime &&
      new Date(e.endTime).getTime() < nowMs &&
      getEventPriority(e) !== "supporting"
  );

  if (overdueRequired.length >= 2) return "contact-clinic";
  if (overdueRequired.length > 0) return "attention-needed";

  const nextEvent = getNextUpcomingEvent(plan.events, now);
  if (nextEvent) {
    const untilMs = new Date(nextEvent.startTime).getTime() - nowMs;
    if (untilMs > 0 && untilMs <= 60 * 60 * 1000) return "upcoming-soon";
  }

  return "on-track";
}

function getRelativeTimeLabel(isoString: string, now: Date): string {
  const eventDate = new Date(isoString);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);

  const time = formatEventTime(isoString);
  if (diffDays === 0) return `Today at ${time}`;
  if (diffDays === 1) return `Tomorrow at ${time}`;
  if (diffDays === -1) return `Yesterday at ${time}`;
  return `${eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${time}`;
}

/* ── Status microcopy ── */

const STATUS_MICRO: Record<DashboardStatus, { label: string; note: string }> = {
  "not-started": { label: "Not Started", note: "Your prep begins soon." },
  "on-track": { label: "On Track", note: "You're doing great." },
  "upcoming-soon": { label: "Step Coming Soon", note: "Almost time — you're ready." },
  "attention-needed": { label: "Needs Attention", note: "A step may be past due." },
  "contact-clinic": { label: "Contact Clinic", note: "Please call your clinic." },
  completed: { label: "All Done", note: "You're ready for your procedure." },
};

function getStatusDotColor(status: DashboardStatus): string {
  switch (status) {
    case "on-track":
    case "completed":
      return "bg-calm-500";
    case "upcoming-soon":
    case "attention-needed":
      return "bg-warm-500";
    case "contact-clinic":
      return "bg-urgent-500";
    default:
      return "bg-text-muted";
  }
}

function getStatusCardVariant(status: DashboardStatus): "default" | "calm" | "warm" | "urgent" {
  switch (status) {
    case "on-track":
    case "completed":
      return "calm";
    case "upcoming-soon":
    case "attention-needed":
      return "warm";
    case "contact-clinic":
      return "urgent";
    default:
      return "default";
  }
}

/* ── Track modal ── */

interface TrackResult {
  headline: string;
  detail: string;
  variant: "calm" | "warm" | "urgent";
  icon: typeof Clock;
  iconColor: string;
  showClinicPhone: boolean;
  show911: boolean;
}

function getTrackResult(plan: PrepPlan, now: Date): TrackResult {
  const symptomEntries = loadSymptomLog();
  const symptomEscalation = evaluateSymptomLog(symptomEntries, 24);

  if (symptomEscalation.level === "urgent-care") {
    return {
      headline: symptomEscalation.headline,
      detail: symptomEscalation.guidance,
      variant: "urgent",
      icon: Phone,
      iconColor: "text-urgent-600",
      showClinicPhone: true,
      show911: true,
    };
  }

  if (symptomEscalation.level === "contact-clinic") {
    return {
      headline: symptomEscalation.headline,
      detail: symptomEscalation.guidance,
      variant: "urgent",
      icon: Phone,
      iconColor: "text-urgent-600",
      showClinicPhone: true,
      show911: false,
    };
  }

  const nowMs = now.getTime();

  const overdue = plan.events.filter(
    (e) =>
      e.required &&
      !e.completed &&
      getEventPriority(e) !== "supporting" &&
      (e.endTime
        ? new Date(e.endTime).getTime() < nowMs
        : new Date(e.startTime).getTime() + 24 * 60 * 60 * 1000 < nowMs)
  );

  if (overdue.length > 0) {
    const first = overdue[0];
    return {
      headline: "A step may need your attention",
      detail: `${first.title} appears to be past due. Review your instruction sheet and contact your clinic if you are unsure what to do.`,
      variant: "warm",
      icon: AlertCircle,
      iconColor: "text-warm-600",
      showClinicPhone: true,
      show911: false,
    };
  }

  const nextEvent = getNextUpcomingEvent(plan.events, now);
  if (nextEvent) {
    const untilMs = new Date(nextEvent.startTime).getTime() - nowMs;
    if (untilMs > 0 && untilMs <= 30 * 60 * 1000) {
      return {
        headline: "Upcoming step soon",
        detail: `${nextEvent.title} begins within 30 minutes. Get ready for your next step.`,
        variant: "warm",
        icon: AlertCircle,
        iconColor: "text-warm-600",
        showClinicPhone: false,
        show911: false,
      };
    }
  }

  const nextLabel = nextEvent
    ? `Your next step is ${nextEvent.title} at ${formatEventTime(nextEvent.startTime)}.`
    : "All steps are accounted for.";

  return {
    headline: "You're on track",
    detail: nextLabel,
    variant: "calm",
    icon: CheckCircle2,
    iconColor: "text-calm-600",
    showClinicPhone: false,
    show911: false,
  };
}

function TrackModal({
  plan,
  now,
  onClose,
  onOpenSymptoms,
}: {
  plan: PrepPlan;
  now: Date;
  onClose: () => void;
  onOpenSymptoms: () => void;
}) {
  const result = getTrackResult(plan, now);
  const ResultIcon = result.icon;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-surface rounded-hero shadow-hero overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" aria-hidden="true" />
            <h3 id="track-modal-title" className="font-serif text-lg font-semibold text-text-primary">
              Am I On Track?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-muted transition-colors bg-transparent border-0 cursor-pointer"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4 flex flex-col gap-4">
          <p className="text-xs text-text-muted leading-relaxed">
            This checks your timeline progress and logged symptoms. It does not
            assess medical readiness or prep quality.
          </p>

          <Card variant={result.variant}>
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  result.variant === "calm"
                    ? "bg-calm-100"
                    : result.variant === "warm"
                      ? "bg-warm-100"
                      : "bg-urgent-100"
                }`}
              >
                <ResultIcon className={`w-5 h-5 ${result.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold">{result.headline}</h4>
                <p className="text-sm mt-1 opacity-85 leading-relaxed">
                  {result.detail}
                </p>
              </div>
            </div>
            {(result.show911 || result.showClinicPhone) && (
              <div className={`mt-3 pt-3 border-t ${
                result.variant === "urgent" ? "border-urgent-200" : "border-warm-200"
              }`}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {result.show911 && (
                    <a
                      href="tel:911"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-urgent-700 hover:text-urgent-800"
                    >
                      <Phone className="w-4 h-4" />
                      Call 911
                    </a>
                  )}
                  {result.showClinicPhone && plan.clinicPhone && (
                    <a
                      href={`tel:${plan.clinicPhone}`}
                      className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                        result.variant === "urgent"
                          ? "text-urgent-700 hover:text-urgent-800"
                          : "text-warm-700 hover:text-warm-800"
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Call {plan.clinicPhone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </Card>

          <button
            type="button"
            onClick={onOpenSymptoms}
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-transparent border-0 cursor-pointer p-0 transition-colors"
          >
            <Activity className="w-4 h-4 text-brand-500" />
            Want to log how you're feeling?
          </button>

          <Button variant="secondary" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ── */

export default function Dashboard() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PrepPlan | null>(loadPlan);
  const [now, setNow] = useState(() => new Date());
  const [showTracker, setShowTracker] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!plan) navigate("/", { replace: true });
  }, [plan, navigate]);

  if (!plan) return null;

  const currentEvent = getCurrentEvent(plan.events, now);
  const nextEvent = getNextUpcomingEvent(plan.events, now);
  const heroEvent = currentEvent ?? nextEvent;
  const progress = getTimelineProgress(plan.events);
  const dashStatus = getDashboardStatus(plan, now);
  const procedureCountdown = getTimeUntilProcedure(plan, now);

  const heroSupporting = heroEvent ? getSupportingEvents(heroEvent, plan.events) : [];
  const heroGroupIds = new Set(
    heroEvent ? [heroEvent.id, ...heroSupporting.map((e) => e.id)] : [],
  );

  const comingUpEvents = plan.events
    .filter((e) => !e.completed && !heroGroupIds.has(e.id) && getEventPriority(e) !== "supporting")
    .slice(0, 2);

  const supplies = loadChecklist((plan.procedureType as ActiveProcedureType) ?? "colonoscopy");
  const sp = getSuppliesProgress(supplies);
  const suppliesAllDone = sp.checked === sp.total && sp.total > 0;

  function handleMarkComplete(eventId: string) {
    const updated = toggleEventCompleted(plan!, eventId);
    savePlan(updated);
    setPlan(updated);
  }

  return (
    <div className="flex flex-col animate-fade-in-up">
      {/* ── Primary zone: fits on first mobile screen ── */}
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-text-primary">Your Prep Plan</h2>
          <span className="text-xs text-text-muted flex items-center gap-1 bg-surface-muted rounded-full px-2.5 py-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {procedureCountdown}
          </span>
        </div>

        {/* Hero card */}
        {heroEvent ? (
          <FocusStepCard
            event={heroEvent}
            variant={currentEvent ? "current" : "next"}
            now={now}
            supportingEvents={heroSupporting}
            onView={() => navigate(`/event/${heroEvent.id}`)}
            onMarkDone={() => handleMarkComplete(heroEvent.id)}
          />
        ) : (
          <Card variant="calm" className="py-6 text-center">
            <CelebrationAccent className="mx-auto">
              <CheckCircle2 className="w-10 h-10 text-calm-500" aria-hidden="true" />
            </CelebrationAccent>
            <h3 className="font-serif text-xl font-semibold text-calm-800 mt-3">
              You're all set!
            </h3>
            <p className="text-sm text-calm-700 mt-1 leading-relaxed">
              All prep steps are complete. You're ready for tomorrow.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mx-auto mt-4"
              onClick={() => navigate("/timeline")}
            >
              Review Timeline
            </Button>
          </Card>
        )}

        {/* Status card — compact: label + note, thin bar, action */}
        <Card variant={getStatusCardVariant(dashStatus)} className="py-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(dashStatus)} ${
                dashStatus === "on-track" || dashStatus === "upcoming-soon" ? "animate-pulse-soft" : ""
              }`}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-text-primary">
              {STATUS_MICRO[dashStatus].label}
            </span>
            <span className="text-sm text-text-secondary">
              {STATUS_MICRO[dashStatus].note}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div
              className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress.completed} of ${progress.total} steps done`}
            >
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-xs text-text-muted shrink-0">
              {progress.completed}/{progress.total} done
            </span>
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <button
              type="button"
              onClick={() => setShowTracker(true)}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 bg-transparent border-0 cursor-pointer p-0 transition-colors"
            >
              Am I on track?
              <ChevronRight className="w-3 h-3" />
            </button>
            {dashStatus === "contact-clinic" && plan.clinicPhone && (
              <a
                href={`tel:${plan.clinicPhone}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-urgent-700 hover:text-urgent-800"
              >
                <Phone className="w-3 h-3" />
                Call Clinic
              </a>
            )}
          </div>
        </Card>
      </div>

      {showTracker && (
        <TrackModal
          plan={plan}
          now={now}
          onClose={() => setShowTracker(false)}
          onOpenSymptoms={() => {
            setShowTracker(false);
            navigate("/symptoms");
          }}
        />
      )}

      {/* ── Demo reminders (after primary zone, not before hero) ── */}
      {isDemoMode() && (() => {
        const prefs = loadReminderPrefs();
        const reminders = getSimulatedReminders(plan, prefs, now);
        if (reminders.length === 0) return null;
        return (
          <div className="flex flex-col gap-2 mt-5" role="region" aria-label="Reminders">
            {reminders.slice(0, 2).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/event/${r.eventId}`)}
                className="w-full text-left bg-transparent border-0 cursor-pointer p-0"
              >
                <Card
                  className={
                    r.type === "past-due"
                      ? "bg-warm-50 border-warm-200 py-3"
                      : "bg-brand-50 border-brand-200 py-3"
                  }
                >
                  <div className="flex items-center gap-3">
                    {r.type === "past-due" ? (
                      <AlertCircle className="w-4 h-4 text-warm-500 shrink-0" />
                    ) : (
                      <BellRing className="w-4 h-4 text-brand-500 shrink-0" />
                    )}
                    <p className={`text-sm flex-1 min-w-0 ${
                      r.type === "past-due" ? "text-warm-800" : "text-brand-800"
                    }`}>
                      {r.message}
                    </p>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${
                      r.type === "past-due" ? "text-warm-400" : "text-brand-400"
                    }`} />
                  </div>
                </Card>
              </button>
            ))}
          </div>
        );
      })()}

      {/* ── Coming Up ── */}
      {comingUpEvents.length > 0 && (
        <div className="mt-10">
          <p className="text-sm font-semibold text-text-primary mb-2">
            Coming Up
          </p>
          <Card>
            <div className="flex flex-col divide-y divide-border">
              {comingUpEvents.map((event) => {
                const Icon = CATEGORY_ICONS[event.category];
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="flex items-center gap-3 py-3 first:pt-0.5 last:pb-0.5 bg-transparent border-0 cursor-pointer text-left w-full hover:opacity-75 transition-opacity"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-text-muted" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {getRelativeTimeLabel(event.startTime, now)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                  </button>
                );
              })}
            </div>
          </Card>
          <button
            type="button"
            onClick={() => navigate("/timeline")}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 bg-transparent border-0 cursor-pointer p-0 mt-3 mx-auto transition-colors"
          >
            See all steps
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Tools — single quiet card ── */}
      <Card className="mt-10">
        <div className="flex flex-col divide-y divide-border">
          <button
            type="button"
            onClick={() => navigate("/supplies")}
            className="flex items-center gap-3 py-3 first:pt-0 bg-transparent border-0 cursor-pointer text-left w-full hover:opacity-75 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
              <ShoppingCart className={`w-4 h-4 ${suppliesAllDone ? "text-calm-500" : "text-text-muted"}`} aria-hidden="true" />
            </div>
            <span className="text-sm text-text-primary flex-1">Prep Supplies</span>
            <span className="text-xs text-text-muted shrink-0">
              {suppliesAllDone ? "All ready" : `${sp.checked}/${sp.total}`}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/ask")}
            className="flex items-center gap-3 py-3 bg-transparent border-0 cursor-pointer text-left w-full hover:opacity-75 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-text-muted" aria-hidden="true" />
            </div>
            <span className="text-sm text-text-primary flex-1">Ask a Question</span>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/emergency")}
            className="flex items-center gap-3 py-3 last:pb-0 bg-transparent border-0 cursor-pointer text-left w-full hover:opacity-75 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-text-muted" aria-hidden="true" />
            </div>
            <span className="text-sm text-text-primary flex-1">Clinic Numbers</span>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
          </button>
        </div>
      </Card>

      {/* ── Bottom quiet zone ── */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          type="button"
          onClick={() => navigate("/symptoms")}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary bg-transparent border-0 cursor-pointer p-0 transition-colors"
        >
          <Activity className="w-3.5 h-3.5" aria-hidden="true" />
          How are you feeling?
        </button>
        <span className="text-text-muted text-xs" aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => navigate("/reminders")}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary bg-transparent border-0 cursor-pointer p-0 transition-colors"
        >
          <Bell className="w-3.5 h-3.5" aria-hidden="true" />
          Reminders
        </button>
      </div>

    </div>
  );
}
