import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  AlertTriangle,
  Building2,
  Stethoscope,
  Pill,
  Siren,
  Pencil,
  Check,
  X,
  Heart,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import BackLink from "../components/BackLink";

interface ContactEntry {
  id: string;
  label: string;
  icon: "building" | "stethoscope" | "pill" | "siren";
  phone: string;
}

const ICON_MAP = {
  building: Building2,
  stethoscope: Stethoscope,
  pill: Pill,
  siren: Siren,
} as const;

const ICON_COLORS = {
  building: "text-brand-600 bg-brand-100",
  stethoscope: "text-calm-600 bg-calm-100",
  pill: "text-warm-600 bg-warm-100",
  siren: "text-urgent-600 bg-urgent-100",
} as const;

const DEFAULT_CONTACTS: ContactEntry[] = [
  { id: "gi-office", label: "Doctor's Office", icon: "building", phone: "" },
  { id: "procedure-center", label: "Procedure Center", icon: "stethoscope", phone: "" },
  { id: "pharmacy", label: "Pharmacy", icon: "pill", phone: "" },
  { id: "emergency", label: "Emergency Care", icon: "siren", phone: "" },
];

const STORAGE_KEY = "preppal-contacts";

function loadContacts(): ContactEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_CONTACTS;
  try {
    const saved = JSON.parse(raw) as ContactEntry[];
    return DEFAULT_CONTACTS.map((d) => {
      const match = saved.find((s) => s.id === d.id);
      return match ? { ...d, phone: match.phone } : d;
    });
  } catch {
    return DEFAULT_CONTACTS;
  }
}

function saveContacts(contacts: ContactEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

const CLINIC_REASONS = [
  "You cannot finish the prep",
  "You cannot keep the prep down",
  "You have repeated vomiting",
  "You feel severely dizzy or faint",
  "You have severe abdominal pain",
  "You are confused about medication instructions",
  "You take blood thinners and are unsure what to do",
  "You have diabetes and are unsure how to manage medications",
  "You have kidney or heart disease concerns",
  "Your instructions conflict with what the app shows",
] as const;

function ContactCard({
  entry,
  onSave,
}: {
  entry: ContactEntry;
  onSave: (phone: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.phone);
  const Icon = ICON_MAP[entry.icon];
  const colors = ICON_COLORS[entry.icon];

  function handleSave() {
    onSave(draft.trim());
    setEditing(false);
  }

  function handleCancel() {
    setDraft(entry.phone);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colors}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{entry.label}</p>
        {editing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="tel"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Enter phone number"
              aria-label={`Phone number for ${entry.label}`}
              autoFocus
              className="flex-1 min-w-0 rounded-card border border-brand-300 bg-surface px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-2 focus:outline-brand-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              aria-label="Save phone number"
              className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors border-0 cursor-pointer shrink-0"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Cancel editing"
              className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center hover:bg-surface-dim transition-colors border-0 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
        ) : entry.phone ? (
          <a
            href={`tel:${entry.phone}`}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            {entry.phone}
          </a>
        ) : (
          <p className="text-xs text-text-muted mt-0.5">No number saved</p>
        )}
      </div>
      {!editing && (
        <button
          type="button"
          onClick={() => {
            setDraft(entry.phone);
            setEditing(true);
          }}
          className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-surface-muted transition-colors bg-transparent border-0 cursor-pointer shrink-0"
          aria-label={entry.phone ? `Edit ${entry.label} number` : `Add ${entry.label} number`}
        >
          <Pencil className="w-4 h-4 text-text-muted" />
        </button>
      )}
      {!editing && entry.phone && (
        <a
          href={`tel:${entry.phone}`}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            entry.icon === "siren"
              ? "bg-urgent-100 hover:bg-urgent-200"
              : "bg-brand-100 hover:bg-brand-200"
          }`}
          aria-label={`Call ${entry.label} at ${entry.phone}`}
        >
          <Phone className={`w-4 h-4 ${entry.icon === "siren" ? "text-urgent-600" : "text-brand-600"}`} />
        </a>
      )}
    </div>
  );
}

export default function Emergency() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<ContactEntry[]>(loadContacts);

  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  function handleSavePhone(id: string, phone: string) {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, phone } : c))
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Back */}
      <BackLink label="Go back" onClick={() => navigate(-1)} className="self-start" />

      {/* Header */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary">
          Help &amp; Contacts
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Keep your important numbers here so they're easy to find whenever
          you need them.
        </p>
      </div>

      {/* Emergency warning */}
      <Card variant="urgent">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-urgent-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-urgent-800">
              Seek urgent care or call 911
            </h3>
            <p className="text-sm text-urgent-700 mt-1 leading-relaxed">
              For chest pain, trouble breathing, fainting, or signs of a severe
              allergic reaction (swelling, hives, difficulty swallowing), call
              emergency services immediately.
            </p>
            <a
              href="tel:911"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-urgent-800 hover:text-urgent-900 mt-2.5"
            >
              <Phone className="w-4 h-4" />
              Call 911
            </a>
          </div>
        </div>
      </Card>

      {/* Contact cards */}
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          Your contacts
        </h3>
        {contacts.every((c) => !c.phone) && (
          <p className="text-xs text-text-secondary bg-surface-muted rounded-card px-3 py-2 mb-2 leading-relaxed">
            No numbers saved yet. Tap the pencil icon to add your clinic's phone
            numbers so they're easy to find when you need them.
          </p>
        )}
        <div className="flex flex-col divide-y divide-border">
          {contacts.map((entry) => (
            <ContactCard
              key={entry.id}
              entry={entry}
              onSave={(phone) => handleSavePhone(entry.id, phone)}
            />
          ))}
        </div>
      </Card>

      {/* Reassurance */}
      <Card variant="calm">
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-calm-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-calm-800">
              Feeling nervous? That's completely normal.
            </h3>
            <p className="text-sm text-calm-700 mt-1 leading-relaxed">
              Prep isn't fun, but millions of people complete it successfully
              every year. If you're just uncomfortable but not experiencing
              anything severe, you're likely right on track. You're doing great.
            </p>
          </div>
        </div>
      </Card>

      {/* When to contact your clinic */}
      <Card variant="warm">
        <h3 className="text-sm font-bold text-warm-800 flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-warm-600" />
          When to call your clinic
        </h3>
        <p className="text-sm text-warm-700 mb-3 leading-relaxed">
          Reach out to your doctor's office or procedure center if:
        </p>
        <ul className="flex flex-col gap-2">
          {CLINIC_REASONS.map((reason) => (
            <li
              key={reason}
              className="flex items-start gap-2 text-sm text-warm-700"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-warm-400 shrink-0 mt-1.5" />
              {reason}
            </li>
          ))}
        </ul>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate("/dashboard")}
          className="w-full"
        >
          Dashboard
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/ask")}
          className="w-full"
        >
          Ask PrepPal
        </Button>
      </div>

      {/* Safety note */}
      <p className="text-xs text-text-muted text-center py-2">
        When in doubt, call your clinic — no question is too small.
      </p>
    </div>
  );
}
