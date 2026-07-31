'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '../../components/PageWrapper';
import type { Employee } from '@/types/domain';
import { proposeProfileChangeAction } from './actions';
import { ArrowLeft, PenLine, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface MyProfileClientProps {
  employee: Employee;
  departments: { id: string; name: string }[];
}

export default function MyProfileClient({ employee, departments }: MyProfileClientProps) {
  const router = useRouter();
  const [role, setRole] = useState(employee.role);
  const [department, setDepartment] = useState(
    departments.some((d) => d.name === employee.department) ? employee.department : departments[0]?.name ?? ''
  );
  const [skillsRaw, setSkillsRaw] = useState(employee.skills.join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const skills = skillsRaw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      await proposeProfileChangeAction({ role, department, skills });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to propose profile change:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit your changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (employee.hasPendingChange || submitted) {
    return (
      <PageWrapper className="p-8">
        <button
          onClick={() => router.push(`/repository/${employee.employeeCode}`)}
          className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-wider mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Profile</span>
        </button>
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-5 mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 font-sans leading-tight mb-2">
            Update pending review
          </h1>
          <p className="text-sm text-slate-500">
            Your proposed changes are waiting for a Super Admin or CV Reviewer to approve. Your
            current profile stays as-is until then.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-8">
      <button
        onClick={() => router.push(`/repository/${employee.employeeCode}`)}
        className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-wider mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Profile</span>
      </button>

      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 font-sans leading-none">
            Update My Profile
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Changes are reviewed by a Super Admin or CV Reviewer before they appear on your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 uppercase tracking-wide">
            <PenLine className="w-3.5 h-3.5" />
            <span>Proposed changes</span>
          </div>

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

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Core Skills</label>
              <span className="text-[10px] text-slate-400">Comma separated</span>
            </div>
            <input
              type="text"
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-slate-700"
            />
          </div>

          {submitError && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <span>{isSubmitting ? 'Submitting...' : 'Submit for Review'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}
