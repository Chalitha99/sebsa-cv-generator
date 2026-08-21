'use client';

import React, { useState } from 'react';
import { FileText, Briefcase, Lightbulb, Award, ArrowRight, Sparkles, Loader2, Plus } from 'lucide-react';
import { SectionCard, EducationSection, textareaCls } from '@/app/components/CvEntrySections';
import type { CvExperienceEntry, CvProjectEntry, CvCertificationEntry } from '@/lib/cvTypes';
import type {
  CvSuggestion,
  CvSuggestionExperience,
  CvSuggestionProject,
  CvSuggestionCertification,
} from './types';

export interface CvSuggestionSelection {
  summary: string;
  academic: CvSuggestion['academic'];
  experience: CvExperienceEntry[];
  specialProjects: CvProjectEntry[];
  certifications: CvCertificationEntry[];
}

export interface CvSuggestionDraft {
  objective: string;
  experience: CvSuggestionExperience[];
  projects: CvSuggestionProject[];
  certifications: CvSuggestionCertification[];
}

interface CvSuggestionSelectorProps {
  suggestion: CvSuggestion;
  draft: CvSuggestionDraft;
  onDraftChange: (draft: CvSuggestionDraft) => void;
  onApply: (selection: CvSuggestionSelection) => Promise<void>;
  applying: boolean;
  /** True once the live one-page preview (driven by this same draft, measured by the parent)
   *  exceeds one page — blocks Apply until the selection is trimmed back down. */
  pageLimitExceeded?: boolean;
}

const checkboxCls = 'w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer shrink-0';
const editableTextCls = 'w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400';
const addButtonCls = 'inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-50 rounded-lg text-[11px] font-bold transition-colors cursor-pointer';

/**
 * Pure projection from the in-progress draft (checkbox state) to the actual selected content —
 * the same shape "Continue" hands to GenerateClient. Exported so GenerateClient can derive a live
 * preview CV from the draft as the user checks/unchecks items, without duplicating this filtering
 * logic or drifting from what "Continue" actually applies.
 */
export function buildSelectionFromDraft(
  draft: CvSuggestionDraft,
  academic: CvSuggestion['academic']
): CvSuggestionSelection {
  return {
    summary: draft.objective,
    academic,
    experience: draft.experience
      .filter((e) => e.relevant)
      .map((e) => ({
        position: e.position,
        company: e.company,
        period: e.period,
        tasks: e.tasks.filter((t) => t.relevant).map((t) => t.text),
      })),
    specialProjects: draft.projects
      .filter((p) => p.relevant)
      .map((p) => ({
        title: p.title,
        brief: p.brief,
        skills: p.skills.filter((s) => s.relevant).map((s) => s.text),
      })),
    certifications: draft.certifications
      .filter((c) => c.relevant)
      .map((c) => ({ name: c.name, issuer: c.issuer, year: c.year })),
  };
}

/**
 * Review step for the AI's content SELECTION (never generation — see suggestCvContentAction's
 * doc comment) — every project/experience/skill/task/certification shown here is the employee's
 * own real data with the AI's relevance flag as the initial checkbox state, which the user can
 * freely override. Only Objective is AI-written text. Checking "I verified the generated content"
 * and clicking Apply saves the selected subset directly as the CV and moves to Preview & Export —
 * this component never lets the user edit wording, only pick which existing items are included.
 */
export default function CvSuggestionSelector({
  suggestion,
  draft,
  onDraftChange,
  onApply,
  applying,
  pageLimitExceeded = false,
}: CvSuggestionSelectorProps) {
  const [isVerified, setIsVerified] = useState(false);
  const { objective, experience, projects, certifications } = draft;

  const toggleExperience = (index: number) =>
    onDraftChange({
      ...draft,
      experience: experience.map((e) => (e.index === index ? { ...e, relevant: !e.relevant } : e)),
    });
  const toggleTask = (expIndex: number, taskIndex: number) =>
    onDraftChange({
      ...draft,
      experience: experience.map((e) =>
        e.index !== expIndex
          ? e
          : { ...e, tasks: e.tasks.map((t) => (t.index === taskIndex ? { ...t, relevant: !t.relevant } : t)) }
      ),
    });

  const toggleProject = (index: number) =>
    onDraftChange({
      ...draft,
      projects: projects.map((p) => (p.index === index ? { ...p, relevant: !p.relevant } : p)),
    });
  const toggleProjectSkill = (projIndex: number, skillIndex: number) =>
    onDraftChange({
      ...draft,
      projects: projects.map((p) =>
        p.index !== projIndex
          ? p
          : { ...p, skills: p.skills.map((s) => (s.index === skillIndex ? { ...s, relevant: !s.relevant } : s)) }
      ),
    });

  const toggleCertification = (index: number) =>
    onDraftChange({
      ...draft,
      certifications: certifications.map((c) =>
        c.index === index ? { ...c, relevant: !c.relevant } : c
      ),
    });

  const updateExperience = (index: number, patch: Partial<CvSuggestionExperience>) =>
    onDraftChange({
      ...draft,
      experience: experience.map((entry) => entry.index === index ? { ...entry, ...patch } : entry),
    });
  const updateTaskText = (expIndex: number, taskIndex: number, text: string) =>
    onDraftChange({
      ...draft,
      experience: experience.map((entry) => entry.index !== expIndex ? entry : {
        ...entry,
        tasks: entry.tasks.map((task) => task.index === taskIndex ? { ...task, text } : task),
      }),
    });
  const updateProject = (index: number, patch: Partial<CvSuggestionProject>) =>
    onDraftChange({
      ...draft,
      projects: projects.map((project) => project.index === index ? { ...project, ...patch } : project),
    });
  const updateCertification = (index: number, patch: Partial<CvSuggestionCertification>) =>
    onDraftChange({
      ...draft,
      certifications: certifications.map((certification) =>
        certification.index === index ? { ...certification, ...patch } : certification
      ),
    });

  const nextManualIndex = (items: { index: number }[]) =>
    Math.min(-1, ...items.map((item) => item.index - 1));
  const addExperience = () => onDraftChange({
    ...draft,
    experience: [...experience, {
      index: nextManualIndex(experience), position: '', company: '', period: '', relevant: true,
      tasks: [{ index: -1, text: '', relevant: true }],
    }],
  });
  const addResponsibility = (expIndex: number) => onDraftChange({
    ...draft,
    experience: experience.map((entry) => entry.index !== expIndex ? entry : {
      ...entry,
      tasks: [...entry.tasks, { index: nextManualIndex(entry.tasks), text: '', relevant: true }],
    }),
  });
  const addProject = () => onDraftChange({
    ...draft,
    projects: [...projects, {
      index: nextManualIndex(projects), title: '', brief: '', relevant: true,
      skills: [{ index: -1, text: '', relevant: true }],
    }],
  });
  const addProjectSkill = (projectIndex: number) => onDraftChange({
    ...draft,
    projects: projects.map((project) => project.index !== projectIndex ? project : {
      ...project,
      skills: [...project.skills, { index: nextManualIndex(project.skills), text: '', relevant: true }],
    }),
  });
  const updateProjectSkill = (projectIndex: number, skillIndex: number, text: string) =>
    onDraftChange({
      ...draft,
      projects: projects.map((project) => project.index !== projectIndex ? project : {
        ...project,
        skills: project.skills.map((skill) => skill.index === skillIndex ? { ...skill, text } : skill),
      }),
    });
  const addCertification = () => onDraftChange({
    ...draft,
    certifications: [...certifications, {
      index: nextManualIndex(certifications), name: '', issuer: '', year: '', relevant: true,
    }],
  });

  const selectedExperienceCount = experience.filter((e) => e.relevant).length;
  const selectedProjectCount = projects.filter((p) => p.relevant).length;
  const selectedCertCount = certifications.filter((c) => c.relevant).length;

  const handleApply = async () => {
    if (!isVerified || applying || pageLimitExceeded) return;
    await onApply(buildSelectionFromDraft(draft, suggestion.academic));
  };

  return (
    <div className="space-y-4">
      <div className="mb-1 px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
        <div>
          <p className="text-xs font-black text-indigo-800">AI Suggested Selection — Review Before Continuing</p>
          <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
            Everything below is pulled from the employee's real profile. The AI only pre-checks what looks relevant —
            nothing is invented. Adjust the selection, then continue to fine-tune wording.
          </p>
        </div>
      </div>

      {/* Objective — the one AI-generated field */}
      <SectionCard label="Objective / Summary" icon={FileText} expanded onToggle={() => {}}>
        <textarea
          rows={5}
          value={objective}
          onChange={(e) => onDraftChange({ ...draft, objective: e.target.value })}
          placeholder="Customized objective for this opportunity..."
          className={textareaCls}
        />
      </SectionCard>

      {/* Academic — read-only, never selectable, never modified */}
      <EducationSection academic={suggestion.academic} expanded onToggle={() => {}} onChange={() => {}} readOnly />

      {/* Work Experience */}
      <SectionCard
        label="Work Experience"
        icon={Briefcase}
        count={selectedExperienceCount}
        expanded
        onToggle={() => {}}
      >
        {experience.length === 0 && <p className="text-xs text-slate-400 italic">No experience on record.</p>}
        {experience.map((exp) => (
          <div key={exp.index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <input
                aria-label={`Include work experience ${exp.position}`}
                type="checkbox"
                checked={exp.relevant}
                onChange={() => toggleExperience(exp.index)}
                className={`${checkboxCls} mt-0.5`}
              />
              <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input aria-label="Position" value={exp.position} onChange={(e) => updateExperience(exp.index, { position: e.target.value })} className={editableTextCls} />
                <input aria-label="Company" value={exp.company} onChange={(e) => updateExperience(exp.index, { company: e.target.value })} className={editableTextCls} />
                <input aria-label="Employment period" value={exp.period} onChange={(e) => updateExperience(exp.index, { period: e.target.value })} className={`${editableTextCls} sm:col-span-2`} />
              </div>
            </div>

            {exp.relevant && (
              <div className="pl-6.5 space-y-1.5">
                {exp.tasks.map((task) => (
                  <div key={task.index} className="flex items-start gap-2">
                    <input
                      aria-label="Include responsibility"
                      type="checkbox"
                      checked={task.relevant}
                      onChange={() => toggleTask(exp.index, task.index)}
                      className={`${checkboxCls} mt-0.5`}
                    />
                    <textarea aria-label="Responsibility" rows={2} value={task.text} onChange={(e) => updateTaskText(exp.index, task.index, e.target.value)} className={editableTextCls} />
                  </div>
                ))}
                <button type="button" onClick={() => addResponsibility(exp.index)} className={addButtonCls}>
                  <Plus className="w-3.5 h-3.5" /> Add responsibility
                </button>
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={addExperience} className={addButtonCls}>
          <Plus className="w-3.5 h-3.5" /> Add work experience
        </button>
      </SectionCard>

      {/* Special Projects */}
      <SectionCard label="Special Projects" icon={Lightbulb} count={selectedProjectCount} expanded onToggle={() => {}}>
        {projects.length === 0 && <p className="text-xs text-slate-400 italic">No special projects on record.</p>}
        {projects.map((proj) => (
          <div key={proj.index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <input
                aria-label={`Include project ${proj.title}`}
                type="checkbox"
                checked={proj.relevant}
                onChange={() => toggleProject(proj.index)}
                className={`${checkboxCls} mt-0.5`}
              />
              <div className="min-w-0 flex-1 space-y-2">
                <input aria-label="Project title" value={proj.title} onChange={(e) => updateProject(proj.index, { title: e.target.value })} className={editableTextCls} />
                <textarea aria-label="Project description" rows={3} value={proj.brief} onChange={(e) => updateProject(proj.index, { brief: e.target.value })} className={editableTextCls} />
              </div>
            </div>

            {proj.relevant && (
              <div className="pl-6.5 space-y-2">
                {proj.skills.map((skill) => (
                  <div key={skill.index} className="flex items-center gap-2">
                    <input
                      aria-label="Include project skill"
                      type="checkbox"
                      checked={skill.relevant}
                      onChange={() => toggleProjectSkill(proj.index, skill.index)}
                      className={checkboxCls}
                    />
                    <input aria-label="Project skill" value={skill.text} onChange={(e) => updateProjectSkill(proj.index, skill.index, e.target.value)} className={editableTextCls} />
                  </div>
                ))}
                <button type="button" onClick={() => addProjectSkill(proj.index)} className={addButtonCls}>
                  <Plus className="w-3.5 h-3.5" /> Add skill
                </button>
              </div>
            )}
          </div>
        ))}
        <button type="button" onClick={addProject} className={addButtonCls}>
          <Plus className="w-3.5 h-3.5" /> Add project
        </button>
      </SectionCard>

      {/* Certifications */}
      <SectionCard label="Certifications" icon={Award} count={selectedCertCount} expanded onToggle={() => {}}>
        {certifications.length === 0 && <p className="text-xs text-slate-400 italic">No certifications on record.</p>}
        {certifications.map((cert) => (
          <div
            key={cert.index}
            className="flex items-start gap-2.5 border border-slate-200 rounded-xl p-4 bg-slate-50/30"
          >
            <input
              aria-label={`Include certification ${cert.name}`}
              type="checkbox"
              checked={cert.relevant}
              onChange={() => toggleCertification(cert.index)}
              className={`${checkboxCls} mt-0.5`}
            />
            <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input aria-label="Certification name" value={cert.name} onChange={(e) => updateCertification(cert.index, { name: e.target.value })} className={`${editableTextCls} sm:col-span-2`} />
              <input aria-label="Certification issuer" value={cert.issuer} onChange={(e) => updateCertification(cert.index, { issuer: e.target.value })} className={editableTextCls} />
              <input aria-label="Certification year" value={cert.year} onChange={(e) => updateCertification(cert.index, { year: e.target.value })} className={editableTextCls} />
            </div>
          </div>
        ))}
        <button type="button" onClick={addCertification} className={addButtonCls}>
          <Plus className="w-3.5 h-3.5" /> Add certification
        </button>
      </SectionCard>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isVerified}
            onChange={(event) => setIsVerified(event.target.checked)}
            className={checkboxCls}
          />
          <span className="text-xs font-bold text-slate-700">I verified the generated content</span>
        </label>

        <button
          type="button"
          onClick={handleApply}
          disabled={!isVerified || applying || pageLimitExceeded}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          {applying ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Applying...</span>
            </>
          ) : (
            <>
              <span>Apply to CV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
        {pageLimitExceeded && (
          <p className="text-[10px] font-bold text-rose-600 text-center leading-relaxed">
            Your selection exceeds one page — uncheck some content before applying.
          </p>
        )}
      </div>
    </div>
  );
}
