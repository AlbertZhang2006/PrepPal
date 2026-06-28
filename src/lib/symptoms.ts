export type SymptomSeverity = "mild" | "severe";

export interface SymptomOption {
  id: string;
  label: string;
  severity: SymptomSeverity;
}

export interface SymptomEntry {
  id: string;
  symptomId: string;
  label: string;
  severity: SymptomSeverity;
  timestamp: string;
}

export const MILD_SYMPTOMS: SymptomOption[] = [
  { id: "nausea", label: "Nausea", severity: "mild" },
  { id: "bloating", label: "Bloating", severity: "mild" },
  { id: "hunger", label: "Hunger", severity: "mild" },
  { id: "cramping", label: "Cramping", severity: "mild" },
  { id: "dizziness", label: "Dizziness", severity: "mild" },
];

export const SEVERE_SYMPTOMS: SymptomOption[] = [
  { id: "vomiting", label: "Vomiting", severity: "severe" },
  { id: "severe-abdominal-pain", label: "Severe abdominal pain", severity: "severe" },
  { id: "chest-pain", label: "Chest pain", severity: "severe" },
  { id: "trouble-breathing", label: "Trouble breathing", severity: "severe" },
  { id: "unable-to-finish-prep", label: "Unable to finish prep", severity: "severe" },
  { id: "fainting", label: "Fainting or nearly fainting", severity: "severe" },
  { id: "allergic-reaction", label: "Allergic reaction (rash, hives, swelling)", severity: "severe" },
];

export const MILD_GUIDANCE =
  "Mild nausea, bloating, and cramping are very common during prep and usually pass on their own. Keep following your instruction sheet — you're doing great.";

export const SEVERE_GUIDANCE =
  "Please reach out to your clinic for guidance. They can tell you exactly what to do — that's what they're there for.";

const STORAGE_KEY = "preppal-symptoms";

export function loadSymptomLog(): SymptomEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SymptomEntry[];
  } catch {
    return [];
  }
}

export function saveSymptomLog(entries: SymptomEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addSymptom(option: SymptomOption): SymptomEntry[] {
  const entries = loadSymptomLog();
  const entry: SymptomEntry = {
    id: `${option.id}-${Date.now()}`,
    symptomId: option.id,
    label: option.label,
    severity: option.severity,
    timestamp: new Date().toISOString(),
  };
  const updated = [entry, ...entries];
  saveSymptomLog(updated);
  return updated;
}

export function removeSymptom(entryId: string): SymptomEntry[] {
  const entries = loadSymptomLog();
  const updated = entries.filter((e) => e.id !== entryId);
  saveSymptomLog(updated);
  return updated;
}

export function hasRecentSevereSymptom(now: Date = new Date()): boolean {
  const entries = loadSymptomLog();
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  return entries.some(
    (e) => e.severity === "severe" && new Date(e.timestamp).getTime() > cutoff
  );
}
