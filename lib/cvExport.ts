/**
 * lib/cvExport.ts
 *
 * Client-side only export utilities. Both functions are async and dynamically import
 * their heavy dependencies so they don't bloat the initial page bundle.
 *
 * Usage:
 *   await exportToPdf('cv-preview-root', 'JohnDoe_CV')
 *   await exportTemplatedDocx(templateId, tailoredCv, avatarUrl, 'JohnDoe_CV')
 */

import type { TailoredCv } from '@/app/(authenticated)/generate/types';

// ─── PDF Export ───────────────────────────────────────────────────────────────
// Screenshots #cv-preview-root (the live Handlebars preview, lib/templates/cvTemplate.ts) via
// html2canvas and tiles it across A4 pages. Requires that element and everything inside it to
// use inline styles only — see CvPreviewTemplate.tsx's comment on why (oklch()).

export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found in DOM.`);

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2, // 2x for sharper output
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // A4 dimensions in mm
  const pdfW = 210;
  const pdfH = 297;
  const imgAspect = canvas.height / canvas.width;
  const imgH = pdfW * imgAspect;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let yOffset = 0;
  let remaining = imgH;

  // Multi-page support: slice the canvas image across A4 pages. Skip adding a trailing page for
  // a small leftover sliver — the template always has generous bottom padding/margin (32px outer
  // padding + 22px section spacing), so a small remainder past a full page is virtually always
  // blank whitespace, not real content. Without this threshold, content whose height landed just
  // over a page boundary produced a near-empty final page with just a thin strip bleeding onto
  // it ("a line at the end").
  const MIN_TRAILING_CONTENT_MM = 15;

  while (remaining > 0) {
    pdf.addImage(imgData, 'JPEG', 0, yOffset > 0 ? -yOffset : 0, pdfW, imgH);
    remaining -= pdfH;
    if (remaining > MIN_TRAILING_CONTENT_MM) {
      pdf.addPage();
      yOffset += pdfH;
    } else {
      break;
    }
  }

  pdf.save(`${filename}.pdf`);
}

// ─── DOCX Export ──────────────────────────────────────────────────────────────
// Fills the actual uploaded master DOCX template (docxtemplater, server-side) rather than
// converting scraped HTML — this is what preserves real Word formatting. See
// app/api/templates/generate/route.ts.

export async function exportTemplatedDocx(
  templateId: string,
  tailoredCv: TailoredCv,
  avatarUrl: string | null | undefined,
  filename: string
): Promise<void> {
  const response = await fetch('/api/templates/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateId, tailoredCv, avatarUrl: avatarUrl ?? undefined }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'Failed to generate DOCX file from the template.');
  }

  const blob = await response.blob();
  const { saveAs } = await import('file-saver');
  saveAs(blob, `${filename}.docx`);
}
