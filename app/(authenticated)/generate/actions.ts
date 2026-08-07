'use server';

import { revalidatePath } from 'next/cache';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isReviewerOrAbove } from '@/lib/auth';
import { getSavedGeneratedCv, saveGeneratedCv } from '@/services/generated-cv-service';
import { getEmployeeById } from '@/services/employee-service';
import type { Employee } from '@/types/domain';
import type { TailoredCv } from './types';

const SYSTEM_PROMPT = `You are an expert AI recruiter and resume writer.
Your job is to tailor the candidate's CV to match the customer opportunity description and requirements.
Integrate the user's specific refinement request to further adjust the details.

STRICT RULES — you MUST follow these without exception:
1. DO NOT change, paraphrase, rename, or modify the candidate's academic qualifications in any way. Return academic data exactly as provided in the input profile.
2. DO NOT change, paraphrase, or modify any experience "position" (job title). Only rewrite the tasks/responsibilities listed under each position to align with customer requirements.
3. DO NOT fabricate details not present or reasonably inferred from the candidate's original history, but frame their achievements using key terminology from the requirements.

Return ONLY structured JSON matching the provided schema.`;

const TAILORED_CV_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    currentPosition: { type: Type.STRING },
    summary: { type: Type.STRING, description: "A tailored executive summary matching the opportunity and instructions." },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          position: { type: Type.STRING, description: "MUST be identical to the original position title — do not modify." },
          company: { type: Type.STRING },
          period: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Rewrite these task descriptions to align with customer requirements."
          }
        },
        required: ['position', 'company', 'period', 'tasks']
      }
    },
    academic: {
      type: Type.ARRAY,
      description: "Return this EXACTLY as provided in the input — do not modify any academic entry.",
      items: {
        type: Type.OBJECT,
        properties: {
          qualification: { type: Type.STRING },
          institution: { type: Type.STRING },
          period: { type: Type.STRING }
        },
        required: ['qualification', 'institution', 'period']
      }
    },
    specialProjects: {
      type: Type.ARRAY,
      description: "Customize project descriptions to highlight relevance to the customer requirement.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          brief: { type: Type.STRING }
        },
        required: ['title', 'brief']
      }
    },
    certifications: {
      type: Type.ARRAY,
      description: "Certifications may be reordered or their descriptions lightly enhanced for relevance.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
          year: { type: Type.STRING }
        },
        required: ['name', 'issuer', 'year']
      }
    }
  },
  required: ['name', 'currentPosition', 'summary', 'experience', 'academic', 'specialProjects', 'certifications']
};

export async function customizeCvAction(
  employee: Employee,
  customerName: string,
  requiredSkills: string,
  preferredExp: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  newInstruction?: string
): Promise<TailoredCv> {
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

  // Capture the original (locked) academic and position data BEFORE the AI call.
  // These will be re-injected after the AI response to guarantee they haven't been modified.
  const originalAcademic = fullEmployee.cvAcademic ?? [];
  const originalExperiencePositions = (fullEmployee.cvExperience || fullEmployee.experience || []).map(
    (exp) => ('position' in exp ? (exp as { position: string }).position : (exp as { role: string }).role)
  );

  // Map employee into a cleaner input context
  const originalProfile = {
    name: fullEmployee.name,
    currentPosition: fullEmployee.currentPosition || fullEmployee.role,
    experience: fullEmployee.cvExperience || fullEmployee.experience || [],
    academic: originalAcademic,
    specialProjects: fullEmployee.specialProjects || [],
    certifications: fullEmployee.cvCertifications || [],
  };

  const promptContent = `
Candidate Original Profile:
${JSON.stringify(originalProfile, null, 2)}

Target Customer/Opportunity: ${customerName}
Mandatory Skills Required: ${requiredSkills}
Preferred Requirements / Job Specs: ${preferredExp}

Chat Customization History:
${chatHistory.map((h) => `${h.role === 'user' ? 'User Instruction' : 'AI Response Summary'}: ${h.content}`).join('\n')}

${newInstruction ? `Latest User Refinement Request: "${newInstruction}"` : 'Initial Customization: Tailor the CV summary and experience task descriptions to highlight the mandatory and preferred skills above. DO NOT change academic qualifications or experience position titles.'}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: promptContent }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: TAILORED_CV_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text ?? '{}') as TailoredCv;
    parsed.customerName = customerName;

    // ── LOCK 1: Academic qualifications — always restore from original profile data ──
    // Even if the LLM ignored the instruction and modified them, we replace with the
    // exact data from the employee's profiles table education column.
    parsed.academic = originalAcademic;

    // ── LOCK 2: Experience position titles — restore original position per entry ──
    // The LLM may only change tasks; position titles are fixed from the source profile.
    if (Array.isArray(parsed.experience)) {
      parsed.experience = parsed.experience.map((exp, idx) => ({
        ...exp,
        position: originalExperiencePositions[idx] ?? exp.position,
      }));
    } else {
      parsed.experience = [];
    }

    if (!Array.isArray(parsed.specialProjects)) {
      parsed.specialProjects = [];
    }

    if (!Array.isArray(parsed.certifications)) {
      parsed.certifications = [];
    }

    // Remove skills (no skills section in CV)
    parsed.skillsAligned = [];

    return parsed;
  } catch (error) {
    console.error('customizeCvAction failed:', error);
    throw new Error('AI tailoring failed. Please check your instructions and try again.');
  }
}

// ─── Generated CV Actions ───────────────────────────────────────────────────

export async function getSavedGeneratedCvAction(
  profileId: string
): Promise<Record<string, any> | null> {
  const supabase = await createClient();
  return getSavedGeneratedCv(supabase, profileId, null);
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
    templateId: null,
    content,
    userId: user.id,
  });
}
