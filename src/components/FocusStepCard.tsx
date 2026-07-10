import { ChevronRight, CheckCircle2 } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import type { PrepEvent } from "../lib/types";
import { formatEventTime } from "../lib/plan-utils";

export type FocusStepVariant = "current" | "next" | "attention";

interface FocusStepCardProps {
  event: PrepEvent;
  variant: FocusStepVariant;
  now: Date;
  supportingEvents?: PrepEvent[];
  onView: () => void;
  onMarkDone: () => void;
  className?: string;
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text;
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

const VARIANT_COPY: Record<FocusStepVariant, { badge: string; viewLabel: string }> = {
  current: { badge: "Happening now", viewLabel: "View Step" },
  next: { badge: "Your next step", viewLabel: "View Step" },
  attention: { badge: "Review this step", viewLabel: "Review Step" },
};

export default function FocusStepCard({
  event,
  variant,
  now,
  supportingEvents = [],
  onView,
  onMarkDone,
  className = "",
}: FocusStepCardProps) {
  const isAttention = variant === "attention";
  const copy = VARIANT_COPY[variant];

  return (
    <Card
      className={`rounded-hero p-6 ${className} ${
        isAttention ? "bg-warm-50 border-warm-200" : "bg-brand-50 border-brand-200"
      }`}
    >
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 bg-white/70 ${
          isAttention ? "text-warm-700" : "text-brand-700"
        }`}
      >
        {copy.badge}
      </span>

      <h3
        className={`font-serif text-xl font-semibold mt-2 ${
          isAttention ? "text-warm-900" : "text-brand-900"
        }`}
      >
        {event.title}
      </h3>
      <p className={`text-sm mt-0.5 ${isAttention ? "text-warm-600" : "text-brand-600"}`}>
        {getRelativeTimeLabel(event.startTime, now)}
      </p>
      <p className={`text-sm leading-relaxed mt-2 ${isAttention ? "text-warm-800" : "text-brand-800"}`}>
        {firstSentence(event.guidance.whatToDo)}
      </p>

      {supportingEvents.length > 0 && (
        <div
          className={`mt-3 pt-3 border-t ${isAttention ? "border-warm-200/60" : "border-brand-200/60"}`}
        >
          <p className={`text-xs font-medium mb-0.5 ${isAttention ? "text-warm-500" : "text-brand-500"}`}>
            Also at this time:
          </p>
          {supportingEvents.map((s) => (
            <p
              key={s.id}
              className={`text-xs leading-relaxed ${isAttention ? "text-warm-700" : "text-brand-700"}`}
            >
              • {s.title}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 mt-4">
        <Button size="sm" className="flex-1" onClick={onView}>
          {copy.viewLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={onMarkDone}>
          <CheckCircle2 className="w-4 h-4" />
          Done
        </Button>
      </div>
    </Card>
  );
}
