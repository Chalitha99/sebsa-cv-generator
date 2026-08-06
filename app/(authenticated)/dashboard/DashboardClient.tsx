'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../../context/DataContext';
import { PageWrapper } from '../../components/PageWrapper';
import type { Employee } from '@/types/domain';
import {
  Users,
  Sparkles,
  AlertTriangle,
  History,
  FileCheck,
} from 'lucide-react';

interface DashboardClientProps {
  employees: Employee[];
  generatedCvCount: number;
}

export default function DashboardClient({ employees, generatedCvCount }: DashboardClientProps) {
  const router = useRouter();
  const { activities } = useData();

  // Dynamic statistics calculations
  const totalEmployeesCount = employees.length;

  const kpis = [
    {
      title: 'Total Employees',
      value: totalEmployeesCount.toLocaleString(),
      icon: Users,
      gradient: 'from-purple-800 via-violet-900 to-slate-950',
      iconBg: 'bg-white/15',
      iconColor: 'text-purple-200',
      labelColor: 'text-violet-200',
    },
    {
      title: 'Generated CV count',
      value: generatedCvCount.toLocaleString(),
      icon: Sparkles,
      gradient: 'from-indigo-900 to-slate-950',
      iconBg: 'bg-white/10',
      iconColor: 'text-sky-300',
      labelColor: 'text-indigo-300',
    },
  ];

  return (
    <PageWrapper className="p-8">
      {/* Hero Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
            Intelligence Dashboard
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Welcome back! Here's a snapshot of users, CVs, templates, opportunities, and key system metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-gradient-to-br ${kpi.gradient} text-white p-5 rounded-2xl shadow-xl relative overflow-hidden group border border-slate-800 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 ${kpi.iconBg} rounded-xl animate-pulse`}>
                  <Icon className={`w-5 h-5 ${kpi.iconColor} animate-pulse`} />
                </div>
              </div>
              <p className={`text-xs font-bold ${kpi.labelColor} uppercase tracking-widest mb-1.5`}>
                {kpi.title}
              </p>
              <h3 className="text-3xl font-black text-white tracking-tight font-sans">
                {kpi.value}
              </h3>
            </div>
          );
        })}
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-12 gap-8">
        {/* Recent Activity (Full width) */}
        <div className="col-span-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h4 className="font-sans text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Recent System Activity</span>
              </h4>
            </div>

            <div className="space-y-4 flex-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-300 cursor-pointer group"
                >
                  {/* User Profile or Badge icon */}
                  {act.user ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                      <img src={act.user.avatar} alt={act.user.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                      act.type === 'warning'
                        ? 'bg-rose-50 border-rose-200/60 text-rose-500'
                        : 'bg-indigo-50 border-indigo-200/60 text-indigo-500'
                    }`}>
                      {act.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <FileCheck className="w-5 h-5" />
                      )}
                    </div>
                  )}

                  {/* Main text block */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h5 className="font-sans text-xs font-black text-slate-800 truncate">
                        {act.title}
                      </h5>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {act.desc}
                    </p>

                    {/* Dynamic statuses and percentages matching pictures */}
                    <div className="flex items-center gap-3 mt-2.5">
                      {act.status && (
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          act.status.includes('SUCCESS')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/30'
                            : act.status.includes('UPDATED')
                            ? 'bg-sky-100 text-sky-800 border border-sky-200/30'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200/30'
                        }`}>
                          {act.status}
                        </span>
                      )}
                      {act.meta && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {act.meta}
                        </span>
                      )}

                      {/* Display Match progress bar for review complete */}
                      {act.title.includes('Review') && (
                        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full w-[94%]" />
                          </div>
                          <span className="text-[10px] font-black text-indigo-600 whitespace-nowrap">
                            94% Match
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}