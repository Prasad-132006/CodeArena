'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Moon, Sun, Activity, User as UserIcon, LogOut, CodeXml } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  systemStatus?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

export function Navbar({ systemStatus = 'unknown' }: NavbarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('codearena-theme') as 'dark' | 'light' | null;
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      const timer = setTimeout(() => {
        setTheme(saved);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('codearena-theme', nextTheme);
  };

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'healthy':
        return 'bg-emerald-500 shadow-emerald-500/50';
      case 'degraded':
        return 'bg-amber-500 shadow-amber-500/50';
      case 'unhealthy':
        return 'bg-rose-500 shadow-rose-500/50';
      default:
        return 'bg-slate-500 shadow-slate-500/50';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30 transition group-hover:bg-indigo-600/30 group-hover:ring-indigo-500/50">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-300 transition">
                  CodeArena
                </span>
                <span className="rounded-full bg-indigo-950 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
                  v0.2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI-Powered C++ Online Judge
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
            <Link
              href="/problems"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-slate-800 hover:text-white transition"
            >
              <CodeXml className="h-4 w-4 text-indigo-400" />
              <span>Problems</span>
            </Link>
            <Link
              href="/#architecture"
              className="rounded-md px-3 py-1.5 hover:bg-slate-800 hover:text-white transition"
            >
              Architecture
            </Link>
            <Link
              href="/#roadmap"
              className="rounded-md px-3 py-1.5 hover:bg-slate-800 hover:text-white transition"
            >
              Roadmap
            </Link>
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* System status pill */}
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300 ring-1 ring-slate-800">
            <span
              className={`h-2 w-2 rounded-full shadow-[0_0_8px] ${getStatusColor()}`}
            />
            <span className="capitalize font-mono hidden sm:inline">
              {systemStatus === 'unknown' ? 'Ready' : systemStatus}
            </span>
          </div>

          {/* API Docs Button */}
          <a
            href="http://localhost:8000/api/v1/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition"
          >
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span>API Docs</span>
          </a>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white transition"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* User Auth Section */}
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-900/50 hover:text-white transition"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span className="max-w-[120px] truncate">{user.display_name}</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    aria-label="Sign Out"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-rose-500/50 hover:text-rose-400 hover:bg-rose-950/20 transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
