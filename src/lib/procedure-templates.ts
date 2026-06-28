import type { ActiveProcedureType, EventCategory, EventGuidance, EventPriority } from "./types";

// ── Template types ───────────────────────────────────────────

export interface SetupField {
  key: string;
  label: string;
  type: "date" | "time" | "text" | "tel" | "select";
  placeholder?: string;
  helper?: string;
  options?: readonly { value: string; label: string; description: string }[];
}

export interface DefaultTimelineEvent {
  id: string;
  title: string;
  category: EventCategory;
  priority?: EventPriority;
  required: boolean;
  description: string;
  guidance?: EventGuidance;
}

export interface SupplyItemTemplate {
  id: string;
  label: string;
}

export interface ProcedureTemplate {
  procedureType: ActiveProcedureType;
  displayName: string;
  shortDescription: string;
  requiredSetupFields: readonly string[];
  optionalSetupFields: readonly string[];
  defaultTimelineEvents: readonly DefaultTimelineEvent[];
  suggestedQuestions: readonly string[];
  suppliesChecklist: readonly SupplyItemTemplate[];
  safetyNotes: readonly string[];
  eventTips: Readonly<Record<string, readonly string[]>>;
  guidanceContent: {
    prepOverview: string;
    whatToExpectDay: string;
    afterProcedure: string;
  };
}

// ── Interpolation helper ─────────────────────────────────────

export function interpolateGuidance(
  guidance: EventGuidance,
  vars: Record<string, string>,
): EventGuidance {
  function interp(s: string): string {
    return s.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
  }
  return {
    whatToDo: interp(guidance.whatToDo),
    whatToExpect: interp(guidance.whatToExpect),
    normalReassurance: interp(guidance.normalReassurance),
    caution: interp(guidance.caution),
  };
}

// ── Colonoscopy template ─────────────────────────────────────

const COLONOSCOPY_TEMPLATE: ProcedureTemplate = {
  procedureType: "colonoscopy",
  displayName: "Colonoscopy Prep",
  shortDescription:
    "A scope exam of the colon that requires bowel prep with a laxative solution, typically as a split dose.",

  requiredSetupFields: [
    "procedureDate",
    "procedureTime",
    "prepType",
    "clearLiquidStartTime",
    "dose1Time",
    "dose2Time",
    "stopLiquidsTime",
  ],
  optionalSetupFields: [
    "arrivalTime",
    "clinicPhone",
    "location",
  ],

  defaultTimelineEvents: [
    {
      id: "buy-supplies",
      title: "Buy prep supplies",
      category: "preparation",
      priority: "primary",
      required: true,
      description: "Pick up prep solution and clear liquids.",
      guidance: {
        whatToDo:
          "Pick up your {{prepName}} from the pharmacy if you haven't already. Stock up on clear liquids you enjoy — chicken or vegetable broth, clear Gatorade or Pedialyte (no red or purple), plain Jell-O (no red or purple), apple juice, white grape juice, and popsicles. Also grab wet wipes and petroleum jelly for comfort.",
        whatToExpect:
          "This is the easiest step — you're just gathering supplies so the rest of the process goes smoothly. Having clear liquids you actually like on hand makes a big difference.",
        normalReassurance:
          "Feeling a bit anxious as you shop for prep supplies is completely normal. Getting organized ahead of time is one of the best things you can do. You're already taking a great step.",
        caution:
          "Make sure your {{prepName}} prescription is filled. If the pharmacy needs to order it, call your clinic so they can help. Do not substitute a different prep without talking to your doctor first.",
      },
    },
    {
      id: "clear-liquid-diet",
      title: "Start clear liquid diet",
      category: "diet",
      priority: "primary",
      required: true,
      description: "Switch to clear liquids only — no solid food.",
      guidance: {
        whatToDo:
          "Starting at {{clearLiquidStartTime}}, switch to clear liquids only — no solid food. Clear liquids include water, clear broth, tea or black coffee (no milk or cream), apple or white grape juice, plain Jell-O, clear Gatorade, and popsicles without fruit chunks.",
        whatToExpect:
          "You'll likely feel hungry, especially by afternoon and evening. This is temporary and very normal. Warm broth can feel more satisfying than cold drinks. Staying busy helps the time pass.",
        normalReassurance:
          "Feeling hungry is the hardest part for most people, and it's completely manageable. Your body has plenty of reserves. By tomorrow evening you'll be enjoying a real meal again.",
        caution:
          "Do not eat any solid food, even small snacks. Solid food can leave residue that makes it harder for your doctor to see clearly during the procedure. If you accidentally eat something solid, contact your clinic before continuing.",
      },
    },
    {
      id: "avoid-red-purple",
      title: "Avoid red and purple liquids",
      category: "restriction",
      priority: "supporting",
      required: true,
      description: "Red/purple dyes can interfere with the exam.",
      guidance: {
        whatToDo:
          "Avoid all red and purple drinks, Jell-O, and popsicles. Stick to yellow, green, orange, or clear options.",
        whatToExpect:
          "This is a simple rule. Just check the color before you drink it.",
        normalReassurance:
          "Red and purple dyes can coat the inside of your colon and look like blood or inflammation to the doctor. It's not dangerous if you accidentally have some, but it can affect the quality of your exam.",
        caution:
          "If you accidentally consumed a red or purple liquid, don't panic — just switch to an approved color. Let your clinic know if it was a large amount.",
      },
    },
    {
      id: "dose-1",
      title: "Dose 1 — {{prepShortName}} evening dose",
      category: "medication",
      priority: "primary",
      required: true,
      description: "First dose of bowel prep solution.",
      guidance: {
        whatToDo:
          "At {{dose1Time}}, prepare your first dose as directed on the packaging. Drink the solution over about 1 hour — small, steady sips work better than big gulps. Follow with additional water as directed. Chilling the solution and using a straw can help with the taste.",
        whatToExpect:
          "Most people find the taste unpleasant — this is completely normal. Bowel movements typically begin within 1 to 3 hours. The extra water is important for hydration.",
        normalReassurance:
          "If the taste makes you gag or you feel mildly nauseous, that's very common. Take a short break (5–10 minutes), then continue. Most people are able to finish the dose. You can chase each sip with a clear liquid you enjoy.",
        caution:
          "Do not skip or reduce your dose, even if you feel it's already working. If you vomit within 30 minutes, wait 30 minutes and try again with smaller sips. If you can't keep the prep down after multiple attempts, contact your clinic for guidance.",
      },
    },
    {
      id: "bathroom-phase",
      title: "Bathroom phase begins",
      category: "preparation",
      priority: "supporting",
      required: false,
      description: "Stay near a bathroom after starting prep.",
      guidance: {
        whatToDo:
          "Stay close to a bathroom for the rest of the evening. Set up a comfortable spot with your phone, a book, or a tablet. Apply petroleum jelly beforehand and use wet wipes instead of dry toilet paper.",
        whatToExpect:
          "Bowel movements will start gradually and become more frequent and watery. Mild cramping that comes in waves before a bowel movement is normal. The urgency can come on quickly, so stay near the bathroom.",
        normalReassurance:
          "Most people say this phase is more tedious than painful. The cramping is usually mild and passes quickly. Millions of people go through this every year and most say it was more manageable than they expected.",
        caution:
          "Mild discomfort and frequent bathroom trips are expected. If you experience severe persistent abdominal pain, feel severely dizzy, or notice significant blood in your stool, contact your clinic or seek medical care.",
      },
    },
    {
      id: "dose-2",
      title: "Dose 2 — {{prepShortName}} early morning dose",
      category: "medication",
      priority: "primary",
      required: true,
      description: "Second dose of bowel prep solution.",
      guidance: {
        whatToDo:
          "Set an alarm for {{dose2Time}}. Prepare your second dose the same way as the first. Use the same tricks — chilled solution, straw, lemon wedge. Follow with additional water as directed.",
        whatToExpect:
          "The early wake-up is tough, but this second dose is crucial. Most people find it a little easier the second time. Your stools should become clear or light yellow — that means the prep is working well.",
        normalReassurance:
          "The split dose produces a significantly cleaner prep than taking everything the night before, which means better results for you. You're in the home stretch.",
        caution:
          "Do not skip this dose. If you vomit, wait 30 minutes and try again. If you can't keep it down after two tries, contact your clinic. Do not drink anything after your cutoff time of {{stopLiquidsTime}}.",
      },
    },
    {
      id: "stop-liquids",
      title: "Stop all liquids",
      category: "restriction",
      priority: "safety",
      required: true,
      description: "Nothing by mouth — required for safe sedation.",
      guidance: {
        whatToDo:
          "At {{stopLiquidsTime}}, stop drinking all liquids — including water. Nothing by mouth until after your procedure. You may brush your teeth but don't swallow any water.",
        whatToExpect:
          "Your mouth may feel dry, but you've had plenty of fluids overnight. This fasting period allows your stomach to empty completely for safe sedation.",
        normalReassurance:
          "Most people find they're focused on getting to their appointment and don't notice the thirst much. This is a standard safety precaution for any procedure with sedation.",
        caution:
          "This cutoff is a strict safety requirement. If you accidentally drink something after this time, contact your clinic immediately — they may need to delay your procedure.",
      },
    },
    {
      id: "arrive",
      title: "Arrive at procedure center",
      category: "arrival",
      priority: "primary",
      required: true,
      description: "Check in with ID, insurance, and driver.",
      guidance: {
        whatToDo:
          "Arrive by {{arrivalTime}}. Bring your photo ID, insurance card, and a list of current medications. Your driver must come with you or be reachable by phone. Wear comfortable, loose clothing and leave valuables at home.",
        whatToExpect:
          "You'll check in, change into a gown, and have an IV placed. A nurse will review your history and answer questions. The atmosphere is calm and routine — the staff does this every day.",
        normalReassurance:
          "Feeling nervous is completely normal and very common. The staff is experienced and will take good care of you. Ask any questions you have — no question is too small.",
        caution:
          "If you were unable to complete your prep (couldn't finish either dose, or stools are still dark and solid), tell the staff right away. They'll consult with your doctor about whether to proceed.",
      },
    },
    {
      id: "procedure",
      title: "Procedure",
      category: "procedure",
      priority: "primary",
      required: true,
      description: "Colonoscopy under sedation, typically 20–40 minutes.",
      guidance: {
        whatToDo:
          "The team will position you comfortably on your left side. Sedation is given through your IV — most people feel relaxed and drowsy within seconds. Just breathe normally. The procedure typically takes 20 to 40 minutes.",
        whatToExpect:
          "Most patients remember very little or nothing thanks to sedation. You'll wake up in recovery feeling groggy but comfortable. Some mild bloating afterward is normal from the air used during the exam.",
        normalReassurance:
          "You made it through the hardest part — the prep. The procedure itself is the easy part for you. Your doctor will share results with you after you wake up.",
        caution:
          "After the procedure, you must not drive, operate machinery, or make important decisions for the rest of the day. Sedation can affect your judgment even after you feel alert.",
      },
    },
  ],

  suggestedQuestions: [
    "Can I drink yellow Gatorade?",
    "I feel nauseous. Is this normal?",
    "My stool is still brown. What should I do?",
    "What happens after Dose #1?",
    "Can I take my medication?",
  ],

  suppliesChecklist: [
    { id: "prep-med", label: "Prep medication (from pharmacy)" },
    { id: "clear-liquids", label: "Clear liquids (water, apple juice, white grape juice)" },
    { id: "electrolyte", label: "Electrolyte drink allowed by your instructions" },
    { id: "broth", label: "Broth or clear soup" },
    { id: "gelatin-popsicles", label: "Gelatin or popsicles (no red or purple)" },
    { id: "soft-tp", label: "Soft toilet paper or wet wipes" },
    { id: "barrier-cream", label: "Barrier cream or petroleum jelly" },
    { id: "phone-charger", label: "Phone charger" },
    { id: "comfy-clothes", label: "Comfortable, loose clothes for procedure day" },
    { id: "instructions", label: "Clinic instructions printed or saved on phone" },
    { id: "ride-home", label: "Ride home confirmed" },
  ],

  safetyNotes: [
    "Do not skip any dose of your prep solution, even if you feel it is already working.",
    "Do not eat solid food once you've started the clear liquid diet.",
    "Stop all liquids at the time your clinic specified — this is required for safe sedation.",
    "Do not adjust any medications on your own. Contact your clinic first.",
    "You must have a responsible adult drive you home after the procedure.",
    "If you experience chest pain, trouble breathing, or severe symptoms, call 911.",
  ],

  eventTips: {
    "buy-supplies": [
      "Make a list before you shop so you don't forget anything.",
      "Pick clear liquids you actually enjoy — variety helps.",
      "Wet wipes and petroleum jelly will make the prep much more comfortable.",
    ],
    "clear-liquid-diet": [
      "Warm broth can feel more filling than cold drinks.",
      "Staying busy or distracted helps the time pass faster.",
      "Popsicles count as clear liquids and can feel like a treat.",
      "Coffee and tea are fine — just skip the milk or cream.",
    ],
    "avoid-red-purple": [
      "When in doubt about a color, choose something clear or yellow.",
      'Check the label — some "orange" drinks contain red dye.',
      "Green, yellow, and clear Jell-O and popsicles are all fine.",
    ],
    "dose-1": [
      "Chill the solution in the fridge — it's much easier to drink cold.",
      "Use a straw to bypass your taste buds.",
      "Chase each sip with a clear liquid you enjoy.",
      "Sucking on a lemon wedge between sips can help with the taste.",
    ],
    "bathroom-phase": [
      "Set up a comfortable spot near the bathroom with entertainment.",
      "Apply petroleum jelly before things start for comfort.",
      "Wet wipes are much gentler than dry toilet paper.",
      "Keep drinking clear fluids to stay hydrated.",
    ],
    "dose-2": [
      "Set a reliable alarm — you don't want to oversleep this one.",
      "The second dose is often a little easier than the first.",
      "Keep your supplies from last night within reach.",
      "You're in the home stretch — this is the last big step.",
    ],
    "stop-liquids": [
      "You may brush your teeth — just don't swallow the water.",
      "Your mouth may feel dry, but you've had plenty of fluids.",
      "Focus on getting ready and the time will pass quickly.",
    ],
    "arrive": [
      "Wear comfortable, loose-fitting clothing.",
      "Leave jewelry and valuables at home.",
      "Bring your ID, insurance card, and medication list.",
      "Your driver should plan to stay or be reachable by phone.",
    ],
    "procedure": [
      "Most patients remember very little thanks to sedation.",
      "The procedure itself is the easy part — you did the hard work already.",
      "Take slow, deep breaths while the sedation takes effect.",
      "The staff does this every day — you're in experienced hands.",
    ],
  },

  guidanceContent: {
    prepOverview:
      "Colonoscopy prep clears your colon so the doctor can see clearly during the exam. You'll drink a laxative solution (usually in two doses), follow a clear liquid diet, and stop all intake before your procedure. The prep is the hardest part — the procedure itself is quick.",
    whatToExpectDay:
      "You'll check in, change into a gown, and receive sedation through an IV. Most patients remember little or nothing. The exam takes 20–40 minutes. You'll rest in recovery and your doctor will share results before you leave.",
    afterProcedure:
      "You'll need a responsible adult to drive you home. You may feel groggy and should not drive, operate machinery, or make important decisions for the rest of the day. Mild bloating or gas is normal. You can usually eat normally once you feel up to it.",
  },
};

// ── EGD template ─────────────────────────────────────────────

const EGD_TEMPLATE: ProcedureTemplate = {
  procedureType: "egd",
  displayName: "Upper Endoscopy / EGD Prep",
  shortDescription:
    "A scope exam of the upper digestive tract (esophagus, stomach, duodenum). Requires fasting but no bowel prep.",

  requiredSetupFields: [
    "procedureDate",
    "procedureTime",
    "stopEatingTime",
    "stopLiquidsTime",
  ],
  optionalSetupFields: [
    "arrivalTime",
    "clinicPhone",
    "location",
  ],

  defaultTimelineEvents: [
    {
      id: "stop-eating",
      title: "Stop eating solid food",
      category: "diet",
      priority: "primary",
      required: true,
      description: "No solid food after this time — clear liquids only.",
      guidance: {
        whatToDo:
          "At {{stopEatingTime}}, stop eating all solid food. You may continue drinking clear liquids (water, clear broth, apple juice, tea, black coffee) until your liquids cutoff time.",
        whatToExpect:
          "You may feel hungry, especially in the evening. This is temporary. Warm broth or clear juice can help you feel more satisfied.",
        normalReassurance:
          "Fasting before a procedure is very routine. Your body has plenty of reserves, and you'll be able to eat again after the procedure.",
        caution:
          "Do not eat any solid food after this time, even small snacks. If you accidentally eat something, contact your clinic — they may need to adjust your procedure time.",
      },
    },
    {
      id: "stop-liquids",
      title: "Stop all liquids",
      category: "restriction",
      priority: "safety",
      required: true,
      description: "Nothing by mouth — required for safe sedation.",
      guidance: {
        whatToDo:
          "At {{stopLiquidsTime}}, stop drinking all liquids — including water. Nothing by mouth until after your procedure. You may brush your teeth but don't swallow any water.",
        whatToExpect:
          "Your mouth may feel dry, but the fasting period is usually only a few hours. This allows your stomach to empty completely for safe sedation.",
        normalReassurance:
          "Most people find they're focused on getting to their appointment and don't notice the thirst much. This is a standard safety precaution for any procedure with sedation.",
        caution:
          "This cutoff is a strict safety requirement. If you accidentally drink something after this time, contact your clinic immediately — they may need to delay your procedure.",
      },
    },
    {
      id: "arrive",
      title: "Arrive at procedure center",
      category: "arrival",
      priority: "primary",
      required: true,
      description: "Check in with ID, insurance, and driver.",
      guidance: {
        whatToDo:
          "Arrive by {{arrivalTime}}. Bring your photo ID, insurance card, and a list of current medications. Your driver must come with you or be reachable by phone. Wear comfortable, loose clothing.",
        whatToExpect:
          "You'll check in, change into a gown, and have an IV placed. A nurse will review your history, confirm your medications, and answer any questions. The atmosphere is calm and routine.",
        normalReassurance:
          "Feeling nervous is completely normal. The staff is experienced and will take good care of you. Ask any questions you have — no question is too small.",
        caution:
          "If you ate or drank anything after your cutoff times, tell the staff right away. They'll consult with your doctor about whether to proceed or reschedule.",
      },
    },
    {
      id: "procedure",
      title: "Procedure",
      category: "procedure",
      priority: "primary",
      required: true,
      description: "Upper endoscopy under sedation, typically 15–30 minutes.",
      guidance: {
        whatToDo:
          "The team will position you comfortably, usually on your left side. Sedation is given through your IV. A thin, flexible scope is passed through your mouth. Just breathe normally — the procedure typically takes 15 to 30 minutes.",
        whatToExpect:
          "Most patients remember very little or nothing thanks to sedation. You'll wake up in recovery feeling groggy but comfortable. A mild sore throat is common and usually resolves within a day.",
        normalReassurance:
          "The procedure itself is quick and most patients are surprised how easy it was. Your doctor will share results with you before you leave.",
        caution:
          "After the procedure, you must not drive, operate machinery, or make important decisions for the rest of the day. Sedation can affect your judgment even after you feel alert.",
      },
    },
  ],

  suggestedQuestions: [
    "What can I eat the day before?",
    "When do I need to stop drinking water?",
    "Will I be asleep during the procedure?",
    "How long does the procedure take?",
    "Can I take my medication the morning of?",
  ],

  suppliesChecklist: [
    { id: "id-insurance", label: "Photo ID and insurance card" },
    { id: "med-list", label: "List of current medications" },
    { id: "comfy-clothes", label: "Comfortable, loose clothes for procedure day" },
    { id: "phone-charger", label: "Phone charger" },
    { id: "instructions", label: "Clinic instructions printed or saved on phone" },
    { id: "ride-home", label: "Ride home confirmed" },
    { id: "throat-lozenges", label: "Throat lozenges for mild sore throat afterward (optional)" },
  ],

  safetyNotes: [
    "Do not eat or drink anything after the times your clinic specified — this is required for safe sedation.",
    "Do not adjust any medications on your own. Contact your clinic first.",
    "You must have a responsible adult drive you home after the procedure.",
    "If you experience chest pain, trouble breathing, or severe symptoms, call 911.",
    "Mild sore throat after the procedure is normal and usually resolves within a day.",
  ],

  eventTips: {
    "stop-eating": [
      "Have a satisfying meal before the cutoff — you'll be fasting for a while.",
      "Clear liquids like broth or juice can help between the food and liquid cutoffs.",
    ],
    "stop-liquids": [
      "You may brush your teeth — just don't swallow the water.",
      "Your mouth may feel dry, but the fasting period is usually short.",
      "Focus on getting ready and the time will pass quickly.",
    ],
    "arrive": [
      "Wear comfortable, loose-fitting clothing.",
      "Leave jewelry and valuables at home.",
      "Bring your ID, insurance card, and medication list.",
      "Your driver should plan to stay or be reachable by phone.",
    ],
    "procedure": [
      "Most patients remember very little thanks to sedation.",
      "The procedure is quick — usually 15 to 30 minutes.",
      "A mild sore throat afterward is normal and resolves quickly.",
      "The staff does this every day — you're in experienced hands.",
    ],
  },

  guidanceContent: {
    prepOverview:
      "EGD prep is simpler than colonoscopy prep — there is no bowel prep solution to drink. You'll need to fast (no food and then no liquids) before the procedure so your stomach is empty for a clear view and safe sedation.",
    whatToExpectDay:
      "You'll check in, change into a gown, and receive sedation through an IV. A thin, flexible scope is passed through your mouth to examine your esophagus, stomach, and upper small intestine. The exam takes 15–30 minutes. Most patients remember little or nothing.",
    afterProcedure:
      "You'll need a responsible adult to drive you home. You may feel groggy and should not drive, operate machinery, or make important decisions for the rest of the day. A mild sore throat is common and usually resolves within 24 hours. You can usually eat soft foods once you feel up to it.",
  },
};

// ── Registry ─────────────────────────────────────────────────

const TEMPLATES: Record<ActiveProcedureType, ProcedureTemplate> = {
  colonoscopy: COLONOSCOPY_TEMPLATE,
  egd: EGD_TEMPLATE,
};

export function getTemplate(procedureType: ActiveProcedureType): ProcedureTemplate {
  return TEMPLATES[procedureType];
}

export function getAllActiveTemplates(): ProcedureTemplate[] {
  return Object.values(TEMPLATES);
}

export function getActiveTypes(): ActiveProcedureType[] {
  return Object.keys(TEMPLATES) as ActiveProcedureType[];
}
