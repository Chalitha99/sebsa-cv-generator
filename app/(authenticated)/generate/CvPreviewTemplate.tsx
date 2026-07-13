'use client';

import React, { useRef } from 'react';
import type { TailoredCv } from './types';
import { Mail, GraduationCap, Briefcase, Award, FolderGit } from 'lucide-react';

interface CvPreviewTemplateProps {
  cv: TailoredCv;
  onChange: (updated: TailoredCv) => void;
}

export default function CvPreviewTemplate({ cv, onChange }: CvPreviewTemplateProps) {
  const handleBlur = (fieldPath: string[], text: string) => {
    const updated = { ...cv };
    // Simple deep setter
    let current: any = updated;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      current = current[fieldPath[i]];
    }
    current[fieldPath[fieldPath.length - 1]] = text;
    onChange(updated);
  };

  const handleArrayElementBlur = (fieldPath: string[], index: number, subField: string | null, text: string) => {
    const updated = { ...cv };
    let current: any = updated;
    for (let i = 0; i < fieldPath.length; i++) {
      current = current[fieldPath[i]];
    }
    if (subField) {
      current[index][subField] = text;
    } else {
      current[index] = text;
    }
    onChange(updated);
  };

  return (
    <div
      id="cv-preview-root"
      className="w-full max-w-[800px] mx-auto bg-white p-12 border border-slate-200 shadow-xl rounded-xl font-sans text-slate-800 leading-relaxed text-sm select-text"
      style={{ minHeight: '1120px' }}
    >
      {/* Header Profile Section */}
      <div className="border-b-2 border-indigo-600 pb-6 mb-6">
        <h1
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleBlur(['name'], e.target.innerText)}
          className="text-3xl font-black tracking-tight text-slate-900 focus:outline-none focus:bg-slate-50 rounded px-1 transition-all"
        >
          {cv.name}
        </h1>
        <h2
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleBlur(['currentPosition'], e.target.innerText)}
          className="text-lg font-bold text-indigo-600 focus:outline-none focus:bg-slate-50 rounded px-1 mt-1 transition-all"
        >
          {cv.currentPosition}
        </h2>
        {cv.customerName && (
          <div className="mt-2 text-xs text-slate-400 font-semibold uppercase tracking-wide">
            Tailored specifically for: <span className="text-slate-650">{cv.customerName}</span>
          </div>
        )}
      </div>

      {/* Professional Summary */}
      <div className="mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-1">
          <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
          <span>Professional Summary</span>
        </h3>
        <p
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleBlur(['summary'], e.target.innerText)}
          className="text-xs text-slate-650 leading-relaxed focus:outline-none focus:bg-slate-50 rounded p-1 transition-all whitespace-pre-wrap"
        >
          {cv.summary}
        </p>
      </div>

      {/* Core Competencies */}
      {cv.skillsAligned && cv.skillsAligned.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>Key Competencies</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {cv.skillsAligned.map((skill, idx) => (
              <span
                key={idx}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleArrayElementBlur(['skillsAligned'], idx, null, e.target.innerText)}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:bg-slate-50 transition-all"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {cv.experience && cv.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3.5 flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Professional Experience</span>
          </h3>
          <div className="space-y-4">
            {cv.experience.map((exp, idx) => (
              <div key={idx} className="group">
                <div className="flex flex-wrap items-baseline justify-between mb-1">
                  <div className="flex gap-2">
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleArrayElementBlur(['experience'], idx, 'position', e.target.innerText)}
                      className="font-bold text-slate-800 focus:outline-none focus:bg-slate-50 rounded px-1 transition-all"
                    >
                      {exp.position}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleArrayElementBlur(['experience'], idx, 'company', e.target.innerText)}
                      className="font-semibold text-indigo-600 focus:outline-none focus:bg-slate-50 rounded px-1 transition-all"
                    >
                      {exp.company}
                    </span>
                  </div>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleArrayElementBlur(['experience'], idx, 'period', e.target.innerText)}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-wide focus:outline-none focus:bg-slate-50 rounded px-1 transition-all"
                  >
                    {exp.period}
                  </span>
                </div>
                {/* Point-wise tasks */}
                <ul className="list-none space-y-1 mt-1.5 pl-1">
                  {exp.tasks.map((task, taskIdx) => (
                    <li key={taskIdx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                      <span className="text-indigo-400 font-bold mt-0.5 shrink-0">▸</span>
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const updatedTasks = [...exp.tasks];
                          updatedTasks[taskIdx] = e.target.innerText;
                          handleArrayElementBlur(['experience'], idx, 'tasks', updatedTasks as any);
                        }}
                        className="focus:outline-none focus:bg-slate-50 rounded px-0.5 transition-all w-full"
                      >
                        {task}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Projects */}
      {cv.specialProjects && cv.specialProjects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3.5 flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <FolderGit className="w-3.5 h-3.5 text-indigo-600" />
            <span>Notable Special Projects</span>
          </h3>
          <div className="space-y-3.5">
            {cv.specialProjects.map((proj, idx) => (
              <div key={idx}>
                <h4
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleArrayElementBlur(['specialProjects'], idx, 'title', e.target.innerText)}
                  className="font-bold text-slate-800 text-xs focus:outline-none focus:bg-slate-50 rounded px-1 transition-all"
                >
                  {proj.title}
                </h4>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleArrayElementBlur(['specialProjects'], idx, 'brief', e.target.innerText)}
                  className="text-xs text-slate-600 mt-1 focus:outline-none focus:bg-slate-50 rounded p-1 transition-all whitespace-pre-wrap"
                >
                  {proj.brief}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Academic Background */}
      {cv.academic && cv.academic.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3.5 flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Academic Background</span>
          </h3>
          <div className="space-y-2">
            {cv.academic.map((acad, idx) => (
              <div key={idx} className="flex justify-between items-baseline text-xs">
                <div>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleArrayElementBlur(['academic'], idx, 'qualification', e.target.innerText)}
                    className="font-bold text-slate-800 focus:outline-none focus:bg-slate-50 rounded px-1 transition-all"
                  >
                    {acad.qualification}
                  </span>
                  <span className="text-slate-400 mx-2">|</span>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleArrayElementBlur(['academic'], idx, 'institution', e.target.innerText)}
                    className="text-slate-650 focus:outline-none focus:bg-slate-50 rounded px-1 transition-all"
                  >
                    {acad.institution}
                  </span>
                </div>
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleArrayElementBlur(['academic'], idx, 'period', e.target.innerText)}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wide focus:outline-none focus:bg-slate-50 rounded px-1 transition-all"
                >
                  {acad.period}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {cv.certifications && cv.certifications.length > 0 && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3.5 flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            <span>Professional Certifications</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cv.certifications.map((cert, idx) => (
              <div key={idx} className="text-xs flex items-baseline gap-1.5 p-1 hover:bg-slate-50 rounded transition-all">
                <span className="text-indigo-500 font-bold shrink-0">✓</span>
                <div>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleArrayElementBlur(['certifications'], idx, 'name', e.target.innerText)}
                    className="font-bold text-slate-800 focus:outline-none transition-all"
                  >
                    {cert.name}
                  </span>
                  <span className="text-slate-400 mx-1.5">|</span>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleArrayElementBlur(['certifications'], idx, 'issuer', e.target.innerText)}
                    className="text-slate-600 focus:outline-none transition-all"
                  >
                    {cert.issuer}
                  </span>
                  <span className="text-slate-400 mx-1.5">|</span>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleArrayElementBlur(['certifications'], idx, 'year', e.target.innerText)}
                    className="text-slate-400 font-semibold focus:outline-none transition-all"
                  >
                    {cert.year}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
