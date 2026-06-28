import type { PrepPlan } from "./types";

export const DEMO_PLAN: PrepPlan = {
  procedureType: "colonoscopy",
  procedureDate: "2026-07-15",
  procedureTime: "08:15",
  arrivalTime: "07:15",
  location: "Riverside Endoscopy Center, Suite 200",
  clinicPhone: "(555) 234-5678",
  prepName: "Suprep (sodium sulfate solution)",
  regimenType: "split-dose",
  source: "manual",
  safetyNotes: [
    "Do not skip any dose of your prep solution, even if you feel the prep is already working.",
    "If you take blood thinners, diabetes medications, or heart medications, contact your clinic for specific instructions — do not adjust doses on your own.",
    "If you experience chest pain, trouble breathing, severe dizziness, or repeated vomiting that prevents you from keeping any liquids down, seek urgent medical care immediately.",
    "It is normal for bowel movements to become very frequent and watery. This means the prep is working as intended.",
    "You must arrange a ride home. You will not be able to drive after sedation.",
  ],
  rawInstructionText: `Colonoscopy Prep Instructions — Dr. Rivera
Patient: Maria Thompson
Procedure: July 15, 2026 at 8:15 AM
Arrival: 7:15 AM at Riverside Endoscopy Center, Suite 200
Prep: Suprep Split Dose

TWO DAYS BEFORE (July 13):
- Purchase prep supplies: Suprep kit, clear liquids (broth, Jell-O, Gatorade — no red or purple), wet wipes, petroleum jelly
- Fill Suprep prescription if not already done

ONE DAY BEFORE (July 14):
- Begin clear liquid diet at 8:00 AM — no solid food for the rest of the day
- Avoid all red and purple colored drinks and Jell-O
- At 6:00 PM: Mix first bottle of Suprep with water to the 16 oz line. Drink over 1 hour. Then drink two more 16 oz cups of water over the next hour.
- Stay near a bathroom. Effects typically begin within 1-3 hours.

DAY OF PROCEDURE (July 15):
- At 3:15 AM: Mix second bottle of Suprep with water to the 16 oz line. Drink over 1 hour. Then drink two more 16 oz cups of water over the next hour.
- STOP all liquids at 6:15 AM — nothing by mouth after this time
- Arrive at 7:15 AM. Bring your ID, insurance card, and a responsible driver.
- Procedure at 8:15 AM

CALL US at (555) 234-5678 if you have questions or concerns.`,

  events: [
    {
      id: "buy-supplies",
      title: "Buy prep supplies",
      startTime: "2026-07-13T17:00:00",
      category: "preparation",
      priority: "primary",
      required: true,
      completed: false,
      guidance: {
        whatToDo:
          "Pick up your Suprep kit from the pharmacy and stock up on clear liquids you enjoy. Good options include chicken or vegetable broth, clear Gatorade or Pedialyte (no red or purple), plain Jell-O (no red or purple), apple juice, white grape juice, and popsicles. Also grab wet wipes and petroleum jelly — your skin will thank you later.",
        whatToExpect:
          "This is the easiest step. You're just gathering what you need so you're not scrambling the day before. Having your favorite clear liquids on hand makes the liquid-only day much more manageable.",
        normalReassurance:
          "It's completely normal to feel a little anxious at this stage. Getting organized early is one of the best things you can do to make the whole process smoother.",
        caution:
          "Make sure your Suprep prescription is filled. If your pharmacy doesn't have it in stock, call your clinic right away so they can help you find it or suggest an alternative. Do not substitute a different prep without talking to your doctor.",
      },
    },
    {
      id: "clear-liquid-diet",
      title: "Start clear liquid diet",
      startTime: "2026-07-14T08:00:00",
      endTime: "2026-07-15T06:15:00",
      category: "diet",
      priority: "primary",
      required: true,
      completed: false,
      guidance: {
        whatToDo:
          "Starting at 8:00 AM, switch to clear liquids only — no solid food for the rest of the day. Clear liquids include water, clear broth (chicken, beef, or vegetable), tea or black coffee (no milk or cream), clear juices like apple or white grape, plain Jell-O, clear Gatorade or Pedialyte, and popsicles without fruit chunks.",
        whatToExpect:
          "You'll likely feel hungry, especially in the afternoon and evening. This is temporary and very normal. Warm broth can help you feel more satisfied than cold drinks. Many people find that staying busy helps the time pass more quickly.",
        normalReassurance:
          "Feeling hungry is the hardest part for most people, and it's completely manageable. You're not starving — your body has plenty of reserves. By tomorrow evening, you'll be enjoying a real meal again.",
        caution:
          "Do not eat any solid food, even small snacks. Solid food can leave residue that makes it harder for your doctor to see clearly during the procedure, which could mean you'd need to repeat the prep and reschedule. If you accidentally eat something solid, contact your clinic before continuing.",
      },
    },
    {
      id: "avoid-red-purple",
      title: "Avoid red and purple liquids",
      startTime: "2026-07-14T08:00:00",
      endTime: "2026-07-15T06:15:00",
      category: "restriction",
      priority: "supporting",
      required: true,
      completed: false,
      guidance: {
        whatToDo:
          "For the entire clear liquid period, avoid anything red or purple — this includes red Gatorade, grape juice, red or purple Jell-O, red popsicles, and any drinks with red or purple food coloring. Stick to yellow, green, orange, or clear options.",
        whatToExpect:
          "This is a simple rule to follow once you know about it. When shopping for supplies, just check the color before adding it to your cart.",
        normalReassurance:
          "This restriction exists for a practical reason: red and purple dyes can coat the inside of your colon and look similar to blood or inflammation, which makes it harder for your doctor to get a clear picture. It's not dangerous if you accidentally have some, but it can affect the quality of your exam.",
        caution:
          "If you accidentally consumed a red or purple liquid, don't panic. Just stop and switch to an approved color. Let your clinic know if it was a large amount, as they may want to adjust their approach.",
      },
    },
    {
      id: "dose-1",
      title: "Dose 1 — Suprep evening dose",
      startTime: "2026-07-14T18:00:00",
      endTime: "2026-07-14T20:00:00",
      category: "medication",
      priority: "primary",
      required: true,
      completed: false,
      guidance: {
        whatToDo:
          "At 6:00 PM, pour one bottle of Suprep into the mixing cup and add cold water to the 16 oz fill line. Drink the entire mixture over the next hour — small, steady sips work better than big gulps. After finishing the Suprep, drink two additional 16 oz cups of water over the following hour. Drinking through a straw and following each sip with a suck on a lemon wedge or hard candy can help with the taste.",
        whatToExpect:
          "Suprep has a strong, salty-sweet taste that most people find unpleasant. This is completely normal and you're not alone — almost everyone finds the taste challenging. Chilling the solution, using a straw, and chasing each sip with a clear liquid you enjoy can make a big difference. Bowel movements typically begin within 1 to 3 hours after you start drinking.",
        normalReassurance:
          "If the taste makes you gag or you feel mildly nauseous, that's very common. Take a short break (5-10 minutes), then continue. Most people are able to finish the dose even if it takes a little longer. The extra water you drink afterward is important — it keeps you hydrated and helps the prep work effectively.",
        caution:
          "Do not skip or reduce your dose, even if you feel the prep is already working or your stools are already clear. If you vomit within 30 minutes of drinking, wait 30 minutes and try again with smaller sips. If you are unable to keep any of the prep down after multiple attempts, contact your clinic — they can advise you on next steps. Do not take anti-nausea medication unless your doctor has specifically approved it.",
      },
    },
    {
      id: "bathroom-phase",
      title: "Bathroom phase begins",
      startTime: "2026-07-14T19:00:00",
      category: "preparation",
      priority: "supporting",
      required: false,
      completed: false,
      guidance: {
        whatToDo:
          "Stay close to a bathroom for the rest of the evening. Set up a comfortable spot — bring your phone, a book, or a tablet. Apply petroleum jelly to the skin around your bottom before things get going, and use wet wipes instead of dry toilet paper. Wear comfortable, loose clothing that's easy to manage in a hurry.",
        whatToExpect:
          "Bowel movements will start gradually and become more frequent and more watery over the next few hours. By late evening, stools will become mostly liquid and may look yellow or clear. You may experience some mild cramping — this is normal and usually comes in waves before a bowel movement. The urgency can come on quickly, so staying near the bathroom is important.",
        normalReassurance:
          "This phase is the most talked-about part of prep, but most people say it's more tedious than painful. The cramping is usually mild and passes quickly. Think of it as your body doing exactly what it's supposed to do. Millions of people go through this every year, and the vast majority say it was much more manageable than they expected.",
        caution:
          "If you experience severe, persistent abdominal pain (not just mild cramping before a bowel movement), feel severely dizzy or lightheaded, or notice significant blood in your stool, contact your clinic or seek medical care. Mild discomfort and frequent trips to the bathroom are expected — severe pain is not.",
      },
    },
    {
      id: "dose-2",
      title: "Dose 2 — Suprep early morning dose",
      startTime: "2026-07-15T03:15:00",
      endTime: "2026-07-15T05:15:00",
      category: "medication",
      priority: "primary",
      required: true,
      completed: false,
      guidance: {
        whatToDo:
          "Set an alarm for 3:15 AM. Mix the second bottle of Suprep with cold water to the 16 oz line, just like the first dose. Drink it over 1 hour, then follow with two more 16 oz cups of water over the next hour. Use the same tricks as before — straw, chilled solution, lemon wedge, hard candy.",
        whatToExpect:
          "The early wake-up is not fun, but this second dose is crucial for a clean prep. Most people find the second dose a little easier because they know what to expect. You'll have more bowel movements afterward, but they tend to be less intense than the evening round. Your stools should become clear or light yellow — this means the prep is working well.",
        normalReassurance:
          "Waking up at 3 AM is tough, but the split dose is used because it produces a significantly cleaner prep than taking everything the night before. A cleaner prep means your doctor can see more clearly, which means better results for you. You're almost done — this is the home stretch.",
        caution:
          "Just like the first dose, do not skip or reduce this dose. If you vomit, wait 30 minutes and try again. If you cannot keep the second dose down after trying twice, contact your clinic — even at this early hour, most clinics have an on-call line for pre-procedure questions. Do not drink anything after your cutoff time of 6:15 AM.",
      },
    },
    {
      id: "stop-liquids",
      title: "Stop all liquids",
      startTime: "2026-07-15T06:15:00",
      category: "restriction",
      priority: "safety",
      required: true,
      completed: false,
      guidance: {
        whatToDo:
          "At 6:15 AM, stop drinking all liquids — including water. Nothing by mouth from this point until after your procedure. You may brush your teeth, but do not swallow any water. If you take any approved medications, take them with just the smallest sip of water before the cutoff.",
        whatToExpect:
          "Your mouth may feel dry, but you've had plenty of fluids overnight. The 2-hour window before your procedure allows your stomach to empty completely, which is important for the safety of your sedation.",
        normalReassurance:
          "Two hours without water sounds uncomfortable, but most people find they're focused on getting to their appointment and don't notice the thirst much. This fasting period is a standard safety precaution for any procedure involving sedation — it's not unique to colonoscopies.",
        caution:
          "This cutoff is a strict safety requirement. If you accidentally drink something after 6:15 AM, contact your clinic immediately. They may need to delay your procedure to ensure your safety during sedation. Do not take any medications after this time unless your clinic has specifically told you to.",
      },
    },
    {
      id: "arrive",
      title: "Arrive at procedure center",
      startTime: "2026-07-15T07:15:00",
      category: "arrival",
      priority: "primary",
      required: true,
      completed: false,
      guidance: {
        whatToDo:
          "Arrive at Riverside Endoscopy Center, Suite 200 by 7:15 AM. Bring your photo ID, insurance card, and a list of your current medications. Your designated driver must come with you or be available by phone — the center will confirm your ride home before proceeding. Wear comfortable, loose-fitting clothing. Leave jewelry and valuables at home.",
        whatToExpect:
          "You'll check in at the front desk, change into a hospital gown, and have an IV placed. A nurse will review your medical history, confirm your medications, and answer any last-minute questions. The anesthesiologist or nurse anesthetist will also visit to explain the sedation. The atmosphere is calm and routine — this is what the staff does every day.",
        normalReassurance:
          "Feeling nervous at this point is completely normal and very common. The staff at the center is experienced and will take good care of you. If you have questions or concerns, now is a great time to ask — no question is too small.",
        caution:
          "If you have not been able to complete your prep (could not finish either dose, or your stools are still dark and solid), tell the check-in staff right away. They will consult with your doctor about whether to proceed or reschedule. It's better to speak up than to have a procedure that can't see what it needs to see.",
      },
    },
    {
      id: "procedure",
      title: "Procedure",
      startTime: "2026-07-15T08:15:00",
      category: "procedure",
      priority: "primary",
      required: true,
      completed: false,
      guidance: {
        whatToDo:
          "Once in the procedure room, the team will position you comfortably on your left side. The sedation will be administered through your IV. Most people feel relaxed and drowsy within seconds. You don't need to do anything — just breathe normally and let the team do their work. The procedure typically takes 20 to 40 minutes.",
        whatToExpect:
          "Most patients remember very little or nothing at all from the procedure thanks to the sedation. You'll wake up in a recovery area feeling groggy but comfortable. Some mild bloating or cramping afterward is normal — the doctor uses a small amount of air to see inside the colon, and that air can cause temporary gas. You'll be able to eat and drink after you're fully awake.",
        normalReassurance:
          "You made it through the hardest part — the prep. The procedure itself is the easy part for you. Colonoscopies are one of the most commonly performed procedures, and the vast majority are completed without any complications. Your doctor will share the results with you after you wake up.",
        caution:
          "After the procedure, you must not drive, operate heavy machinery, or make important decisions for the rest of the day — sedation can affect your judgment even after you feel alert. Your driver should stay at the center or be reachable by phone so you can leave as soon as you're ready.",
      },
    },
  ],
};
