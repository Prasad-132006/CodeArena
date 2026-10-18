'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile, changeUserPassword } from '@/lib/api';
import {
  User as UserIcon,
  Mail,
  Calendar,
  ShieldCheck,
  LogOut,
  CodeXml,
  Cpu,
  Clock,
  KeyRound,
  Check,
  AlertCircle,
  Save,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout, updateUser } = useAuth();

  // Profile edit state
  const [displayName, setDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?returnUrl=/profile');
    }
    if (user) {
      setDisplayName(user.display_name);
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setProfileError('Display name must be at least 2 characters.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateUserProfile({ display_name: trimmed });
      updateUser(updated);
      setProfileSuccess('Profile display name updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (!currentPassword) {
      setPwdError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPwdError('New password must contain at least one letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeUserPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwdSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(null), 4000);
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-12 sm:px-6 lg:px-8">
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              Member Since
            </span>
            <p className="text-sm font-semibold text-white mt-2">{formattedDate}</p>
            <p className="text-[11px] text-slate-500 mt-1">UTC Account Creation</p>
          </div>

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

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Authentication Method
            </span>
            <p className="text-sm font-semibold text-white mt-2">Argon2id + HttpOnly JWT</p>
            <p className="text-[11px] text-slate-500 mt-1">Zero-Trust Verified Session</p>
          </div>
        </div>

        {/* User Management Section: Edit Profile & Change Password */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card A: Profile Settings */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                <UserIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Profile Settings</h2>
                <p className="text-[11px] text-slate-400">Update your public display identity</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Primary identifier (cannot be modified)
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  placeholder="Your public coder alias"
                />
              </div>

              {profileError && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingProfile || displayName.trim() === user.display_name}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSavingProfile ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card B: Security & Password Change */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Security & Password</h2>
                <p className="text-[11px] text-slate-400">Re-hash credentials with Argon2id</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  placeholder="Min 8 chars, letters & digits"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                  placeholder="Repeat new password"
                />
              </div>

              {pwdError && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPassword || !currentPassword || !newPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isChangingPassword ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
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
                Your account is primed for isolated C++ Docker code execution and the failure-aware AI Coding Coach. In this current Phase 2 release, you can browse, filter, search, inspect test cases, and manage your user credentials.
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
