'use client';

import React, { useMemo } from 'react';
import Handlebars from 'handlebars';
import { cvTemplateSource } from '@/lib/templates/cvTemplate';
import type { TailoredCv } from './types';

interface CvPreviewTemplateProps {
  cv: TailoredCv;
  onChange?: (updated: TailoredCv) => void;
}

export default function CvPreviewTemplate({ cv, onChange }: CvPreviewTemplateProps) {
  // Compile the Handlebars template with the current CV data
  const compiledHtml = useMemo(() => {
    try {
      const template = Handlebars.compile(cvTemplateSource);
      return template(cv);
    } catch (error) {
      console.error('Handlebars compilation error:', error);
      return '<div class="text-rose-500">Error compiling preview template.</div>';
    }
  }, [cv]);

  return (
    <div
      id="cv-preview-root"
      // Deliberately inline styles only, no Tailwind/utility classes — this node (and everything
      // Handlebars renders inside it) is screenshotted by html2canvas for PDF export, and
      // Tailwind v4's default palette is oklch(), which html2canvas 1.x cannot parse (it throws
      // and PDF export silently fails). See lib/templates/cvTemplate.ts's header comment.
      style={{
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
        fontSize: '14px',
        color: '#2D3748',
      }}
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: compiledHtml }}
    />
  );
}
