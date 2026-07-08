'use client';

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PageWrapper } from '../../components/PageWrapper';
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
  ToggleRight
} from 'lucide-react';

export default function SettingsPage() {
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

  const adminUsersList = [
    { name: 'Sarah Mitchell', email: 'sarah.mitchell@cv-ai.com', role: 'System Administrator', status: 'Active', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120' },
    { name: 'Michael Chen', email: 'm.chen@cv-ai.com', role: 'Talent Recruiter', status: 'Active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120' },
    { name: 'Emily Watson', email: 'emily.w@cv-ai.com', role: 'Viewer / Auditor', status: 'Suspended', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120' },
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
          {/* Company details card */}
          <form
            onSubmit={handleSaveCompany}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-5"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                Company & Brand Configuration
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Enterprise Name
                </label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Industry Verticals
                </label>
                <input
                  type="text"
                  required
                  value={compIndustry}
                  onChange={(e) => setCompIndustry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                />
              </div>
            </div>

            {/* Brand primary colors selection mockup */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Palette className="w-4 h-4 text-slate-400" />
                <span>Primary Brand Color Palette</span>
              </label>
              <div className="flex items-center gap-3">
                {[
                  { hex: '#405169', name: 'Muted Slate Blue' },
                  { hex: '#003d9b', name: 'Nexus Sapphire' },
                  { hex: '#704444', name: 'Cosmic Coral' },
                  { hex: '#111827', name: 'Obsidian Slate' },
                  { hex: '#059669', name: 'Forest Emerald' },
                ].map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setPrimaryColor(col.hex)}
                    className={`w-9 h-9 rounded-full border transition-all hover:scale-110 flex items-center justify-center cursor-pointer`}
                    style={{ backgroundColor: col.hex, borderColor: primaryColor === col.hex ? '#1b1b1d' : 'transparent' }}
                    title={col.name}
                  >
                    {primaryColor === col.hex && (
                      <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions segment */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center gap-2 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-300" />
                    <span>Settings Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4.5 h-4.5" />
                    <span>Save Company Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>

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
              {/* Row 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-800">Email Digests</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">
                    Receive customized weekly digests of active candidate matching metrics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotif('email')}
                  className="text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {notifEmails ? (
                    <ToggleRight className="w-9 h-9 text-indigo-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-400" />
                  )}
                </button>
              </div>

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

          {/* User management table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Users2 className="w-5 h-5 text-indigo-600" />
              <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                User Access & Team Controls
              </h4>
            </div>

            <div className="space-y-3.5">
              {adminUsersList.map((usr, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={usr.avatar}
                      alt={usr.name}
                      className="w-9 h-9 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <h5 className="text-[11px] font-black text-slate-800 leading-none">
                        {usr.name}
                      </h5>
                      <p className="text-[9px] text-slate-400 mt-1 leading-none">
                        {usr.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-wide text-slate-600 leading-none">
                      {usr.role.split(' ')[0]}
                    </p>
                    <span className={`text-[8px] font-black uppercase tracking-wider mt-1 inline-block px-1.5 py-0.5 rounded ${
                      usr.status === 'Active'
                        ? 'bg-emerald-150 text-emerald-800'
                        : 'bg-rose-150 text-rose-800'
                    }`}>
                      {usr.status}
                    </span>
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
