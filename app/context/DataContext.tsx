'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CvProfile } from '@/lib/cvTypes';

/**
 * UI-only state (per docs/02-architecture.md §4). Employee/CV business data now comes from
 * Server Components + Supabase — see services/employee-service.ts and repositories/.
 * Activities and settings are still here temporarily; they migrate to Supabase in Phases 10 and 11.
 *
 * addEmployee() is exposed here so the upload page client component can trigger the server action
 * via a thin wrapper without importing server-only modules.
 */

export interface CompanySettings {
  name: string;
  industry: string;
  colors: string[];
  activeTemplate: string;
}

export interface NotificationSettings {
  emailDigests: boolean;
  newGenerationAlert: boolean;
  systemUpdates: boolean;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  desc: string;
  time: string;
  status?: string;
  meta?: string;
  user?: {
    name: string;
    avatar: string;
  };
}

/** The data passed to addEmployee from the upload form */
export interface NewEmployeePayload {
  /** Flat fields required for the Supabase profiles row */
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  /** Structured CV data extracted by Gemini */
  cvProfile: CvProfile;
}

interface DataContextType {
  companySettings: CompanySettings;
  notificationSettings: NotificationSettings;
  activities: Activity[];
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'time'>) => void;
  /**
   * Persists a new employee to Supabase via the upload/actions.ts server action.
   * Returns the new profile's row ID.
   */
  addEmployee: (payload: NewEmployeePayload) => Promise<string>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'Global HR Solutions',
    industry: 'Technology & HR',
    colors: ['#003d9b', '#486176'],
    activeTemplate: 'Executive Modern',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailDigests: true,
    newGenerationAlert: false,
    systemUpdates: true,
  });

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 'act-1',
      type: 'success',
      title: 'Customer CV Generated',
      desc: 'AI optimized the profile of Sarah Johnson for Project Manager role.',
      time: '2 mins ago',
      status: 'SUCCESS',
      meta: 'PDF • 2.4 MB',
      user: {
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
      },
    },
    {
      id: 'act-2',
      type: 'upload',
      title: 'Bulk Upload Complete',
      desc: 'Successfully imported 125 new candidate CVs into the repository.',
      time: '45 mins ago',
      status: 'UPDATED',
    },
    {
      id: 'act-3',
      type: 'match',
      title: 'AI Review Completed',
      desc: 'Profile match score calculated for David Chen for Senior Developer position.',
      time: '3 hours ago',
      status: '94% Match',
      user: {
        name: 'David Chen',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
      },
    },
    {
      id: 'act-4',
      type: 'warning',
      title: 'Repository Warning',
      desc: 'Duplicate entry detected for candidate Elena Rodriguez. Manual review required.',
      time: '5 hours ago',
    },
  ]);

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => ({ ...prev, ...settings }));
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...settings }));
  };

  const addActivity = (act: Omit<Activity, 'id' | 'time'>) => {
    const newAct: Activity = {
      ...act,
      id: `act-${Date.now()}`,
      time: 'Just now',
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  /**
   * Calls the server action to persist the new employee. Dynamically imported to avoid bundling
   * server-only modules in the client bundle.
   */
  const addEmployee = useCallback(async (payload: NewEmployeePayload): Promise<string> => {
    // Dynamically import the server action to avoid bundling 'use server' code in the client chunk
    const { createEmployeeAction } = await import('@/app/(authenticated)/upload/actions');

    const skillsFromExperience = payload.cvProfile.experience
      .flatMap((e) => e.tasks)
      .slice(0, 0); // tasks are not skills; keep skills list from form

    const rowId = await createEmployeeAction({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      department: payload.department,
      skills: payload.skills.length > 0 ? payload.skills : skillsFromExperience,
      currentPosition: payload.cvProfile.currentPosition,
      cvExperience: payload.cvProfile.experience,
      cvAcademic: payload.cvProfile.academic,
      specialProjects: payload.cvProfile.specialProjects,
      cvCertifications: payload.cvProfile.certifications,
    });

    // Log to activity feed
    addActivity({
      type: 'upload',
      title: 'CV Parsed & Imported',
      desc: `AI parsed and imported ${payload.name}'s CV into the repository.`,
      status: 'SUCCESS',
      user: {
        name: payload.name,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
      },
    });

    return rowId;
  }, []);

  return (
    <DataContext.Provider
      value={{
        companySettings,
        notificationSettings,
        activities,
        updateCompanySettings,
        updateNotificationSettings,
        addActivity,
        addEmployee,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
