'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '../context/DataContext';
import {
  LayoutDashboard,
  FolderOpen,
  CloudUpload,
  BrainCircuit,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Users
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname() || '';
  const { currentUser } = useData();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Repository', path: '/repository', icon: FolderOpen },
    { name: 'Upload', path: '/upload', icon: CloudUpload },
    { name: 'Generate', path: '/generate', icon: BrainCircuit },
    { name: 'Templates', path: '/templates', icon: FileSpreadsheet },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-slate-900 text-slate-100 flex flex-col p-5 border-r border-slate-800 z-50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/10">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-sans text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            CV-AI
          </h1>
          <p className="text-[11px] font-semibold text-sky-400 uppercase tracking-widest leading-none mt-0.5">
            HR Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center px-4 py-3 rounded-xl gap-3.5 transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 border border-sky-500/30 text-sky-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="font-sans text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}

        <div className="w-full h-px bg-slate-800/80 my-4" />

        {/* Settings Item */}
        <Link
          href="/settings"
          className={`flex items-center px-4 py-3 rounded-xl gap-3.5 transition-all duration-300 group ${
            pathname === '/settings'
              ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 border border-sky-500/30 text-sky-300 font-semibold'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
          }`}
        >
          <Settings
            className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              pathname === '/settings' ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          <span className="font-sans text-sm tracking-wide">Settings</span>
        </Link>
      </nav>

      {/* AI Assistant Pro Card */}
      <div className="bg-gradient-to-br from-slate-800/90 to-indigo-950/40 p-4 rounded-2xl border border-slate-700/60 shadow-lg mt-auto">
        <div className="flex items-center gap-2 mb-1.5 text-sky-300">
          <Sparkles className="w-4 h-4 text-sky-400 fill-sky-400/20" />
          <p className="font-sans text-xs font-black tracking-wide uppercase">AI Assistant Pro</p>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-300/90 mb-3">
          Unlock skills mapping and autonomous candidate fit intelligence profiles.
        </p>
        <button className="w-full py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-sans text-xs font-bold rounded-xl shadow-md active:scale-95 transition-transform duration-300">
          Upgrade Now
        </button>
      </div>

      {/* User Footer Profile */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800/80">
        <div className="relative">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full border border-slate-700 object-cover"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-950"></span>
        </div>
        <div className="truncate">
          <p className="font-sans text-xs font-black text-slate-200 truncate leading-tight">
            {currentUser.name}
          </p>
          <p className="text-[10px] text-slate-400 truncate mt-0.5 font-semibold uppercase tracking-wider">
            {currentUser.role}
          </p>
        </div>
      </div>
    </aside>
  );
};
