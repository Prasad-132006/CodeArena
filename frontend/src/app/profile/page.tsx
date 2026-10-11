'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Calendar,
  ShieldCheck,
  LogOut,
  CodeXml,
  Cpu,
  Clock,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?returnUrl=/profile');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading user profile...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const formattedDate = new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Profile Header Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-2xl shadow-lg shadow-indigo-600/30">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{user.display_name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition"
              >
                <CodeXml className="h-4 w-4" />
                <span>Browse Problems</span>
              </Link>
              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-rose-500/50 hover:bg-rose-950/20 hover:text-rose-400 transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Account Details & Metadata Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Member Since
            </span>
            <p className="text-sm font-semibold text-white mt-2">{formattedDate}</p>
            <p className="text-[11px] text-slate-500 mt-1">UTC Account Creation</p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-cyan-400" />
              User ID
            </span>
            <p className="text-xs font-mono font-medium text-slate-300 mt-2 truncate" title={user.id}>
              {user.id}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">UUID Primary Key</p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Authentication Method
            </span>
            <p className="text-sm font-semibold text-white mt-2">Argon2id + HttpOnly JWT</p>
            <p className="text-[11px] text-slate-500 mt-1">Zero-Trust Verified Session</p>
          </div>
        </div>

        {/* Platform Roadmap Notice */}
        <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30 shrink-0">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Upcoming Phase 3 & 4 Judge Features
              </h3>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Your account is primed for isolated C++ Docker code execution and the failure-aware AI Coding Coach. In this current Phase 2 release, you can browse, filter, search, and inspect the complete problem library and starter templates.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                  <Clock className="h-3 w-3 text-indigo-400" />
                  Code Judge: Phase 3
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  Evidence AI Coach: Phase 4
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
