'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageWrapper } from '../../components/PageWrapper';
import { createClient } from '@/lib/supabase/client';
import {
  listTemplatesAction,
  uploadTemplateAction,
  deleteTemplateAction,
} from '../generate/actions';
import {
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileCode,
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  storagePath: string;
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch templates and user role
  const loadData = async () => {
    try {
      setLoading(true);
      const list = await listTemplatesAction();
      setTemplates(list);

      // Check current user role
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        if (roleData) {
          setUserRole(roleData.role as 'admin' | 'employee');
        }
      }
    } catch (err) {
      console.error('Failed to load templates metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.docx')) {
        setFile(selectedFile);
        setUploadError(null);
      } else {
        setUploadError('Only DOCX CV template files are supported.');
        setFile(null);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('file', file);

      await uploadTemplateAction(formData);

      // Reset Form
      setName('');
      setDescription('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      await loadData();
    } catch (err: any) {
      console.error('Template upload failed:', err);
      setUploadError(err.message || 'Failed to upload CV template. Please check settings.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to permanently delete this template?')) return;

    try {
      await deleteTemplateAction(templateId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete template.');
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <PageWrapper className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 font-sans leading-none">
          CV Template Management
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Upload and manage master DOCX templates containing placeholders like `{"{{fullName}}"}` or `{"{{experience}}"}`.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Upload Template Panel (Admin only) */}
        <div className="col-span-12 lg:col-span-4">
          {isAdmin ? (
            <form
              onSubmit={handleUploadSubmit}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <UploadCloud className="w-5 h-5 text-indigo-650" />
                <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400">
                  Upload DOCX CV Template
                </h4>
              </div>

              {/* Template Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEBSA Executive Template"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize this template's formatting style or design details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-400 transition-all text-slate-700 resize-none leading-relaxed"
                />
              </div>

              {/* File Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  DOCX Template File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-2"
                >
                  <FileText className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">
                    {file ? file.name : 'Select template .docx file'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Word documents only'}
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".docx"
                    className="hidden"
                  />
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Template uploaded successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !file || !name.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading Template...</span>
                  </>
                ) : (
                  <span>Upload Template</span>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center flex flex-col items-center gap-3">
              <FileCode className="w-8 h-8 text-slate-400" />
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Admin Panel Restrained
              </h5>
              <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                Only Administrator accounts can upload or delete master DOCX CV layouts.
              </p>
            </div>
          )}
        </div>

        {/* Existing Templates Grid */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex-1 flex flex-col">
            <h4 className="font-sans text-xs font-black uppercase tracking-widest text-slate-400 mb-4 pb-3 border-b border-slate-100">
              Active Layout Templates ({templates.length})
            </h4>

            {loading ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-650" />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 border border-dashed border-slate-250 rounded-xl text-center">
                <FileText className="w-10 h-10 text-slate-300 mb-2" />
                <h5 className="text-xs font-black uppercase tracking-widest text-slate-500">
                  No templates available
                </h5>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                  Upload a master DOCX file to configure template placement variables.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-5 border border-slate-200 rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow relative bg-slate-50/20"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h5 className="text-sm font-black text-slate-850 truncate pr-6">
                          {template.name}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {template.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span>Uploaded {new Date(template.createdAt).toLocaleDateString()}</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
