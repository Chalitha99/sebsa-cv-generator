'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../../context/DataContext';
import { PageWrapper } from '../../components/PageWrapper';
import {
  Users,
  FolderSync,
  Sparkles,
  Zap,
  MousePointerClick,
  ChevronRight,
  TrendingUp,
  FileUp,
  Database,
  PenTool,
  Grid,
  AlertTriangle,
  History,
  FileCheck,
  TrendingDown
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { employees, activities } = useData();

  // Dynamic statistics calculations
  const totalEmployeesCount = employees.length;
  const storedCVs = 3700 + totalEmployeesCount; // Dynamic offset

  const kpis = [
    {
      title: 'Total Employees',
      value: totalEmployeesCount.toLocaleString(),
      badge: '+12.4%',
      badgeType: 'positive',
      icon: Users,
      color: 'from-sky-500/10 to-sky-500/5',
      textColor: 'text-sky-600',
    },
    {
      title: 'CVs Stored',
      value: storedCVs.toLocaleString(),
      badge: 'Global',
      badgeType: 'neutral',
      icon: Database,
      color: 'from-indigo-500/10 to-indigo-500/5',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Customer CVs Generated',
      value: '842',
      badge: 'High Value',
      badgeType: 'highlight',
      icon: Sparkles,
      color: 'from-amber-500/10 to-amber-500/5',
      textColor: 'text-amber-600',
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
            Welcome back. Here is an autonomous snapshot of your enterprise HR data.
          </p>
        </div>
        <button
          onClick={() => router.push('/generate')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-full shadow-lg shadow-indigo-600/10 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Zap className="w-4 h-4 text-white fill-white/20" />
          <span>New AI Request</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-slate-400 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 bg-gradient-to-tr ${kpi.color} rounded-xl`}>
                  <Icon className={`w-5 h-5 ${kpi.textColor}`} />
                </div>
                {kpi.badgeType === 'positive' && (
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                    {kpi.badge}
                  </span>
                )}
                {kpi.badgeType === 'neutral' && (
                  <span className="text-[11px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2.5 py-1 rounded-full">
                    {kpi.badge}
                  </span>
                )}
                {kpi.badgeType === 'highlight' && (
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded-full">
                    {kpi.badge}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                {kpi.title}
              </p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight font-sans">
                {kpi.value}
              </h3>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>
          );
        })}

        {/* Processing/Active AI Request Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group border border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Zap className="w-5 h-5 text-sky-300 animate-bounce" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-sky-300 bg-sky-500/20 border border-sky-400/30 px-2.5 py-1 rounded-full animate-pulse">
              Processing
            </span>
          </div>
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1.5">
            Active AI Requests
          </p>
          <h3 className="text-3xl font-black text-white tracking-tight font-sans flex items-baseline gap-2">
            45 <span className="text-sm font-semibold opacity-70">active</span>
          </h3>
        </div>
      </div>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Bento: Quick Actions (Span 4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h4 className="font-sans text-sm font-black uppercase tracking-wider text-slate-800 mb-5 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-indigo-600" />
              <span>Quick Actions</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
                { name: 'Upload CV', icon: FileUp, path: '/upload' },
                { name: 'Employee Repository', icon: Database, path: '/repository' },
                { name: 'Generate Customer CV', icon: Sparkles, path: '/generate' },
                { name: 'Manage Templates', icon: Grid, path: '/templates' },
              ].map((action, i) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => router.push(action.path)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 transition-all duration-300 group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-600 group-hover:text-indigo-600 group-hover:scale-105 transition-all border border-slate-200/50">
                        <ActionIcon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-950 font-sans tracking-wide">
                        {action.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Talent Insight */}
          <div className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white p-6 rounded-2xl relative overflow-hidden shadow-lg shadow-sky-600/10">
            <div className="relative z-10">
              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-sky-200 mb-2">
                AI Talent Insight
              </h4>
              <p className="text-sm font-medium leading-relaxed opacity-90 mb-6">
                Based on current search trends, there is an automated 15% increase in "Cloud Architect" and "Kubernetes" searches this week.
              </p>
              <button
                onClick={() => router.push('/repository')}
                className="bg-white hover:bg-sky-50 text-indigo-950 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full transition-transform active:scale-95 shadow-md"
              >
                View Repository
              </button>
            </div>
            <div className="absolute -right-6 -bottom-6 w-36 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Right Bento: Recent Activity (Span 8) */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h4 className="font-sans text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Recent System Activity</span>
              </h4>
              <button
                onClick={() => router.push('/repository')}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                View Repository
              </button>
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
