'use client';

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import type { TailoredCv } from './types';
import {
  SectionCard,
  SkillsSection,
  ExperienceSection,
  ProjectsSection,
  EducationSection,
  CertificationsSection,
  textareaCls,
} from '@/app/components/CvEntrySections';

// ── Summary (Generate-flow specific — TailoredCv.summary has no equivalent in the base
//    CvProfile shape other flows edit, so this one section stays local rather than shared) ────

function SummarySection({
  summary,
  expanded,
  onToggle,
  onChange,
}: {
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <SectionCard label="Objective / Summary" icon={FileText} expanded={expanded} onToggle={onToggle}>
      <textarea
        rows={6}
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Professional summary tailored to the opportunity..."
        className={textareaCls}
      />
    </SectionCard>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

interface CvSectionEditorProps {
  cv: TailoredCv;
  onChange: (updated: TailoredCv) => void;
}

/**
 * CvSectionEditor renders all AI-generated CV sections as individually
 * collapsible, fully-editable cards. Each section operates independently
 * so edits to one section do not affect others' scroll/collapse state.
 */
export default function CvSectionEditor({ cv, onChange }: CvSectionEditorProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    summary: true,
    skills: true,
    experience: true,
    projects: false,
    education: false,
    certifications: false,
  });

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  /** Merge a partial update into the full cv object. */
  const patch = (partial: Partial<TailoredCv>) => onChange({ ...cv, ...partial });

  return (
    <div className="space-y-4">
      <SummarySection
        summary={cv.summary}
        expanded={expanded.summary}
        onToggle={() => toggle('summary')}
        onChange={(summary) => patch({ summary })}
      />

      <SkillsSection
        label="Aligned Skills"
        skills={cv.skillsAligned}
        expanded={expanded.skills}
        onToggle={() => toggle('skills')}
        onChange={(skillsAligned) => patch({ skillsAligned })}
      />

      <ExperienceSection
        experience={cv.experience}
        expanded={expanded.experience}
        onToggle={() => toggle('experience')}
        onChange={(experience) => patch({ experience })}
      />

      <ProjectsSection
        projects={cv.specialProjects}
        expanded={expanded.projects}
        onToggle={() => toggle('projects')}
        onChange={(specialProjects) => patch({ specialProjects })}
      />

      <EducationSection
        academic={cv.academic}
        expanded={expanded.education}
        onToggle={() => toggle('education')}
        onChange={(academic) => patch({ academic })}
      />

      <CertificationsSection
        certifications={cv.certifications}
        expanded={expanded.certifications}
        onToggle={() => toggle('certifications')}
        onChange={(certifications) => patch({ certifications })}
      />
    </div>
  );
}
