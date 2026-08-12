'use server';

import { revalidatePath } from 'next/cache';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isReviewerOrAbove } from '@/lib/auth';
import { getSavedGeneratedCv, saveGeneratedCv } from '@/services/generated-cv-service';
import { getEmployeeById } from '@/services/employee-service';
import type { Employee } from '@/types/domain';
import type { CvSuggestion } from './types';

const SYSTEM_PROMPT = `You are an AI recruiting assistant helping a staffing team assemble a CV for a specific
customer opportunity.

Your ONLY job is to identify which parts of the candidate's EXISTING profile are relevant to the
opportunity, and to write one customized Objective. You are a content SELECTOR, not a content
CREATOR.

STRICT RULES — you MUST follow these without exception:
1. You will be given the candidate's work experience, special projects, and certifications, each
   with a stable numeric "index" (and, for experience/projects, their tasks/skills each with their
   own index too). For each item, decide whether it is relevant to the opportunity and return only
   its index and a "relevant" boolean — never rewrite, paraphrase, or return the item's text.
2. Do not invent, add, or imagine any project, experience, responsibility, skill, or certification
   that is not already present in the profile you were given. Only select among what exists.
3. The ONLY text you may generate is "objective": a customized Objective/Summary for this specific
   opportunity. If the candidate already has an Objective, refine and re-emphasize it — keep their
   core points and voice, do not discard it for an unrelated one. Only write one from scratch if
   they have none. Base it only on the candidate's real experience — do not fabricate achievements.
4. Mark an item "relevant": true if it should be pre-selected for this CV — i.e. it demonstrates
   skills or experience that match the mandatory skills or the customer's requirements. Mark
   unrelated or clearly out-of-scope items "relevant": false. It is fine for nothing in a section
   to be relevant.

Return ONLY structured JSON matching the provided schema.`;

const SUGGESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    objective: {
      type: Type.STRING,
      description: "Customized Objective/Summary for this opportunity, based on the candidate's real experience and existing objective (if any). The only field you may write freely.",
    },
    experience: {
      type: Type.ARRAY,
      description: 'One entry per experience item you were given, referenced by its index.',
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          relevant: { type: Type.BOOLEAN },
          relevantTaskIndexes: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: 'Indexes of this experience\'s tasks that are relevant to the opportunity.',
          },
        },
        required: ['index', 'relevant', 'relevantTaskIndexes'],
      },
    },
    projects: {
      type: Type.ARRAY,
      description: 'One entry per special project you were given, referenced by its index.',
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          relevant: { type: Type.BOOLEAN },
          relevantSkillIndexes: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "Indexes of this project's skills that are relevant to the opportunity.",
          },
        },
        required: ['index', 'relevant', 'relevantSkillIndexes'],
      },
    },
    certifications: {
      type: Type.ARRAY,
      description: 'One entry per certification you were given, referenced by its index.',
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.INTEGER },
          relevant: { type: Type.BOOLEAN },
        },
        required: ['index', 'relevant'],
      },
    },
  },
  required: ['objective', 'experience', 'projects', 'certifications'],
};

// Shape sent to the AI — the profile's real content, each item tagged with a stable index. The
// AI never needs to (and structurally cannot, per the response schema above) echo this text back;
// it only ever returns indexes + relevance flags against this same numbering.
interface IndexedExperience {
  index: number;
  position: string;
  company: string;
  period: string;
  tasks: { index: number; text: string }[];
}
interface IndexedProject {
  index: number;
  title: string;
  brief: string;
  skills: { index: number; text: string }[];
}
interface IndexedCertification {
  index: number;
  name: string;
  issuer: string;
  year: string;
}

// Raw shape of the AI's structured response — indexes and flags only, never text (see rule 1/2
// in SYSTEM_PROMPT and the SUGGESTION_SCHEMA above).
interface RawSuggestionResponse {
  objective: string;
  experience: { index: number; relevant: boolean; relevantTaskIndexes: number[] }[];
  projects: { index: number; relevant: boolean; relevantSkillIndexes: number[] }[];
  certifications: { index: number; relevant: boolean }[];
}

/**
 * Analyzes the employee's full existing profile against a customer opportunity and suggests
 * which existing projects/experience/certifications (and which of their skills/responsibilities)
 * are relevant — the AI never generates or modifies any of that content, only flags relevance by
 * index against the real profile data assembled below. The one exception is `objective`, a
 * customized summary, which is the only text the AI is allowed to produce (see SYSTEM_PROMPT).
 * The caller (CvSuggestionSelector) lets the user review/adjust the selection before any of it is
 * applied to a CV.
 */
export async function suggestCvContentAction(
  employee: Employee,
  customerName: string,
  requiredSkills: string,
  preferredExp: string
): Promise<CvSuggestion> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const supabase = await createClient();
  const fullEmployee = await getEmployeeById(supabase, employee.rowId);
  if (!fullEmployee) {
    throw new Error(`Employee profile ${employee.rowId} not found.`);
  }

  const academic = fullEmployee.cvAcademic ?? [];

  const indexedExperience: IndexedExperience[] = (fullEmployee.cvExperience ?? []).map((exp, index) => ({
    index,
    position: exp.position,
    company: exp.company,
    period: exp.period,
    tasks: exp.tasks.map((text, taskIndex) => ({ index: taskIndex, text })),
  }));

  const indexedProjects: IndexedProject[] = (fullEmployee.specialProjects ?? []).map((proj, index) => ({
    index,
    title: proj.title,
    brief: proj.brief,
    skills: (proj.skills ?? []).map((text, skillIndex) => ({ index: skillIndex, text })),
  }));

  const indexedCertifications: IndexedCertification[] = (fullEmployee.cvCertifications ?? []).map((cert, index) => ({
    index,
    name: cert.name,
    issuer: cert.issuer,
    year: cert.year,
  }));

  const promptContent = `
Candidate's Existing Objective: ${fullEmployee.summary || '(none on file)'}

Candidate's Existing Work Experience (select which are relevant, and which of each one's tasks):
${JSON.stringify(indexedExperience, null, 2)}

Candidate's Existing Special Projects (select which are relevant, and which of each one's skills):
${JSON.stringify(indexedProjects, null, 2)}

Candidate's Existing Certifications (select which are relevant):
${JSON.stringify(indexedCertifications, null, 2)}

Target Customer/Opportunity: ${customerName}
Mandatory Skills Required: ${requiredSkills}
Preferred Requirements / Job Specs: ${preferredExp}
`;

  let raw: RawSuggestionResponse;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: promptContent }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: SUGGESTION_SCHEMA,
      },
    });

    raw = JSON.parse(response.text ?? '{}') as RawSuggestionResponse;
  } catch (error) {
    console.error('suggestCvContentAction failed:', error);
    throw new Error('AI suggestion failed. Please check your inputs and try again.');
  }

  // ── Resolve the AI's index/relevance flags against the REAL profile data. ──────────────────
  // Nothing below ever reads text out of `raw` — every displayed value comes from
  // indexedExperience/indexedProjects/indexedCertifications, so a hallucinated or malformed AI
  // response can only ever affect which existing items are pre-checked, never what text appears.
  const experience = indexedExperience.map((exp) => {
    const flag = raw.experience?.find((e) => e.index === exp.index);
    const relevantTaskIndexes = new Set(flag?.relevantTaskIndexes ?? []);
    return {
      index: exp.index,
      position: exp.position,
      company: exp.company,
      period: exp.period,
      relevant: flag?.relevant ?? false,
      tasks: exp.tasks.map((t) => ({ ...t, relevant: relevantTaskIndexes.has(t.index) })),
    };
  });

  const projects = indexedProjects.map((proj) => {
    const flag = raw.projects?.find((p) => p.index === proj.index);
    const relevantSkillIndexes = new Set(flag?.relevantSkillIndexes ?? []);
    return {
      index: proj.index,
      title: proj.title,
      brief: proj.brief,
      relevant: flag?.relevant ?? false,
      skills: proj.skills.map((s) => ({ ...s, relevant: relevantSkillIndexes.has(s.index) })),
    };
  });

  const certifications = indexedCertifications.map((cert) => {
    const flag = raw.certifications?.find((c) => c.index === cert.index);
    return { ...cert, relevant: flag?.relevant ?? false };
  });

  return {
    objective: typeof raw.objective === 'string' && raw.objective.trim() ? raw.objective : fullEmployee.summary || '',
    academic,
    experience,
    projects,
    certifications,
  };
}

// ─── Generated CV Actions ───────────────────────────────────────────────────

export async function getSavedGeneratedCvAction(
  profileId: string
): Promise<Record<string, any> | null> {
  const supabase = await createClient();
  return getSavedGeneratedCv(supabase, profileId);
}

export async function saveGeneratedCvAction(
  profileId: string,
  content: Record<string, any>
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');

  const adminClient = createAdminClient();
  await saveGeneratedCv(adminClient, {
    profileId,
    content,
    userId: user.id,
  });
}
