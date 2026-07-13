'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '../../context/DataContext';
import { PageWrapper } from '../../components/PageWrapper';
import type { Employee } from '@/types/domain';
import type { TailoredCv } from './types';
import { customizeCvAction } from './actions';
import CvPreviewTemplate from './CvPreviewTemplate';
import { exportToPdf, exportToDocx } from '@/lib/cvExport';
import {
  BrainCircuit,
  Sparkles,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Download,
  Copy,
  FolderSync,
  RefreshCw,
  Cpu,
  CheckCircle2,
  FileCheck2,
  BookmarkCheck,
  Eye,
  Loader2,
  Send,
  User,
  Bot,
  AlertCircle
} from 'lucide-react';

interface GenerateClientProps {
  employees: Employee[];
}

export default function GenerateClient({ employees }: GenerateClientProps) {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <GeneratePageContent employees={employees} />
    </Suspense>
  );
}

function GeneratePageContent({ employees }: GenerateClientProps) {
  const { addActivity } = useData();
  const searchParams = useSearchParams();

  // Selected candidate from query params if any
  const preselectedName = searchParams ? searchParams.get('name') : '';

  // Pipeline Wizard Steps: 1 = Configure, 2 = Customize Chat, 3 = Preview & Edit
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [customerName, setCustomerName] = useState('Acme Corp — Lead Architect Initiative');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('Kubernetes, Go, AWS Cloud Services, Terraform Architecture');
  const [preferredExp, setPreferredExp] = useState('At least 6 years orchestrating large-scale financial microservices and leading infrastructure transformations.');
  const [creativity, setCreativity] = useState(70);

  // Chat refinement state
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [customizingLoading, setCustomizingLoading] = useState(false);
  const [customizingError, setCustomizingError] = useState<string | null>(null);

  // Current Tailored CV output
  const [tailoredCv, setTailoredCv] = useState<TailoredCv | null>(null);

  // Find currently selected employee object
  const selectedEmployee = useMemo(() => {
    return employees.find((emp) => emp.id === selectedCandidateId) || employees[0];
  }, [employees, selectedCandidateId]);

  // Set default selection based on query params or fallback
  useEffect(() => {
    if (employees.length > 0) {
      const match = employees.find((emp) => emp.name.toLowerCase() === preselectedName?.toLowerCase());
      if (match) {
        setSelectedCandidateId(match.id);
      } else {
        const alex = employees.find((emp) => emp.name.includes('Alexander'));
        setSelectedCandidateId(alex ? alex.id : employees[0].id);
      }
    }
  }, [employees, preselectedName]);

  // Initial Customization Action (goes to step 2)
  const handleInitialGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomizingLoading(true);
    setCustomizingError(null);
    setWizardStep(2);

    try {
      const tailored = await customizeCvAction(
        selectedEmployee,
        customerName,
        requiredSkills,
        preferredExp,
        []
      );
      setTailoredCv(tailored);
      setChatHistory([
        {
          role: 'assistant',
          content: `Initial resume draft generated for ${selectedEmployee.name} aligned with ${customerName}. You can ask me to modify sections, highlight specific work, or reframe skills below.`
        }
      ]);

      // Log generation activity
      addActivity({
        type: 'success',
        title: 'Customized CV Compiled',
        desc: `AI tailored CV for ${selectedEmployee.name} aligned with ${customerName}.`,
        status: '96% FIT',
        user: {
          name: selectedEmployee.name,
          avatar: selectedEmployee.avatar,
        },
      });
    } catch (err) {
      setCustomizingError(err instanceof Error ? err.message : 'AI Customization failed. Please check setup.');
    } finally {
      setCustomizingLoading(false);
    }
  };

  // Refine chat instruction
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || customizingLoading || !tailoredCv) return;

    const userMessage = chatInput.trim();
    const updatedHistory = [...chatHistory, { role: 'user' as const, content: userMessage }];
    setChatHistory(updatedHistory);
    setChatInput('');
    setCustomizingLoading(true);
    setCustomizingError(null);

    try {
      const tailored = await customizeCvAction(
        selectedEmployee,
        customerName,
        requiredSkills,
        preferredExp,
        updatedHistory,
        userMessage
      );
      setTailoredCv(tailored);
      setChatHistory([
        ...updatedHistory,
        {
          role: 'assistant',
          content: `Customization applied: ${userMessage}. Summary, competencies, and project history adjusted to prioritize this instruction.`
        }
      ]);
    } catch (err) {
      setCustomizingError(err instanceof Error ? err.message : 'AI refinement failed. Try phrasing differently.');
    } finally {
      setCustomizingLoading(false);
    }
  };

  // Handle local CV preview modifications
  const handleCvChange = (updated: TailoredCv) => {
    setTailoredCv(updated);
  };

  const handleDownloadPdf = async () => {
    if (!tailoredCv) return;
    try {
      await exportToPdf('cv-preview-root', `${tailoredCv.name.replace(/\s+/g, '_')}_Tailored_CV`);
    } catch (err) {
      alert('Could not export to PDF. Try adjusting text sizing.');
    }
  };

  const handleDownloadDocx = async () => {
    if (!tailoredCv) return;
    try {
      await exportToDocx(tailoredCv, `${tailoredCv.name.replace(/\s+/g, '_')}_Tailored_CV`);
    } catch (err) {
      alert('Could not export to Word DOCX.');
    }
  };

  if (employees.length === 0) {
    return (
      <PageWrapper className="p-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 flex flex-col items-center text-center">
          <BrainCircuit className="w-10 h-10 text-slate-300 mb-4" />
          <h5 className="text-sm font-bold text-slate-700">No employee profiles found</h5>
          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            Upload at least one candidate CV from the Upload page first.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
            Customer CV Generation
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Tailor, customize, and export high-fidelity CVs aligned perfectly to customer opportunity requirements.
          </p>
        </div>

        {/* Stepper tracker indicators */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/40">
          <span className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${wizardStep === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>1. PARAMETERS</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${wizardStep === 2 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>2. CUSTOMIZE</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${wizardStep === 3 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>3. PREVIEW & EXPORT</span>
        </div>
      </div>

      {/* STEP 1: CONFIGURE OPPORTUNITY */}
      {wizardStep === 1 && (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-6 mx-auto w-full">
            <form
              onSubmit={handleInitialGenerate}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-5"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders className="w-5 h-5 text-indigo-600" />
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

              {/* Select Employee */}
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
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
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

              {/* Preferred Specs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Preferred Specs / Job Description
                </label>
                <textarea
                  rows={4}
                  value={preferredExp}
                  onChange={(e) => setPreferredExp(e.target.value)}
                  placeholder="Paste details of the role or specific experiences required..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700 leading-relaxed resize-none placeholder:text-slate-300"
                />
              </div>

              {/* Range slider for creativity levels */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    AI Customization Alignment Strictness
                  </label>
                  <span className="text-xs font-black text-indigo-600 font-mono">
                    {creativity}% Creative
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={creativity}
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Strict Fact Match</span>
                  <span>Optimized flow</span>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 py-4 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl font-sans text-sm font-black shadow-lg shadow-sky-600/10 active:scale-[0.98] transition-transform flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <BrainCircuit className="w-5 h-5" />
                <span>Initialize AI Tailored CV</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: CHAT CUSTOMIZATION & LIVE PREVIEW */}
      {wizardStep === 2 && (
        <div className="grid grid-cols-12 gap-8">
          {/* Chat Controller Panel */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col flex-1 min-h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                  <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                    AI Customizer Chat
                  </h4>
                </div>
                <button
                  onClick={() => setWizardStep(1)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
              </div>

              {/* Chat Message Panel */}
              <div className="flex-1 overflow-y-auto max-h-[350px] space-y-4 pr-1 mb-4">
                {chatHistory.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 max-w-[85%] ${
                      message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-indigo-650 text-white'
                          : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                      }`}
                    >
                      {message.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-50 border border-slate-200/80 rounded-tl-none text-slate-700'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {customizingLoading && (
                  <div className="flex items-center gap-2.5 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center animate-spin">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none text-xs text-slate-400">
                      Tailoring CV content to request specs...
                    </div>
                  </div>
                )}

                {customizingError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-700 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {customizingError}
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="e.g. Highlight AWS Cloud Architecture projects..."
                  disabled={customizingLoading}
                  className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-700 placeholder:text-slate-350 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={customizingLoading || !chatInput.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Continue button */}
              {tailoredCv && (
                <button
                  onClick={() => setWizardStep(3)}
                  className="mt-5 py-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl shadow-md active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Review Draft & Export</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Live Preview Box */}
          <div className="col-span-12 lg:col-span-7 flex flex-col">
            <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200/80 flex items-center justify-center min-h-[480px] max-h-[600px] overflow-y-auto">
              {tailoredCv ? (
                <div className="scale-[0.8] origin-top my-4 shadow-lg w-full">
                  <CvPreviewTemplate cv={tailoredCv} onChange={handleCvChange} />
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                  <span>Drafting initial profile context...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: INTERACTIVE PREVIEW & EXPORT / DOWNLOAD */}
      {wizardStep === 3 && tailoredCv && (
        <div className="flex flex-col gap-6">
          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setWizardStep(2)}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h4 className="text-sm font-black text-slate-800">Final Edit & Export Panel</h4>
                <p className="text-[11px] text-slate-450 font-medium">Click on any text item on the CV preview below to edit it inline.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 shadow-sm"
              >
                <Download className="w-4 h-4 text-rose-500" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 shadow-sm"
              >
                <Download className="w-4 h-4 text-blue-500" />
                <span>Export DOCX</span>
              </button>

              <button
                onClick={() => {
                  alert('Successfully synchronized tailored layout to CRM database.');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-650 text-white font-black rounded-xl text-xs hover:bg-indigo-750 transition-colors cursor-pointer active:scale-95 shadow-md"
              >
                <FolderSync className="w-4 h-4 text-sky-200" />
                <span>Sync to CRM</span>
              </button>
            </div>
          </div>

          {/* Full-width editable preview */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-inner flex justify-center">
            <CvPreviewTemplate cv={tailoredCv} onChange={handleCvChange} />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
