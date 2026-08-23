import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Music, ShieldCheck, User, Lock, Mail, Phone, ArrowRight, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAsAdmin, loginAsStudent, settings } = useApp();
  const [roleTab, setRoleTab] = useState<'admin' | 'student'>('admin');

  // Admin form
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Student form
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsAdmin(adminIdentifier, adminPassword);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsStudent(studentIdentifier, useOtpMode ? otpCode : studentPassword);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden font-sans">
      {/* Subtle Editorial Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-zinc-950 shadow-xl shadow-amber-500/20 mb-4 transform hover:scale-105 transition-transform duration-200">
          <Music className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif italic text-zinc-100 tracking-tight">
          {settings.instituteName}
        </h1>
        <p className="text-xs font-mono text-zinc-400 mt-1 max-w-sm mx-auto uppercase tracking-wider">
          Smart Fee & Membership Management Portal
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
        {/* Role Toggle Switch */}
        <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800 mb-6 font-mono">
          <button
            type="button"
            onClick={() => setRoleTab('admin')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
              roleTab === 'admin'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Admin Portal</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('student')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
              roleTab === 'student'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Student Portal</span>
          </button>
        </div>

        {/* ADMIN LOGIN FORM */}
        {roleTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4 font-mono">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5 font-mono">
                Admin Email or Identifier
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={adminIdentifier}
                  onChange={(e) => setAdminIdentifier(e.target.value)}
                  placeholder="admin@symphonymusic.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-mono">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotSuccess(false);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-mono cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer uppercase tracking-wider"
            >
              <span>Sign In as Academy Director</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STUDENT LOGIN FORM */}
        {roleTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4 font-mono">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1.5">
                Registered Mobile or Student ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={studentIdentifier}
                  onChange={(e) => setStudentIdentifier(e.target.value)}
                  placeholder="e.g. 9876543210 or SMA-2026-001"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all font-mono"
                />
              </div>
            </div>

            {!useOtpMode ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-wider text-zinc-400">
                    Password / PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseOtpMode(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Login via OTP
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs uppercase tracking-wider text-zinc-400">
                    4-Digit Verification OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseOtpMode(false)}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Use Password
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="2026"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 tracking-widest font-mono focus:outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer uppercase tracking-wider"
            >
              <span>Access Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-serif italic text-zinc-100 mb-1">
              Reset Password
            </h3>
            <p className="text-xs font-mono text-zinc-400 mb-4">
              Enter your registered institute email or phone to receive a reset link.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-300 text-xs mb-4 font-mono">
                Password recovery link sent! Check your inbox or WhatsApp messages.
              </div>
            ) : (
              <div className="space-y-3 mb-4 font-mono">
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            )}

            <div className="flex gap-2 font-mono">
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs text-zinc-300 cursor-pointer"
              >
                Close
              </button>
              {!forgotSuccess && (
                <button
                  type="button"
                  onClick={() => setForgotSuccess(true)}
                  className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 rounded-xl text-xs font-bold text-zinc-950 cursor-pointer"
                >
                  Send Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Tagline */}
      <div className="mt-8 text-center text-xs font-mono text-zinc-600">
        &copy; {new Date().getFullYear()} {settings.instituteName}. All rights reserved.
      </div>
    </div>
  );
};
