'use client';

import React, { useState } from 'react';
import { PageWrapper } from '../../components/PageWrapper';
import {
  FileSpreadsheet,
  Eye,
  PenTool,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
  Trash
} from 'lucide-react';

export default function TemplatesPage() {
  // Live editable fields for Jonathan Carter
  const [resumeData, setResumeData] = useState({
    name: 'Jonathan Carter',
    title: 'Senior Technology Executive',
    email: 'j.carter@executive-intel.com',
    phone: '+1 (555) 019-2834',
    location: 'New York, NY',
    summary: 'A results-driven technology executive with extensive experience leading multi-disciplinary product teams. Expertise spans across SaaS scaling, agile transformation, and distributed ledger development with an absolute focus on modern software craftsmanship.',
    skills: 'SaaS Scaling, Distributed Systems, Team Leadership, Agile Orchestration, Strategic Planning, Technical Architecture',
    experienceCompany1: 'Apex Systems Corp',
    experienceRole1: 'Vice President of Product Technology',
    experiencePeriod1: 'Jan 2020 — Present',
    experienceDesc1: 'Orchestrated the engineering realignment of 6 separate product groups, successfully scaling delivery outputs by 40%. Implemented streamlined CI/CD pipelines reducing testing latencies.',
    experienceCompany2: 'Invenio Labs Inc',
    experienceRole2: 'Director of Engineering Systems',
    experiencePeriod2: 'Mar 2016 — Dec 2019',
    experienceDesc2: 'Directly managed a cloud development team of 24 engineers. Oversaw the migrations of core architectures onto highly secure, Kubernetes-orchestrated networks.',
  });

  const [isSaved, setIsSaved] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleReset = () => {
    setResumeData({
      name: 'Jonathan Carter',
      title: 'Senior Technology Executive',
      email: 'j.carter@executive-intel.com',
      phone: '+1 (555) 019-2834',
      location: 'New York, NY',
      summary: 'A results-driven technology executive with extensive experience leading multi-disciplinary product teams. Expertise spans across SaaS scaling, agile transformation, and distributed ledger development with an absolute focus on modern software craftsmanship.',
      skills: 'SaaS Scaling, Distributed Systems, Team Leadership, Agile Orchestration, Strategic Planning, Technical Architecture',
      experienceCompany1: 'Apex Systems Corp',
      experienceRole1: 'Vice President of Product Technology',
      experiencePeriod1: 'Jan 2020 — Present',
      experienceDesc1: 'Orchestrated the engineering realignment of 6 separate product groups, successfully scaling delivery outputs by 40%. Implemented streamlined CI/CD pipelines reducing testing latencies.',
      experienceCompany2: 'Invenio Labs Inc',
      experienceRole2: 'Director of Engineering Systems',
      experiencePeriod2: 'Mar 2016 — Dec 2019',
      experienceDesc2: 'Directly managed a cloud development team of 24 engineers. Oversaw the migrations of core architectures onto highly secure, Kubernetes-orchestrated networks.',
    });
  };

  return (
    <PageWrapper className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
          Template Management
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Design, customize, and configure layout structures for tailored customer-facing resume profiles.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Live Resume Editor Form */}
        <div className="col-span-12 lg:col-span-5">
          <form
            onSubmit={handlePublish}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-5 h-full"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-indigo-600" />
                <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                  Interactive Editor: Executive Modern
                </h4>
              </div>

              {/* Template selection pill */}
              <span className="text-[10px] font-black uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                Active Template
              </span>
            </div>

            {/* Candidate Identity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Candidate Name
                </label>
                <input
                  type="text"
                  required
                  value={resumeData.name}
                  onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Corporate Title
                </label>
                <input
                  type="text"
                  required
                  value={resumeData.title}
                  onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                />
              </div>
            </div>

            {/* Details bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="text"
                  value={resumeData.email}
                  onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white text-slate-700 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Phone
                </label>
                <input
                  type="text"
                  value={resumeData.phone}
                  onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white text-slate-700 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Location
                </label>
                <input
                  type="text"
                  value={resumeData.location}
                  onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white text-slate-700 focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Executive Profile Summary
              </label>
              <textarea
                rows={4}
                required
                value={resumeData.summary}
                onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700 leading-relaxed resize-none"
              />
            </div>

            {/* Skills chip list */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Core Skills Matrix (Comma Separated)
              </label>
              <input
                type="text"
                required
                value={resumeData.skills}
                onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
              />
            </div>

            {/* Interactive experiences 1 */}
            <div className="p-4 border border-slate-200 rounded-xl space-y-3.5 bg-slate-50/20">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                Primary Career Role
              </span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Company"
                  value={resumeData.experienceCompany1}
                  onChange={(e) => setResumeData({ ...resumeData, experienceCompany1: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                />
                <input
                  type="text"
                  placeholder="Period"
                  value={resumeData.experiencePeriod1}
                  onChange={(e) => setResumeData({ ...resumeData, experiencePeriod1: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
                />
              </div>
              <input
                type="text"
                placeholder="Role Title"
                value={resumeData.experienceRole1}
                onChange={(e) => setResumeData({ ...resumeData, experienceRole1: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
              />
              <textarea
                rows={2}
                placeholder="Description"
                value={resumeData.experienceDesc1}
                onChange={(e) => setResumeData({ ...resumeData, experienceDesc1: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 leading-relaxed resize-none"
              />
            </div>

            {/* Actions list */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4.5 py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Defaults</span>
              </button>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Template Published</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Publish Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live High-Fidelity preview of resume template */}
        <div className="col-span-12 lg:col-span-7 flex flex-col">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex-1 flex flex-col h-full">
            <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Live High-Fidelity Template Preview</span>
            </h4>

            {/* Professional resume document mock widget */}
            <div className="bg-white rounded-2xl border border-slate-300/80 p-8 shadow-xl flex-1 flex flex-col justify-between max-w-[600px] mx-auto w-full font-sans text-slate-800">
              <div>
                {/* Main Identity segment */}
                <div className="pb-5 border-b-2 border-slate-900 flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase leading-none">
                      {resumeData.name}
                    </h1>
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest mt-1.5">
                      {resumeData.title}
                    </p>
                  </div>

                  {/* Secondary small contact details block */}
                  <div className="text-right text-[10px] font-semibold text-slate-500 space-y-0.5">
                    <p>{resumeData.email}</p>
                    <p>{resumeData.phone}</p>
                    <p>{resumeData.location}</p>
                  </div>
                </div>

                {/* Summary section */}
                <div className="mt-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2.5">
                    Executive Profile
                  </h4>
                  <p className="text-xs text-slate-650 leading-relaxed italic pr-4">
                    "{resumeData.summary}"
                  </p>
                </div>

                {/* Core competencies segment */}
                <div className="mt-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">
                    Core Technical Capacities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeData.skills.split(',').map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Professional History segment */}
                <div className="mt-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-1 mb-4">
                    Professional Career History
                  </h4>

                  <div className="space-y-5">
                    {/* Role item 1 */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <h5 className="text-xs font-black text-slate-900 leading-none">
                          {resumeData.experienceRole1}
                        </h5>
                        <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                          {resumeData.experiencePeriod1}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                        {resumeData.experienceCompany1}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed pr-2">
                        {resumeData.experienceDesc1}
                      </p>
                    </div>

                    {/* Role item 2 */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <h5 className="text-xs font-black text-slate-900 leading-none">
                          {resumeData.experienceRole2}
                        </h5>
                        <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">
                          {resumeData.experiencePeriod2}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                        {resumeData.experienceCompany2}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed pr-2">
                        {resumeData.experienceDesc2}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark badge at the very bottom */}
              <div className="pt-6 border-t border-slate-200 text-[9px] font-bold text-slate-400 flex justify-between items-center mt-8">
                <span>Enterprise Modern Template (Clean Slate)</span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
