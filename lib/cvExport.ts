/**
 * lib/cvExport.ts
 *
 * Client-side only export utilities. Both functions are async and dynamically import
 * their heavy dependencies so they don't bloat the initial page bundle.
 *
 * Usage:
 *   await exportToPdf('cv-preview-root', 'JohnDoe_CV')
 *   await exportToDocx(tailoredCv, 'JohnDoe_CV')
 */

import type { TailoredCv } from '@/app/(authenticated)/generate/types';

// ─── PDF Export ───────────────────────────────────────────────────────────────

export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found in DOM.`);

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,          // 2× for sharper output
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

  // Multi-page support: slice the canvas image across A4 pages
  while (remaining > 0) {
    pdf.addImage(imgData, 'JPEG', 0, yOffset > 0 ? -yOffset : 0, pdfW, imgH);
    remaining -= pdfH;
    if (remaining > 0) {
      pdf.addPage();
      yOffset += pdfH;
    }
  }

  pdf.save(`${filename}.pdf`);
}

export async function exportToDocx(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found in DOM.`);

  // Get the modified HTML from the preview element
  const htmlContent = element.innerHTML;

  // Call our new API route to convert HTML to DOCX
  const response = await fetch('/api/export-docx', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ html: htmlContent }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate DOCX file from server.');
  }

  // The API returns a blob representing the docx
  const blob = await response.blob();

  // Dynamically import file-saver to keep client bundle small
  const { saveAs } = await import('file-saver');
  saveAs(blob, `${filename}.docx`);
}
