'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '../../context/DataContext';
import { PageWrapper } from '../../components/PageWrapper';
import type { Employee } from '@/types/domain';
import {
  BrainCircuit,
  Sparkles,
  Sliders,
  ChevronRight,
  Download,
  Copy,
  FolderSync,
  RefreshCw,
  Cpu,
  CheckCircle2,
  FileCheck2,
  BookmarkCheck,
  Eye,
  Loader2
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

  // Form State
  const [customerName, setCustomerName] = useState('Acme Corp — Lead Architect Initiative');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('Kubernetes, Go, AWS Cloud Services, Terraform Architecture');
  const [preferredExp, setPreferredExp] = useState('At least 6 years orchestrating large-scale financial microservices and leading infrastructure transformations.');
  const [creativity, setCreativity] = useState(70);

  // Generation status state
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const [currentStep, setCurrentStep] = useState(0);

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
        // Fallback default to Alexander Sterling if available, else first employee
        const alex = employees.find((emp) => emp.name.includes('Alexander'));
        setSelectedCandidateId(alex ? alex.id : employees[0].id);
      }
    }
  }, [employees, preselectedName]);

  const generationSteps = [
    'Analyzing Acme Corp requirement specifications...',
    'Fetching candidate original profile context...',
    'Adapting professional summary for target architecture goals...',
    'Performing semantic skills taxonomy alignment...',
    'Formatting high-fidelity customized PDF template...',
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('generating');
    setCurrentStep(0);

    // Dynamic step increments
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= generationSteps.length - 1) {
          clearInterval(interval);
          setStatus('done');
          
          // Log generation activity
          addActivity({
            type: 'success',
            title: 'Tailored CV Created',
            desc: `AI tailored CV for ${selectedEmployee.name} aligned to ${customerName}.`,
            status: '96% FIT',
            user: {
              name: selectedEmployee.name,
              avatar: selectedEmployee.avatar,
            },
          });
          return prev;
        }
        return prev + 1;
      });
    }, 900);
  };

  if (employees.length === 0) {
    return (
      <PageWrapper className="p-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 flex flex-col items-center text-center">
          <BrainCircuit className="w-10 h-10 text-slate-300 mb-4" />
          <h5 className="text-sm font-bold text-slate-700">No employees in the repository yet</h5>
          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            Upload at least one employee CV before generating a customized CV.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
          Customer CV Generation
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Tailor and format candidates' resumes autonomously to match specific customer requirements or job descriptions.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Input Generation Form */}
        <div className="col-span-12 lg:col-span-5">
          <form
            onSubmit={handleGenerate}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-5 h-full"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                Tailoring Parameters
              </h4>
            </div>

            {/* Target Client */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Target Opportunity / Customer
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Acme Corp — Lead Frontend"
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
              />
            </div>

            {/* Select Employee candidate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Select Talent Candidate
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

            {/* Mandatory Required Skills */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Mandatory Required Skills
              </label>
              <input
                type="text"
                required
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="e.g. React.js, Next.js, Redux"
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
              />
            </div>

            {/* Preferred experience details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Preferred Requirements / Job Specs
              </label>
              <textarea
                rows={4}
                value={preferredExp}
                onChange={(e) => setPreferredExp(e.target.value)}
                placeholder="Describe key responsibilities or target experiences..."
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700 leading-relaxed resize-none"
              />
            </div>

            {/* Range slider for creativity levels */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  AI Alignment strictness
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

            {/* Generate Trigger */}
            <button
              type="submit"
              disabled={status === 'generating'}
              className="mt-4 py-4 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl font-sans text-sm font-black shadow-lg shadow-sky-600/10 active:scale-[0.98] transition-transform flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BrainCircuit className="w-5 h-5" />
              <span>Generate AI Customized CV</span>
            </button>
          </form>
        </div>

        {/* Right Column: AI Tailored output section */}
        <div className="col-span-12 lg:col-span-7 flex flex-col">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex-1 flex flex-col min-h-[480px]">
            {/* Idle default state */}
            {status === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 mb-4 animate-pulse">
                  <BrainCircuit className="w-8 h-8" />
                </div>
                <h5 className="text-sm font-bold text-slate-700">Ready for Alignment</h5>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                  Configure the target opportunity settings on the left and trigger the AI compiler to view the structured results.
                </p>
              </div>
            )}

            {/* Generating Loader state */}
            {status === 'generating' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-6">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <h5 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">
                  Tailoring Active Profile...
                </h5>

                {/* Progress stepper logs */}
                <div className="w-full text-left space-y-3.5 bg-slate-50 border border-slate-200/80 p-4.5 rounded-xl">
                  {generationSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 transition-opacity duration-300 ${
                        idx < currentStep
                          ? 'opacity-100 text-emerald-600 font-semibold'
                          : idx === currentStep
                          ? 'opacity-100 text-indigo-600 font-bold'
                          : 'opacity-30 text-slate-400'
                      }`}
                    >
                      {idx < currentStep ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      ) : idx === currentStep ? (
                        <Loader2 className="w-4.5 h-4.5 animate-spin shrink-0 text-indigo-600" />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </div>
                      )}
                      <span className="text-xs leading-tight">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated high-fidelity output */}
            {status === 'done' && (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded">
                        96% Fit Alignment
                      </span>
                      <h4 className="text-sm font-black text-slate-800 mt-1">
                        Tailored Profile: {selectedEmployee.name}
                      </h4>
                    </div>

                    {/* Meta sync information */}
                    <div className="text-right text-[10px] font-semibold text-slate-400">
                      <span>Aligned to {customerName.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* Adapted Experience & highlighted fields */}
                  <div className="space-y-6">
                    {/* Aligned Executive Summary with Highlight Markers */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/20" />
                        <span>AI Adapted Executive Summary</span>
                      </p>
                      <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 text-xs text-slate-700 leading-relaxed relative">
                        <span className="absolute top-1 right-2 text-[8px] font-bold text-indigo-500 uppercase tracking-wide">
                          Modified by AI
                        </span>
                        "Results-driven and highly communicative{' '}
                        <span className="bg-amber-100 text-slate-850 px-1 font-semibold rounded">
                          {selectedEmployee.role}
                        </span>{' '}
                        possessing specialized technical proficiency. Tailored directly to{' '}
                        <span className="bg-indigo-100 text-indigo-900 px-1 font-semibold rounded">
                          {customerName.split(' ')[0]}
                        </span>
                        's core requirements by integrating core strategies: leveraging{' '}
                        <span className="bg-sky-100 text-sky-900 px-1 font-semibold rounded font-mono">
                          {requiredSkills.split(',')[0]}
                        </span>{' '}
                        and{' '}
                        <span className="bg-sky-100 text-sky-900 px-1 font-semibold rounded font-mono">
                          {requiredSkills.split(',')[1] || 'Go'}
                        </span>{' '}
                        to align critical high compliance systems."
                      </div>
                    </div>

                    {/* Aligned Core competencies */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                        Extracted Match Taxonomy
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {requiredSkills.split(',').map((skill, index) => (
                          <div
                            key={index}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                            <span>{skill.trim()}</span>
                          </div>
                        ))}
                        {selectedEmployee.skills.slice(0, 3).map((skill, index) => (
                          <div
                            key={index + 10}
                            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                            <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Experience Adaptation mockup */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Adapted Professional Experience
                      </p>
                      <div className="p-4 border border-slate-200/60 rounded-xl space-y-2 bg-slate-50/50">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-bold text-slate-800">
                            {selectedEmployee.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            Jan 2021 — Present
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          "Leading system orchestration and components deployment aligned directly with enterprise requirements. Successfully reduced latency metrics by optimizing {requiredSkills.split(',')[0]?.trim() || 'infrastructure'} frameworks."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Finalizing action buttons panel */}
                <div className="mt-8 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3">
                  <button
                    onClick={() => alert('Simulated Tailored PDF downloaded.')}
                    className="flex items-center justify-center gap-1.5 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Download CV</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Adapted Executive Summary: Aligned to ${customerName}`);
                      alert('Copied AI tailored resume summary text to clipboard!');
                    }}
                    className="flex items-center justify-center gap-1.5 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Text</span>
                  </button>

                  <button
                    onClick={() => alert('Successfully synchronized optimized profile into Enterprise CRM.')}
                    className="flex items-center justify-center gap-1.5 py-3 bg-indigo-600 text-white font-black rounded-xl text-xs hover:bg-indigo-700 transition-colors cursor-pointer active:scale-95"
                  >
                    <FolderSync className="w-4 h-4 text-sky-200" />
                    <span>Sync to CRM</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

