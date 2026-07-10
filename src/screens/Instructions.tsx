import { useNavigate } from "react-router-dom";
import {
  FileText,
  Edit3,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import Card from "../components/Card";
import Button from "../components/Button";
import BackLink from "../components/BackLink";
import { loadPlan } from "../lib/plan-utils";

export default function Instructions() {
  const navigate = useNavigate();
  const plan = loadPlan();
  const raw =
    plan?.rawInstructionText ||
    localStorage.getItem("preppal-raw-instructions") ||
    "";

  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <BackLink label="Go back" onClick={() => navigate(-1)} className="self-start" />

      <div>
        <h2 className="font-serif text-xl font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-500" />
          Your Original Instructions
        </h2>
        <p className="text-text-secondary mt-1">
          The raw prep instructions you entered. Always refer back to these if
          you're unsure about anything.
        </p>
      </div>

      {raw ? (
        <>
          <Card className="text-left">
            <pre className="whitespace-pre-wrap text-sm text-text-secondary font-sans leading-relaxed">
              {raw}
            </pre>
          </Card>

          <Button
            variant="secondary"
            onClick={() => navigate("/upload")}
            className="self-start"
          >
            <Edit3 className="w-4 h-4" />
            Upload New Instructions
          </Button>
        </>
      ) : (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-card bg-surface-muted flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-text-muted" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                No instructions uploaded yet
              </h3>
              <p className="text-sm text-text-secondary mt-1.5 max-w-xs mx-auto leading-relaxed">
                Upload a photo or PDF of your prep instructions, or enter your
                details manually. Your original instructions will appear here
                for reference.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button
                variant="primary"
                onClick={() => navigate("/upload")}
              >
                <FileText className="w-4 h-4" />
                Upload Instructions
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/setup")}
              >
                <Edit3 className="w-4 h-4" />
                Enter Manually
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-start gap-2 py-2">
        <ShieldCheck className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          Always follow the instructions your clinic provided. If the app
          conflicts with your printed instructions, follow the printed
          instructions and contact your clinic.
        </p>
      </div>
    </div>
  );
}
