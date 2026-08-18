'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import CvPreviewTemplate from './CvPreviewTemplate';
import CvSectionEditor from './CvSectionEditor';
import CvSuggestionSelector, {
  type CvSuggestionDraft,
  type CvSuggestionSelection,
} from './CvSuggestionSelector';
import { useSearchParams } from 'next/navigation';
import { PageWrapper } from '../../components/PageWrapper';
import type { Employee } from '@/types/domain';
import type { TailoredCv, CvSuggestion } from './types';
import {
  suggestCvContentAction,
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

  // ── AI suggestion + CV content state ────────────────────────────────────────
  // suggestion: the AI's relevance flags paired with the employee's real profile data (never
  // shown to the user until they've reviewed/adjusted it via CvSuggestionSelector). tailoredCv is
  // only set once the user continues past that selection step — from then on it behaves exactly
  // like the old flow (CvSectionEditor for a light wording pass, then Apply to CV).
  const [suggestion, setSuggestion] = useState<CvSuggestion | null>(null);
  const [suggestionDraft, setSuggestionDraft] = useState<CvSuggestionDraft | null>(null);
  const [tailoredCv, setTailoredCv] = useState<TailoredCv | null>(null);

  // ── Save state ──────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveSuccess] = useState(false);
  const [isHumanVerified, setIsHumanVerified] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedEmployee = useMemo(
    () => employees.find((emp) => emp.rowId === selectedCandidateId) || employees[0],
    [employees, selectedCandidateId]
  );

  const originalProfileCv = useMemo(
    () =>
      selectedEmployee && suggestion
        ? {
            name: selectedEmployee.name,
            currentPosition: selectedEmployee.currentPosition || selectedEmployee.role,
            summary: suggestion.originalObjective,
            customerName: '',
            skillsAligned: [],
            academic: suggestion.academic,
            experience: suggestion.experience.map((entry) => ({
              position: entry.position,
              company: entry.company,
              period: entry.period,
              tasks: entry.tasks.map((task) => task.text),
            })),
            specialProjects: suggestion.projects.map((project) => ({
              title: project.title,
              brief: project.brief,
              // Project skills are editing/selection metadata and should not appear
              // beneath projects in the final Complete Profile CV preview.
              skills: [],
            })),
            certifications: suggestion.certifications.map((certification) => ({
              name: certification.name,
              issuer: certification.issuer,
              year: certification.year,
            })),
            avatar: selectedEmployee.avatar,
          }
        : null,
    [selectedEmployee, suggestion]
  );

  const customizedPreviewCv = useMemo(
    () =>
      tailoredCv
        ? {
            ...tailoredCv,
            specialProjects: tailoredCv.specialProjects.map((project) => ({
              ...project,
              skills: [],
            })),
          }
        : null,
    [tailoredCv]
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
   * Asks the AI which of the employee's existing projects/experience/certifications are
   * relevant to this opportunity (plus a customized Objective) — never a rewrite of the profile.
   * The result is reviewed/adjusted by the user in CvSuggestionSelector before anything is
   * actually applied to a CV (handleSelectionContinue below).
   */
  const handleCustomize = async (e: React.FormEvent) => {
    e.preventDefault();

    setCustomizingLoading(true);
    setCustomizingError(null);
    setSuggestion(null);
    setSuggestionDraft(null);
    setTailoredCv(null);
    setWizardStep(2);

    try {
      const result = await suggestCvContentAction(
        selectedEmployee,
        customerName,
        requiredSkills,
        preferredExp
      );
      setSuggestion(result);
      setSuggestionDraft({
        objective: result.objective,
        experience: result.experience,
        projects: result.projects,
        certifications: result.certifications,
      });
    } catch (err) {
      setCustomizingError(
        err instanceof Error ? err.message : 'AI suggestion failed. Please check setup.'
      );
    } finally {
      setCustomizingLoading(false);
    }
  };

  /**
   * Called once the user has reviewed/adjusted the AI's suggested selection in
   * CvSuggestionSelector. Builds the actual TailoredCv from only the selected content, then hands
   * off to the existing CvSectionEditor for a light wording pass before Apply to CV — from here
   * on, behavior is unchanged from the old flow.
   */
  const handleSelectionApply = async (selection: CvSuggestionSelection) => {
    if (!selectedEmployee) return;
    const cv: TailoredCv = {
      name: selectedEmployee.name,
      currentPosition: selectedEmployee.currentPosition || selectedEmployee.role,
      summary: selection.summary,
      customerName,
      skillsAligned: [],
      academic: selection.academic,
      experience: selection.experience,
      specialProjects: selection.specialProjects,
      certifications: selection.certifications,
      avatar: selectedEmployee.avatar,
    };

    setSaving(true);
    try {
      await saveGeneratedCvAction(selectedEmployee.rowId, cv);
      setTailoredCv(cv);
      setWizardStep(3);
    } catch (err) {
      alert(err instanceof Error ? `Save failed: ${err.message}` : 'Could not apply the selected content.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Saves the current (possibly edited) tailoredCv to the generated_cvs table.
   * Returns true on success, false on failure.
   */


  /**
   * Always saves the CV then navigates to Step 3 preview.
   * (The "Apply to Template" button is the single action — it saves + previews.)
   */


  const handleBackToSelection = () => {
    setTailoredCv(null);
    setWizardStep(2);
  };

  const handleGoToPreview = () => setWizardStep(3);

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
            Customize CV
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
            2. SELECT &amp; REVIEW
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

              {suggestion && (suggestionDraft || tailoredCv) && !customizingLoading && (
                <button
                  type="button"
                  onClick={handleBackToSelection}
                  className="py-3.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl font-sans text-sm font-black active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span>Continue with Draft</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          STEP 2 — REVIEW & EDIT
      ════════════════════════════════════════════════════════════════════ */}
      {wizardStep === 2 && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer active:scale-95 text-[11px] font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Parameters</span>
            </button>
          </div>
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
                      I Verified the Generated Content
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

            </div>
          </div>

          {/* ── Right main: loading / error / section editor ─────────────── */}
          <div className="col-span-12 lg:col-span-9">
            {/* Loading state */}
            {customizingLoading && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center py-28 gap-5">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-sky-200 animate-ping opacity-40" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-sky-500 border-r-indigo-500 animate-spin" />
                  <div className="absolute inset-4 rounded-full border border-dashed border-indigo-300 animate-[spin_3s_linear_infinite_reverse]" />
                  <div className="relative w-12 h-12 rounded-2xl bg-slate-900 shadow-lg shadow-indigo-500/20 flex items-center justify-center animate-pulse">
                    <Image
                      src="/images/seb-logo-2.png"
                      alt="SEBSA"
                      width={34}
                      height={34}
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-black text-slate-800">
                    Analyzing Profile…
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Reviewing{' '}
                    <span className="font-bold text-slate-700">{selectedEmployee?.name}</span>'s
                    existing profile against{' '}
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

            {/* Suggestion selector — shown once the AI has flagged relevant existing content,
                before anything is applied to a CV */}
            {suggestion && suggestionDraft && !tailoredCv && !customizingLoading && !customizingError && (
              <CvSuggestionSelector
                suggestion={suggestion}
                draft={suggestionDraft}
                onDraftChange={setSuggestionDraft}
                onApply={handleSelectionApply}
                applying={saving}
              />
            )}

            {/* Section editor — shown once the user has continued past selection, for a light
                wording pass over only the content they picked */}
            {tailoredCv && !customizingLoading && !customizingError && (
              <>
                {/* Context banner */}
                <div className="mb-4 px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-indigo-800">
                      Built From Your Selection — Review Wording Before Saving
                    </p>
                    <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                      Only the content you selected is included. Expand collapsed sections to see more.
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
      {wizardStep === 3 && tailoredCv && customizedPreviewCv && originalProfileCv && (
        <div className="flex flex-col gap-6">
          {/* Action toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleBackToSelection}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer active:scale-95"
                aria-label="Back to Select and Preview"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  Original and Customized CV Preview
                </h4>
                <p className="text-[11px] text-slate-450 font-medium">
                  Compare the complete employee profile with the selected customer-specific content.
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <section className="min-w-0 space-y-3">
              <div className="px-1">
                <h5 className="text-xs font-black uppercase tracking-widest text-slate-600">
                  Complete Profile CV
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">
                  Original overview, experience, projects, academics, and certifications.
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-inner flex justify-center">
                <CvPreviewTemplate cv={originalProfileCv} id="original-cv-preview-root" />
              </div>
            </section>

            <section className="min-w-0 space-y-3">
              <div className="px-1">
                <h5 className="text-xs font-black uppercase tracking-widest text-indigo-700">
                  Customized CV
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">
                  Contains only the content selected in the previous step. Project skills are hidden.
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-indigo-100 shadow-inner flex justify-center">
                <CvPreviewTemplate
                  cv={{
                    ...customizedPreviewCv,
                    avatar: selectedEmployee?.avatar || null,
                  }}
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
