import type { SymptomEntry } from "./symptoms";

// ── Escalation levels (ordered by severity) ──────────────────

export type EscalationLevel =
  | "normal"
  | "caution"
  | "contact-clinic"
  | "urgent-care";

const LEVEL_RANK: Record<EscalationLevel, number> = {
  "normal": 0,
  "caution": 1,
  "contact-clinic": 2,
  "urgent-care": 3,
};

export interface EscalationResult {
  level: EscalationLevel;
  headline: string;
  guidance: string;
  showClinicPhone: boolean;
  show911: boolean;
}

// ── Symptom → escalation mapping ─────────────────────────────

const SYMPTOM_ESCALATION: Record<string, EscalationLevel> = {
  "nausea": "caution",
  "bloating": "caution",
  "hunger": "normal",
  "cramping": "caution",
  "dizziness": "caution",

  "vomiting": "contact-clinic",
  "unable-to-finish-prep": "contact-clinic",

  "severe-abdominal-pain": "urgent-care",
  "chest-pain": "urgent-care",
  "trouble-breathing": "urgent-care",
  "fainting": "urgent-care",
  "allergic-reaction": "urgent-care",
};

// ── Text pattern → escalation mapping ────────────────────────

interface TextRule {
  patterns: RegExp[];
  level: EscalationLevel;
}

const TEXT_RULES: TextRule[] = [
  // ── Urgent care (check first — highest severity) ──
  {
    patterns: [/chest\s*pain/i, /pain\s*(in|my)\s*chest/i],
    level: "urgent-care",
  },
  {
    patterns: [/can'?t\s*breath/i, /trouble\s*breath/i, /difficult\w*\s*breath/i, /short\w*\s*(of\s*)?breath/i],
    level: "urgent-care",
  },
  {
    patterns: [/faint/i, /pass\w*\s*out/i, /lost?\s*conscious/i],
    level: "urgent-care",
  },
  {
    patterns: [/allergic/i, /hives/i, /swelling/i, /anaphyla/i],
    level: "urgent-care",
  },
  {
    patterns: [/severe\s*(abdominal\s*)?pain/i, /really\s*bad\s*pain/i, /extreme\s*pain/i, /unbearable\s*pain/i],
    level: "urgent-care",
  },

  // ── Contact clinic ──
  {
    patterns: [/can'?t\s*finish/i, /unable\s*(to\s*)?finish/i, /couldn'?t\s*finish/i, /not\s*able\s*to\s*finish/i],
    level: "contact-clinic",
  },
  {
    patterns: [/can'?t\s*keep\s*(it\s*)?down/i, /keep\s*throwing\s*up/i, /can'?t\s*stop\s*vomit/i],
    level: "contact-clinic",
  },
  {
    patterns: [/vomit/i, /throw\w*\s*up/i, /threw\s*up/i, /puking/i],
    level: "contact-clinic",
  },
  {
    patterns: [/severe\w*\s*dizz/i, /really\s*dizz/i, /extremely\s*dizz/i, /very\s*dizz/i],
    level: "contact-clinic",
  },
  {
    patterns: [/blood\s*thinn/i, /warfarin/i, /coumadin/i, /eliquis/i, /xarelto/i, /plavix/i],
    level: "contact-clinic",
  },
  {
    patterns: [/diabetes\s*med/i, /insulin/i, /metformin/i, /blood\s*sugar\s*med/i],
    level: "contact-clinic",
  },
  {
    patterns: [/kidney/i],
    level: "contact-clinic",
  },
  {
    patterns: [/heart\s*(disease|condition|problem|failure|med)/i, /cardiac/i],
    level: "contact-clinic",
  },
  {
    patterns: [/pregnan/i],
    level: "contact-clinic",
  },
  {
    patterns: [/medication/i, /medicine/i, /pills?\b/i, /prescription/i, /which\s*med/i, /what\s*med/i],
    level: "contact-clinic",
  },
  {
    patterns: [/instruc\w+\s*(say|conflict|different|wrong|don'?t\s*match)/i, /app\s*(say|show|conflict|wrong|different)/i, /doesn'?t\s*match/i],
    level: "contact-clinic",
  },
  {
    patterns: [/stool\s*(is\s*)?(still\s*)?brown/i, /brown\s*stool/i, /still\s*brown/i, /not\s*clear\s*(yet)?$/i],
    level: "contact-clinic",
  },
  {
    patterns: [/bleed/i, /blood\s*(in|from)/i, /bloody/i],
    level: "contact-clinic",
  },

  // ── Caution ──
  {
    patterns: [/nause?o?us/i, /feel\w*\s*sick/i, /queasy/i, /stomach\s*upset/i],
    level: "caution",
  },
  {
    patterns: [/cramp/i, /bloat/i],
    level: "caution",
  },
  {
    patterns: [/dizz/i, /lightheaded/i],
    level: "caution",
  },
  {
    patterns: [/taste/i, /disgust/i, /gross/i, /hard\s*to\s*drink/i, /can'?t\s*stand/i],
    level: "caution",
  },
];

// ── Guidance text per level ──────────────────────────────────

const LEVEL_GUIDANCE: Record<EscalationLevel, { headline: string; guidance: string }> = {
  "normal": {
    headline: "You're doing great",
    guidance: "Everything sounds normal. Keep following your instruction sheet and reach out to your clinic if anything changes.",
  },
  "caution": {
    headline: "This can be normal during prep",
    guidance: "Mild discomfort is very common and usually passes on its own. Keep following your instruction sheet. If things get worse or you're concerned, your clinic is always happy to help.",
  },
  "contact-clinic": {
    headline: "Check in with your clinic",
    guidance: "This is something your clinic should know about. Give them a call — they deal with this every day and can tell you exactly what to do.",
  },
  "urgent-care": {
    headline: "Seek care right away",
    guidance: "These symptoms need immediate attention. Stop your prep and call your clinic, go to urgent care, or call 911 if you feel it's an emergency.",
  },
};

// ── Symptom-specific guidance ────────────────────────────────

const SYMPTOM_GUIDANCE: Partial<Record<string, string>> = {
  "nausea": "Try slowing down your prep, taking small sips, and resting between drinks. Sucking on a lemon wedge can also help.",
  "bloating": "Some bloating is expected as the prep works. Gentle walking can help. It will pass.",
  "hunger": "Feeling hungry is the hardest part for most people. Warm broth, Jell-O, and popsicles can help you feel more satisfied.",
  "cramping": "Mild cramping that comes in waves is normal during prep. It usually passes quickly. Contact your clinic if it becomes severe or persistent.",
  "dizziness": "Make sure you're drinking plenty of clear fluids to stay hydrated. Sit or lie down if you feel lightheaded. If it gets worse, call your clinic.",
  "vomiting": "If you vomited within 30 minutes of taking your prep, wait 30 minutes and try again with smaller sips. If you can't keep the prep down after multiple attempts, call your clinic.",
  "unable-to-finish-prep": "Try slowing down and taking smaller sips. Rest for 15–30 minutes between glasses. Do not skip your prep without speaking to your clinic first — call them for guidance.",
  "severe-abdominal-pain": "Stop your prep and contact your clinic or seek urgent care right away. Do not try to push through severe pain.",
  "chest-pain": "Stop your prep immediately. Call 911 or go to the emergency room. Do not wait.",
  "trouble-breathing": "Stop your prep immediately. Call 911 or go to the emergency room. Do not wait.",
  "fainting": "Lie down in a safe place. If you fainted or nearly fainted, call your clinic or 911. Do not continue your prep until you've spoken to a medical professional.",
  "allergic-reaction": "Stop your prep immediately. If you have swelling of the face, throat, or tongue, or difficulty breathing, call 911. For milder reactions (rash, hives), call your clinic right away.",
};

// ── Public API ───────────────────────────────────────────────

export function evaluateSymptom(symptomId: string): EscalationResult {
  const level = SYMPTOM_ESCALATION[symptomId] ?? "normal";
  const base = LEVEL_GUIDANCE[level];
  const specific = SYMPTOM_GUIDANCE[symptomId];

  return {
    level,
    headline: base.headline,
    guidance: specific ?? base.guidance,
    showClinicPhone: level === "contact-clinic" || level === "urgent-care",
    show911: level === "urgent-care",
  };
}

export function evaluateText(text: string): EscalationResult {
  let highest: EscalationLevel = "normal";

  for (const rule of TEXT_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        if (LEVEL_RANK[rule.level] > LEVEL_RANK[highest]) {
          highest = rule.level;
        }
        if (highest === "urgent-care") break;
      }
    }
    if (highest === "urgent-care") break;
  }

  const base = LEVEL_GUIDANCE[highest];
  return {
    level: highest,
    headline: base.headline,
    guidance: base.guidance,
    showClinicPhone: highest === "contact-clinic" || highest === "urgent-care",
    show911: highest === "urgent-care",
  };
}

export function evaluateSymptomLog(
  entries: SymptomEntry[],
  cutoffHours: number = 24,
): EscalationResult {
  const cutoff = Date.now() - cutoffHours * 60 * 60 * 1000;
  const recent = entries.filter(
    (e) => new Date(e.timestamp).getTime() > cutoff,
  );

  if (recent.length === 0) {
    return {
      ...LEVEL_GUIDANCE["normal"],
      level: "normal",
      showClinicPhone: false,
      show911: false,
    };
  }

  let highest: EscalationLevel = "normal";
  let highestSymptomId = "";

  for (const entry of recent) {
    const level = SYMPTOM_ESCALATION[entry.symptomId] ?? "normal";
    if (LEVEL_RANK[level] > LEVEL_RANK[highest]) {
      highest = level;
      highestSymptomId = entry.symptomId;
    }
  }

  const base = LEVEL_GUIDANCE[highest];
  const specific = SYMPTOM_GUIDANCE[highestSymptomId];

  return {
    level: highest,
    headline: base.headline,
    guidance: specific ?? base.guidance,
    showClinicPhone: highest === "contact-clinic" || highest === "urgent-care",
    show911: highest === "urgent-care",
  };
}

export type EventSafetyCategory = "medication" | "restriction" | "arrival" | "procedure";

const EVENT_SAFETY_NOTES: Partial<Record<string, string>> = {
  "dose-1": "Take your full dose as directed. Do not reduce or skip it, even if you feel it's already working. If you have trouble keeping it down, call your clinic before stopping.",
  "dose-2": "This dose is essential for a successful prep. Do not skip it. If you have trouble, call your clinic — do not decide on your own to stop.",
  "stop-liquids": "This is a strict safety requirement. If you accidentally drink something after the cutoff, call your clinic — they may need to adjust your procedure time.",
  "arrive": "If you were unable to complete your prep, tell the staff right away. Do not take any medications your clinic hasn't specifically approved for today.",
  "procedure": "Do not drive, operate machinery, or make important decisions for the rest of the day after sedation.",
};

export function getEventSafetyNote(eventId: string): string | null {
  return EVENT_SAFETY_NOTES[eventId] ?? null;
}

export function getEscalationVariant(level: EscalationLevel): "calm" | "warm" | "urgent" | "default" {
  switch (level) {
    case "urgent-care": return "urgent";
    case "contact-clinic": return "warm";
    case "caution": return "calm";
    default: return "default";
  }
}
