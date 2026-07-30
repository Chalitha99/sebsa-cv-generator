'use server';

import { revalidatePath } from 'next/cache';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { listTemplates, uploadTemplate, deleteTemplate } from '@/services/template-service';
import { getSavedGeneratedCv, saveGeneratedCv } from '@/services/generated-cv-service';
import type { Employee } from '@/types/domain';
import type { TailoredCv } from './types';

const SYSTEM_PROMPT = `You are an expert AI recruiter and resume writer.
Your job is to tailor the candidate's CV to match the customer opportunity description and requirements.
Integrate the user's specific refinement request to further adjust the details.
Return ONLY structured JSON matching the provided schema. Do not fabric details not present or reasonably inferred from the candidate's original history, but frame their achievements using key terminology from the requirements.`;

const TAILORED_CV_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    currentPosition: { type: Type.STRING },
    summary: { type: Type.STRING, description: "A tailored executive summary matching the opportunity and instructions." },
    skillsAligned: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of key competencies aligned with opportunity demands."
    },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          position: { type: Type.STRING },
          company: { type: Type.STRING },
          period: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['position', 'company', 'period', 'tasks']
      }
    },
    academic: {
      type: Type.ARRAY,
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
  required: ['name', 'currentPosition', 'summary', 'skillsAligned', 'experience', 'academic', 'specialProjects', 'certifications']
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

  // Map employee into a cleaner input context
  const originalProfile = {
    name: employee.name,
    currentPosition: employee.currentPosition || employee.role,
    skills: employee.skills,
    experience: employee.cvExperience || employee.experience || [],
    academic: employee.cvAcademic || [],
    specialProjects: employee.specialProjects || [],
    certifications: employee.cvCertifications || [],
  };

  const promptContent = `
Candidate Original Profile:
${JSON.stringify(originalProfile, null, 2)}

Target Customer/Opportunity: ${customerName}
Mandatory Skills Required: ${requiredSkills}
Preferred Requirements / Job Specs: ${preferredExp}

Chat Customization History:
${chatHistory.map((h) => `${h.role === 'user' ? 'User Instruction' : 'AI Response Summary'}: ${h.content}`).join('\n')}

${newInstruction ? `Latest User Refinement Request: "${newInstruction}"` : 'Initial Customization: Tailor the CV summary, skills list, and experiences to highlight the mandatory and preferred skills above.'}
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
    return parsed;
  } catch (error) {
    console.error('customizeCvAction failed:', error);
    throw new Error('AI tailoring failed. Please check your instructions and try again.');
  }
}

// ─── Template Actions ────────────────────────────────────────────────────────

export async function listTemplatesAction() {
  const supabase = await createClient();
  return listTemplates(supabase);
}

export async function uploadTemplateAction(formData: FormData): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  if (user.role !== 'admin') throw new Error('Unauthorized: Admin role required.');

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const file = formData.get('file') as File;

  if (!name || !file) {
    throw new Error('Name and DOCX file are required.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const adminClient = createAdminClient();

  const templateId = await uploadTemplate(
    adminClient,
    name,
    description,
    arrayBuffer,
    file.name,
    user.id
  );

  revalidatePath('/templates');
  return templateId;
}

export async function deleteTemplateAction(templateId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');
  if (user.role !== 'admin') throw new Error('Unauthorized: Admin role required.');

  const adminClient = createAdminClient();
  await deleteTemplate(adminClient, templateId);

  revalidatePath('/templates');
}

// ─── Generated CV Actions ───────────────────────────────────────────────────

export async function getSavedGeneratedCvAction(
  profileId: string,
  templateId: string
): Promise<Record<string, any> | null> {
  const supabase = await createClient();
  return getSavedGeneratedCv(supabase, profileId, templateId);
}

export async function saveGeneratedCvAction(
  profileId: string,
  templateId: string,
  content: Record<string, any>
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated.');

  const adminClient = createAdminClient();
  await saveGeneratedCv(adminClient, {
    profileId,
    templateId,
    content,
    userId: user.id,
  });
}
