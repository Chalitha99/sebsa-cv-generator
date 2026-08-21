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

export const ANONYMOUS_CV_NAME = 'ABC Philip';

/** Returns a new export-only CV value without changing the source CV or employee record. */
export function anonymizeCv(cv: TailoredCv): TailoredCv {
  return {
    ...cv,
    name: ANONYMOUS_CV_NAME,
    avatar: null,
    isAnonymous: true,
  };
}

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

  // The root element carries a decorative border/rounded-corner/box-shadow for the on-screen
  // preview card (CvPreviewTemplate.tsx) — html2canvas screenshots it verbatim, so that border's
  // bottom edge (plus the shadow underneath it) got baked into the exported image and showed up
  // as a stray horizontal line wherever the content happened to end, including alone on an
  // otherwise-blank trailing page. None of that chrome belongs in the exported document, so it's
  // stripped from the live element for the duration of the capture and restored immediately after.
  const previousBorder = element.style.border;
  const previousBoxShadow = element.style.boxShadow;
  const previousBorderRadius = element.style.borderRadius;
  element.style.border = 'none';
  element.style.boxShadow = 'none';
  element.style.borderRadius = '0';

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale: 2, // 2x for sharper output
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });
  } finally {
    element.style.border = previousBorder;
    element.style.boxShadow = previousBoxShadow;
    element.style.borderRadius = previousBorderRadius;
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // A4 dimensions in mm
  const pdfW = 210;
  const pdfH = 297;
  const imgAspect = canvas.height / canvas.width;
  const imgH = pdfW * imgAspect;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let yOffset = 0;
  let remaining = imgH;

  // Multi-page support: slice the canvas image across A4 pages. A small leftover sliver past a
  // full page (the template's own bottom padding/margins rounding up just past 297mm) doesn't get
  // its own near-blank trailing page — the template always has enough bottom whitespace (32px
  // outer padding + 22px section spacing) that anything this small is never real content.
  const MIN_TRAILING_CONTENT_MM = 40;

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
