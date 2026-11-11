'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { HealthStatusWidget } from '@/components/HealthStatusWidget';
import {
  Code2,
  Brain,
  ShieldCheck,
  CheckCircle,
  Clock,
  Database,
  ExternalLink,
  FolderGit2,
  ArrowRight,
  Zap,
  Globe,
} from 'lucide-react';

export default function Home() {
  const [overallStatus, setOverallStatus] = useState<
    'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  >('unknown');

  const roadmapPhases = [
    {
      phase: 'Phase 1',
      title: 'Monorepo & Core Infrastructure',
      status: 'Completed Milestone',
      active: true,
      items: [
        'Next.js 16 (App Router, Tailwind, Lucide, Monaco)',
        'FastAPI modular monolith with async SQLAlchemy & Alembic',
        'PostgreSQL 16 & Redis 7 Docker Compose orchestration',
        'Comprehensive /api/v1/health diagnostic endpoint',
      ],
    },
    {
      phase: 'Phase 2',
      title: 'Authentication & Problem Library',
      status: 'Completed Milestone',
      active: true,
      items: [
        'JWT Auth, User sessions, registration/login',
        'Problem schema, test cases, difficulty & tags',
        'Alembic migrations & seed problem datasets',
        'Problem browsing, search, and filtering UI',
      ],
    },
    {
      phase: 'Phase 3',
      title: 'Isolated C++ Judge Sandbox',
      status: 'Completed Milestone',
      active: true,
      items: [
        'Docker containerized g++ runner (no host mount)',
        'Background job queue worker with Redis & RQ',
        'Strict limits: time, memory, disk, network disabled',
        'Submission lifecycle & asynchronous verdict polling',
      ],
    },
    {
      phase: 'Phase 4',
      title: 'Deterministic Diagnostics & AI Coach',
      status: 'Planned',
      active: false,
      items: [
        'Compiler error AST parser & output mismatch comparator',
        'Level 1-4 progressive hint generator',
        'LLM adapter with zero-cost deterministic fallback',
        'Two-column Monaco workspace integration',
      ],
    },
    {
      phase: 'Phase 5',
      title: 'User Analytics & Topic Recommendations',
      status: 'Planned',
      active: false,
      items: [
        'Recharts dashboard for accuracy & solve times',
        'Weak-area detection & problem recommendation algorithm',
        'Bookmarks and submission detail inspection',
      ],
    },
    {
      phase: 'Phase 6',
      title: 'E2E Testing, Security Audits & Deployment',
      status: 'Planned',
      active: false,
      items: [
        'Playwright E2E suites & Pytest backend integration tests',
        'Sandbox security hardening & rate limit verification',
        'Production Docker builds & documentation',
      ],
    },
  ];

  const featureCards = [
    {
      icon: ShieldCheck,
      iconColor: 'text-[#2CBB5D]',
      iconBg: 'bg-[#2CBB5D]/10',
      title: 'Docker C++ Sandbox',
      description:
        'Untrusted code runs in disposable containers with g++ pinned, no host mounts, no Docker socket access, and strict time/memory/disk limits.',
    },
    {
      icon: Brain,
      iconColor: 'text-[#FFA116]',
      iconBg: 'bg-[#FFA116]/10',
      title: 'Evidence-Based AI Coach',
      description:
        'Diagnoses failures using actual compiler logs and test diffs. Delivers 4-level progressive hints with a deterministic zero-cost fallback.',
    },
    {
      icon: Code2,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      title: 'Monaco IDE',
      description:
        'Two-column dark-first workspace with instant test running, hidden test submission, syntax highlighting, and keyboard navigation.',
    },
    {
      icon: Database,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      title: 'PostgreSQL & Redis',
      description:
        'SQLAlchemy 2.x async engine, Alembic migrations for relational durability, and Redis job queues for asynchronous judging.',
    },
  ];

  return (
    <div
      className="min-h-screen text-[#F0F3F6] selection:bg-[#FFA116]/30 selection:text-white"
      style={{ backgroundColor: '#0D1117' }}
    >
      {/* Top Navigation */}
      <Navbar systemStatus={overallStatus} />

      {/* ── HERO SECTION ── */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,161,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,161,22,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      >
        {/* Orange glow blobs */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-96 w-96 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(255,161,22,0.08)' }}
        />
        <div
          className="pointer-events-none absolute right-1/4 top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(255,161,22,0.05)' }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFA116]/30 bg-[#FFA116]/10 px-4 py-1.5 text-xs font-semibold text-[#FFA116] mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2CBB5D] animate-pulse" />
            Phase 3 Complete — Isolated C++ Judge Sandbox
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold tracking-tight text-[#F0F3F6] sm:text-6xl lg:text-7xl">
            CodeArena
          </h1>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #FFA116, #FFD166, #FFA116)',
              }}
            >
              AI-Powered Competitive Programming
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#929BA8]">
            A production-minded platform featuring an isolated Docker C++ judge and an original
            AI coding coach that explains failures using actual compiler output and test evidence.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-[#0D1117] shadow-lg transition hover:opacity-90"
              style={{
                backgroundColor: '#FFA116',
                boxShadow: '0 0 24px rgba(255,161,22,0.35)',
              }}
            >
              Start Solving Problems
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="http://localhost:8000/api/v1/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#273244] bg-[#161D27] px-6 py-3 text-sm font-semibold text-[#F0F3F6] transition hover:border-[#FFA116]/40 hover:text-[#FFA116]"
            >
              View API Docs
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">

        {/* ── STATS BAR ── */}
        <section className="mt-12">
          <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-6">
            <div className="grid grid-cols-1 divide-y divide-[#273244] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {/* Stat 1 */}
              <div className="flex flex-col items-center py-6 sm:py-0">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-[#FFA116]" />
                  <span className="text-3xl font-extrabold text-[#F0F3F6]">5</span>
                </div>
                <p className="text-sm font-semibold text-[#F0F3F6]">Languages</p>
                <p className="mt-1 text-xs text-[#929BA8]">C++, C, Java, Python, Go</p>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center py-6 sm:py-0">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5 text-[#2CBB5D]" />
                  <span className="text-3xl font-extrabold text-[#F0F3F6]">Docker</span>
                </div>
                <p className="text-sm font-semibold text-[#F0F3F6]">Sandbox</p>
                <p className="mt-1 text-xs text-[#929BA8]">Isolated & secure execution</p>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center py-6 sm:py-0">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-[#FFA116]" />
                  <span className="text-3xl font-extrabold text-[#F0F3F6]">Real-Time</span>
                </div>
                <p className="text-sm font-semibold text-[#F0F3F6]">Judge</p>
                <p className="mt-1 text-xs text-[#929BA8]">Async verdict polling</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURE CARDS ── */}
        <section className="mt-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#F0F3F6]">
              Core Capabilities
            </h2>
            <p className="mt-2 text-sm text-[#929BA8]">
              Designed with strict isolation, modular boundaries, and zero reliance on superficial AI.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-xl border border-[#273244] bg-[#161D27] p-6 transition hover:border-[#FFA116]/30"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg} ${card.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-[#F0F3F6]">{card.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#929BA8]">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SYSTEM DIAGNOSTICS ── */}
        <section id="diagnostics" className="mt-16 scroll-mt-20">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#F0F3F6]">
              System Diagnostics
            </h2>
            <p className="mt-2 text-sm text-[#929BA8]">Live health status of all services</p>
          </div>
          <HealthStatusWidget onStatusChange={setOverallStatus} />
        </section>

        {/* ── PHASE ROADMAP ── */}
        <section id="roadmap" className="mt-16 scroll-mt-20">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#F0F3F6]">
              Phased Implementation Roadmap
            </h2>
            <p className="mt-2 text-sm text-[#929BA8]">
              Strictly structured 6-phase engineering plan for CodeArena.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roadmapPhases.map((phase) => (
              <div
                key={phase.phase}
                className={`relative rounded-xl border p-6 transition ${
                  phase.active
                    ? 'border-[#FFA116]/40 bg-[#161D27] shadow-lg'
                    : 'border-[#273244] bg-[#161D27] hover:border-[#273244]/80'
                }`}
                style={
                  phase.active
                    ? { boxShadow: '0 0 20px rgba(255,161,22,0.08)' }
                    : undefined
                }
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs font-semibold"
                    style={{ color: phase.active ? '#FFA116' : '#929BA8' }}
                  >
                    {phase.phase}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      phase.active
                        ? 'bg-[#FFA116]/15 text-[#FFA116] ring-1 ring-[#FFA116]/30'
                        : 'bg-[#1C2532] text-[#929BA8]'
                    }`}
                  >
                    {phase.active ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {phase.status}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-semibold text-[#F0F3F6]">{phase.title}</h3>

                <ul className="mt-4 space-y-2 text-xs text-[#929BA8]">
                  {phase.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: phase.active ? '#FFA116' : '#273244' }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── QUICK START ── */}
        <section className="mt-16 rounded-xl border border-[#273244] bg-[#161D27] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFA116]/10 text-[#FFA116]">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F0F3F6]">
                Windows PowerShell Quick Start
              </h3>
              <p className="text-xs text-[#929BA8]">
                Exact instructions to run the local development stack
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div
              className="rounded-lg p-4 text-[#929BA8] border border-[#273244]"
              style={{ backgroundColor: '#111820' }}
            >
              <span className="text-[#273244] select-none"># Option 1: Full Docker Compose Stack</span>
              <p className="mt-2 text-[#2CBB5D]">docker compose up --build</p>
            </div>

            <div
              className="rounded-lg p-4 text-[#929BA8] border border-[#273244]"
              style={{ backgroundColor: '#111820' }}
            >
              <span className="text-[#273244] select-none"># Option 2: Run Backend & Frontend Locally</span>
              <p className="mt-2 text-[#FFA116]"># Terminal 1 (PostgreSQL & Redis):</p>
              <p className="text-[#2CBB5D]">docker compose up -d postgres redis</p>
              <p className="mt-3 text-[#FFA116]"># Terminal 2 (FastAPI Backend):</p>
              <p className="text-[#2CBB5D]">
                cd backend; python -m venv .venv; .venv\Scripts\activate; pip install -r requirements.txt; uvicorn app.main:app --reload
              </p>
              <p className="mt-3 text-[#FFA116]"># Terminal 3 (Next.js Frontend):</p>
              <p className="text-[#2CBB5D]">cd frontend; npm run dev</p>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        className="mt-20 border-t border-[#273244] py-8 text-center text-xs text-[#929BA8]"
        style={{ backgroundColor: '#111820' }}
      >
        <p>CodeArena © 2026 — AI-Powered Online Judge</p>
      </footer>
    </div>
  );
}
