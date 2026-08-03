'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '../../../components/PageWrapper';
import type { Employee } from '@/types/domain';
import type { CvExperienceEntry } from '@/lib/cvTypes';
import { isAdminOrAbove, type UserRole } from '@/lib/roles';
import CvPreviewTemplate from '../../generate/CvPreviewTemplate';
import { listTemplatesAction } from '../../generate/actions';
import type { Template } from '@/services/template-service';
import { buildTailoredCvFromEmployee } from '@/lib/templates/buildTailoredCvFromEmployee';
import { exportToPdf, exportTemplatedDocx } from '@/lib/cvExport';
import {
  ArrowLeft,
  Mail,
  MapPin,
  Briefcase,
  Layers,
  Award,
  GraduationCap,
  Sparkles,
  Download,
  FileType2,
  Eye,
  Loader2,
  ChevronRight,
  ExternalLink,
  Code2,
  Cpu,
  BadgeCheck,
  Clock,
  PenLine,
  X,
} from 'lucide-react';

interface EmployeeProfileClientProps {
  employee: Employee;
  viewerRole: UserRole;
}

export default function EmployeeProfileClient({ employee, viewerRole }: EmployeeProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'experience' | 'projects'>('experience');
  const canGenerateCv = isAdminOrAbove(viewerRole);

  const handleBack = () => {
    router.push('/repository');
  };

  // ── Preview & export the actual CV template (docs/04-rbac-security.md §15) ─────────────────
  // Available to whoever can view this page — most usefully an Employee viewing/downloading
  // their own CV, but also lets Admins/Reviewers grab a quick copy without the full "Customize
  // CVs" wizard. No AI tailoring here — just the employee's current profile data as-is.
  const [showPreview, setShowPreview] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listTemplatesAction()
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch((err) => console.error('Failed to load CV templates:', err))
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tailoredCv = useMemo(() => buildTailoredCvFromEmployee(employee), [employee]);
  const activeTemplate = templates[0] ?? null;
  const exportFilename = `${employee.name.replace(/\s+/g, '_')}_CV`;

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await exportToPdf('cv-preview-root', exportFilename);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(err instanceof Error ? `Could not export to PDF: ${err.message}` : 'Could not export to PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!activeTemplate) {
      alert('No CV template has been configured yet — ask an Admin to upload one under CV Templates.');
      return;
    }
    setDownloadingDocx(true);
    try {
      await exportTemplatedDocx(activeTemplate.id, tailoredCv, employee.avatar, exportFilename);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert(err instanceof Error ? err.message : 'Could not export to DOCX.');
    } finally {
      setDownloadingDocx(false);
    }
  };

  // ── Prefer structured CV fields; fall back to legacy or demo data ─────────

  // Structured experience (from Gemini parsing pipeline)
  const cvExperience: CvExperienceEntry[] = employee.cvExperience ?? [];

  // Legacy experience fallback
  const experience = employee.experience || [
    {
      role: employee.role,
      company: 'Global Enterprises Inc.',
      type: 'Full-time',
      period: 'Jan 2020 — Present',
      desc: `Responsible for leading design and implementation of highly scaling solutions in the ${employee.department} department. Managed a cross-functional squad of 5 engineers to release product cycles on schedule.`,
    },
    {
      role: `Mid-level ${employee.role.replace('Senior ', '')}`,
      company: 'Startup Lab Ltd.',
      type: 'Full-time',
      period: 'Jun 2017 — Dec 2019',
      desc: 'Collaborated closely with cross-functional partners to craft, code, and launch clean client experiences. Reduced loading bottlenecks by 22% using advanced modular component schemas.',
    },
  ];

  // Special projects (structured)
  const specialProjects = employee.specialProjects ?? [];

  // Legacy projects fallback
  const projects = employee.projects || [
    {
      name: 'Project Delta-Prime',
      desc: 'Re-engineering product structure with serverless technologies.',
      tags: employee.skills.slice(0, 2),
    },
    {
      name: 'Hyperion core analytics',
      desc: 'AI-driven data query model built on Python databases.',
      tags: ['AI/ML', 'PYTHON'],
    },
  ];

  // Structured certifications
  const cvCertifications = employee.cvCertifications ?? [];

  const certs = employee.certs || [
    'Certified Specialist (Standard Consortium • Exp. 2026)',
    'Advanced Professional Practitioner (Tech Guild • 2021)',
  ];

  // Structured academic entries
  const cvAcademic = employee.cvAcademic ?? [];
  const education = employee.education || 'B.Sc. Software Engineering (State University • 2016)';

  return (
    <PageWrapper className="p-8">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-wider group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Repository</span>
        </button>

        {viewerRole === 'employee' && employee.status === 'published' && !employee.hasPendingChange && (
          <button
            onClick={() => router.push('/my-profile')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wide transition-colors"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Review status banners */}
      {employee.status === 'draft' && (
        <div className="mb-6 flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-700">
          <Clock className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold">
            This profile is pending review by a Super Admin or CV Reviewer — it won't appear in the
            general repository until approved.
          </p>
        </div>
      )}
      {employee.hasPendingChange && (
        <div className="mb-6 flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-700">
          <Clock className="w-4 h-4 shrink-0" />
          <p className="text-xs font-semibold">
            A proposed update to this profile is pending review.
          </p>
        </div>
      )}

      {/* Two Column Dashboard Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left 8 Columns: Dynamic Profile Details */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          {/* Main profile banner card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
            {/* Ambient visual overlay */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-slate-200">
              <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                    {employee.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full">
                    {employee.id}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  {employee.role}{' '}
                  {employee.specialty && (
                    <span className="text-slate-400 font-medium">| {employee.specialty}</span>
                  )}
                </p>

                <div className="flex flex-wrap gap-y-2 gap-x-4 mt-3 text-slate-500 font-sans text-xs">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employee.location || 'San Francisco, CA'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employee.experienceYears || '5+ Years Experience'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{employee.email}</span>
                  </div>
                </div>
              </div>

              {/* Verify Match button CTA */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1.5 ${
                  employee.isAccountLinked
                    ? 'bg-emerald-50 border border-emerald-200/50 text-emerald-700'
                    : 'bg-slate-50 border border-slate-200/50 text-slate-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${employee.isAccountLinked ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  Account {employee.isAccountLinked ? 'Active' : 'Inactive'}
                </span>
                {canGenerateCv && (
                  <button
                    onClick={() => router.push(`/generate?name=${encodeURIComponent(employee.name)}`)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-md shadow-indigo-600/10 active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                    <span>Verify Talent Match</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive tabs navigation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col flex-1">
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('experience')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-wider border-b-2 font-sans transition-all cursor-pointer ${
                  activeTab === 'experience'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                Work Experience
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-wider border-b-2 font-sans transition-all cursor-pointer ${
                  activeTab === 'projects'
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                Projects & Certifications
              </button>
            </div>

            {/* Tab content panel */}
            <div className="p-6 flex-1">
              {activeTab === 'experience' && (
                <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-8">
                  {/* Prefer structured Gemini-parsed experience with point-wise tasks */}
                  {cvExperience.length > 0
                    ? cvExperience.map((exp, i) => (
                        <div key={i} className="relative group">
                          <span className="absolute -left-[31px] top-1 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full group-hover:scale-125 transition-transform"></span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-black text-slate-800 leading-snug">{exp.position}</h4>
                              <p className="text-xs font-bold text-slate-500 mt-0.5">{exp.company}</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-full self-start sm:self-auto mt-2 sm:mt-0">
                              {exp.period}
                            </span>
                          </div>
                          {exp.tasks.length > 0 && (
                            <ul className="mt-2 space-y-1.5">
                              {exp.tasks.map((task, ti) => (
                                <li key={ti} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                                  <span className="text-indigo-400 mt-0.5 shrink-0">▸</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    : experience.map((exp, i) => (
                        <div key={i} className="relative group">
                          <span className="absolute -left-[31px] top-1 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full group-hover:scale-125 transition-transform"></span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                            <div>
                              <h4 className="text-sm font-black text-slate-800 leading-snug">{exp.role}</h4>
                              <p className="text-xs font-bold text-slate-500 mt-0.5">
                                {exp.company} • <span className="text-slate-400 font-medium">{exp.type}</span>
                              </p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-full self-start sm:self-auto mt-2 sm:mt-0">
                              {exp.period}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{exp.desc}</p>
                        </div>
                      ))}
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-6">
                  {/* Special Projects — prefer structured, fall back to legacy */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-slate-500" />
                      <span>Key Portfolios & Projects</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(specialProjects.length > 0 ? specialProjects : projects.map((p) => ({ title: p.name, brief: p.desc }))).map((proj, i) => (
                        <div
                          key={i}
                          className="p-4 border border-slate-200/60 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        >
                          <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            {proj.title}
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {proj.brief}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications — prefer structured */}
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-slate-500" />
                      <span>Professional Certifications</span>
                    </h4>
                    <div className="space-y-2.5">
                      {cvCertifications.length > 0
                        ? cvCertifications.map((cert, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 border border-slate-150 rounded-xl bg-indigo-50/20"
                            >
                              <BadgeCheck className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700">{cert.name}</p>
                                {(cert.issuer || cert.year) && (
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                    {[cert.issuer, cert.year].filter(Boolean).join(' • ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        : certs.map((cert, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 border border-slate-150 rounded-xl bg-indigo-50/20"
                            >
                              <BadgeCheck className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
                              <span className="text-xs font-semibold text-slate-700">{cert}</span>
                            </div>
                          ))}
                    </div>
                  </div>

                  {/* Academic — prefer structured entries */}
                  <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <GraduationCap className="w-4.5 h-4.5 text-slate-500" />
                      <span>Academic Background</span>
                    </h4>
                    {cvAcademic.length > 0 ? (
                      <div className="space-y-2.5">
                        {cvAcademic.map((entry, i) => (
                          <div key={i} className="p-3 border border-slate-150 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div>
                              <p className="text-xs font-bold text-slate-700">{entry.qualification}</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{entry.institution}</p>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-full shrink-0">
                              {entry.period}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 border border-slate-150 rounded-xl bg-slate-50 text-xs font-semibold text-slate-700">
                        {education}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Interactive PDF mock widget */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Skills Checklist card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Validated Skills Cloud
            </h4>
            <div className="flex flex-wrap gap-2">
              {employee.skills.map((skill, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-900 transition-colors"
                >
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Structured Original CV Previewer Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
            <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Structured CV Preview</span>
            </h4>

            {/* Structured Page widget mockup container — click to open the real template preview */}
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="cv-preview-container text-left bg-[#f5f3f5] rounded-xl border border-slate-200/80 overflow-hidden flex flex-col text-slate-700 font-sans p-4 mb-4 relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/10 transition-colors duration-300 pointer-events-none flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Eye className="w-3 h-3" /> View Full Preview
                </span>
              </div>

              {/* Document Header mockup */}
              <div className="pb-3 border-b border-slate-300">
                <p className="text-[14px] font-black tracking-tight text-slate-900 leading-none uppercase">
                  {employee.name}
                </p>
                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wide">
                  {employee.role} • {employee.department}
                </p>
              </div>

              {/* Document Sections */}
              <div className="mt-3 space-y-3 flex-1 overflow-hidden">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Executive Summary
                  </p>
                  <p className="text-[7px] text-slate-600 leading-snug mt-1 italic">
                    "Driven professional offering structured development and analytical operations. Proven track record managing cloud architectures and visual interfaces to align product workflows."
                  </p>
                </div>

                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Primary Experience
                  </p>
                  <div className="mt-1 space-y-1">
                    <p className="text-[7px] font-black text-slate-800">
                      {experience[0]?.role} — {experience[0]?.company}
                    </p>
                    <p className="text-[6.5px] text-slate-500 leading-relaxed">
                      "Executed high scalability designs reducing operational overhead significantly. Realigned standard system components to secure automated cloud orchestration pipelines."
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Technology & Skills
                  </p>
                  <p className="text-[7.5px] font-semibold text-indigo-700 font-mono mt-0.5 leading-normal">
                    {employee.skills.join(' • ')}
                  </p>
                </div>
              </div>

              {/* Watermark badge */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between items-center text-[7px] font-bold text-slate-400">
                <span>CV-AI Verified Profile</span>
                <span>Page 1 of 1</span>
              </div>
            </button>

            {/* Actions panel */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center justify-center gap-1.5 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer"
              >
                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadDocx}
                disabled={downloadingDocx || templatesLoading}
                className="flex items-center justify-center gap-1.5 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer"
              >
                {downloadingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileType2 className="w-4 h-4" />}
                <span>Download DOCX</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full CV Template Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h4 className="text-sm font-black text-slate-800">CV Preview — {employee.name}</h4>
                <p className="text-[11px] text-slate-450 font-medium mt-0.5">
                  {activeTemplate
                    ? `Rendered against the current profile data — download uses the "${activeTemplate.name}" template.`
                    : 'Rendered against the current profile data. No DOCX template is configured yet, so only PDF export is available.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] hover:bg-slate-50 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-rose-500" />}
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  disabled={downloadingDocx || templatesLoading}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] hover:bg-slate-50 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {downloadingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileType2 className="w-3.5 h-3.5 text-blue-500" />}
                  <span>DOCX</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 hover:bg-slate-200/65 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
              <CvPreviewTemplate cv={tailoredCv} />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
