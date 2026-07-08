'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '../components/PageWrapper';
import { Mail, Eye, EyeOff, LogIn, CheckCircle, ShieldCheck, TrendingUp, Sparkles, BrainCircuit } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate short network delay
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <PageWrapper className="min-h-screen w-full flex flex-col md:flex-row bg-[#fbf9fb]">
      {/* Left Column: Premium HR AI Graphics & Trust indicators */}
      <section className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 relative overflow-hidden items-center justify-center p-12">
        {/* Subtle radial glows */}
        <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-sky-500/10 blur-[150px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
        </div>

        {/* Content Box */}
        <div className="relative z-10 max-w-lg text-white text-center flex flex-col items-center">
          {/* Main Visual Representation */}
          <div className="mb-10 group relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900/40 p-1 backdrop-blur-sm transition-transform duration-700 hover:scale-[1.02]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDepJ0od0oinEZhFL88a6GH2RaeIpf5gkE0-_YU9lg5NaXOu8SVpi-yJk_p0dMOuDAzmrZfSB_zt_mGHvV_HyviFIgGQ22KIKW4K4iBv1lMJzM09erQ_CEUor10uLVOqisX179PRD0GRtAKVQvmBG1rfohXv_mX6Qp49Tj9IdTnJFF7p2aKB9C6FfXEsJC-fq5hztRjrcxrjeRhrMTsyZgLdp5RcI3qcD0qDI3r2Fhe5jXcaRXjDAJQflN9JCgXqYRC0QbNhvw9t44"
              alt="Intelligent HR dashboard mockup"
              className="w-full h-auto rounded-xl object-cover"
            />
            {/* Absolute element overlays */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/50 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-300">AI Intelligence Mode</span>
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-4 text-slate-100 font-sans leading-tight">
            Revolutionize Human Capital with Intelligence.
          </h1>
          <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-md opacity-90 mb-10">
            Empower your recruitment and management workflow with the most advanced AI-driven HR analytics system available.
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-slate-300 font-sans">
            <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 px-3.5 py-2 rounded-xl backdrop-blur-sm">
              <CheckCircle className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Enterprise Ready</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 px-3.5 py-2 rounded-xl backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/30 px-3.5 py-2 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Predictive Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Portal Login Form */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-sky-500/15 mb-4 hover:scale-105 transition-transform duration-300">
              <BrainCircuit className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">
              CV-AI
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2 leading-none">
              HR Intelligence Login
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Work Email field */}
            <div className="relative group">
              <input
                type="email"
                required
                placeholder="Work Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-4 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 transition-all font-sans"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            {/* Secure Password field */}
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Secure Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-4 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-slate-800 focus:ring-slate-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
                  Remember Me
                </span>
              </label>
              <a href="#" className="text-xs font-black text-slate-900 hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white rounded-xl font-sans text-sm font-black shadow-lg shadow-sky-600/10 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Verifying Profile...' : 'Login to Portal'}</span>
              {!isLoading && <LogIn className="w-4 h-4" />}
            </button>

            {/* SSO Divider */}
            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-slate-200/80"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2">
                Or continue with SSO
              </span>
              <div className="flex-grow border-t border-slate-200/80"></div>
            </div>

            {/* SSO buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center h-12 border border-slate-200/80 hover:border-slate-300 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all active:scale-[0.97]"
              >
                <span>Azure AD</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-center h-12 border border-slate-200/80 hover:border-slate-300 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all active:scale-[0.97]"
              >
                <span>Google Workspace</span>
              </button>
            </div>
          </form>

          {/* Footer Info */}
          <footer className="mt-12 text-center text-xs font-medium text-slate-500">
            <p>
              Don't have enterprise access?{' '}
              <a href="#" className="text-slate-900 font-black hover:underline">
                Contact Sales
              </a>
            </p>
            <div className="mt-6 flex justify-center gap-4 text-[11px] text-slate-400">
              <a href="#" className="hover:text-slate-600 transition-colors">
                Privacy Policy
              </a>
              <span>•</span>
              <a href="#" className="hover:text-slate-600 transition-colors">
                Terms of Service
              </a>
            </div>
          </footer>
        </div>
      </section>
    </PageWrapper>
  );
}
