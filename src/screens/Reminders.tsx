import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import {
  loadReminderPrefs,
  saveReminderPrefs,
  type ReminderPreferences,
} from "../lib/reminders";
import { loadPlan } from "../lib/plan-utils";

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ id, label, description, checked, onChange }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 py-3.5 cursor-pointer"
    >
      <div className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-surface-muted rounded-full border border-border peer-checked:bg-brand-600 peer-checked:border-brand-600 transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
    </label>
  );
}

export default function Reminders() {
  const navigate = useNavigate();
  const plan = loadPlan();
  const [prefs, setPrefs] = useState<ReminderPreferences>(loadReminderPrefs);

  useEffect(() => {
    if (!plan) navigate("/", { replace: true });
  }, [plan, navigate]);

  function updatePref(key: keyof ReminderPreferences, value: boolean) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveReminderPrefs(updated);
  }

  if (!plan) return null;

  const anyEnabled = prefs.oneHourBefore || prefs.thirtyMinBefore || prefs.whenDue || prefs.whenPastDue;

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 self-start bg-transparent border-0 cursor-pointer p-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Go back
      </button>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Bell className="w-6 h-6 text-brand-500" aria-hidden="true" />
          Reminder Preferences
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Choose when you'd like to see reminders for your prep steps.
          These show as cards on your dashboard.
        </p>
      </div>

      {/* In-app only notice */}
      <Card variant="calm" className="flex gap-3 items-start">
        <Info className="w-5 h-5 text-calm-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-calm-800">
          <p className="font-medium">In-app reminders only</p>
          <p className="mt-1 text-calm-700 leading-relaxed">
            These reminders appear on your dashboard when you open PrepPal.
            They are not push notifications — keep the app open or check back
            regularly during your prep.
          </p>
        </div>
      </Card>

      {/* Toggles */}
      <Card>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
          Remind me...
        </h3>
        <div className="flex flex-col divide-y divide-border">
          <Toggle
            id="pref-1h"
            label="1 hour before each step"
            description="Gives you time to prepare for what's coming up next."
            checked={prefs.oneHourBefore}
            onChange={(v) => updatePref("oneHourBefore", v)}
          />
          <Toggle
            id="pref-30m"
            label="30 minutes before each step"
            description="A heads-up so you're ready when it's time to start."
            checked={prefs.thirtyMinBefore}
            onChange={(v) => updatePref("thirtyMinBefore", v)}
          />
          <Toggle
            id="pref-due"
            label="When a step is due"
            description="Shows a card the moment a step is scheduled to begin."
            checked={prefs.whenDue}
            onChange={(v) => updatePref("whenDue", v)}
          />
          <Toggle
            id="pref-past"
            label="If a step is past due"
            description="Alerts you if a step's time has passed and it hasn't been marked complete."
            checked={prefs.whenPastDue}
            onChange={(v) => updatePref("whenPastDue", v)}
          />
        </div>
      </Card>

      {/* Status */}
      <Card className={anyEnabled ? "bg-calm-50 border-calm-200" : undefined}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            anyEnabled ? "bg-calm-100" : "bg-surface-muted"
          }`}>
            {anyEnabled ? (
              <BellRing className="w-5 h-5 text-calm-600" />
            ) : (
              <Bell className="w-5 h-5 text-text-muted" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {anyEnabled ? "Reminders are on" : "All reminders are off"}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {anyEnabled
                ? "You'll see reminder cards on your dashboard when steps are approaching."
                : "Turn on at least one option above to see reminders."}
            </p>
          </div>
        </div>
      </Card>

      {/* Preview section */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
          What reminders look like
        </h3>
        <div className="flex flex-col gap-2.5">
          <Card className="bg-brand-50 border-brand-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Upcoming Reminder</p>
                <p className="text-sm font-medium text-brand-900 mt-0.5">Your next step starts in 30 minutes.</p>
                <p className="text-xs text-brand-700 mt-0.5">Scheduled for 6:00 PM</p>
              </div>
            </div>
          </Card>
          <Card variant="warm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-warm-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-warm-600 uppercase tracking-wider">Past Due</p>
                <p className="text-sm font-medium text-warm-800 mt-0.5">A step appears to be past due.</p>
                <p className="text-xs text-warm-700 mt-0.5">Review your instruction sheet.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Back */}
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>
    </div>
  );
}
