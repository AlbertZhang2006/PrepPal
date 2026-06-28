export type ProcedureType =
  | "colonoscopy"
  | "egd"
  | "surgery"
  | "imaging"
  | "lab_fasting"
  | "other";

export type ActiveProcedureType = Extract<ProcedureType, "colonoscopy" | "egd">;

export type RegimenType = "split-dose" | "single-dose" | "other";
export type PlanSource = "ai-scan" | "manual";

export type EventCategory =
  | "preparation"
  | "diet"
  | "medication"
  | "hydration"
  | "restriction"
  | "arrival"
  | "procedure";

export type EventPriority = "safety" | "primary" | "reminder" | "supporting";

export interface EventGuidance {
  whatToDo: string;
  whatToExpect: string;
  normalReassurance: string;
  caution: string;
}

export interface PrepEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  category: EventCategory;
  priority?: EventPriority;
  required: boolean;
  completed: boolean;
  guidance: EventGuidance;
}

export interface PrepPlan {
  procedureType: ProcedureType;
  procedureDate: string;
  procedureTime: string;
  arrivalTime: string;
  location: string;
  clinicPhone: string;
  prepName: string;
  regimenType: RegimenType;
  source: PlanSource;
  events: PrepEvent[];
  safetyNotes: string[];
  rawInstructionText: string;
}
