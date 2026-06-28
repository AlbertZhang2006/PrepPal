import type { PrepPlan } from "./types";
import { formatEventTime } from "./plan-utils";

export interface ReminderPreferences {
  oneHourBefore: boolean;
  thirtyMinBefore: boolean;
  whenDue: boolean;
  whenPastDue: boolean;
}

const STORAGE_KEY = "preppal-reminder-prefs";

const DEFAULT_PREFS: ReminderPreferences = {
  oneHourBefore: true,
  thirtyMinBefore: true,
  whenDue: true,
  whenPastDue: true,
};

export function loadReminderPrefs(): ReminderPreferences {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ReminderPreferences>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveReminderPrefs(prefs: ReminderPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export type ReminderType = "upcoming" | "due" | "past-due";

export interface SimulatedReminder {
  id: string;
  type: ReminderType;
  eventId: string;
  eventTitle: string;
  message: string;
  timeLabel: string;
}

export function getSimulatedReminders(
  plan: PrepPlan,
  prefs: ReminderPreferences,
  now: Date,
): SimulatedReminder[] {
  const reminders: SimulatedReminder[] = [];
  const nowMs = now.getTime();

  for (const event of plan.events) {
    if (event.completed) continue;
    if (event.id === "buy-supplies" || event.id === "bathroom-phase") continue;

    const startMs = new Date(event.startTime).getTime();
    const endMs = event.endTime ? new Date(event.endTime).getTime() : null;
    const diffMs = startMs - nowMs;
    const diffMin = diffMs / 60_000;

    if (prefs.oneHourBefore && diffMin > 30 && diffMin <= 60) {
      reminders.push({
        id: `1h-${event.id}`,
        type: "upcoming",
        eventId: event.id,
        eventTitle: event.title,
        message: `${event.title} starts in about ${Math.round(diffMin)} minutes.`,
        timeLabel: formatEventTime(event.startTime),
      });
    }

    if (prefs.thirtyMinBefore && diffMin > 0 && diffMin <= 30) {
      reminders.push({
        id: `30m-${event.id}`,
        type: "upcoming",
        eventId: event.id,
        eventTitle: event.title,
        message: `${event.title} starts in ${Math.round(diffMin)} minutes. Time to get ready.`,
        timeLabel: formatEventTime(event.startTime),
      });
    }

    if (prefs.whenDue && diffMin <= 0 && diffMin > -5) {
      reminders.push({
        id: `due-${event.id}`,
        type: "due",
        eventId: event.id,
        eventTitle: event.title,
        message: `${event.title} is starting now.`,
        timeLabel: formatEventTime(event.startTime),
      });
    }

    if (prefs.whenPastDue) {
      const pastDueMs = endMs ? endMs : startMs + 60 * 60_000;
      if (nowMs > pastDueMs) {
        reminders.push({
          id: `past-${event.id}`,
          type: "past-due",
          eventId: event.id,
          eventTitle: event.title,
          message: `${event.title} appears to be past due. Review your instruction sheet.`,
          timeLabel: formatEventTime(event.startTime),
        });
      }
    }
  }

  return reminders;
}
