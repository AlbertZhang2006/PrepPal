import type { PrepPlan, PrepEvent, EventGuidance, ActiveProcedureType } from "./types";
import { getTemplate, interpolateGuidance } from "./procedure-templates";

export interface ManualSetupInput {
  procedureDate: string;
  procedureTime: string;
  arrivalTime: string;
  prepType: string;
  clearLiquidStartTime: string;
  dose1Time: string;
  dose2Time: string;
  stopLiquidsTime: string;
  stopEatingTime?: string;
  clinicPhone: string;
}

function dayBefore(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function twoDaysBefore(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 2);
  return d.toISOString().slice(0, 10);
}

function addHours(isoDateTime: string, hours: number): string {
  const d = new Date(isoDateTime);
  d.setHours(d.getHours() + hours);
  return d.toISOString().slice(0, 19);
}

function addMinutes(isoDateTime: string, minutes: number): string {
  const d = new Date(isoDateTime);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString().slice(0, 19);
}

function fmtTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const PREP_DISPLAY_NAMES: Record<string, string> = {
  suprep: "Suprep (sodium sulfate solution)",
  golytely: "GoLYTELY (PEG solution)",
  miralax: "MiraLAX + Gatorade",
  clenpiq: "Clenpiq (sodium picosulfate)",
  other: "Prescribed prep solution",
};

function prepLabel(prepType: string): string {
  return PREP_DISPLAY_NAMES[prepType] ?? PREP_DISPLAY_NAMES.other;
}

function prepShortName(prepType: string): string {
  return prepLabel(prepType).split(" (")[0];
}

function buildFallbackGuidance(whatToDo: string): EventGuidance {
  return { whatToDo, whatToExpect: "", normalReassurance: "", caution: "" };
}

export function generatePlan(input: ManualSetupInput, procedureType: ActiveProcedureType = "colonoscopy"): PrepPlan {
  if (procedureType === "egd") {
    return generateEgdPlan(input);
  }

  const {
    procedureDate,
    procedureTime,
    arrivalTime,
    prepType,
    clearLiquidStartTime,
    dose1Time,
    dose2Time,
    stopLiquidsTime,
    clinicPhone,
  } = input;

  const template = getTemplate("colonoscopy");

  const dayBeforeDate = dayBefore(procedureDate);
  const twoDaysBeforeDate = twoDaysBefore(procedureDate);
  const resolvedArrival = arrivalTime || (() => {
    const d = new Date(`${procedureDate}T${procedureTime}:00`);
    d.setHours(d.getHours() - 1);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  })();

  const prep = prepLabel(prepType);

  const dose1DateTime = `${dayBeforeDate}T${dose1Time}:00`;
  const dose2DateTime = `${procedureDate}T${dose2Time}:00`;
  const clearLiquidDateTime = `${dayBeforeDate}T${clearLiquidStartTime}:00`;
  const stopLiquidsDateTime = `${procedureDate}T${stopLiquidsTime}:00`;
  const bathroomDateTime = addMinutes(dose1DateTime, 60);
  const arrivalDateTime = `${procedureDate}T${resolvedArrival}:00`;
  const procedureDateTime = `${procedureDate}T${procedureTime}:00`;

  const templateVars: Record<string, string> = {
    prepName: prep,
    prepShortName: prepShortName(prepType),
    clearLiquidStartTime: fmtTime(clearLiquidStartTime),
    dose1Time: fmtTime(dose1Time),
    dose2Time: fmtTime(dose2Time),
    stopLiquidsTime: fmtTime(stopLiquidsTime),
    arrivalTime: fmtTime(resolvedArrival),
  };

  function interp(s: string): string {
    return s.replace(/\{\{(\w+)\}\}/g, (_, key: string) => templateVars[key] ?? `{{${key}}}`);
  }

  const guidanceByEventId = new Map<string, EventGuidance>();
  for (const evt of template.defaultTimelineEvents) {
    if (evt.guidance) {
      guidanceByEventId.set(evt.id, interpolateGuidance(evt.guidance, templateVars));
    }
  }

  function getGuidance(eventId: string, fallback: string): EventGuidance {
    return guidanceByEventId.get(eventId) ?? buildFallbackGuidance(fallback);
  }

  const eventTimings: Record<string, { startTime: string; endTime?: string }> = {
    "buy-supplies": { startTime: `${twoDaysBeforeDate}T17:00:00` },
    "clear-liquid-diet": { startTime: clearLiquidDateTime, endTime: stopLiquidsDateTime },
    "avoid-red-purple": { startTime: clearLiquidDateTime, endTime: stopLiquidsDateTime },
    "dose-1": { startTime: dose1DateTime, endTime: addHours(dose1DateTime, 2) },
    "bathroom-phase": { startTime: bathroomDateTime },
    "dose-2": { startTime: dose2DateTime, endTime: addHours(dose2DateTime, 2) },
    "stop-liquids": { startTime: stopLiquidsDateTime },
    "arrive": { startTime: arrivalDateTime },
    "procedure": { startTime: procedureDateTime },
  };

  const events: PrepEvent[] = template.defaultTimelineEvents.map((tmpl) => {
    const timing = eventTimings[tmpl.id];
    if (!timing) {
      throw new Error(`No timing defined for event: ${tmpl.id}`);
    }
    return {
      id: tmpl.id,
      title: interp(tmpl.title),
      startTime: timing.startTime,
      ...(timing.endTime ? { endTime: timing.endTime } : {}),
      category: tmpl.category,
      ...(tmpl.priority ? { priority: tmpl.priority } : {}),
      required: tmpl.required,
      completed: false,
      guidance: getGuidance(tmpl.id, tmpl.description),
    };
  });

  const phoneNote = clinicPhone
    ? `Call your clinic at ${clinicPhone} if you have questions or concerns.`
    : "Contact your clinic if you have questions or concerns.";

  return {
    procedureType: "colonoscopy",
    procedureDate,
    procedureTime,
    arrivalTime: resolvedArrival,
    location: "",
    clinicPhone,
    prepName: prep,
    regimenType: "split-dose",
    source: "manual",
    events,
    safetyNotes: [...template.safetyNotes, phoneNote],
    rawInstructionText: "",
  };
}

function generateEgdPlan(input: ManualSetupInput): PrepPlan {
  const {
    procedureDate,
    procedureTime,
    arrivalTime,
    stopLiquidsTime,
    clinicPhone,
  } = input;

  const stopEatingTime = input.stopEatingTime || "22:00";
  const template = getTemplate("egd");

  const dayBeforeDate = dayBefore(procedureDate);
  const resolvedArrival = arrivalTime || (() => {
    const d = new Date(`${procedureDate}T${procedureTime}:00`);
    d.setHours(d.getHours() - 1);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  })();

  const stopEatingDateTime = `${dayBeforeDate}T${stopEatingTime}:00`;
  const stopLiquidsDateTime = `${procedureDate}T${stopLiquidsTime}:00`;
  const arrivalDateTime = `${procedureDate}T${resolvedArrival}:00`;
  const procedureDateTime = `${procedureDate}T${procedureTime}:00`;

  const templateVars: Record<string, string> = {
    stopEatingTime: fmtTime(stopEatingTime),
    stopLiquidsTime: fmtTime(stopLiquidsTime),
    arrivalTime: fmtTime(resolvedArrival),
  };

  function interp(s: string): string {
    return s.replace(/\{\{(\w+)\}\}/g, (_, key: string) => templateVars[key] ?? `{{${key}}}`);
  }

  const guidanceByEventId = new Map<string, EventGuidance>();
  for (const evt of template.defaultTimelineEvents) {
    if (evt.guidance) {
      guidanceByEventId.set(evt.id, interpolateGuidance(evt.guidance, templateVars));
    }
  }

  function getGuidance(eventId: string, fallback: string): EventGuidance {
    return guidanceByEventId.get(eventId) ?? buildFallbackGuidance(fallback);
  }

  const eventTimings: Record<string, { startTime: string; endTime?: string }> = {
    "stop-eating": { startTime: stopEatingDateTime, endTime: stopLiquidsDateTime },
    "stop-liquids": { startTime: stopLiquidsDateTime },
    "arrive": { startTime: arrivalDateTime },
    "procedure": { startTime: procedureDateTime },
  };

  const events: PrepEvent[] = template.defaultTimelineEvents.map((tmpl) => {
    const timing = eventTimings[tmpl.id];
    if (!timing) {
      throw new Error(`No timing defined for event: ${tmpl.id}`);
    }
    return {
      id: tmpl.id,
      title: interp(tmpl.title),
      startTime: timing.startTime,
      ...(timing.endTime ? { endTime: timing.endTime } : {}),
      category: tmpl.category,
      ...(tmpl.priority ? { priority: tmpl.priority } : {}),
      required: tmpl.required,
      completed: false,
      guidance: getGuidance(tmpl.id, tmpl.description),
    };
  });

  const phoneNote = clinicPhone
    ? `Call your clinic at ${clinicPhone} if you have questions or concerns.`
    : "Contact your clinic if you have questions or concerns.";

  return {
    procedureType: "egd",
    procedureDate,
    procedureTime,
    arrivalTime: resolvedArrival,
    location: "",
    clinicPhone,
    prepName: "None (fasting only)",
    regimenType: "other",
    source: "manual",
    events,
    safetyNotes: [...template.safetyNotes, phoneNote],
    rawInstructionText: "",
  };
}
