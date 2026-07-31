'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '../../context/DataContext';
import { PageWrapper } from '../../components/PageWrapper';
import { createClient } from '@/lib/supabase/client';
import { isAdminOrAbove, canAssignRole, type UserRole } from '@/lib/roles';
import { listUsersAction, updateUserRoleAction, type ManagedUser } from './actions';
import {
  Settings,
  Building2,
  LayoutGrid,
  BellRing,
  Users2,
  Save,
  CheckCircle2,
  Palette,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';

const ASSIGNABLE_ROLES: UserRole[] = ['super_admin', 'admin', 'cv_reviewer', 'employee'];

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  cv_reviewer: 'CV Reviewer',
  employee: 'Employee',
};

export default function SettingsPage() {
  const router = useRouter();
  const { companySettings, updateCompanySettings, notificationSettings, updateNotificationSettings } = useData();

  // Settings State
  const [compName, setCompName] = useState(companySettings.name);
  const [compIndustry, setCompIndustry] = useState(companySettings.industry);
  const [activeTmpl, setActiveTmpl] = useState(companySettings.activeTemplate);
  const [primaryColor, setPrimaryColor] = useState('#405169');

  const [notifEmails, setNotifEmails] = useState(notificationSettings.emailDigests);
  const [notifGen, setNotifGen] = useState(notificationSettings.newGenerationAlert);
  const [notifSys, setNotifSys] = useState(notificationSettings.systemUpdates);

  const [isSaved, setIsSaved] = useState(false);

  // ── User Access & Team Controls (real data) ──────────────────────────────────
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const loadUserAccess = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      const viewerRole = (roleRow?.role as UserRole | undefined) ?? 'employee';
      setCurrentUserRole(viewerRole);

      // Settings is entirely an Admin/Super Admin surface (company config, templates picker,
      // user access) — docs/04-rbac-security.md §2. UX guard only; the User Access card's own
      // actions (listUsersAction/updateUserRoleAction) are the real boundary.
      if (!isAdminOrAbove(viewerRole)) {
        router.replace('/dashboard');
        return;
      }

      const list = await listUsersAction();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load user access data:', err);
      setUsersError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserAccess();
  }, [loadUserAccess]);

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    setSavingUserId(targetUserId);
    setUsersError(null);
    try {
      await updateUserRoleAction(targetUserId, newRole);
      await loadUserAccess();
    } catch (err) {
      console.error('Failed to update role:', err);
      setUsersError(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      name: compName,
      industry: compIndustry,
      activeTemplate: activeTmpl,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleToggleNotif = (type: 'email' | 'gen' | 'sys') => {
    let updated = {};
    if (type === 'email') {
      const val = !notifEmails;
      setNotifEmails(val);
      updated = { emailDigests: val };
    } else if (type === 'gen') {
      const val = !notifGen;
      setNotifGen(val);
      updated = { newGenerationAlert: val };
    } else {
      const val = !notifSys;
      setNotifSys(val);
      updated = { systemUpdates: val };
    }
    updateNotificationSettings(updated);
  };

  const templatesList = [
    { name: 'Executive Modern', desc: 'High-contrast typography, ideal for leadership profiles.' },
    { name: 'Muted Minimalist', desc: 'Understated margins, elegant serif details for designers.' },
    { name: 'Swiss Clean Slate', desc: 'Highly structure grid system, tech-forward monospace font.' },
  ];

  return (
    <PageWrapper className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
          Portal Settings
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Configure company metrics, template specifications, notification triggers, and client SSO profiles.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Company & Template settings (Span 7) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {/* Template Management card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <LayoutGrid className="w-5 h-5 text-indigo-600" />
              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                Active CV Template Configurations
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templatesList.map((tmpl) => {
                const isActive = activeTmpl === tmpl.name;
                return (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => setActiveTmpl(tmpl.name)}
                    className={`p-4 rounded-xl text-left border flex flex-col justify-between h-[130px] transition-all cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-sm'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                        {tmpl.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                        {tmpl.desc}
                      </p>
                    </div>

                    <span className={`text-[9px] font-black uppercase ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}>
                      {isActive ? '● Selected Active' : 'Configure Layout'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Notifications & User control (Span 5) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          {/* Notification toggles card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <BellRing className="w-5 h-5 text-indigo-600" />
              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                Trigger Alerts & Notifications
              </h4>
            </div>

            {/* Switch rows */}
            <div className="space-y-4">  
              {/* Row 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-800">Generation Alerts</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">
                    Trigger autonomous alerts on Slack when a candidate CV is tailored.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotif('gen')}
                  className="text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {notifGen ? (
                    <ToggleRight className="w-9 h-9 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-800">System Analytics Alerts</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">
                    Stay notified when there are database schema or sync latency spikes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotif('sys')}
                  className="text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {notifSys ? (
                    <ToggleRight className="w-9 h-9 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* User Access & Team Controls — real user_roles data */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Users2 className="w-5 h-5 text-indigo-600" />
              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                User Access & Team Controls
              </h4>
            </div>

            {usersLoading && (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {!usersLoading && currentUserRole && !isAdminOrAbove(currentUserRole) && (
              <p className="text-xs text-slate-400 py-4 text-center">
                Only Admin and Super Admin can view or manage user access.
              </p>
            )}

            {usersError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-lg px-3 py-2">
                {usersError}
              </p>
            )}

            {!usersLoading && currentUserRole && isAdminOrAbove(currentUserRole) && (
              <div className="space-y-3.5">
                {users.map((usr) => {
                  const actorCanActOnRow = canAssignRole(currentUserRole, usr.role);
                  const assignableOptions = ASSIGNABLE_ROLES.filter((r) =>
                    canAssignRole(currentUserRole, r)
                  );
                  return (
                    <div
                      key={usr.id}
                      className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 gap-3"
                    >
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-black text-slate-800 leading-none truncate">
                          {usr.email}
                        </h5>
                        <p className="text-[9px] text-slate-400 mt-1 leading-none">
                          Joined {new Date(usr.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {actorCanActOnRow ? (
                        <select
                          value={usr.role}
                          disabled={savingUserId === usr.id}
                          onChange={(e) => handleRoleChange(usr.id, e.target.value as UserRole)}
                          className="text-[10px] font-black uppercase tracking-wide text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 shrink-0"
                        >
                          {assignableOptions.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                          {!assignableOptions.includes(usr.role) && (
                            <option value={usr.role}>{ROLE_LABELS[usr.role]}</option>
                          )}
                        </select>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg shrink-0">
                          {ROLE_LABELS[usr.role]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
