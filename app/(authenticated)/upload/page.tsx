'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useData, Employee } from '../../context/DataContext';
import { PageWrapper } from '../../components/PageWrapper';
import {
  CloudUpload,
  FileText,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  Trash2,
  ArrowRight
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const { addEmployee } = useData();

  // Simulated upload state
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');

  // Pre-filled form state upon completed AI parsing
  const [formData, setFormData] = useState({
    name: 'Sarah Chen',
    email: 'sarah.chen@cv-ai.com',
    role: 'Senior Frontend Engineer',
    department: 'Engineering',
    skills: 'React.js, TypeScript, Next.js, Tailwind CSS, Cypress, Redux',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const startUploadSimulation = (fileName: string, fileSize: string) => {
    setFile({ name: fileName, size: fileSize });
    setStatus('uploading');
    setUploadProgress(10);

    // Increment progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('processing');
          
          // Simulation of AI structuring data
          setTimeout(() => {
            setStatus('done');
          }, 1500);
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const sizeStr = (droppedFile.size / (1024 * 1024)).toFixed(1) + ' MB';
      startUploadSimulation(droppedFile.name, sizeStr);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const sizeStr = (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB';
      startUploadSimulation(selectedFile.name, sizeStr);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();

    // Split skills string into trimmed array
    const skillList = formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newEmp: Employee = {
      id: `#EMP-00${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      skills: skillList,
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    };

    addEmployee(newEmp);
    router.push('/repository');
  };

  const handleDiscard = () => {
    setFile(null);
    setUploadProgress(0);
    setStatus('idle');
    setFormData({
      name: '',
      email: '',
      role: '',
      department: 'Engineering',
      skills: '',
    });
  };

  return (
    <PageWrapper className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
          Upload Employee CV
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Import new candidates or staff CVs. Our parser automatically structures experiences, projects, and skills.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Drag & Drop Zone and Status Panel */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full">
            <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Select Document
            </h4>

            {/* Drag & Drop Board */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={status === 'idle' ? triggerFileInput : undefined}
              className={`flex-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none min-h-[220px] ${
                isDragActive
                  ? 'border-indigo-600 bg-indigo-50/20'
                  : status !== 'idle'
                  ? 'border-slate-200 bg-slate-50/50 cursor-default'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/20 hover:bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="hidden"
              />

              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                <CloudUpload className="w-6.5 h-6.5" />
              </div>

              <h5 className="text-sm font-bold text-slate-800 mb-1">
                Drag & drop candidate CV here
              </h5>
              <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                or <span className="text-indigo-600 font-semibold underline">browse local files</span>. Supports PDF, DOCX, TXT up to 10MB.
              </p>
            </div>

            {/* Simulated Live Parser Processing Widget */}
            {file && (
              <div className="mt-6 p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate leading-none">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-none">
                      {file.size}
                    </p>
                  </div>
                </div>

                {status === 'uploading' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <span>Uploading to server...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {status === 'processing' && (
                  <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600 py-1">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI parsing candidate structure...</span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                      Verifying
                    </span>
                  </div>
                )}

                {status === 'done' && (
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600 py-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      <span>Data parsing complete. Review fields on right.</span>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                      Ready
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pre-populated AI parsed information form */}
        <div className="col-span-12 lg:col-span-7">
          <form
            onSubmit={handleImport}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                  Employee Information (AI Parsed Draft)
                </h4>
                {status === 'done' && (
                  <div className="flex items-center gap-1 text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    <Sparkles className="w-3 h-3 text-indigo-500 fill-indigo-500/20" />
                    <span>98% Confident</span>
                  </div>
                )}
              </div>

              {/* Editable Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Candidate Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Chen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={status === 'idle'}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                />
              </div>

              {/* Editable Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. s.chen@corporation.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={status === 'idle'}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                />
              </div>

              {/* Editable Job Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Recommended Position
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={status === 'idle'}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                />
              </div>

              {/* Department Selector dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  disabled={status === 'idle'}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                >
                  <option>Engineering</option>
                  <option>Design</option>
                  <option>Product Management</option>
                  <option>Marketing</option>
                  <option>Finance</option>
                  <option>Intelligence</option>
                </select>
              </div>

              {/* Skills text tags editing field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Extracted Core Skills
                  </label>
                  <span className="text-[10px] text-slate-400">Comma separated lists</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. React.js, TypeScript, Next.js"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  disabled={status === 'idle'}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700 leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Actions button strip at bottom */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={status === 'idle'}
                className="flex items-center gap-1.5 px-5 py-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-all cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" />
                <span>Discard Draft</span>
              </button>

              <button
                type="submit"
                disabled={status !== 'done'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-md active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Import to Repository</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
