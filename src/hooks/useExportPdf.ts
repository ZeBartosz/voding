import { useCallback, useEffect, useRef, useState } from "react";
import type { Note } from "../types";
import { jsPDF } from "jspdf";
import { formatTime } from "../utils/formatTime";
import { buildShareableUrl } from "../utils/urlParams";

interface UseExportPdfParams {
  title?: string | null;
  videoUrl?: string | null;
  notes?: Note[] | null;
  filename?: string;
}

// Color palette matching the app theme
const colors = {
  primary: { r: 184, g: 46, b: 46 }, // --accent-red
  primaryDark: { r: 140, g: 35, b: 35 },
  text: { r: 40, g: 40, b: 45 },
  textMuted: { r: 100, g: 105, b: 110 },
  cardBg: { r: 248, g: 248, b: 250 },
  cardBorder: { r: 230, g: 230, b: 235 },
  white: { r: 255, g: 255, b: 255 },
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
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (exportingRef.current) return;

    exportingRef.current = true;
    setExporting(true);

    try {
      const safeTitle = title ?? "VOD Review Session";
      const safeNotes: Note[] = notes ?? [];
      const sortedNotes = [...safeNotes].sort((a, b) => a.timestamp - b.timestamp);

      const doc: jsPDF = new jsPDF({
        unit: "pt",
        format: "a4",
      });

      const marginLeft = 40;
      const marginRight = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - marginLeft - marginRight;
      let y = 40;

      // Helper function to add a new page with header
      const addNewPage = () => {
        doc.addPage();
        y = 40;
        // Add subtle header line on new pages
        doc.setDrawColor(colors.cardBorder.r, colors.cardBorder.g, colors.cardBorder.b);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, 30, pageWidth - marginRight, 30);
      };

      // ===== HEADER SECTION =====
      // Red accent bar at top
      doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.rect(0, 0, pageWidth, 8, "F");

      y = 50;

      // Logo/Brand badge
      doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.roundedRect(marginLeft, y - 12, 36, 36, 6, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("V", marginLeft + 12, y + 14);

      // Title
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const titleX = marginLeft + 50;
      const titleLines = doc.splitTextToSize(safeTitle, contentWidth - 60) as string[];
      doc.text(titleLines, titleX, y + 14);

      y += titleLines.length * 24 + 20;

      // Subtitle - "VOD Review Session Notes"
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
      doc.text("VOD Review Session Notes", marginLeft, y);

      y += 20;

      // Meta info box
      doc.setFillColor(colors.cardBg.r, colors.cardBg.g, colors.cardBg.b);
      doc.setDrawColor(colors.cardBorder.r, colors.cardBorder.g, colors.cardBorder.b);
      doc.setLineWidth(0.5);
      doc.roundedRect(marginLeft, y, contentWidth, 50, 6, 6, "FD");

      // Meta content
      const exportedAt = new Date().toLocaleString();
      doc.setFontSize(10);
      doc.setTextColor(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);

      // Exported date
      doc.setFont("helvetica", "bold");
      doc.text("Exported:", marginLeft + 12, y + 18);
      doc.setFont("helvetica", "normal");
      doc.text(exportedAt, marginLeft + 65, y + 18);

      // Notes count
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", marginLeft + 12, y + 35);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${String(sortedNotes.length)} note${sortedNotes.length !== 1 ? "s" : ""}`,
        marginLeft + 50,
        y + 35,
      );

      // Video URL (if exists)
      if (videoUrl) {
        doc.setFont("helvetica", "bold");
        doc.text("Video:", marginLeft + 200, y + 18);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
        const urlDisplay = videoUrl.length > 45 ? videoUrl.substring(0, 45) + "..." : videoUrl;
        doc.textWithLink(urlDisplay, marginLeft + 240, y + 18, { url: videoUrl });

        // Sharable URL
        const sharableUrl = buildShareableUrl(videoUrl, notes ?? []);
        if (sharableUrl) {
          doc.setTextColor(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
          doc.setFont("helvetica", "bold");
          doc.text("shareable URL:", marginLeft + 157, y + 35);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
          const urlDisplay =
            sharableUrl.length > 45 ? sharableUrl.substring(0, 45) + "..." : sharableUrl;
          doc.textWithLink(urlDisplay, marginLeft + 240, y + 35, { url: sharableUrl });
        }
      }

      y += 70;

      // Section title
      doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.rect(marginLeft, y, 4, 20, "F");
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Session Notes", marginLeft + 14, y + 14);

      y += 40;

      // ===== NOTES SECTION =====
      for (let i = 0; i < sortedNotes.length; i++) {
        const n = sortedNotes[i];
        const timeLabel = formatTime(n.timestamp);
        const content = (n.content || "").trim();

        // Calculate content height
        doc.setFontSize(11);
        const contentLines = doc.splitTextToSize(content, contentWidth - 90) as string[];
        const lineHeight = 15;
        const cardPadding = 24;
        const cardHeight = Math.max(contentLines.length * lineHeight + cardPadding + 10, 50);

        // Check if we need a new page
        if (y + cardHeight > pageHeight - 60) {
          addNewPage();
        }

        // Note card background
        doc.setFillColor(colors.cardBg.r, colors.cardBg.g, colors.cardBg.b);
        doc.setDrawColor(colors.cardBorder.r, colors.cardBorder.g, colors.cardBorder.b);
        doc.setLineWidth(0.5);
        doc.roundedRect(marginLeft, y, contentWidth, cardHeight, 6, 6, "FD");

        // Timestamp badge
        const badgeWidth = 55;
        const badgeHeight = 22;
        const badgeX = marginLeft + 10;
        const badgeY = y + 10;

        doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
        doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4, 4, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(timeLabel, badgeX + badgeWidth / 2, badgeY + 14, { align: "center" });

        // Make timestamp clickable
        if (videoUrl) {
          try {
            const linkUrl = buildShareableUrl(videoUrl, [n]);
            doc.link(badgeX, badgeY, badgeWidth, badgeHeight, { url: linkUrl });
          } catch {
            // ignore
          }
        }

        // Note number indicator
        doc.setTextColor(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`#${String(i + 1)}`, marginLeft + contentWidth - 25, y + 20);

        // Note content
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const contentX = marginLeft + 80;
        const contentY = y + 25;
        doc.text(contentLines, contentX, contentY);

        y += cardHeight + 10;
      }

      // ===== FOOTER =====
      const footerY = pageHeight - 30;
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(colors.cardBorder.r, colors.cardBorder.g, colors.cardBorder.b);
        doc.setLineWidth(0.5);
        doc.line(marginLeft, footerY - 10, pageWidth - marginRight, footerY - 10);
        doc.setTextColor(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Generated by Vodding - VOD Review Tool", marginLeft, footerY);
        doc.text(`Page ${String(i)} of ${String(totalPages)}`, pageWidth - marginRight, footerY, {
          align: "right",
        });
      }

      // Save the PDF
      try {
        const outputFn = (doc as unknown as { output?: (type: string) => unknown }).output;
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
            const saveFn = (doc as unknown as { save?: (name: string) => void }).save;
            if (typeof saveFn === "function") saveFn.call(doc, filename);
          }
        } else {
          const saveFn = (doc as unknown as { save?: (name: string) => void }).save;
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
