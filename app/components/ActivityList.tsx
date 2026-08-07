'use client';

import React from 'react';
import type { Activity } from '../context/DataContext';
import { AlertTriangle, FileCheck } from 'lucide-react';

/** Shared activity-card rendering — used by the Dashboard's "Recent System Activity" preview
 *  (sliced to the most recent few) and the full /activity log page (everything). */
export function ActivityList({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-xs font-medium text-slate-400 text-center py-10">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
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
  );
}
