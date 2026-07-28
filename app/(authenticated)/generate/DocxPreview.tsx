'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

interface DocxPreviewProps {
  /** The template ID to fetch and render. Pass null/empty to show placeholder. */
  templateId: string | null;
  /** Optional className for the outer wrapper */
  className?: string;
}

/**
 * DocxPreview renders a DOCX file directly in the browser using the
 * `docx-preview` library. It fetches the raw DOCX blob from
 * /api/templates/raw?templateId=<id> and renders it into a container div.
 *
 * This approach avoids docxtemplater entirely, so no TemplateError is thrown
 * regardless of the placeholder syntax in the uploaded DOCX.
 */
export default function DocxPreview({ templateId, className = '' }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId || !containerRef.current) return;

    let cancelled = false;

    const renderPreview = async () => {
      setLoading(true);
      setError(null);

      // Clear previous render
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        // 1. Fetch the raw DOCX blob from our API
        const res = await fetch(`/api/templates/raw?templateId=${encodeURIComponent(templateId)}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to fetch template (${res.status})`);
        }

        const arrayBuffer = await res.arrayBuffer();
        if (cancelled) return;

        // 2. Dynamically import docx-preview (client-only, avoids SSR issues)
        const { renderAsync } = await import('docx-preview');
        if (cancelled || !containerRef.current) return;

        // 3. Render the DOCX into the container
        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-preview-wrapper',
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
      } catch (err: any) {
        if (!cancelled) {
          console.error('DocxPreview render error:', err);
          setError(err.message || 'Failed to render document preview');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    renderPreview();

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (!templateId) {
    return (
      <div className={`flex flex-col items-center justify-center text-slate-400 gap-3 p-12 ${className}`}>
        <FileText className="w-10 h-10 text-slate-300" />
        <span className="text-xs font-semibold">Select a template to see preview</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-xl gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs text-slate-400 font-semibold">
            Rendering document preview…
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-xs font-bold text-rose-600">Preview failed</p>
          <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* docx-preview render target */}
      <div
        ref={containerRef}
        className="docx-preview-container w-full"
        style={{
          // Ensure the rendered pages scale to fit the container nicely
          '--docx-preview-page-border': '1px solid #e2e8f0',
          '--docx-preview-page-box-shadow': '0 4px 16px rgba(0,0,0,0.08)',
          '--docx-preview-page-margin': '0 auto 24px auto',
        } as React.CSSProperties}
      />
    </div>
  );
}
