import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Eye,
  Heart,
  Lightbulb,
  Phone,
  ClipboardList,
  MessageCircle,
  Pill,
  ShoppingCart,
  UtensilsCrossed,
  Droplets,
  Ban,
  MapPin,
  Stethoscope,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import type { EventCategory, ActiveProcedureType } from "../lib/types";
import {
  loadPlan,
  savePlan,
  toggleEventCompleted,
  formatEventTime,
} from "../lib/plan-utils";
import { getEventSafetyNote } from "../lib/escalation";
import { getTemplate } from "../lib/procedure-templates";

const CATEGORY_ICONS: Record<EventCategory, typeof Clock> = {
  preparation: ShoppingCart,
  diet: UtensilsCrossed,
  medication: Pill,
  hydration: Droplets,
  restriction: Ban,
  arrival: MapPin,
  procedure: Stethoscope,
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  preparation: "Getting Ready",
  diet: "Food & Drink",
  medication: "Prep Medication",
  hydration: "Staying Hydrated",
  restriction: "Important Reminder",
  arrival: "Arrival",
  procedure: "Your Procedure",
};

export default function EventDetail() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [plan, setPlan] = useState(() => loadPlan());

  useEffect(() => {
    if (!plan) navigate("/", { replace: true });
  }, [plan, navigate]);

  if (!plan) return null;

  const event = plan.events.find((e) => e.id === eventId);

  if (!event) {
    return (
      <div className="flex flex-col gap-5 items-center py-12">
        <p className="text-text-secondary">Event not found.</p>
        <Button variant="secondary" onClick={() => navigate("/timeline")}>
          Back to Timeline
        </Button>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[event.category];
  const procedureType = (plan.procedureType as ActiveProcedureType) ?? "colonoscopy";
  const templateTips = getTemplate(procedureType).eventTips;
  const tips = templateTips[event.id] ?? [];

  function handleToggle() {
    if (!plan || !event) return;
    const updated = toggleEventCompleted(plan, event.id);
    savePlan(updated);
    setPlan(updated);
  }

  const dateStr = new Date(event.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/timeline")}
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 self-start bg-transparent border-0 cursor-pointer p-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Timeline
      </button>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-50 px-2 py-1 rounded-full">
            <CategoryIcon className="w-3.5 h-3.5" />
            {CATEGORY_LABELS[event.category]}
          </span>
          {event.required && (
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
              Important step
            </span>
          )}
          {event.completed && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-calm-700 bg-calm-100 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-text-primary">{event.title}</h2>

        <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary">
          <Clock className="w-4 h-4 text-text-muted" />
          <span>
            {dateStr} · {formatEventTime(event.startTime)}
            {event.endTime && ` – ${formatEventTime(event.endTime)}`}
          </span>
        </div>
      </div>

      {/* What to do */}
      {event.guidance.whatToDo && (
        <Card>
          <h3 className="font-semibold text-sm text-text-primary mb-2 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand-500" />
            What to do
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {event.guidance.whatToDo}
          </p>
        </Card>
      )}

      {/* What to expect */}
      {event.guidance.whatToExpect && (
        <Card>
          <h3 className="font-semibold text-sm text-text-primary mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-500" />
            What to expect
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {event.guidance.whatToExpect}
          </p>
        </Card>
      )}

      {/* This is normal */}
      {event.guidance.normalReassurance && (
        <Card variant="calm">
          <h3 className="font-semibold text-sm text-calm-800 mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-calm-600" />
            This is normal
          </h3>
          <p className="text-sm text-calm-700 leading-relaxed">
            {event.guidance.normalReassurance}
          </p>
        </Card>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <Card variant="calm">
          <h3 className="font-semibold text-sm text-calm-800 mb-2.5 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-calm-600" />
            Tips
          </h3>
          <ul className="flex flex-col gap-2">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-calm-700">
                <span className="w-1.5 h-1.5 rounded-full bg-calm-400 shrink-0 mt-1.5" />
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* When to contact your clinic */}
      {event.guidance.caution && (
        <Card variant="warm">
          <h3 className="font-semibold text-sm text-warm-800 mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-warm-600" />
            When to contact your clinic
          </h3>
          <p className="text-sm text-warm-700 leading-relaxed">
            {event.guidance.caution}
          </p>
          {plan.clinicPhone && (
            <a
              href={`tel:${plan.clinicPhone}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-warm-800 hover:text-warm-900 mt-3"
            >
              <Phone className="w-3.5 h-3.5" />
              Call {plan.clinicPhone}
            </a>
          )}
        </Card>
      )}

      {/* Supplies checklist link */}
      {event.id === "buy-supplies" && (
        <Button
          className="w-full"
          onClick={() => navigate("/supplies")}
        >
          <ShoppingCart className="w-4 h-4" />
          Open Supplies Checklist
        </Button>
      )}

      {/* Safety note from escalation engine */}
      {(() => {
        const safetyNote = getEventSafetyNote(event.id);
        if (!safetyNote) return null;
        return (
          <Card className="bg-brand-50 border-brand-200">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-1">
                  Important to know
                </h3>
                <p className="text-sm text-brand-800 leading-relaxed">
                  {safetyNote}
                </p>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5">
        <Button
          size="lg"
          variant={event.completed ? "secondary" : "primary"}
          className="w-full"
          onClick={handleToggle}
        >
          {event.completed ? (
            <>
              <RotateCcw className="w-5 h-5" />
              Undo
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Done — Mark Complete
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate("/ask")}
        >
          <MessageCircle className="w-4 h-4" />
          Ask PrepPal about this step
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/timeline")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Timeline
        </Button>
      </div>

      {/* Safety note */}
      <p className="text-xs text-text-muted text-center py-2">
        Always follow your clinic's printed instructions if anything here looks different.
      </p>
    </div>
  );
}
