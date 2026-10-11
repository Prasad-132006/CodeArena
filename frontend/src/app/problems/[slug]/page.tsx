'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { fetchProblemBySlug } from '@/lib/api';
import { ProblemDetail, Difficulty } from '@/types';
import {
  ArrowLeft,
  Tag as TagIcon,
  Copy,
  Check,
  CodeXml,
  AlertCircle,
  FileCode2,
  Terminal,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export default function ProblemDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;

    async function loadProblem() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await fetchProblemBySlug(slug);
        setProblem(data);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to retrieve problem details.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProblem();
  }, [slug]);

  const handleCopyStarterCode = () => {
    if (problem?.starter_code) {
      navigator.clipboard.writeText(problem.starter_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Problem Library</span>
          </Link>
        </div>

        {isLoading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
            <div className="space-y-4">
              <div className="h-8 w-64 rounded bg-slate-800" />
              <div className="h-5 w-32 rounded-full bg-slate-800/60" />
              <div className="h-40 rounded-xl bg-slate-800/40" />
            </div>
            <div className="h-96 rounded-2xl bg-slate-800/40" />
          </div>
        ) : errorMessage || !problem ? (
          /* Error / 404 State */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center max-w-lg mx-auto">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Problem Not Found</h2>
            <p className="mt-2 text-xs text-slate-400">
              {errorMessage || `We couldn't locate problem '${slug}'. It may be unpublished or does not exist.`}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Library</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Two-Column Problem Workspace Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Problem Specification (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Header Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {problem.title}
                  </h1>
                  {getDifficultyBadge(problem.difficulty)}
                </div>

                {/* Tags */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {problem.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-slate-700/50"
                    >
                      <TagIcon className="h-3 w-3 text-slate-500" />
                      <span>{tag.name}</span>
                    </span>
                  ))}
                </div>

                {/* Description */}
                <div className="mt-6 border-t border-slate-800 pt-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Problem Description
                  </h2>
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
                    {problem.description}
                  </div>
                </div>

                {/* Input & Output Format */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Input Format
                    </span>
                    <p className="mt-1 text-xs text-slate-300 font-mono">
                      {problem.input_format || 'Standard function arguments'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Output Format
                    </span>
                    <p className="mt-1 text-xs text-slate-300 font-mono">
                      {problem.output_format || 'Return value'}
                    </p>
                  </div>
                </div>

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Illustrative Examples
                    </h2>
                    {problem.examples.map((example, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs font-mono"
                      >
                        <div className="font-semibold text-indigo-400 mb-2">
                          Example {idx + 1}:
                        </div>
                        <div className="space-y-1.5 text-slate-300">
                          <div>
                            <span className="text-slate-500 select-none">Input: </span>
                            <span className="text-emerald-400">{example.input}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 select-none">Output: </span>
                            <span className="text-amber-300">{example.output}</span>
                          </div>
                          {example.explanation && (
                            <div className="font-sans text-slate-400 text-[11px] pt-1">
                              <span className="text-slate-500 font-mono select-none">Explanation: </span>
                              {example.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                <div className="mt-6 border-t border-slate-800 pt-6">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Constraints
                  </h2>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                    {problem.constraints || 'Standard memory and execution limits apply.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: C++ Starter Code & Future Editor Placeholder (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Starter Code Viewer Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-white">C++ Starter Template</span>
                  </div>
                  <button
                    onClick={handleCopyStarterCode}
                    className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 transition"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Starter Code Block */}
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  <pre>
                    <code>{problem.starter_code}</code>
                  </pre>
                </div>
              </div>

              {/* Code Judge Sandbox Placeholder Card (Phase 3 Anchor) */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center ring-1 ring-indigo-500/30">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Docker Judge Workspace
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Planned for Phase 3: Isolated sandbox execution
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-5 text-center">
                  <Cpu className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-300">
                    Interactive Monaco Editor & Live Compiler Judge
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Full code submission and judge verdicts will unlock in Phase 3 with non-root g++ execution sandboxing.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-1.5 text-[11px] font-mono text-slate-400">
                    <span>Status: Phase 2 Problem Library Loaded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
