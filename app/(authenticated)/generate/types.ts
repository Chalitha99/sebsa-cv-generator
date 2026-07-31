import type { CvProfile } from '@/lib/cvTypes';

export interface TailoredCv extends CvProfile {
  summary: string;           // AI-generated executive summary or description
  customerName: string;      // Target opportunity
  skillsAligned: string[];   // Merged required + profile skills
  avatar?: string | null;    // Employee avatar image URL
}
