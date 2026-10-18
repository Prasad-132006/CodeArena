'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { HealthStatusWidget } from '@/components/HealthStatusWidget';
import {
  Code2,
  Brain,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  Database,
  ExternalLink,
  Terminal,
  FolderGit2,
} from 'lucide-react';

export default function Home() {
  const [overallStatus, setOverallStatus] = useState<
    'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  >('unknown');

  const roadmapPhases = [
    {
      phase: 'Phase 1',
      title: 'Monorepo & Core Infrastructure',
      status: 'Current Milestone',
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
      status: 'Planned',
      active: false,
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

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar systemStatus={overallStatus} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 p-8 sm:p-12 shadow-2xl">
          {/* Subtle glow effect */}
          <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Phase 1 Milestone — Core Platform Foundation
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              CodeArena
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-indigo-300">
                AI-Powered C++ Online Judge
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
              A production-minded competitive programming and learning platform featuring an isolated
              Docker C++ judge and an original AI coding coach that explains submission failures using
              actual compiler output and test execution evidence.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#diagnostics"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
              >
                <span>Live System Diagnostics</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="http://localhost:8000/api/v1/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              >
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span>FastAPI Swagger Docs</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>

              <a
                href="#roadmap"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
              >
                <span>Project Roadmap</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live System Diagnostics Widget */}
        <section id="diagnostics" className="mt-12 scroll-mt-20">
          <HealthStatusWidget onStatusChange={setOverallStatus} />
        </section>

        {/* Key Architectural Pillars */}
        <section id="architecture" className="mt-16 scroll-mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              System Architecture & Core Capabilities
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Designed with strict isolation, modular boundaries, and zero reliance on superficial AI.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Pillar 1 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Docker C++ Sandbox</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Untrusted code runs in disposable containers with g++ pinned, no host mounts, no Docker socket access, and strict time/memory/disk limits.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Evidence-Based AI Coach</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Diagnoses failures using actual compiler logs and test diffs. Delivers 4-level progressive hints with a deterministic zero-cost fallback.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Monaco C++ IDE</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Two-column dark-first workspace with instant test running, hidden test submission, syntax highlighting, and keyboard navigation.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-white">PostgreSQL & Redis</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                SQLAlchemy 2.x async engine, Alembic migrations for relational durability, and Redis job queues for asynchronous judging.
              </p>
            </div>
          </div>
        </section>

        {/* Monorepo Roadmap Tracker */}
        <section id="roadmap" className="mt-16 scroll-mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Phased Implementation Roadmap
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Strictly structured 6-phase engineering plan for CodeArena.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roadmapPhases.map((phase) => (
              <div
                key={phase.phase}
                className={`relative rounded-xl border p-6 transition ${
                  phase.active
                    ? 'border-indigo-500/50 bg-indigo-950/20 shadow-lg shadow-indigo-950/50'
                    : 'border-slate-800/80 bg-slate-900/30 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-indigo-400">
                    {phase.phase}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      phase.active
                        ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {phase.active ? (
                      <CheckCircle className="h-3 w-3 text-indigo-400" />
                    ) : (
                      <Clock className="h-3 w-3 text-slate-500" />
                    )}
                    {phase.status}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-semibold text-white">{phase.title}</h3>

                <ul className="mt-4 space-y-2 text-xs text-slate-300">
                  {phase.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Windows PowerShell Quick Start Guide */}
        <section className="mt-16 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Windows PowerShell Launch Commands
              </h3>
              <p className="text-xs text-slate-400">
                Exact instructions to run the local development stack
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 font-mono text-xs">
            <div className="rounded-lg bg-slate-950 p-3 text-slate-300 border border-slate-800">
              <span className="text-slate-500"># Option 1: Full Docker Compose Stack</span>
              <p className="mt-1 text-emerald-400">docker compose up --build</p>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 text-slate-300 border border-slate-800">
              <span className="text-slate-500"># Option 2: Run Backend & Frontend Locally</span>
              <p className="mt-1 text-indigo-300"># Terminal 1 (PostgreSQL & Redis):</p>
              <p className="text-emerald-400">docker compose up -d postgres redis</p>
              <p className="mt-2 text-indigo-300"># Terminal 2 (FastAPI Backend):</p>
              <p className="text-emerald-400">
                cd backend; python -m venv .venv; .venv\Scripts\activate; pip install -r requirements.txt; uvicorn app.main:app --reload
              </p>
              <p className="mt-2 text-indigo-300"># Terminal 3 (Next.js Frontend):</p>
              <p className="text-emerald-400">cd frontend; npm run dev</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>CodeArena © 2026 — AI-Powered Online Judge & Practice Platform</p>
        <p className="mt-1">Production-Minded Solo Final Year Capstone Project</p>
      </footer>
    </div>
  );
}
