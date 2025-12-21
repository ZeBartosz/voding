import { useCallback, useEffect, useRef, useState } from "react";
import type { Note } from "../types";
import { jsPDF } from "jspdf";

interface UseExportPdfParams {
  title?: string | null;
  videoUrl?: string | null;
  notes?: Note[] | null;
  filename?: string;
}

export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const m = String(minutes);
  const s = String(secs).padStart(2, "0");
  if (hours > 0) {
    const hh = String(hours);
    return hh + ":" + m.padStart(2, "0") + ":" + s;
  }
  return m + ":" + s;
};

export default function useExportPdf({
  title,
  videoUrl,
  notes,
  filename = "session-notes.pdf",
}: UseExportPdfParams) {
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);
  const exportTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (exportTimeoutRef.current) {
        clearTimeout(exportTimeoutRef.current);
        exportTimeoutRef.current = null;
      }
    };
  }, []);

  const exportPdf = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    if (exportingRef.current) return;

    exportingRef.current = true;
    setExporting(true);

    try {
      const safeTitle = title ?? "VOD Review Session";
      const safeNotes: Note[] = notes ?? [];

      const doc: jsPDF = new jsPDF({
        unit: "pt",
        format: "a4",
      });

      const marginLeft = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - marginLeft * 2;
      let y = 48;

      doc.setFontSize(18);
      doc.text(safeTitle, marginLeft, y);
      doc.setFontSize(10);

      y += 18;

      const exportedAt = new Date().toLocaleString();
      const videoMeta = videoUrl ? " • Video: " + videoUrl : "";

      doc.text("Exported: " + exportedAt + videoMeta, marginLeft, y);
      y += 18;
      doc.setDrawColor(230);
      doc.line(marginLeft, y, pageWidth - marginLeft, y);
      y += 18;
      doc.setFontSize(12);

      for (const n of safeNotes) {
        const timeLabel = formatTime(n.timestamp);
        const ts = Math.floor(n.timestamp);
        const content = (n.content || "").trim();
        const split = doc.splitTextToSize(content, maxWidth - 80) as string[];
        const blockHeight = split.length * 14 + 8;

        if (y + blockHeight > pageHeight - 80) {
          doc.addPage();
          y = 48;
        }

        doc.setFontSize(11);
        doc.setTextColor(10, 90, 255);

        const timeX = marginLeft;
        doc.text(timeLabel, timeX, y);

        if (videoUrl) {
          try {
            const linkUrl = `${window.location.origin}${window.location.pathname}#v=${encodeURIComponent(videoUrl)}&t=${String(ts)}`;
            doc.link(timeX, y - 10, 60, 12, { url: linkUrl });
          } catch {
            // ignore
          }
        }
        doc.setTextColor(0, 0, 0);
        const contentX = marginLeft + 80;
        doc.text(split, contentX, y);

        y += split.length * 14;
        y += 8;
      }

      try {
        const outputFn = (
          doc as unknown as { output?: (type: string) => unknown }
        ).output;
        if (typeof outputFn === "function") {
          const blobOrVal = outputFn.call(doc, "blob");
          if (blobOrVal instanceof Blob) {
            const url = URL.createObjectURL(blobOrVal);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => {
              URL.revokeObjectURL(url);
            }, 0);
          } else {
            const saveFn = (doc as unknown as { save?: (name: string) => void })
              .save;
            if (typeof saveFn === "function") saveFn.call(doc, filename);
          }
        } else {
          const saveFn = (doc as unknown as { save?: (name: string) => void })
            .save;
          if (typeof saveFn === "function") saveFn.call(doc, filename);
        }
      } catch {
        // ignore
      }
    } finally {
      setExporting(false);
      exportingRef.current = false;
    }
  }, [title, videoUrl, notes, filename]);

  const handleExport = useCallback(() => {
    if (exportingRef.current) return;

    exportTimeoutRef.current = setTimeout(() => {
      exportTimeoutRef.current = null;
      exportPdf();
    }, 0);
  }, [exportPdf]);

  return { exporting, handleExport };
}
