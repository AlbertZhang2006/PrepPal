import type { PrepPlan, PrepEvent } from "./types";

const SAFETY_NOTE = "Follow your clinic's official instructions. PrepPal is a support tool — not a replacement for medical advice.";

function toIcsDate(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}${mo}${da}T${h}${mi}${s}`;
}

function defaultEnd(startIso: string): string {
  const d = new Date(startIso);
  d.setMinutes(d.getMinutes() + 30);
  return d.toISOString().slice(0, 19);
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text;
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  const parts: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    parts.push(remaining.slice(0, 75));
    remaining = " " + remaining.slice(75);
  }
  parts.push(remaining);
  return parts.join("\r\n");
}

function buildVEvent(event: PrepEvent, uid: string, dtstamp: string): string {
  const start = toIcsDate(event.startTime);
  const end = toIcsDate(event.endTime ?? defaultEnd(event.startTime));
  const summary = escapeIcs(event.title);
  const brief = firstSentence(event.guidance.whatToDo);
  const description = escapeIcs(`${brief}\n\n${SAFETY_NOTE}`);

  const lines = [
    "BEGIN:VEVENT",
    foldLine(`UID:${uid}`),
    `DTSTAMP:${dtstamp}`,
    foldLine(`DTSTART:${start}`),
    foldLine(`DTEND:${end}`),
    foldLine(`SUMMARY:${summary}`),
    foldLine(`DESCRIPTION:${description}`),
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    foldLine(`DESCRIPTION:${summary} — starting soon`),
    "END:VALARM",
    "END:VEVENT",
  ];

  return lines.join("\r\n");
}

export function generateIcs(plan: PrepPlan): string {
  const exportable = plan.events.filter((e) => e.required);
  const now = toIcsDate(new Date().toISOString().slice(0, 19));

  const vevents = exportable.map((event) => {
    const uid = `${event.id}-${plan.procedureDate}@preppal`;
    return buildVEvent(event, uid, now);
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PrepPal//PrepPal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:Procedure Prep — ${plan.procedureDate}`),
    ...vevents,
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(plan: PrepPlan): void {
  const content = generateIcs(plan);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prep-schedule-${plan.procedureDate}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
