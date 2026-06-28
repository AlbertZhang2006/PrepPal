import type { PrepPlan, PrepEvent, EventPriority } from "./types";

const STORAGE_KEY = "preppal-plan";

export function savePlan(plan: PrepPlan): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

export function loadPlan(): PrepPlan | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const plan = JSON.parse(raw) as PrepPlan;
    if (!plan.procedureType) {
      plan.procedureType = "colonoscopy";
    }
    return plan;
  } catch {
    return null;
  }
}

export function clearPlan(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/* ── Priority helpers ── */

const PRIORITY_RANK: Record<EventPriority, number> = {
  safety: 0,
  primary: 1,
  reminder: 2,
  supporting: 3,
};

export function getEventPriority(event: PrepEvent): EventPriority {
  return event.priority ?? "primary";
}

function pickHighestPriority(events: PrepEvent[]): PrepEvent {
  return events.reduce((best, e) => {
    const bestRank = PRIORITY_RANK[getEventPriority(best)];
    const eRank = PRIORITY_RANK[getEventPriority(e)];
    return eRank < bestRank ? e : best;
  });
}

export function getSupportingEvents(event: PrepEvent, allEvents: PrepEvent[]): PrepEvent[] {
  return allEvents.filter(
    (e) =>
      e.id !== event.id &&
      e.startTime === event.startTime &&
      getEventPriority(e) === "supporting",
  );
}

/* ── Toggle completed (auto-completes simultaneous supporting events) ── */

export function toggleEventCompleted(plan: PrepPlan, eventId: string): PrepPlan {
  const target = plan.events.find((e) => e.id === eventId);
  if (!target) return plan;

  const newCompleted = !target.completed;

  const linkedIds = new Set<string>([eventId]);
  if (getEventPriority(target) !== "supporting") {
    for (const e of plan.events) {
      if (
        e.id !== eventId &&
        e.startTime === target.startTime &&
        getEventPriority(e) === "supporting"
      ) {
        linkedIds.add(e.id);
      }
    }
  }

  return {
    ...plan,
    events: plan.events.map((e) =>
      linkedIds.has(e.id) ? { ...e, completed: newCompleted } : e,
    ),
  };
}

/* ── Prep status ── */

export type PrepStatus =
  | "not-started"
  | "early-prep"
  | "active-prep"
  | "day-of"
  | "completed";

export function getNextUpcomingEvent(
  events: PrepEvent[],
  now: Date = new Date(),
): PrepEvent | null {
  const nowMs = now.getTime();

  let earliestMs = Infinity;
  for (const event of events) {
    if (event.completed) continue;
    const startMs = new Date(event.startTime).getTime();
    if (startMs > nowMs && startMs < earliestMs) {
      earliestMs = startMs;
    }
  }

  if (earliestMs !== Infinity) {
    const atEarliest = events.filter(
      (e) => !e.completed && new Date(e.startTime).getTime() === earliestMs,
    );
    return pickHighestPriority(atEarliest);
  }

  const firstIncomplete = events.find((e) => !e.completed);
  return firstIncomplete ?? null;
}

export function getCurrentEvent(
  events: PrepEvent[],
  now: Date = new Date(),
): PrepEvent | null {
  const nowMs = now.getTime();
  const currentEvents: PrepEvent[] = [];

  for (const event of events) {
    if (event.completed) continue;
    const startMs = new Date(event.startTime).getTime();
    const endMs = event.endTime
      ? new Date(event.endTime).getTime()
      : undefined;

    if (endMs) {
      if (startMs <= nowMs && nowMs <= endMs) currentEvents.push(event);
    } else {
      if (startMs <= nowMs) currentEvents.push(event);
    }
  }

  if (currentEvents.length === 0) return null;
  return pickHighestPriority(currentEvents);
}

/* ── Progress (excludes supporting events from count) ── */

export interface TimelineProgress {
  completed: number;
  total: number;
  percentage: number;
}

export function getTimelineProgress(events: PrepEvent[]): TimelineProgress {
  const countable = events.filter((e) => getEventPriority(e) !== "supporting");
  const total = countable.length;
  const completed = countable.filter((e) => e.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export function getPrepStatus(plan: PrepPlan, now: Date = new Date()): PrepStatus {
  const { completed, total } = getTimelineProgress(plan.events);

  if (completed === total && total > 0) return "completed";

  const procedureStart = new Date(`${plan.procedureDate}T${plan.procedureTime}:00`);
  const procedureDateStart = new Date(`${plan.procedureDate}T00:00:00`);
  const nowMs = now.getTime();

  if (nowMs >= procedureStart.getTime()) return "completed";
  if (nowMs >= procedureDateStart.getTime()) return "day-of";

  const firstEventTime = plan.events.length > 0
    ? new Date(plan.events[0].startTime).getTime()
    : Infinity;

  if (nowMs < firstEventTime) return "not-started";

  const hasMedEvent = plan.events.some(
    (e) =>
      e.category === "medication" &&
      new Date(e.startTime).getTime() <= nowMs,
  );

  return hasMedEvent ? "active-prep" : "early-prep";
}

/* ── Formatting ── */

export function formatEventTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatEventDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatEventDateTime(isoString: string): string {
  return `${formatEventDate(isoString)} at ${formatEventTime(isoString)}`;
}

export function getEventStatus(
  event: PrepEvent,
  now: Date = new Date(),
): "completed" | "current" | "upcoming" {
  if (event.completed) return "completed";
  const startMs = new Date(event.startTime).getTime();
  const endMs = event.endTime ? new Date(event.endTime).getTime() : undefined;
  const nowMs = now.getTime();

  if (endMs) {
    if (startMs <= nowMs && nowMs <= endMs) return "current";
  } else {
    if (startMs <= nowMs) return "current";
  }

  return nowMs >= startMs ? "current" : "upcoming";
}

export function getTimeUntilEvent(
  event: PrepEvent,
  now: Date = new Date(),
): string {
  const diffMs = new Date(event.startTime).getTime() - now.getTime();

  if (diffMs <= 0) return "now";

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function getTimeUntilProcedure(plan: PrepPlan, now: Date = new Date()): string {
  const procedureDate = new Date(`${plan.procedureDate}T${plan.procedureTime}:00`);
  const diffMs = procedureDate.getTime() - now.getTime();

  if (diffMs <= 0) return "now";

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 1) return `${days} days`;
  if (days === 1) return `${days} day, ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
