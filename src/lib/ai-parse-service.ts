/**
 * AI parsing service layer.
 *
 * Swap the internals of parsePrepInstructions() with an LLM API call
 * when ready. The contract (input: raw text → output: ParsedPrepInstructions)
 * stays the same so the rest of the app doesn't change.
 */

// ── Public types ──────────────────────────────────────────────

export type FieldConfidence = "high" | "medium" | "low" | "missing";

export interface ConfidenceScores {
  procedureDate: FieldConfidence;
  procedureTime: FieldConfidence;
  arrivalTime: FieldConfidence;
  prepType: FieldConfidence;
  regimenType: FieldConfidence;
  clearLiquidStart: FieldConfidence;
  dose1: FieldConfidence;
  dose2: FieldConfidence;
  stopLiquids: FieldConfidence;
  clinicPhone: FieldConfidence;
}

export type WarningSeverity = "error" | "warning" | "info";

export interface ParseWarning {
  field: string;
  severity: WarningSeverity;
  message: string;
}

export interface ParsedPrepInstructions {
  procedureDate: string;
  procedureTime: string;
  arrivalTime: string;
  prepType: string;
  regimenType: "split-dose" | "single-dose" | "other";
  clearLiquidStart: string;
  dose1: string;
  dose2: string;
  stopLiquids: string;
  clinicPhone: string;

  confidence: ConfidenceScores;
  overallConfidence: "high" | "partial" | "low";
  warnings: ParseWarning[];
  missingFields: string[];
  rawText: string;
}

// ── Regex helpers (rule-based extraction) ─────────────────────

const DATE_PATTERN =
  /(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/gi;

const TIME_PATTERN =
  /\d{1,2}:\d{2}\s*(?:AM|PM|am|pm|a\.m\.|p\.m\.)/g;

const PREP_KEYWORDS: Record<string, string> = {
  suprep: "suprep",
  "sodium sulfate": "suprep",
  golytely: "golytely",
  nulytely: "golytely",
  "peg solution": "golytely",
  "peg-3350": "golytely",
  miralax: "miralax",
  "mira-lax": "miralax",
  clenpiq: "clenpiq",
  "sodium picosulfate": "clenpiq",
};

function parseTime24(timeStr: string): string {
  const match = timeStr.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm|a\.m\.|p\.m\.)/,
  );
  if (!match) return "";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3].toLowerCase().replace(/\./g, "");
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

function parseDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function findPrepType(text: string): string {
  const lower = text.toLowerCase();
  for (const [keyword, type] of Object.entries(PREP_KEYWORDS)) {
    if (lower.includes(keyword)) return type;
  }
  return "";
}

function findTimesNear(text: string, keywords: string[]): string {
  const lower = text.toLowerCase();
  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword);
    if (idx === -1) continue;
    const region = text.slice(
      Math.max(0, idx - 30),
      idx + keyword.length + 60,
    );
    const timeMatch = region.match(TIME_PATTERN);
    if (timeMatch) return parseTime24(timeMatch[0]);
  }
  return "";
}

function detectRegimenType(
  text: string,
  dose2: string,
): "split-dose" | "single-dose" | "other" {
  const lower = text.toLowerCase();
  if (lower.includes("split") || lower.includes("two dose") || dose2)
    return "split-dose";
  if (lower.includes("single dose") || lower.includes("one dose"))
    return "single-dose";
  return "other";
}

// ── Field confidence scoring ──────────────────────────────────

function scoreField(value: string, nearKeyword: boolean): FieldConfidence {
  if (!value) return "missing";
  if (nearKeyword) return "high";
  return "medium";
}

// ── Time conflict detection ───────────────────────────────────

function toMinutes(time24: string): number | null {
  if (!time24) return null;
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

function detectTimeConflicts(
  fields: Pick<
    ParsedPrepInstructions,
    "dose1" | "dose2" | "stopLiquids" | "procedureTime" | "arrivalTime"
  >,
): ParseWarning[] {
  const warnings: ParseWarning[] = [];

  const dose1 = toMinutes(fields.dose1);
  const dose2 = toMinutes(fields.dose2);
  const stop = toMinutes(fields.stopLiquids);
  const arrival = toMinutes(fields.arrivalTime);
  const procedure = toMinutes(fields.procedureTime);

  // Dose 2 is typically early morning (before 6 AM) while dose 1 is evening.
  // If both look like evening times, flag it.
  if (dose1 !== null && dose2 !== null && dose1 < dose2) {
    const bothEvening = dose1 >= 12 * 60 && dose2 >= 12 * 60;
    if (bothEvening) {
      warnings.push({
        field: "dose2",
        severity: "warning",
        message:
          "Dose 2 appears to be later than Dose 1 on the same day. For split-dose preps, Dose 2 is usually early the next morning.",
      });
    }
  }

  // Stop liquids should be after dose 2 (in the morning)
  if (dose2 !== null && stop !== null && stop < dose2) {
    warnings.push({
      field: "stopLiquids",
      severity: "warning",
      message:
        "Stop liquids time is before Dose 2. You typically need to finish Dose 2 before the liquid cutoff.",
    });
  }

  // Arrival should be before or at procedure time
  if (arrival !== null && procedure !== null && arrival > procedure) {
    warnings.push({
      field: "arrivalTime",
      severity: "warning",
      message:
        "Arrival time is after procedure time. Arrival is usually 30–60 minutes before the procedure.",
    });
  }

  return warnings;
}

// ── Live conflict detection (runs on edited values) ─────────

export interface TimingConflict {
  id: string;
  severity: "error" | "warning";
  title: string;
  description: string;
  affectedFields: string[];
  suggestion: string;
}

export function detectValueConflicts(values: Record<string, string>): TimingConflict[] {
  const conflicts: TimingConflict[] = [];

  const procedure = toMinutes(values.procedureTime);
  const arrival = toMinutes(values.arrivalTime);
  const dose1 = toMinutes(values.dose1Time);
  const dose2 = toMinutes(values.dose2Time);
  const stop = toMinutes(values.stopLiquidsTime);
  const clearLiquid = toMinutes(values.clearLiquidStartTime);

  // Procedure time earlier than arrival
  if (procedure !== null && arrival !== null && procedure < arrival) {
    conflicts.push({
      id: "procedure-before-arrival",
      severity: "error",
      title: "Procedure time is before arrival time",
      description:
        "Your procedure is listed earlier than your arrival. This usually means one of the times needs to be corrected.",
      affectedFields: ["procedureTime", "arrivalTime"],
      suggestion: "Check your appointment details for the correct procedure and arrival times.",
    });
  }

  // Dose 2 after stop-liquids
  if (dose2 !== null && stop !== null && dose2 >= stop) {
    conflicts.push({
      id: "dose2-after-stop",
      severity: "error",
      title: "Dose 2 is at or after your stop-liquids cutoff",
      description:
        "You need to finish Dose 2 before you stop all liquids. These times may be reversed or one may be incorrect.",
      affectedFields: ["dose2Time", "stopLiquidsTime"],
      suggestion: "Compare both times against your printed instructions. Dose 2 is usually 4–5 hours before your procedure.",
    });
  }

  // Stop-liquids missing when other times are present
  if (!values.stopLiquidsTime && (dose2 !== null || procedure !== null)) {
    conflicts.push({
      id: "stop-liquids-missing",
      severity: "warning",
      title: "Stop-liquids time not set",
      description:
        "This is a safety cutoff for sedation. Without it, your timeline won't include a reminder to stop drinking.",
      affectedFields: ["stopLiquidsTime"],
      suggestion: "Check your instruction sheet for when to stop all liquids. It's usually 2–4 hours before your procedure.",
    });
  }

  // Dose 1 and Dose 2 too close (< 4 hours apart, assuming dose1 is PM and dose2 is AM next day)
  if (dose1 !== null && dose2 !== null) {
    const isTypicalSplit = dose1 >= 12 * 60 && dose2 < 12 * 60;
    if (!isTypicalSplit && dose1 < dose2) {
      const gap = dose2 - dose1;
      if (gap < 4 * 60) {
        conflicts.push({
          id: "doses-too-close",
          severity: "warning",
          title: "Dose 1 and Dose 2 are less than 4 hours apart",
          description:
            "Split-dose preps usually have at least 4–6 hours between doses. These times may not be correct.",
          affectedFields: ["dose1Time", "dose2Time"],
          suggestion: "Double-check both dose times on your instruction sheet. Dose 1 is typically the evening before; Dose 2 is early the morning of your procedure.",
        });
      }
    }
    // Both doses in the evening — likely a data entry issue
    if (dose1 >= 12 * 60 && dose2 >= 12 * 60 && dose2 > dose1) {
      conflicts.push({
        id: "both-doses-evening",
        severity: "warning",
        title: "Both doses appear to be in the evening",
        description:
          "For split-dose preps, Dose 2 is usually early the next morning, not the same evening as Dose 1.",
        affectedFields: ["dose1Time", "dose2Time"],
        suggestion: "Dose 2 times like 3:00 AM or 4:00 AM are common. Check your instructions for the correct morning time.",
      });
    }
  }

  // Clear liquid diet starts after Dose 1
  if (clearLiquid !== null && dose1 !== null && clearLiquid > dose1) {
    conflicts.push({
      id: "clear-liquid-after-dose1",
      severity: "warning",
      title: "Clear liquid diet starts after Dose 1",
      description:
        "You should be on clear liquids before starting your prep solution. The diet start time may be wrong.",
      affectedFields: ["clearLiquidStartTime", "dose1Time"],
      suggestion: "Most clinics ask you to start clear liquids in the morning, well before your evening dose.",
    });
  }

  // Prep type is "other" or unknown
  if (values.prepType === "other") {
    conflicts.push({
      id: "unknown-prep-type",
      severity: "warning",
      title: "Prep type is set to \"Other\"",
      description:
        "We'll use general guidance, but selecting your specific prep helps us give more accurate tips.",
      affectedFields: ["prepType"],
      suggestion: "Look at your prep medication box or prescription label for the brand name (e.g., Suprep, GoLYTELY, MiraLAX, Clenpiq).",
    });
  }

  // Procedure date in the past
  if (values.procedureDate) {
    const procDate = new Date(values.procedureDate + "T23:59:59");
    if (procDate.getTime() < Date.now()) {
      conflicts.push({
        id: "procedure-in-past",
        severity: "error",
        title: "Procedure date appears to be in the past",
        description:
          "The date we found may have been read incorrectly, or this may be an old instruction sheet.",
        affectedFields: ["procedureDate"],
        suggestion: "Confirm your procedure date from your appointment confirmation or clinic's scheduling call.",
      });
    }
  }

  return conflicts;
}

// ── Main service function ─────────────────────────────────────

export async function parsePrepInstructions(
  rawText: string,
): Promise<ParsedPrepInstructions> {
  // ── Future: replace this block with an LLM API call ──
  //
  // const response = await fetch("/api/parse", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ rawText }),
  // });
  // const llmResult = await response.json();
  // ... map llmResult into the same shape below ...
  //
  // The rest of the function (warnings, confidence, missing fields)
  // should still run on the client as a validation layer on top of
  // whatever the LLM returns.
  // ─────────────────────────────────────────────────────

  const dates = rawText.match(DATE_PATTERN) || [];
  const allTimes = rawText.match(TIME_PATTERN) || [];

  const procedureDate = dates[0] ? parseDate(dates[0]) : "";
  const prepType = findPrepType(rawText);

  const dose1 = findTimesNear(rawText, [
    "dose 1",
    "first dose",
    "evening dose",
    "dose #1",
  ]);

  const dose2 = findTimesNear(rawText, [
    "dose 2",
    "second dose",
    "morning dose",
    "dose #2",
    "early morning",
  ]);

  const clearLiquidStart = findTimesNear(rawText, [
    "clear liquid",
    "liquid diet",
    "clear fluids only",
    "no solid food",
  ]);

  const stopLiquids = findTimesNear(rawText, [
    "nothing by mouth",
    "stop drinking",
    "stop all liquids",
    "npo",
    "no liquids",
    "stop liquids",
  ]);

  const arrivalTime = findTimesNear(rawText, [
    "arrive",
    "arrival",
    "check in",
    "check-in",
    "report to",
  ]);

  const procedureTime =
    findTimesNear(rawText, [
      "procedure",
      "colonoscopy",
      "scheduled for",
      "appointment",
    ]) || (allTimes[0] ? parseTime24(allTimes[0]) : "");

  const phoneMatch = rawText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const clinicPhone = phoneMatch ? phoneMatch[0] : "";

  const regimenType = detectRegimenType(rawText, dose2);

  // ── Confidence per field ──

  const confidence: ConfidenceScores = {
    procedureDate: scoreField(procedureDate, dates.length > 0),
    procedureTime: scoreField(
      procedureTime,
      !!findTimesNear(rawText, ["procedure", "colonoscopy"]),
    ),
    arrivalTime: scoreField(
      arrivalTime,
      !!findTimesNear(rawText, ["arrive", "arrival"]),
    ),
    prepType: prepType ? "high" : "missing",
    regimenType: regimenType !== "other" ? "medium" : "low",
    clearLiquidStart: scoreField(
      clearLiquidStart,
      !!findTimesNear(rawText, ["clear liquid"]),
    ),
    dose1: scoreField(dose1, !!findTimesNear(rawText, ["dose 1", "first dose"])),
    dose2: scoreField(dose2, !!findTimesNear(rawText, ["dose 2", "second dose"])),
    stopLiquids: scoreField(
      stopLiquids,
      !!findTimesNear(rawText, ["nothing by mouth", "npo"]),
    ),
    clinicPhone: clinicPhone ? "medium" : "missing",
  };

  // ── Missing fields ──

  const fieldLabels: Record<string, string> = {
    procedureDate: "Procedure Date",
    procedureTime: "Procedure Time",
    prepType: "Prep Type",
    dose1: "Dose 1 Time",
    dose2: "Dose 2 Time",
    clearLiquidStart: "Clear Liquid Start",
    stopLiquids: "Stop Liquids Time",
  };

  const requiredValues: Record<string, string> = {
    procedureDate,
    procedureTime,
    prepType,
    dose1,
    dose2,
    clearLiquidStart,
    stopLiquids,
  };

  const missingFields = Object.entries(requiredValues)
    .filter(([, v]) => !v)
    .map(([k]) => fieldLabels[k] ?? k);

  // ── Warnings ──

  const warnings: ParseWarning[] = [];

  if (!procedureTime) {
    warnings.push({
      field: "procedureTime",
      severity: "error",
      message: "Procedure time could not be detected. Please enter it manually.",
    });
  }

  if (!dose1) {
    warnings.push({
      field: "dose1",
      severity: "error",
      message:
        "Dose 1 time is missing. This is required to build an accurate timeline.",
    });
  }

  if (!dose2) {
    warnings.push({
      field: "dose2",
      severity: "warning",
      message:
        "Dose 2 time is missing. If your prep is split-dose, this time is needed.",
    });
  }

  if (!stopLiquids) {
    warnings.push({
      field: "stopLiquids",
      severity: "error",
      message:
        "Stop liquids time could not be detected. This is a critical safety cutoff — please enter it manually.",
    });
  }

  if (!prepType) {
    warnings.push({
      field: "prepType",
      severity: "warning",
      message:
        "Prep type could not be identified. Please select your prep medication so guidance is accurate.",
    });
  }

  warnings.push(...detectTimeConflicts({ dose1, dose2, stopLiquids, procedureTime, arrivalTime }));

  // ── Overall confidence ──

  const scores = Object.values(confidence);
  const highCount = scores.filter((s) => s === "high").length;
  const missingCount = scores.filter((s) => s === "missing").length;

  let overallConfidence: ParsedPrepInstructions["overallConfidence"];
  if (missingCount >= 4 || highCount === 0) {
    overallConfidence = "low";
  } else if (missingCount >= 2 || highCount < 4) {
    overallConfidence = "partial";
  } else {
    overallConfidence = "high";
  }

  return {
    procedureDate,
    procedureTime,
    arrivalTime,
    prepType,
    regimenType,
    clearLiquidStart,
    dose1,
    dose2,
    stopLiquids,
    clinicPhone,
    confidence,
    overallConfidence,
    warnings,
    missingFields,
    rawText,
  };
}
