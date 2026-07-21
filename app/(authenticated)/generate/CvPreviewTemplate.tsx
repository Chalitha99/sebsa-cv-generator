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
      className="w-full max-w-[800px] mx-auto bg-white border border-slate-200 shadow-xl rounded-xl font-sans text-slate-800 leading-relaxed text-sm select-text"
      style={{ minHeight: '1120px' }}
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: compiledHtml }}
      onBlur={(e) => {
        // If we still want to notify parents that editing happened, we can trigger onChange here
        // However, extracting the specific JSON changes from the raw HTML is complex.
        // For now, the user edits the HTML directly, and the export functions grab the DOM HTML.
      }}
    />
  );
}
