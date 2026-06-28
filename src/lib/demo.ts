import type { PrepPlan, ActiveProcedureType } from "./types";
import { DEMO_PLAN } from "./demo-data";
import { generatePlan, type ManualSetupInput } from "./generate-plan";

const DEMO_MODE_KEY = "preppal-demo-mode";

export function isDemoMode(): boolean {
  return localStorage.getItem(DEMO_MODE_KEY) === "true";
}

export function setDemoMode(active: boolean): void {
  if (active) {
    localStorage.setItem(DEMO_MODE_KEY, "true");
  } else {
    localStorage.removeItem(DEMO_MODE_KEY);
  }
}

export function exitDemo(): void {
  localStorage.removeItem(DEMO_MODE_KEY);
  localStorage.removeItem("preppal-plan");
  localStorage.removeItem("preppal-symptoms");
  localStorage.removeItem("preppal-contacts");
  localStorage.removeItem("preppal-raw-instructions");
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function createDemoPlan(procedureType: ActiveProcedureType = "colonoscopy"): PrepPlan {
  if (procedureType === "egd") {
    return createEgdDemoPlan();
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const procDate = formatDateStr(tomorrow);
  const dayBefore = formatDateStr(today);
  const twoDaysBefore = formatDateStr(yesterday);

  const plan: PrepPlan = JSON.parse(JSON.stringify(DEMO_PLAN));

  plan.procedureDate = procDate;

  for (const event of plan.events) {
    event.startTime = event.startTime
      .replace("2026-07-15", procDate)
      .replace("2026-07-14", dayBefore)
      .replace("2026-07-13", twoDaysBefore);
    if (event.endTime) {
      event.endTime = event.endTime
        .replace("2026-07-15", procDate)
        .replace("2026-07-14", dayBefore)
        .replace("2026-07-13", twoDaysBefore);
    }
  }

  const buySupplies = plan.events.find((e) => e.id === "buy-supplies");
  if (buySupplies) buySupplies.completed = true;

  const procDateDisplay = tomorrow.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const todayDisplay = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const yesterdayDisplay = yesterday.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  plan.rawInstructionText = plan.rawInstructionText
    .replace(/July 15, 2026/g, procDateDisplay)
    .replace(/July 14/g, todayDisplay)
    .replace(/July 13/g, yesterdayDisplay);

  return plan;
}

function createEgdDemoPlan(): PrepPlan {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const procDate = formatDateStr(tomorrow);
  const todayDisplay = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const procDateDisplay = tomorrow.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const input: ManualSetupInput = {
    procedureDate: procDate,
    procedureTime: "09:00",
    arrivalTime: "08:00",
    prepType: "",
    clearLiquidStartTime: "",
    dose1Time: "",
    dose2Time: "",
    stopLiquidsTime: "05:00",
    stopEatingTime: "22:00",
    clinicPhone: "(555) 345-6789",
  };

  const plan = generatePlan(input, "egd");
  plan.location = "City Gastroenterology Clinic, Suite 100";
  plan.rawInstructionText = `Upper Endoscopy (EGD) Prep Instructions — Dr. Chen
Patient: Alex Kim
Procedure: ${procDateDisplay} at 9:00 AM
Arrival: 8:00 AM at City Gastroenterology Clinic, Suite 100

THE EVENING BEFORE (${todayDisplay}):
- Eat a light dinner before 10:00 PM
- After 10:00 PM, no solid food — clear liquids only (water, clear broth, apple juice, tea, black coffee)

THE MORNING OF PROCEDURE:
- Stop all liquids at 5:00 AM — nothing by mouth after this time
- You may brush your teeth but do not swallow water
- Arrive at 8:00 AM with photo ID, insurance card, and medication list
- Wear comfortable clothing; leave valuables at home
- Your driver must remain at or near the facility

MEDICATIONS:
- Contact our office about any blood thinners or diabetes medications
- You may take other routine medications with a small sip of water before 5:00 AM

AFTER THE PROCEDURE:
- You will need a responsible adult to drive you home
- Do not drive, operate machinery, or make important decisions for the rest of the day
- A mild sore throat is normal and usually resolves within 24 hours
- You may eat soft foods once you feel up to it

Questions? Call us at (555) 345-6789`;

  return plan;
}

export interface DemoHint {
  hint: string;
}

export function getDemoHint(pathname: string): DemoHint {
  if (pathname === "/dashboard") {
    return {
      hint: 'This is your prep dashboard. Tap "Am I On Track?" to check your progress, or explore the upcoming steps below.',
    };
  }
  if (pathname === "/timeline") {
    return {
      hint: "Your full prep timeline. Tap any event for detailed guidance, practical tips, and reassurance.",
    };
  }
  if (pathname === "/ask") {
    return {
      hint: "Try a suggested question or type your own. Responses are general guidance — not medical advice.",
    };
  }
  if (pathname === "/emergency") {
    return {
      hint: "Save your clinic's phone numbers here. Tap the pencil icon to add or edit a number.",
    };
  }
  if (pathname === "/symptoms") {
    return {
      hint: "Log symptoms during prep. Mild symptoms show reassurance; severe symptoms prompt you to contact your clinic.",
    };
  }
  if (pathname.startsWith("/event/")) {
    return {
      hint: "Each step includes what to do, what to expect, reassurance, tips, and when to call your clinic.",
    };
  }
  if (pathname === "/instructions") {
    return {
      hint: "Your clinic's original instructions are always here for reference.",
    };
  }
  if (pathname === "/reminders") {
    return {
      hint: "Set your reminder preferences. In demo mode, simulated reminder cards appear on the dashboard.",
    };
  }
  return {
    hint: "Explore PrepPal in demo mode, preparing for a procedure tomorrow.",
  };
}
