import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  Circle,
  CalendarPlus,
  ChevronRight,
} from "lucide-react";
import Card from "../components/Card";
import FocusStepCard from "../components/FocusStepCard";
import CelebrationAccent from "../components/CelebrationAccent";
import type { PrepPlan, PrepEvent } from "../lib/types";
import {
  loadPlan,
  savePlan,
  toggleEventCompleted,
  getTimelineProgress,
  getCurrentEvent,
  getNextUpcomingEvent,
  getSupportingEvents,
  getEventPriority,
  formatEventTime,
} from "../lib/plan-utils";
import { downloadIcs } from "../lib/calendar-export";

/* ── Item status ── */

type ItemStatus = "completed" | "current" | "upcoming" | "attention";

function getItemStatus(event: PrepEvent, now: Date): ItemStatus {
  if (event.completed) return "completed";

  const nowMs = now.getTime();
  const startMs = new Date(event.startTime).getTime();

  if (startMs > nowMs) return "upcoming";

  if (event.endTime) {
    const endMs = new Date(event.endTime).getTime();
    if (nowMs <= endMs) return "current";
    return "attention";
  }

  if (nowMs - startMs > 24 * 60 * 60 * 1000) return "attention";

  return "current";
}

/* ── Phase grouping ── */

type Phase = "before-prep" | "evening-prep" | "morning-prep" | "procedure-day";

const PHASE_LABELS: Record<Phase, string> = {
  "before-prep": "Before Prep",
  "evening-prep": "Evening Prep",
  "morning-prep": "Morning of Procedure",
  "procedure-day": "Procedure",
};

const PHASE_ORDER: Phase[] = ["before-prep", "evening-prep", "morning-prep", "procedure-day"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function getDayBefore(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function getPhase(event: PrepEvent, procedureDate: string): Phase {
  const eventDate = event.startTime.slice(0, 10);

  if (eventDate === procedureDate) {
    return (event.category === "arrival" || event.category === "procedure")
      ? "procedure-day"
      : "morning-prep";
  }

  const dayBefore = getDayBefore(procedureDate);
  if (eventDate === dayBefore) {
    const hour = new Date(event.startTime).getHours();
    return (event.category === "medication" || hour >= 17)
      ? "evening-prep"
      : "before-prep";
  }

  return "before-prep";
}

/* ── Compact list item status rendering ── */

function StatusIcon({ status, isFocus }: { status: ItemStatus; isFocus: boolean }) {
  if (status === "completed") {
    return <CheckCircle2 className="w-4 h-4 text-calm-500 shrink-0" />;
  }
  if (status === "current" || (status === "upcoming" && isFocus)) {
    return (
      <span className="w-4 h-4 rounded-full border-2 border-brand-500 flex items-center justify-center shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
      </span>
    );
  }
  if (status === "attention") {
    return <AlertCircle className="w-4 h-4 text-warm-500 shrink-0" />;
  }
  return <Circle className="w-4 h-4 text-text-muted opacity-40 shrink-0" />;
}

function getStatusLabel(status: ItemStatus, isFocus: boolean): { text: string; color: string } | null {
  if (status === "completed") return { text: "Done", color: "text-calm-600" };
  if (status === "current") return { text: "Now", color: "text-brand-600" };
  if (status === "attention") return { text: "Review", color: "text-warm-600" };
  if (isFocus) return { text: "Next", color: "text-brand-600" };
  return null;
}

/* ── Component ── */

export default function Timeline() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PrepPlan | null>(loadPlan);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!plan) navigate("/", { replace: true });
  }, [plan, navigate]);

  if (!plan) return null;

  const progress = getTimelineProgress(plan.events);
  const allDone = progress.completed === progress.total && progress.total > 0;

  const currentEvent = getCurrentEvent(plan.events, now);
  const attentionEvent = !currentEvent
    ? plan.events.find(
        (e) => getItemStatus(e, now) === "attention" && getEventPriority(e) !== "supporting",
      )
    : null;
  const focusEvent = currentEvent ?? attentionEvent ?? getNextUpcomingEvent(plan.events, now);

  const focusStatus = focusEvent ? getItemStatus(focusEvent, now) : null;
  const focusSupporting = focusEvent ? getSupportingEvents(focusEvent, plan.events) : [];

  const groupedEvents = PHASE_ORDER
    .map((phase) => ({
      phase,
      label: PHASE_LABELS[phase],
      events: plan.events.filter((e) => getPhase(e, plan.procedureDate) === phase),
    }))
    .filter((g) => g.events.length > 0);

  function handleMarkDone(eventId: string) {
    const updated = toggleEventCompleted(plan!, eventId);
    savePlan(updated);
    setPlan(updated);
  }

  return (
    <div className="flex flex-col animate-fade-in-up">
      {/* ── 1. Compact progress header ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-text-primary">Your Timeline</h2>
          <span className="text-xs text-text-muted bg-surface-muted rounded-full px-2.5 py-1">
            {progress.completed}/{progress.total} done
          </span>
        </div>

        {focusEvent && focusStatus === "upcoming" && (
          <p className="text-sm text-text-secondary">
            Next: {focusEvent.title} at {formatEventTime(focusEvent.startTime)}
          </p>
        )}

        <div
          className="h-2 bg-surface-muted rounded-full overflow-hidden"
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
      </div>

      {/* ── 2. Focus card OR completion state ── */}
      {focusEvent ? (
        <FocusStepCard
          className="mt-5"
          event={focusEvent}
          variant={focusStatus === "current" ? "current" : focusStatus === "attention" ? "attention" : "next"}
          now={now}
          supportingEvents={focusSupporting}
          onView={() => navigate(`/event/${focusEvent.id}`)}
          onMarkDone={() => handleMarkDone(focusEvent.id)}
        />
      ) : allDone ? (
        <div className="text-center py-8 mt-5">
          <CelebrationAccent className="mx-auto">
            <CheckCircle2 className="w-10 h-10 text-calm-500" aria-hidden="true" />
          </CelebrationAccent>
          <p className="font-serif text-xl font-semibold text-calm-800 mt-3">All steps complete</p>
          <p className="text-sm text-calm-700 mt-1">You're ready for your procedure.</p>
        </div>
      ) : null}

      {/* ── 3 & 4. Phase-grouped compact timeline ── */}
      {groupedEvents.map((group) => {
        const visibleEvents = group.events.filter(
          (e) => getEventPriority(e) !== "supporting",
        );
        if (visibleEvents.length === 0) return null;

        return (
          <div key={group.phase} className="mt-6">
            <p className="text-sm text-text-secondary mb-2">
              {group.label}
            </p>
            <Card className="py-1">
              <div className="flex flex-col divide-y divide-border">
                {visibleEvents.map((event) => {
                  const status = getItemStatus(event, now);
                  const isFocus = event.id === focusEvent?.id;
                  const label = getStatusLabel(status, isFocus);
                  const supporting = getSupportingEvents(event, plan.events);

                  return (
                    <div key={event.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/event/${event.id}`)}
                        className="flex items-start gap-3 py-3 bg-transparent border-0 cursor-pointer text-left w-full hover:opacity-75 transition-opacity"
                      >
                        <StatusIcon status={status} isFocus={isFocus} />

                        <span className="text-xs text-text-muted w-16 shrink-0 text-right tabular-nums mt-0.5">
                          {formatEventTime(event.startTime)}
                        </span>

                        <div className="flex-1 min-w-0">
                          <span className={`text-sm block truncate ${
                            status === "completed"
                              ? "text-text-muted line-through decoration-calm-300"
                              : isFocus
                                ? "font-medium text-text-primary"
                                : "text-text-primary"
                          }`}>
                            {event.title}
                          </span>
                          {supporting.length > 0 && (
                            <p className={`text-xs mt-0.5 ${
                              status === "completed" ? "text-text-muted" : "text-text-muted"
                            }`}>
                              Also: {supporting.map((s) => s.title).join(", ")}
                            </p>
                          )}
                        </div>

                        {label && (
                          <span className={`text-xs font-medium shrink-0 mt-0.5 ${label.color}`}>
                            {label.text}
                          </span>
                        )}

                        <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        );
      })}

      {/* ── Bottom ── */}
      <button
        type="button"
        onClick={() => downloadIcs(plan)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary bg-transparent border-0 cursor-pointer p-0 mx-auto mt-6 transition-colors"
      >
        <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
        Export to Calendar
      </button>

    </div>
  );
}
