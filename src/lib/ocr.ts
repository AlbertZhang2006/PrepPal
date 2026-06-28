import { recognize } from "tesseract.js";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export interface OcrProgress {
  stage: string;
  progress: number;
}

export async function extractTextFromImage(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const result = await recognize(file, "eng", {
    logger: (info: { status: string; progress: number }) => {
      onProgress?.({
        stage: formatTesseractStatus(info.status),
        progress: Math.round(info.progress * 100),
      });
    },
  });
  return result.data.text.trim();
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;
  const lines: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.({
      stage: `Reading page ${i} of ${totalPages}...`,
      progress: Math.round((i / totalPages) * 100),
    });
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    if (pageText.trim()) lines.push(pageText.trim());
  }

  return lines.join("\n\n");
}

export async function extractText(
  file: File,
  onProgress?: (p: OcrProgress) => void,
): Promise<string> {
  if (file.type === "application/pdf") {
    return extractTextFromPdf(file, onProgress);
  }
  return extractTextFromImage(file, onProgress);
}

function formatTesseractStatus(status: string): string {
  switch (status) {
    case "loading tesseract core":
      return "Loading OCR engine...";
    case "initializing tesseract":
      return "Initializing OCR...";
    case "loading language traineddata":
      return "Loading language data...";
    case "initializing api":
      return "Preparing text recognition...";
    case "recognizing text":
      return "Reading text from image...";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1) + "...";
  }
}
