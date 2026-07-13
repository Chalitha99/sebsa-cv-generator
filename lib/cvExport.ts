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

// ─── DOCX Export ─────────────────────────────────────────────────────────────

export async function exportToDocx(cv: TailoredCv, filename: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } =
    await import('docx');

  const { saveAs } = await import('file-saver');

  const BRAND_COLOR = '003D9B'; // IFS navy blue

  // ── Helpers ──────────────────────────────────────────────────────────────
  const sectionHeading = (text: string) =>
    new Paragraph({
      text: text.toUpperCase(),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_COLOR, space: 4 },
      },
      run: { color: BRAND_COLOR, bold: true, size: 22 },
    });

  const bodyText = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, size: 20, color: '333333' })],
      spacing: { after: 80 },
    });

  const boldLine = (label: string, value: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 20 }),
        new TextRun({ text: value, size: 20 }),
      ],
      spacing: { after: 60 },
    });

  const bulletPoint = (text: string) =>
    new Paragraph({
      text,
      bullet: { level: 0 },
      spacing: { after: 60 },
      run: { size: 20, color: '333333' },
    });

  // ── Document ──────────────────────────────────────────────────────────────
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [
      {
        children: [
          // Header block
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: cv.name, bold: true, size: 48, color: BRAND_COLOR })],
            spacing: { after: 80 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: cv.currentPosition, size: 26, color: '555555' })],
            spacing: { after: 60 },
          }),
          ...(cv.customerName
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: `Tailored for: ${cv.customerName}`, italics: true, size: 20, color: '888888' }),
                  ],
                  spacing: { after: 300 },
                }),
              ]
            : []),

          // Summary
          ...(cv.summary
            ? [sectionHeading('Professional Summary'), bodyText(cv.summary)]
            : []),

          // Skills
          ...(cv.skillsAligned.length > 0
            ? [
                sectionHeading('Core Competencies'),
                new Paragraph({
                  children: [new TextRun({ text: cv.skillsAligned.join(' • '), size: 20 })],
                  spacing: { after: 200 },
                }),
              ]
            : []),

          // Experience
          ...(cv.experience.length > 0
            ? [
                sectionHeading('Professional Experience'),
                ...cv.experience.flatMap((exp) => [
                  new Paragraph({
                    children: [
                      new TextRun({ text: exp.position, bold: true, size: 22 }),
                      new TextRun({ text: `  |  ${exp.company}`, size: 22, color: '555555' }),
                      new TextRun({ text: `  |  ${exp.period}`, size: 20, color: '888888', italics: true }),
                    ],
                    spacing: { before: 200, after: 80 },
                  }),
                  ...exp.tasks.map((task) => bulletPoint(task)),
                ]),
              ]
            : []),

          // Academic
          ...(cv.academic.length > 0
            ? [
                sectionHeading('Academic Background'),
                ...cv.academic.map((acad) =>
                  boldLine(acad.qualification, `${acad.institution}  |  ${acad.period}`)
                ),
              ]
            : []),

          // Projects
          ...(cv.specialProjects.length > 0
            ? [
                sectionHeading('Special Projects'),
                ...cv.specialProjects.flatMap((proj) => [
                  new Paragraph({
                    children: [new TextRun({ text: proj.title, bold: true, size: 20 })],
                    spacing: { before: 120, after: 60 },
                  }),
                  bodyText(proj.brief),
                ]),
              ]
            : []),

          // Certifications
          ...(cv.certifications.length > 0
            ? [
                sectionHeading('Certifications'),
                ...cv.certifications.map((cert) =>
                  boldLine(
                    cert.name,
                    [cert.issuer, cert.year].filter(Boolean).join(' • ')
                  )
                ),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}
