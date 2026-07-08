'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Experience {
  role: string;
  company: string;
  type: string;
  period: string;
  desc: string;
}

export interface Project {
  name: string;
  desc: string;
  tags: string[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  specialty?: string;
  location?: string;
  experienceYears?: string;
  department: string;
  skills: string[];
  lastUpdated: string;
  avatar: string;
  experience?: Experience[];
  projects?: Project[];
  certs?: string[];
  education?: string;
}

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

interface DataContextType {
  employees: Employee[];
  companySettings: CompanySettings;
  notificationSettings: NotificationSettings;
  activities: Activity[];
  currentUser: { name: string; role: string; avatar: string };
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updated: Partial<Employee>) => void;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'time'>) => void;
  deleteEmployee: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '#EMP-00124',
      name: 'Alex Rivera',
      email: 'alex.rivera@cv-ai.com',
      role: 'Senior Frontend Dev',
      department: 'Engineering',
      skills: ['React', 'TypeScript', 'Next.js'],
      lastUpdated: 'Oct 12, 2023',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    },
    {
      id: '#EMP-00125',
      name: 'Maya Sterling',
      email: 'm.sterling@cv-ai.com',
      role: 'Product Designer',
      department: 'Design',
      skills: ['Figma', 'UX Research', 'Design Systems'],
      lastUpdated: 'Nov 04, 2023',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    },
    {
      id: '#EMP-00128',
      name: 'James Chen',
      email: 'j.chen@cv-ai.com',
      role: 'Data Scientist',
      department: 'Intelligence',
      skills: ['Python', 'PyTorch', 'Scikit-learn'],
      lastUpdated: 'Oct 30, 2023',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    },
    {
      id: '#EMP-00130',
      name: 'Sarah Jenkins',
      email: 's.jenkins@cv-ai.com',
      role: 'Marketing Director',
      department: 'Marketing',
      skills: ['SEO', 'Brand Strategy', 'PR'],
      lastUpdated: 'Nov 15, 2023',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    },
    {
      id: '#EMP-00132',
      name: 'Alexander Sterling',
      email: 'a.sterling@techcorp.com',
      role: 'Senior Solutions Architect',
      specialty: 'Cloud & DevOps Specialist',
      location: 'Amsterdam, NL',
      experienceYears: '8+ Years Experience',
      department: 'Engineering',
      skills: ['Kubernetes', 'Terraform', 'AWS EKS', 'Docker', 'GoLang', 'Python', 'Jenkins', 'Grafana', 'Prometheus', 'Ansible', 'GitOps'],
      lastUpdated: 'Oct 12, 2023',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
      experience: [
        {
          role: 'Senior Solutions Architect',
          company: 'Global Cloud Systems',
          type: 'Full-time',
          period: 'Jan 2021 — Present',
          desc: 'Leading the architectural transformation of legacy infrastructure to cloud-native microservices. Mentoring a team of 12 engineers and reducing operational costs by 35% through automated CI/CD pipelines.',
        },
        {
          role: 'Lead DevOps Engineer',
          company: 'NextGen Fintech',
          type: 'Full-time',
          period: 'Mar 2018 — Dec 2020',
          desc: 'Architected a secure, compliant Kubernetes-based platform for financial transactions. Implemented zero-trust security protocols and automated 90% of recurring infrastructure tasks.',
        },
      ],
      projects: [
        {
          name: 'Project Aurora',
          desc: 'Multi-cloud orchestration platform using Go and Terraform.',
          tags: ['AWS', 'TERRAFORM'],
        },
        {
          name: 'Sentinel Guard',
          desc: 'Real-time threat detection system with AI-driven analytics.',
          tags: ['PYTHON', 'AI/ML'],
        },
      ],
      certs: [
        'AWS Certified Solutions Architect (Professional Level • Exp. 2025)',
        'CKA: Kubernetes Admin (Linux Foundation • 2022)',
      ],
      education: 'M.Sc. Computer Science (TU Delft • 2017)',
    },
  ]);

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

  const [currentUser] = useState({
    name: 'Sarah Mitchell',
    role: 'Talent Acquisition',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
  });

  const addEmployee = (employee: Employee) => {
    setEmployees((prev) => [employee, ...prev]);
    addActivity({
      type: 'upload',
      title: 'Employee CV Processed',
      desc: `Successfully structured talent data for ${employee.name} (${employee.role}).`,
      status: 'SUCCESS',
      user: {
        name: employee.name,
        avatar: employee.avatar,
      },
    });
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...updated } : emp))
    );
  };

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

  const deleteEmployee = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    if (emp) {
      addActivity({
        type: 'warning',
        title: 'Employee Removed',
        desc: `Removed ${emp.name} from the talent intelligence repository.`,
      });
    }
  };

  return (
    <DataContext.Provider
      value={{
        employees,
        companySettings,
        notificationSettings,
        activities,
        currentUser,
        addEmployee,
        updateEmployee,
        updateCompanySettings,
        updateNotificationSettings,
        addActivity,
        deleteEmployee,
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
