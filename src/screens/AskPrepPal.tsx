import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Send,
  Phone,
  User,
  Bot,
  Siren,
  ShieldAlert,
  Heart,
  Info,
} from "lucide-react";
import Card from "../components/Card";
import { loadPlan } from "../lib/plan-utils";
import {
  evaluateText,
  getEscalationVariant,
  type EscalationLevel,
} from "../lib/escalation";
import { getTemplate } from "../lib/procedure-templates";
import type { ActiveProcedureType } from "../lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  escalationLevel: EscalationLevel;
}

function getSuggestedQuestions(procedureType: ActiveProcedureType): readonly string[] {
  return getTemplate(procedureType).suggestedQuestions;
}

interface CannedMatch {
  patterns: RegExp[];
  response: string;
}

const CANNED_RESPONSES: CannedMatch[] = [
  {
    patterns: [/gatorade/i, /yellow.*(drink|liquid)/i, /drink.*yellow/i],
    response:
      "Many clear yellow liquids are commonly allowed, but follow your clinic's instructions. Avoid red or purple liquids unless your instructions say otherwise.",
  },
  {
    patterns: [
      /nause?o?us/i,
      /feel.*sick/i,
      /queasy/i,
      /stomach.*upset/i,
    ],
    response:
      "Mild nausea can happen during prep and is usually not a cause for alarm. Try slowing down your prep intake, taking small sips, and resting between drinks. If nausea is severe or you are vomiting repeatedly, contact your clinic.",
  },
  {
    patterns: [/stool.*brown/i, /brown.*stool/i, /still.*brown/i, /not.*clear/i],
    response:
      "Prep progress can vary. Continue following your instructions. If your procedure is soon and stool remains brown or you are unsure whether the prep is working, contact your clinic.",
  },
  {
    patterns: [/after.*dose.*1/i, /dose.*1.*happen/i, /what.*expect.*dose/i, /first.*dose/i],
    response:
      "After your first dose, expect bowel movements to begin within 1–3 hours. You'll want to stay near a bathroom. Clear to yellow liquid stool is normal and means the prep is working. Keep drinking clear fluids to stay hydrated.",
  },
  {
    patterns: [
      /medication/i,
      /medicine/i,
      /pills?/i,
      /blood\s*thinn/i,
      /diabetes.*med/i,
      /insulin/i,
      /aspirin/i,
      /prescription/i,
    ],
    response:
      "PrepPal can't safely advise on medication changes — your clinic is the right resource for this. Contact your doctor's office, especially for diabetes medications, blood thinners, heart medications, or kidney-related concerns.",
  },
  {
    patterns: [/clear.*liquid/i, /what.*clear/i, /allowed.*drink/i, /can.*drink/i, /what.*drink/i],
    response:
      "Clear liquids typically include water, clear broths, apple juice, white grape juice, Jell-O (not red or purple), popsicles, tea, and black coffee. Avoid anything with pulp, milk, cream, or red/purple coloring. Always follow your clinic's specific list.",
  },
  {
    patterns: [/coffee/i, /caffeine/i],
    response:
      "Black coffee and plain tea are commonly allowed as clear liquids. Do not add milk, cream, or non-dairy creamers. Follow your clinic's instructions for specifics.",
  },
  {
    patterns: [/eat/i, /food/i, /solid/i, /hungry/i, /starving/i],
    response:
      "Hunger is very common during prep — you're not alone. Warm broth, Jell-O, and popsicles can help you feel more satisfied. Follow your instruction sheet for when to stop solid foods and when to switch to clear liquids only.",
  },
  {
    patterns: [/taste/i, /flavor/i, /disgusting/i, /gross/i, /hard.*drink/i],
    response:
      "The prep solution can taste unpleasant. Try chilling it in the fridge, drinking it through a straw, or chasing each sip with a clear liquid you enjoy. Sucking on a lemon wedge between sips can also help. Take it slow — you don't have to gulp it all at once.",
  },
  {
    patterns: [/can't.*finish/i, /unable.*finish/i, /too.*much/i, /throw.*up/i, /vomit/i],
    response:
      "If you're having difficulty finishing your prep, try slowing down and taking smaller sips. Resting for 15–30 minutes between glasses can help. If you truly cannot finish or you are vomiting repeatedly, contact your clinic for guidance. Do not skip your prep without speaking to your clinic first.",
  },
  {
    patterns: [/scared/i, /nervous/i, /anxious/i, /worried/i, /afraid/i],
    response:
      "It's completely normal to feel nervous before your procedure. The prep is the hardest part — the procedure itself is quick, and most patients remember very little thanks to sedation. You're taking great care of your health by going through with this. The staff does this every day and will take good care of you.",
  },
  {
    patterns: [/how\s*long/i, /duration/i, /procedure.*take/i, /take.*long/i],
    response:
      "Most GI procedures take 15–40 minutes depending on the type. Including check-in and recovery, plan for about 2–3 hours total at the facility. You'll need someone to drive you home afterward due to the sedation.",
  },
  {
    patterns: [/drive/i, /driver/i, /ride.*home/i, /uber/i, /taxi/i],
    response:
      "You will need a responsible adult to drive you home after the procedure due to sedation. Most facilities require your driver to remain at or near the facility. Check with your clinic about their specific policy on ride-sharing services.",
  },
  {
    patterns: [/bleed/i, /blood/i],
    response:
      "A small amount of blood can sometimes occur during prep, especially with hemorrhoids. However, if you see a significant or ongoing amount of blood, contact your clinic or seek medical attention. Do not ignore persistent bleeding.",
  },
  {
    patterns: [/cancel/i, /reschedule/i, /postpone/i],
    response:
      "If you need to cancel or reschedule, contact your clinic as soon as possible. They can help you determine next steps. If you're considering canceling because of prep difficulty, call your clinic first — they may have suggestions to help you through it.",
  },
  {
    patterns: [/chest.*pain/i, /breath/i, /faint/i, /dizz/i, /allergic/i, /swelling/i, /rash/i, /hives/i],
    response:
      "These symptoms need immediate attention. Stop your prep and contact your clinic or seek urgent care right away. If you are experiencing chest pain, difficulty breathing, or signs of a severe allergic reaction, call 911.",
  },
  {
    patterns: [/pregnan/i],
    response:
      "If you are or may be pregnant, contact your clinic right away before continuing with your prep. They need to know so they can advise you on next steps.",
  },
  {
    patterns: [/kidney/i],
    response:
      "Kidney concerns during prep should be discussed directly with your clinic. Some prep solutions require special consideration for patients with kidney disease. Contact your doctor's office for specific guidance.",
  },
  {
    patterns: [/skip/i, /don'?t\s*want\s*to/i, /do\s*i\s*have\s*to/i],
    response:
      "Completing your prep as directed is important for your procedure to be effective. If you're struggling, call your clinic — they can often help with tips or adjustments. Never skip your prep without speaking to them first.",
  },
];

function getCannedResponse(input: string): string {
  const trimmed = input.trim().toLowerCase();

  for (const entry of CANNED_RESPONSES) {
    for (const pattern of entry.patterns) {
      if (pattern.test(trimmed)) {
        return entry.response;
      }
    }
  }

  return "That's a great question, but I don't have a specific answer for that one. Check your instruction sheet, or contact your clinic — they'll be able to help.";
}

function EscalationBanner({
  level,
  clinicPhone,
}: {
  level: EscalationLevel;
  clinicPhone: string;
}) {
  if (level === "normal" || level === "caution") return null;

  const variant = getEscalationVariant(level);

  return (
    <div
      className={`rounded-card px-3.5 py-2.5 mt-1 ${
        variant === "urgent"
          ? "bg-urgent-50 border border-urgent-200"
          : "bg-warm-50 border border-warm-200"
      }`}
    >
      <div className="flex items-start gap-2">
        {level === "urgent-care" ? (
          <Siren className="w-4 h-4 text-urgent-600 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-warm-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${
            level === "urgent-care" ? "text-urgent-800" : "text-warm-800"
          }`}>
            {level === "urgent-care"
              ? "This may need immediate attention"
              : "Your clinic can help with this"}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {level === "urgent-care" && (
              <a
                href="tel:911"
                className="inline-flex items-center gap-1 text-xs font-semibold text-urgent-700 hover:text-urgent-800"
              >
                <Phone className="w-3 h-3" />
                Call 911
              </a>
            )}
            {clinicPhone && (
              <a
                href={`tel:${clinicPhone}`}
                className={`inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 ${
                  level === "urgent-care" ? "text-urgent-600" : "text-warm-700"
                }`}
              >
                <Phone className="w-3 h-3" />
                Call {clinicPhone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AskPrepPal() {
  const navigate = useNavigate();
  const plan = loadPlan();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plan) navigate("/", { replace: true });
  }, [plan, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!plan) return null;

  const suggestedQuestions = getSuggestedQuestions(
    (plan.procedureType as ActiveProcedureType) ?? "colonoscopy",
  );

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const escalation = evaluateText(trimmed);
    const responseText = getCannedResponse(trimmed);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      escalationLevel: "normal",
    };

    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: responseText,
      escalationLevel: escalation.level,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend(input);
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-serif text-lg font-semibold text-text-primary flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-brand-500" aria-hidden="true" />
          Ask PrepPal
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Ask a question about your prep instructions or what to expect.
        </p>
      </div>

      {/* Before conversation: suggested questions + safety note */}
      {messages.length === 0 && (
        <>
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">
              Common questions
            </p>
            <div className="flex flex-col gap-1.5">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="text-left text-sm px-3.5 py-2.5 rounded-card border border-border bg-surface text-text-secondary hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Single safety note — the only place this message appears */}
          <Card>
            <div className="flex gap-3 items-start">
              <Info className="w-4 h-4 text-text-muted shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium text-text-muted">Important note</p>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  PrepPal organizes clinic instructions and provides general
                  guidance. It does not replace medical advice. For medication
                  questions, medical history, severe symptoms, or unclear
                  instructions, always follow your healthcare team's official
                  instructions.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Conversation */}
      {messages.length > 0 && (
        <div className="flex flex-col gap-3" aria-live="polite" aria-label="Conversation">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex gap-2.5 justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-600 text-white px-4 py-2.5">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <div className="max-w-[85%] flex flex-col gap-1.5">
                    <div className={`rounded-2xl rounded-bl-md px-4 py-2.5 ${
                      msg.escalationLevel === "urgent-care"
                        ? "bg-urgent-50 border border-urgent-100"
                        : msg.escalationLevel === "contact-clinic"
                          ? "bg-warm-50 border border-warm-100"
                          : "bg-surface-muted"
                    }`}>
                      <p className="text-sm text-text-primary leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                    <EscalationBanner
                      level={msg.escalationLevel}
                      clinicPhone={plan.clinicPhone}
                    />
                    {msg.escalationLevel === "caution" && (
                      <div className="flex items-start gap-1.5 ml-1 mt-0.5">
                        <Heart className="w-3 h-3 text-calm-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-calm-600">
                          This is usually manageable — but call your clinic if it gets worse.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 sticky bottom-16 bg-surface-dim pt-2 pb-1" role="search">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your prep..."
          aria-label="Ask a question about your prep"
          className="flex-1 rounded-card border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-2 focus:outline-brand-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send question"
          className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-0 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Suggestion chips after conversation */}
      {messages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.filter(
            (q) => !messages.some((m) => m.role === "user" && m.text === q)
          )
            .slice(0, 3)
            .map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSend(q)}
                className="text-xs px-2.5 py-1.5 rounded-full border border-border bg-surface text-text-muted hover:bg-brand-50 hover:border-brand-200 hover:text-brand-600 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
        </div>
      )}

      {/* Clinic link */}
      <button
        type="button"
        onClick={() => navigate("/emergency")}
        className="flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 py-2 bg-transparent border-0 cursor-pointer"
      >
        <Phone className="w-4 h-4" />
        Need to reach your clinic? View contacts
      </button>
    </div>
  );
}
