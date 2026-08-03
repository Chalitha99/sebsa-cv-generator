'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '../../components/PageWrapper';
import {
  approveNewProfileAction,
  rejectNewProfileAction,
  approveClaimAction,
  rejectClaimAction,
  approveChangeAction,
  rejectChangeAction,
  type PendingItem,
} from './actions';
import { ClipboardCheck, UserPlus, LinkIcon, PenLine, Check, X, Loader2 } from 'lucide-react';

interface ReviewClientProps {
  initialItems: PendingItem[];
}

const TYPE_META: Record<PendingItem['type'], { label: string; icon: React.ElementType; color: string }> = {
  new_profile: { label: 'New Profile', icon: UserPlus, color: 'text-sky-600 bg-sky-50 border-sky-100' },
  claim: { label: 'Account Claim', icon: LinkIcon, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  change: { label: 'Profile Edit', icon: PenLine, color: 'text-amber-600 bg-amber-50 border-amber-100' },
};

export default function ReviewClient({ initialItems }: ReviewClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const keyFor = (item: PendingItem) => `${item.type}:${item.profileId}`;

  const handleAction = (item: PendingItem, action: 'approve' | 'reject') => {
    const key = keyFor(item);
    setProcessingKey(key);
    setError(null);

    startTransition(async () => {
      try {
        if (item.type === 'new_profile') {
          await (action === 'approve' ? approveNewProfileAction : rejectNewProfileAction)(item.profileId);
        } else if (item.type === 'claim') {
          await (action === 'approve' ? approveClaimAction : rejectClaimAction)(item.profileId);
        } else {
          await (action === 'approve' ? approveChangeAction : rejectChangeAction)(item.profileId);
        }
        setItems((prev) => prev.filter((i) => keyFor(i) !== key));
        router.refresh();
      } catch (err) {
        console.error(`Failed to ${action} pending item:`, err);
        setError(err instanceof Error ? err.message : `Failed to ${action} this request.`);
      } finally {
        setProcessingKey(null);
      }
    });
  };

  return (
    <PageWrapper className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
          Pending Approvals
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          New self-service profiles, account claim requests, and proposed profile edits awaiting review.
        </p>
      </div>

      {error && (
        <p className="mb-6 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 flex flex-col items-center text-center">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mb-4" />
          <h5 className="text-sm font-bold text-slate-700">All caught up</h5>
          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            Nothing is waiting for review right now.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
          {items.map((item) => {
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;
            const key = keyFor(item);
            const busy = isPending && processingKey === key;

            return (
              <div key={key} className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${meta.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.email} · <span className="font-mono">{item.employeeCode}</span>
                    </p>
                    {item.type === 'change' && item.proposedChange && (
                      <>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Proposed: <span className="font-semibold text-slate-700">{item.proposedChange.role}</span> ·{' '}
                          {item.proposedChange.department} ·{' '}
                          {item.proposedChange.skills.slice(0, 4).join(', ')}
                          {item.proposedChange.skills.length > 4 ? '…' : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {item.proposedChange.cvExperience?.length ?? 0} experience ·{' '}
                          {item.proposedChange.cvAcademic?.length ?? 0} education ·{' '}
                          {item.proposedChange.specialProjects?.length ?? 0} projects ·{' '}
                          {item.proposedChange.cvCertifications?.length ?? 0} certifications
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(item, 'reject')}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleAction(item, 'approve')}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
