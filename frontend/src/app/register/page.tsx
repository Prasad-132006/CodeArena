'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle, Terminal } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      router.push('/problems');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (displayName.trim().length < 2) {
      setErrorMessage('Display name must be at least 2 characters long.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setErrorMessage('Password must contain at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.push('/problems');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred during registration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F3F6] flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-8 shadow-2xl">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/problems"
              className="inline-flex items-center gap-1.5 text-xs text-[#929BA8] hover:text-[#FFA116] transition-colors"
            >
              <span>←</span>
              <span>Back to CodeArena</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFA116]/10 text-[#FFA116] mb-4">
              <Terminal className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F0F3F6]">
              Create your account
            </h1>
            <p className="mt-2 text-xs text-[#929BA8]">
              Join CodeArena to start solving problems and track your progress.
            </p>
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-xl border border-[#EF4743]/30 bg-[#EF4743]/10 p-3.5 text-xs text-[#EF4743]"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-medium text-[#929BA8] mb-1.5"
              >
                Display Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#929BA8]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full rounded-xl border border-[#273244] bg-[#1C2532] py-2.5 pl-10 pr-3 text-sm text-[#F0F3F6] placeholder-[#929BA8]/60 transition focus:border-[#FFA116] focus:outline-none focus:ring-1 focus:ring-[#FFA116]/50"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#929BA8] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#929BA8]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="w-full rounded-xl border border-[#273244] bg-[#1C2532] py-2.5 pl-10 pr-3 text-sm text-[#F0F3F6] placeholder-[#929BA8]/60 transition focus:border-[#FFA116] focus:outline-none focus:ring-1 focus:ring-[#FFA116]/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#929BA8] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#929BA8]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars, letter &amp; number"
                  className="w-full rounded-xl border border-[#273244] bg-[#1C2532] py-2.5 pl-10 pr-10 text-sm text-[#F0F3F6] placeholder-[#929BA8]/60 transition focus:border-[#FFA116] focus:outline-none focus:ring-1 focus:ring-[#FFA116]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#929BA8] hover:text-[#F0F3F6] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-[#929BA8] mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#929BA8]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-[#273244] bg-[#1C2532] py-2.5 pl-10 pr-10 text-sm text-[#F0F3F6] placeholder-[#929BA8]/60 transition focus:border-[#FFA116] focus:outline-none focus:ring-1 focus:ring-[#FFA116]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#929BA8] hover:text-[#F0F3F6] transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#FFA116] py-3 text-sm font-semibold text-black shadow-lg shadow-[#FFA116]/20 hover:bg-[#FFA116]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Creating account...</span>
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link to Login */}
          <div className="mt-6 text-center text-xs text-[#929BA8]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#FFA116] hover:underline transition"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
