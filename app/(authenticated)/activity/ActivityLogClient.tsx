'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../../context/DataContext';
import { PageWrapper } from '../../components/PageWrapper';
import { ActivityList } from '../../components/ActivityList';
import { ArrowLeft, History } from 'lucide-react';

export default function ActivityLogClient() {
  const router = useRouter();
  const { activities } = useData();

  return (
    <PageWrapper className="p-8">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 uppercase tracking-wider mb-6 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Dashboard</span>
      </button>

      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none flex items-center gap-2.5">
          <History className="w-6 h-6 text-indigo-600" />
          Full Activity Log
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Everything recorded this session, most recent first.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <ActivityList activities={activities} />
      </div>
    </PageWrapper>
  );
}
