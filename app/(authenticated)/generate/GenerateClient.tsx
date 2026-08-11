'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import CvPreviewTemplate from './CvPreviewTemplate';
import CvSectionEditor from './CvSectionEditor';
import { useSearchParams } from 'next/navigation';
import { PageWrapper } from '../../components/PageWrapper';
import type { Employee } from '@/types/domain';
import type { TailoredCv } from './types';
import {
  customizeCvAction,
  saveGeneratedCvAction,
} from './actions';
import { exportToPdf } from '@/lib/cvExport';
import {
  BrainCircuit,
  Sparkles,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Download,
  FolderSync,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserCircle,
} from 'lucide-react';

interface GenerateClientProps {
  employees: Employee[];
}

export default function GenerateClient({ employees }: GenerateClientProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
        </div>
      }
    >
      <GeneratePageContent employees={employees} />
    </Suspense>
  );
}

function GeneratePageContent({ employees }: GenerateClientProps) {
  const searchParams = useSearchParams();
  const preselectedName = searchParams ? searchParams.get('name') : '';

  // ── Wizard step ─────────────────────────────────────────────────────────────
  // 1 = Parameters, 2 = Review & Edit, 3 = Preview & Export
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // ── Step 1 form state ───────────────────────────────────────────────────────
  const [customerName, setCustomerName] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredExp, setPreferredExp] = useState('');

  // ── Generation state ────────────────────────────────────────────────────────
  const [customizingLoading, setCustomizingLoading] = useState(false);
  const [customizingError, setCustomizingError] = useState<string | null>(null);

  // ── CV content state ────────────────────────────────────────────────────────
  const [tailoredCv, setTailoredCv] = useState<TailoredCv | null>(null);

  // ── Save state ──────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isHumanVerified, setIsHumanVerified] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.rowId === selectedCandidateId) || employees[0],
    [employees, selectedCandidateId]
  );

  // ── Pre-select employee from query param ────────────────────────────────────
  useEffect(() => {
    if (employees.length === 0) return;
    const match = employees.find(
      (emp) => emp.name.toLowerCase() === preselectedName?.toLowerCase()
    );
    if (match) {
      setSelectedCandidateId(match.rowId);
    } else {
      const alex = employees.find((emp) => emp.name.includes('Alexander'));
      setSelectedCandidateId(alex ? alex.rowId : employees[0].rowId);
    }
  }, [employees, preselectedName]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Always generates a completely fresh CV from Gemini using the current
   * employee profile and customer requirements. No saved draft is used.
   */
  const handleCustomize = async (e: React.FormEvent) => {
    e.preventDefault();

    setCustomizingLoading(true);
    setCustomizingError(null);
    setSaveSuccess(false);
    setTailoredCv(null);
    setIsHumanVerified(false);
    setWizardStep(2);

    try {
      const tailored = await customizeCvAction(
        selectedEmployee,
        customerName,
        requiredSkills,
        preferredExp,
        [] // Always empty — fresh generation every time
      );
      setTailoredCv(tailored);
    } catch (err) {
      setCustomizingError(
        err instanceof Error ? err.message : 'AI customization failed. Please check setup.'
      );
    } finally {
      setCustomizingLoading(false);
    }
  };

  /**
   * Saves the current (possibly edited) tailoredCv to the generated_cvs table.
   * Returns true on success, false on failure.
   */
  const handleSave = async (): Promise<boolean> => {
    if (!tailoredCv || !selectedEmployee) return false;
    setSaving(true);
    try {
      await saveGeneratedCvAction(selectedEmployee.rowId, tailoredCv);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      return true;
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Always saves the CV then navigates to Step 3 preview.
   * (The "Apply to Template" button is the single action — it saves + previews.)
   */
  const handleGoToPreview = async () => {
    if (!tailoredCv) return;
    const ok = await handleSave();
    if (!ok) return;
    setWizardStep(3);
  };

  const handleDownloadDocx = async () => {
    if (!tailoredCv) return;
    try {
      await exportToPdf(
        'cv-preview-root',
        `${(tailoredCv.name ?? 'CV').replace(/\s+/g, '_')}_Tailored_CV`
      );
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert(err instanceof Error ? err.message : 'Could not export to DOCX.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!tailoredCv) return;
    try {
      await exportToPdf(
        'cv-preview-root',
        `${(tailoredCv.name ?? 'CV').replace(/\s+/g, '_')}_Tailored_CV`
      );
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(err instanceof Error ? `Could not export to PDF: ${err.message}` : 'Could not export to PDF.');
    }
  };

  const handleSyncToCrm = async () => {
    if (!tailoredCv) return;
    try {
      await saveGeneratedCvAction(selectedEmployee.rowId, tailoredCv);
      alert('Successfully synchronized tailored CV to CRM database.');
    } catch (err: any) {
      alert(`Could not sync to CRM: ${err.message}`);
    }
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (employees.length === 0) {
    return (
      <PageWrapper className="p-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 flex flex-col items-center text-center">
          <BrainCircuit className="w-10 h-10 text-slate-300 mb-4" />
          <h5 className="text-sm font-bold text-slate-700">No employee profiles found</h5>
          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            Create at least one employee profile from the Create Profile page first.
          </p>
        </div>
      </PageWrapper>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageWrapper className="p-8">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
            Customize CVs
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Tailor, customize, and export high-fidelity CVs aligned perfectly to customer
            opportunity requirements.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/40">
          <span
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
              wizardStep === 1 ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-400'
            }`}
          >
            1. PARAMETERS
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
              wizardStep === 2 ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-400'
            }`}
          >
            2. REVIEW &amp; EDIT
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
              wizardStep === 3 ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-400'
            }`}
          >
            3. PREVIEW &amp; EXPORT
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STEP 1 — CONFIGURE OPPORTUNITY
      ════════════════════════════════════════════════════════════════════ */}
      {wizardStep === 1 && (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-6 mx-auto w-full">
            <form
              onSubmit={handleCustomize}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-5"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders className="w-5 h-5 text-indigo-650" />
                <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                  Opportunity Customization Details
                </h4>
              </div>

              {/* Target Opportunity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Target Opportunity / Customer
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corp — Lead Frontend Initiative"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700 placeholder:text-slate-300"
                />
              </div>

              {/* Select Talent Profile */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Select Talent Profile
                </label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                >
                  {employees.map((emp) => (
                    <option key={emp.rowId} value={emp.rowId}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>

                {selectedEmployee && (
                  <div className="flex items-center gap-2.5 mt-2">
                    {selectedEmployee.avatar && !selectedEmployee.avatar.includes('unsplash.com') ? (
                      <img
                        src={selectedEmployee.avatar}
                        alt={selectedEmployee.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {selectedEmployee.department} · {selectedEmployee.role}
                    </span>
                  </div>
                )}
              </div>


              {/* Mandatory Skills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Mandatory Required Skills
                </label>
                <input
                  type="text"
                  required
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="e.g. React.js, Next.js, Redux, TailwindCSS"
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700 placeholder:text-slate-300"
                />
              </div>

              {/* Preferred Specs / JD */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Customer Requirements / Job Description
                </label>
                <textarea
                  rows={4}
                  value={preferredExp}
                  onChange={(e) => setPreferredExp(e.target.value)}
                  placeholder="Paste the role requirements or job description details..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700 leading-relaxed resize-none placeholder:text-slate-300"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="mt-4 py-4 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl font-sans text-sm font-black shadow-lg shadow-sky-600/10 active:scale-[0.98] transition-transform flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <BrainCircuit className="w-5 h-5" />
                <span>Customize CV</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          STEP 2 — REVIEW & EDIT
      ════════════════════════════════════════════════════════════════════ */}
      {wizardStep === 2 && (
        <div className="grid grid-cols-12 gap-6">
          {/* ── Left sidebar: context + action buttons (sticky) ─────────── */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-6 flex flex-col gap-4">
              {/* Candidate info card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sparkles className="w-4 h-4 text-indigo-650" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Customization Context
                  </h4>
                </div>

                {/* Employee */}
                {selectedEmployee && (
                  <div className="flex items-center gap-3">
                    {selectedEmployee.avatar && !selectedEmployee.avatar.includes('unsplash.com') ? (
                      <img
                        src={selectedEmployee.avatar}
                        alt={selectedEmployee.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-indigo-100 shadow-sm flex items-center justify-center shrink-0">
                        <UserCircle className="w-7 h-7 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate">
                        {selectedEmployee.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {selectedEmployee.role}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Target Customer
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-snug">
                      {customerName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {tailoredCv && !customizingLoading && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 pb-3 border-b border-slate-100">
                    Actions
                  </h4>

                  {/* Human Verified checkbox */}
                  <div className="flex items-center gap-2 py-1">
                    <input
                      id="generate-human-verified-checkbox"
                      type="checkbox"
                      checked={isHumanVerified}
                      onChange={(e) => setIsHumanVerified(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                    />
                    <label
                      htmlFor="generate-human-verified-checkbox"
                      className="text-xs font-bold text-slate-600 select-none cursor-pointer"
                    >
                      Human Verified
                    </label>
                  </div>

                  {/* Apply to CV — also auto-saves */}
                  <button
                    type="button"
                    onClick={handleGoToPreview}
                    disabled={saving || !isHumanVerified}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Saved! Applying...</span>
                      </>
                    ) : (
                      <>
                        <span>Apply to CV</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Saves your customized CV and generates the template preview.
                  </p>
                </div>
              )}

              {/* Back button */}
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors self-start"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to Parameters
              </button>
            </div>
          </div>

          {/* ── Right main: loading / error / section editor ─────────────── */}
          <div className="col-span-12 lg:col-span-9">
            {/* Loading state */}
            {customizingLoading && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center py-28 gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-black text-slate-800">
                    Generating Customized CV…
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    AI is tailoring{' '}
                    <span className="font-bold text-slate-700">{selectedEmployee?.name}</span>'s
                    profile for{' '}
                    <span className="font-bold text-slate-700">{customerName}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {customizingError && !customizingLoading && (
              <div className="bg-white rounded-2xl border border-rose-200 shadow-sm flex flex-col items-center justify-center py-20 gap-4 text-center px-8">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <div className="space-y-1">
                  <p className="text-sm font-black text-rose-700">Customization Failed</p>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    {customizingError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to Parameters
                </button>
              </div>
            )}

            {/* Section editor — shown when CV is ready */}
            {tailoredCv && !customizingLoading && !customizingError && (
              <>
                {/* Context banner */}
                <div className="mb-4 px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-indigo-800">
                      AI Generated — Review &amp; Edit Before Saving
                    </p>
                    <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                      All sections are editable. Expand collapsed sections to see more.
                    </p>
                  </div>
                  {saveSuccess && (
                    <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Saved to database
                    </div>
                  )}
                </div>

                <CvSectionEditor cv={tailoredCv} onChange={setTailoredCv} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          STEP 3 — PREVIEW & EXPORT
      ════════════════════════════════════════════════════════════════════ */}
      {wizardStep === 3 && tailoredCv && (
        <div className="flex flex-col gap-6">
          {/* Action toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  Final CV Preview &amp; Export Panel
                </h4>
                <p className="text-[11px] text-slate-450 font-medium">
                  Verify the filled template before downloading.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 shadow-sm"
              >
                <Download className="w-4 h-4 text-rose-500" />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToCrm}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-650 text-white font-black rounded-xl text-xs hover:bg-indigo-750 transition-colors cursor-pointer active:scale-95 shadow-md"
              >
                <FolderSync className="w-4 h-4 text-sky-200" />
                <span>Sync to CRM</span>
              </button>
            </div>
          </div>

          {/* Full-width interactive HTML preview showing the customized CV template */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-inner flex justify-center">
            <CvPreviewTemplate
              cv={{
                ...tailoredCv,
                avatar: selectedEmployee?.avatar || null,
              }}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
