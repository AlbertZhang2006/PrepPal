import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileImage,
  FileText,
  Camera,
  ArrowRight,
  AlertTriangle,
  X,
  ScanSearch,
  PenLine,
  RotateCcw,
} from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import BackLink from "../components/BackLink";
import { extractText, type OcrProgress } from "../lib/ocr";
import { parsePrepInstructions } from "../lib/ai-parse-service";
import { loadSelectedProcedure } from "./ProcedureSelect";
import { getTemplate } from "../lib/procedure-templates";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
];
const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.webp,.heic";

type Phase = "upload" | "scanning" | "preview" | "error";

export default function UploadInstructions() {
  const navigate = useNavigate();
  const selectedProcedure = loadSelectedProcedure();
  const template = getTemplate(selectedProcedure);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState("");
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image">("image");
  const [isDragging, setIsDragging] = useState(false);
  const [scanStage, setScanStage] = useState("Reading document...");
  const [scanProgress, setScanProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [pasteMode, setPasteMode] = useState(false);

  const startOcr = useCallback(async (file: File) => {
    setPhase("scanning");
    setScanProgress(0);
    setScanStage("Reading document...");
    setOcrError("");

    try {
      const text = await extractText(file, (p: OcrProgress) => {
        setScanStage(p.stage);
        setScanProgress(p.progress);
      });

      if (!text.trim()) {
        setOcrError(
          "We could not read this file clearly. You can enter your prep details manually or paste the instruction text.",
        );
        setExtractedText("");
        setPhase("error");
        return;
      }

      setExtractedText(text);
      setPhase("preview");
    } catch {
      setOcrError(
        "We could not read this file clearly. You can enter your prep details manually or paste the instruction text.",
      );
      setExtractedText("");
      setPhase("error");
    }
  }, []);

  function processFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError(
        `"${file.name}" is not a supported file type. Please upload a PDF, PNG, JPEG, or WebP file.`,
      );
      return;
    }

    setFileError("");
    setFileName(file.name);
    setFileType(file.type === "application/pdf" ? "pdf" : "image");

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }

    startOcr(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleReset() {
    setPhase("upload");
    setFileName("");
    setFilePreviewUrl(null);
    setScanProgress(0);
    setExtractedText("");
    setOcrError("");
    setFileError("");
    setPasteMode(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const [isParsing, setIsParsing] = useState(false);

  async function handleConfirmText() {
    const text = extractedText.trim();
    if (!text) return;

    setIsParsing(true);
    try {
      localStorage.setItem("preppal-raw-instructions", text);

      const result = await parsePrepInstructions(text);
      localStorage.setItem(
        "preppal-parse-result",
        JSON.stringify(result),
      );
      navigate("/review");
    } finally {
      setIsParsing(false);
    }
  }

  // Upload phase
  if (phase === "upload") {
    return (
      <div className="flex flex-col gap-6">
        <BackLink
          label="Change Procedure"
          onClick={() => navigate("/select-procedure?next=upload")}
          className="self-start"
        />

        <div>
          <p className="text-xs font-medium text-brand-600 mb-1">
            {template.displayName}
          </p>
          <h2 className="font-serif text-2xl font-semibold text-text-primary">
            Upload Your Instructions
          </h2>
          <p className="text-text-secondary mt-1">
            {pasteMode
              ? "Paste the text of your prep instructions below."
              : "Upload a photo, screenshot, or PDF of your prep instructions. We'll scan the document and extract the key details."}
          </p>
        </div>

        {pasteMode ? (
          <>
            <div>
              <label className="text-xs font-semibold text-text-muted mb-2 block">
                Your instructions
              </label>
              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="Paste your prep instructions here, or type the key details (procedure date, arrival time, prep type, dose times, etc.)"
                rows={10}
                autoFocus
                className="w-full rounded-card border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-2 focus:outline-brand-500 resize-y leading-relaxed"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setPasteMode(false);
                  setExtractedText("");
                }}
              >
                Upload a File Instead
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmText}
                disabled={!extractedText.trim() || isParsing}
              >
                {isParsing ? "Parsing..." : "Parse Text"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Drop zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed p-10 transition-colors cursor-pointer bg-transparent ${
                isDragging
                  ? "border-brand-400 bg-brand-50"
                  : "border-border hover:border-brand-300 hover:bg-surface-muted"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
                <Upload className="w-7 h-7 text-brand-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">
                  {isDragging
                    ? "Drop your file here"
                    : "Drag and drop your file here"}
                </p>
                <p className="text-xs text-text-muted mt-1">or click to browse</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </span>
                <span className="flex items-center gap-1">
                  <FileImage className="w-3.5 h-3.5" /> Screenshot
                </span>
                <span className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> Photo
                </span>
              </div>
            </button>

            {fileError && (
              <Card variant="warm" className="flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
                <div className="text-sm text-warm-800">
                  <p className="font-medium">File not supported</p>
                  <p className="mt-1 text-warm-700">{fileError}</p>
                </div>
              </Card>
            )}

            <button
              type="button"
              onClick={() => setPasteMode(true)}
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 bg-transparent border-0 cursor-pointer p-0"
            >
              <PenLine className="w-3.5 h-3.5" />
              Or paste instructions instead
            </button>
          </>
        )}

        <p className="text-xs text-text-muted text-center">
          {pasteMode
            ? "Your text is processed on your device and never uploaded to any server."
            : "Your file is processed on your device and never uploaded to any server."}
        </p>
      </div>
    );
  }

  // Scanning phase
  if (phase === "scanning") {
    return (
      <div className="flex flex-col gap-6 items-center py-8">
        <div className="relative w-full max-w-sm">
          {/* Document preview */}
          <div className="relative rounded-card border border-border bg-surface overflow-hidden aspect-[3/4] flex items-center justify-center">
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt="Uploaded document"
                className="w-full h-full object-cover opacity-60"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-muted">
                <FileText className="w-16 h-16 opacity-30" />
                <span className="text-sm">{fileName}</span>
              </div>
            )}

            {/* Scan line overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-0 right-0 h-0.5 bg-brand-400 shadow-[0_0_12px_2px_rgba(62,112,122,0.4)] animate-scan-line" />
            </div>

            {/* Corner markers */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-brand-400 rounded-tl" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-brand-400 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-brand-400 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-brand-400 rounded-br" />
          </div>
        </div>

        {/* Progress */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <ScanSearch className="w-5 h-5 text-brand-500 animate-pulse-soft" />
            <span className="text-sm font-medium text-text-primary">
              {scanStage}
            </span>
          </div>
          <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="text-xs text-text-muted text-center">
            {fileType === "image"
              ? "Reading text from your image — this may take a moment"
              : "Reading text from your PDF"}
          </p>
        </div>
      </div>
    );
  }

  // Error phase — OCR failed
  if (phase === "error") {
    return (
      <div className="flex flex-col gap-5 animate-fade-in-up">
        <BackLink label="Back to Upload" onClick={handleReset} className="self-start" />

        <Card variant="warm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-warm-800">
                Could not read this file
              </h3>
              <p className="text-sm text-warm-700 mt-1 leading-relaxed">
                {ocrError}
              </p>
            </div>
          </div>
        </Card>

        {/* Manual text entry fallback */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            <PenLine className="w-4 h-4 text-brand-500" />
            Paste or type your instructions
          </h3>
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            placeholder="Paste your prep instructions here, or type the key details (procedure date, arrival time, prep type, dose times, etc.)"
            rows={10}
            className="w-full rounded-card border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-2 focus:outline-brand-500 resize-y leading-relaxed"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            Try Another File
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirmText}
            disabled={!extractedText.trim() || isParsing}
          >
            {isParsing ? "Parsing..." : "Parse Text"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/setup")}
        >
          Enter details manually instead
        </Button>
      </div>
    );
  }

  // Preview phase — show extracted text, allow editing
  return (
    <div className="flex flex-col gap-5 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-calm-100 flex items-center justify-center">
            <ScanSearch className="w-5 h-5 text-calm-600" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              Text Extracted
            </h2>
            <p className="text-sm text-text-muted flex items-center gap-1.5">
              {fileType === "pdf" ? (
                <FileText className="w-3.5 h-3.5" />
              ) : (
                <FileImage className="w-3.5 h-3.5" />
              )}
              {fileName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors bg-transparent border-0 cursor-pointer"
          title="Upload a different file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <Card variant="calm" className="flex gap-3 items-start">
        <PenLine className="w-5 h-5 text-calm-600 shrink-0 mt-0.5" />
        <p className="text-sm text-calm-800">
          Review the text below and fix anything that doesn't look right.
          Scanning isn't always perfect — double-check any dates, times, or
          medication names before continuing.
        </p>
      </Card>

      {/* Editable extracted text */}
      <div>
        <label className="text-xs font-semibold text-text-muted mb-2 block">
          Extracted text
        </label>
        <textarea
          value={extractedText}
          onChange={(e) => setExtractedText(e.target.value)}
          rows={12}
          className="w-full rounded-card border border-border bg-surface px-4 py-3 text-sm text-text-primary focus:outline-2 focus:outline-brand-500 resize-y leading-relaxed font-mono"
        />
      </div>

      <Card variant="warm" className="flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-warm-600 shrink-0 mt-0.5" />
        <p className="text-sm text-warm-800">
          <span className="font-medium">Scanning can make mistakes.</span> Check
          that dates, times, and your prep medication name look correct before
          continuing. You'll get another chance to review everything on the
          next screen.
        </p>
      </Card>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={handleReset}>
          Upload Different File
        </Button>
        <Button
          className="flex-1"
          onClick={handleConfirmText}
          disabled={!extractedText.trim() || isParsing}
        >
          {isParsing ? "Parsing..." : "Parse & Review"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-text-muted text-center">
        Your file is processed on your device and never uploaded to any server.
      </p>
    </div>
  );
}
