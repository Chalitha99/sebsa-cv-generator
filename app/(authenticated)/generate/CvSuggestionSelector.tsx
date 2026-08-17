'use client';

import React, { useState } from 'react';
import { FileText, Briefcase, Lightbulb, Award, ArrowRight, Sparkles } from 'lucide-react';
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

interface CvSuggestionSelectorProps {
  suggestion: CvSuggestion;
  onContinue: (selection: CvSuggestionSelection) => void;
}

const checkboxCls = 'w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer shrink-0';

/**
 * Review step for the AI's content SELECTION (never generation — see suggestCvContentAction's
 * doc comment) — every project/experience/skill/task/certification shown here is the employee's
 * own real data with the AI's relevance flag as the initial checkbox state, which the user can
 * freely override. Only Objective is AI-written text. "Continue" hands the selected subset up to
 * GenerateClient, which loads it into the existing CvSectionEditor for a light wording pass
 * before Apply to CV — this component itself never lets the user edit wording, only pick items.
 */
export default function CvSuggestionSelector({ suggestion, onContinue }: CvSuggestionSelectorProps) {
  const [objective, setObjective] = useState(suggestion.objective);
  const [experience, setExperience] = useState<CvSuggestionExperience[]>(suggestion.experience);
  const [projects, setProjects] = useState<CvSuggestionProject[]>(suggestion.projects);
  const [certifications, setCertifications] = useState<CvSuggestionCertification[]>(suggestion.certifications);

  const toggleExperience = (index: number) =>
    setExperience((prev) => prev.map((e) => (e.index === index ? { ...e, relevant: !e.relevant } : e)));
  const toggleTask = (expIndex: number, taskIndex: number) =>
    setExperience((prev) =>
      prev.map((e) =>
        e.index !== expIndex
          ? e
          : { ...e, tasks: e.tasks.map((t) => (t.index === taskIndex ? { ...t, relevant: !t.relevant } : t)) }
      )
    );

  const toggleProject = (index: number) =>
    setProjects((prev) => prev.map((p) => (p.index === index ? { ...p, relevant: !p.relevant } : p)));
  const toggleProjectSkill = (projIndex: number, skillIndex: number) =>
    setProjects((prev) =>
      prev.map((p) =>
        p.index !== projIndex
          ? p
          : { ...p, skills: p.skills.map((s) => (s.index === skillIndex ? { ...s, relevant: !s.relevant } : s)) }
      )
    );

  const toggleCertification = (index: number) =>
    setCertifications((prev) => prev.map((c) => (c.index === index ? { ...c, relevant: !c.relevant } : c)));

  const selectedExperienceCount = experience.filter((e) => e.relevant).length;
  const selectedProjectCount = projects.filter((p) => p.relevant).length;
  const selectedCertCount = certifications.filter((c) => c.relevant).length;

  const handleContinue = () => {
    onContinue({
      summary: objective,
      academic: suggestion.academic,
      experience: experience
        .filter((e) => e.relevant)
        .map((e) => ({
          position: e.position,
          company: e.company,
          period: e.period,
          tasks: e.tasks.filter((t) => t.relevant).map((t) => t.text),
        })),
      specialProjects: projects
        .filter((p) => p.relevant)
        .map((p) => ({
          title: p.title,
          brief: p.brief,
          skills: p.skills.filter((s) => s.relevant).map((s) => s.text),
        })),
      certifications: certifications
        .filter((c) => c.relevant)
        .map((c) => ({ name: c.name, issuer: c.issuer, year: c.year })),
    });
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
          onChange={(e) => setObjective(e.target.value)}
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
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={exp.relevant}
                onChange={() => toggleExperience(exp.index)}
                className={`${checkboxCls} mt-0.5`}
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800">
                  {exp.position} <span className="font-semibold text-slate-500">— {exp.company}</span>
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{exp.period}</p>
              </div>
            </label>

            {exp.relevant && exp.tasks.length > 0 && (
              <div className="pl-6.5 space-y-1.5">
                {exp.tasks.map((task) => (
                  <label key={task.index} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.relevant}
                      onChange={() => toggleTask(exp.index, task.index)}
                      className={`${checkboxCls} mt-0.5`}
                    />
                    <span className="text-[11px] text-slate-600 leading-relaxed">{task.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      {/* Special Projects */}
      <SectionCard label="Special Projects" icon={Lightbulb} count={selectedProjectCount} expanded onToggle={() => {}}>
        {projects.length === 0 && <p className="text-xs text-slate-400 italic">No special projects on record.</p>}
        {projects.map((proj) => (
          <div key={proj.index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/30 space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={proj.relevant}
                onChange={() => toggleProject(proj.index)}
                className={`${checkboxCls} mt-0.5`}
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800">{proj.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{proj.brief}</p>
              </div>
            </label>

            {proj.relevant && proj.skills.length > 0 && (
              <div className="pl-6.5 flex flex-wrap gap-1.5">
                {proj.skills.map((skill) => (
                  <button
                    key={skill.index}
                    type="button"
                    onClick={() => toggleProjectSkill(proj.index, skill.index)}
                    className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                      skill.relevant
                        ? 'bg-indigo-50 border-indigo-100/80 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {skill.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </SectionCard>

      {/* Certifications */}
      <SectionCard label="Certifications" icon={Award} count={selectedCertCount} expanded onToggle={() => {}}>
        {certifications.length === 0 && <p className="text-xs text-slate-400 italic">No certifications on record.</p>}
        {certifications.map((cert) => (
          <label
            key={cert.index}
            className="flex items-start gap-2.5 cursor-pointer border border-slate-200 rounded-xl p-4 bg-slate-50/30"
          >
            <input
              type="checkbox"
              checked={cert.relevant}
              onChange={() => toggleCertification(cert.index)}
              className={`${checkboxCls} mt-0.5`}
            />
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-800">{cert.name}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {cert.issuer}
                {cert.year && ` (${cert.year})`}
              </p>
            </div>
          </label>
        ))}
      </SectionCard>

      <button
        type="button"
        onClick={handleContinue}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
      >
        <span>Continue with Selection</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
