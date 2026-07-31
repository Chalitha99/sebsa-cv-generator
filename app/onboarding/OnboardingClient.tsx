'use client';

import React, { useRef, useState } from 'react';
import { PageWrapper } from '../components/PageWrapper';
import { extractText } from '@/lib/parsing/extractClientText';
import { emptyCvProfile, type CvProfile } from '@/lib/cvTypes';
import { createOwnProfileAction, claimProfileAction, type ClaimableProfile } from './actions';
import {
  CloudUpload,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  UserCheck,
  UserX,
} from 'lucide-react';

type Status = 'idle' | 'extracting' | 'analyzing' | 'done' | 'error';

interface OnboardingClientProps {
  userEmail: string;
  departments: { id: string; name: string }[];
  claimableProfile: ClaimableProfile | null;
}

export default function OnboardingClient({ userEmail, departments, claimableProfile }: OnboardingClientProps) {
  // If we found an unclaimed profile matching their email, confirm before falling through to
  // the "create from scratch" CV-upload flow below.
  const [mode, setMode] = useState<'claim' | 'create'>(claimableProfile ? 'claim' : 'create');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!claimableProfile) return;
    setIsClaiming(true);
    setClaimError(null);
    try {
      await claimProfileAction(claimableProfile.id);
      // claimProfileAction redirects to /repository/<code> on success
    } catch (err) {
      console.error('Profile claim failed:', err);
      setClaimError(err instanceof Error ? err.message : 'Failed to link this profile to your account.');
      setIsClaiming(false);
    }
  };

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [droppedFile, setDroppedFile] = useState<{ name: string; size: string } | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CvProfile>(emptyCvProfile());
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState(departments[0]?.name ?? '');
  const [skillsRaw, setSkillsRaw] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setDroppedFile({ name: file.name, size: sizeStr });
    setStatus('extracting');
    setErrorMsg(null);

    let rawText: string;
    try {
      rawText = await extractText(file);
    } catch (err) {
      console.error('Text extraction failed:', err);
      setStatus('error');
      setErrorMsg('Could not read the file. Please try a different format.');
      return;
    }

    setStatus('analyzing');
    try {
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Server error ${res.status}`);
      }
      const parsed = (await res.json()) as CvProfile;
      setProfile(parsed);
      setRole(parsed.currentPosition || '');
      setStatus('done');
    } catch (err) {
      console.error('CV parsing failed:', err);
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'CV analysis failed.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const skills = skillsRaw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await createOwnProfileAction({
        name: profile.name,
        role,
        department,
        skills,
        currentPosition: profile.currentPosition,
        cvExperience: profile.experience,
        cvAcademic: profile.academic,
        specialProjects: profile.specialProjects,
        cvCertifications: profile.certifications,
      });
      // createOwnProfileAction redirects to /dashboard on success
    } catch (err) {
      console.error('Self-service profile creation failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit your profile.');
      setIsSubmitting(false);
    }
  };

  if (mode === 'claim' && claimableProfile) {
    return (
      <PageWrapper className="min-h-screen w-full flex items-center justify-center bg-[#fbf9fb] p-8">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-5 mx-auto">
              <UserCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-sans leading-tight mb-2">
              We found a profile for you
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              An existing record matches your work email — is this you?
            </p>

            <div className="text-left p-4 border border-slate-200 rounded-xl bg-slate-50/50 mb-6 space-y-1">
              <p className="text-sm font-black text-slate-800">{claimableProfile.name}</p>
              <p className="text-xs text-slate-500">{claimableProfile.role || 'Role not specified'}</p>
              <p className="text-xs text-slate-500">{claimableProfile.department}</p>
              <p className="text-[10px] font-mono text-slate-400 mt-2">{claimableProfile.employeeCode}</p>
            </div>

            {claimError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2 mb-4">
                {claimError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('create')}
                disabled={isClaiming}
                className="flex items-center justify-center gap-1.5 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                <UserX className="w-4 h-4" />
                <span>Not me</span>
              </button>
              <button
                type="button"
                onClick={handleClaim}
                disabled={isClaiming}
                className="flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-colors disabled:opacity-40"
              >
                {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>{isClaiming ? 'Linking...' : "Yes, that's me"}</span>
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-screen w-full flex items-center justify-center bg-[#fbf9fb] p-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
            Welcome — let's set up your profile
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Upload your CV to create your profile. An Admin will review it before it appears in
            the company repository — you can still view your own submission any time from your
            account.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
          {/* File drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={status === 'idle' ? () => fileInputRef.current?.click() : undefined}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[160px] ${
              isDragActive
                ? 'border-indigo-600 bg-indigo-50/20 cursor-pointer'
                : status === 'idle'
                ? 'border-slate-300 hover:border-slate-400 bg-slate-50/20 hover:bg-slate-50/50 cursor-pointer'
                : 'border-slate-200 bg-slate-50/50 cursor-default'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
            <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
              <CloudUpload className="w-6.5 h-6.5" />
            </div>
            <h5 className="text-sm font-bold text-slate-800 mb-1">Drag & drop your CV here</h5>
            <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
              or <span className="text-indigo-600 font-semibold underline">browse local files</span>.
              Supports PDF, DOCX, TXT.
            </p>
          </div>

          {droppedFile && (
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-none">{droppedFile.name}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-none">{droppedFile.size}</p>
              </div>
              {status === 'extracting' && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> Reading file...
                </span>
              )}
              {status === 'analyzing' && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600">
                  <Loader2 className="w-4 h-4 animate-spin" /> AI analyzing...
                </span>
              )}
              {status === 'done' && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Parsed
                </span>
              )}
            </div>
          )}

          {status === 'error' && errorMsg && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
            </p>
          )}

          {/* Review form — only once parsing is done */}
          {status === 'done' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Review before submitting</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Work Email</label>
                <input
                  type="email"
                  disabled
                  value={userEmail}
                  className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Current Role</label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-700"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Core Skills</label>
                  <span className="text-[10px] text-slate-400">Comma separated</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Project Management"
                  value={skillsRaw}
                  onChange={(e) => setSkillsRaw(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-700"
                />
              </div>

              {profile.experience.length > 0 && (
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Detected experience ({profile.experience.length})
                  </p>
                  <ul className="space-y-1">
                    {profile.experience.map((exp, i) => (
                      <li key={i} className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">{exp.position}</span> — {exp.company}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {submitError && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
