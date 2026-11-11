'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal, CodeXml, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  systemStatus?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

export function Navbar({ systemStatus = 'unknown' }: NavbarProps) {
  const { user, logout, isLoading } = useAuth();

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'healthy':
        return 'bg-[#FFA116] shadow-[#FFA116]/50';
      case 'degraded':
        return 'bg-amber-500 shadow-amber-500/50';
      case 'unhealthy':
        return 'bg-[#EF4743] shadow-[#EF4743]/50';
      default:
        return 'bg-[#929BA8] shadow-[#929BA8]/50';
    }
  };

  const getStatusText = () => {
    if (systemStatus === 'unknown') return 'Ready';
    return systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#273244] bg-[#111820]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand / Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Terminal icon in orange-accented box */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFA116]/10 text-[#FFA116] ring-1 ring-[#FFA116]/30 transition group-hover:bg-[#FFA116]/20 group-hover:ring-[#FFA116]/50">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#F0F3F6] transition group-hover:text-[#FFA116]">
                CodeArena
              </span>
              {/* v2.0 badge */}
              <span className="rounded-full bg-[#FFA116]/10 px-2 py-0.5 text-[10px] font-semibold text-[#FFA116] ring-1 ring-[#FFA116]/30">
                v2.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 text-sm font-medium text-[#929BA8]">
            <Link
              href="/problems"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-[#1C2532] hover:text-[#FFA116] transition"
            >
              <CodeXml className="h-4 w-4 text-[#FFA116]" />
              <span>Problems</span>
            </Link>
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">

          {/* System status pill */}
          <div className="flex items-center gap-2 rounded-full bg-[#161D27] px-3 py-1 text-xs text-[#929BA8] ring-1 ring-[#273244]">
            <span
              className={`h-2 w-2 rounded-full shadow-[0_0_8px] ${getStatusColor()}`}
            />
            <span className="capitalize font-mono hidden sm:inline">
              {getStatusText()}
            </span>
          </div>

          {/* API Docs Button */}
          <a
            href="http://localhost:8000/api/v1/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#273244] bg-[#161D27] px-3 py-1.5 text-xs font-medium text-[#929BA8] hover:border-[#FFA116]/40 hover:text-[#FFA116] transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>API Docs</span>
          </a>

          {/* User Auth Section */}
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  {/* Avatar initial circle */}
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-lg border border-[#273244] bg-[#161D27] px-3 py-1.5 text-xs font-medium text-[#F0F3F6] hover:border-[#FFA116]/40 hover:text-[#FFA116] transition"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFA116] text-[10px] font-bold text-[#0D1117]">
                      {user.display_name?.charAt(0).toUpperCase() ?? 'U'}
                    </span>
                    <span className="max-w-[120px] truncate">{user.display_name}</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    title="Sign Out"
                    aria-label="Sign Out"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#273244] bg-[#161D27] text-[#929BA8] hover:border-[#EF4743]/50 hover:text-[#EF4743] hover:bg-[#EF4743]/10 transition"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#929BA8] hover:text-[#FFA116] hover:bg-[#1C2532] transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-[#FFA116] px-3.5 py-1.5 text-xs font-semibold text-[#0D1117] shadow-md shadow-[#FFA116]/30 hover:bg-[#FFA116]/90 transition"
                  >
                    Get Started
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
