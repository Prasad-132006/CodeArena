'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { fetchProblemBySlug } from '@/lib/api';
import { ProblemDetail, Difficulty, TestCase } from '@/types';
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
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-xs border border-slate-800 rounded-xl">
      <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
      Initializing Monaco C++ Editor...
    </div>
  ),
});

function ProblemDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [userCode, setUserCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0);

  useEffect(() => {
    if (!slug) return;

    async function loadProblem() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await fetchProblemBySlug(slug);
        setProblem(data);
        setUserCode(data.starter_code);
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

  const handleCopyCode = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleResetCode = () => {
    if (problem?.starter_code) {
      setUserCode(problem.starter_code);
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

  // Extract test cases (sample cases preferred)
  const sampleTestCases: TestCase[] =
    problem?.test_cases && problem.test_cases.length > 0
      ? problem.test_cases.filter((tc) => tc.is_sample)
      : problem?.examples.map((ex, idx) => ({
          id: `sample-${idx}`,
          input_data: ex.input,
          expected_output: ex.output,
          is_sample: true,
          explanation: ex.explanation,
          order: idx,
        })) || [];

  const hiddenCount =
    problem?.test_cases ? problem.test_cases.filter((tc) => !tc.is_sample).length : 2;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
            <div className="lg:col-span-6 space-y-4">
              <div className="h-8 w-64 rounded bg-slate-800" />
              <div className="h-5 w-32 rounded-full bg-slate-800/60" />
              <div className="h-40 rounded-xl bg-slate-800/40" />
            </div>
            <div className="lg:col-span-6 h-[500px] rounded-2xl bg-slate-800/40" />
          </div>
        ) : errorMessage || !problem ? (
          /* Error / 404 State */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center max-w-lg mx-auto mt-12">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Problem Statement & Test Cases (5 or 6 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Header & Statement Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {problem.title}
                  </h1>
                  {getDifficultyBadge(problem.difficulty)}
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
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

              {/* Test Cases Showcase Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">Evaluation Test Cases</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400 ring-1 ring-emerald-500/20">
                      {sampleTestCases.length} Public Samples
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-indigo-400 ring-1 ring-indigo-500/20">
                      <Lock className="h-2.5 w-2.5" />
                      {hiddenCount} Judge Hidden
                    </span>
                  </div>
                </div>

                {/* Test case tabs */}
                {sampleTestCases.length > 0 && (
                  <div className="mt-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {sampleTestCases.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTestCaseIdx(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            selectedTestCaseIdx === idx
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Active test case preview */}
                    {sampleTestCases[selectedTestCaseIdx] && (
                      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs space-y-3">
                        <div>
                          <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                            Input
                          </span>
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-emerald-400 overflow-x-auto">
                            {sampleTestCases[selectedTestCaseIdx].input_data}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                            Expected Output
                          </span>
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-amber-300 overflow-x-auto">
                            {sampleTestCases[selectedTestCaseIdx].expected_output}
                          </div>
                        </div>

                        {sampleTestCases[selectedTestCaseIdx].explanation && (
                          <div className="pt-1">
                            <span className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1">
                              Explanation
                            </span>
                            <p className="font-sans text-xs text-slate-300 leading-relaxed">
                              {sampleTestCases[selectedTestCaseIdx].explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Monaco C++ Editor Workspace (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm overflow-hidden">
                {/* Editor Top Bar */}
                <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70 gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileCode2 className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">Solution.cpp</span>
                    <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-indigo-300 ring-1 ring-slate-700/50">
                      C++20 (g++ 13)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetCode}
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 transition"
                      title="Reset to starter template"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 transition"
                      title="Copy code to clipboard"
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
                </div>

                {/* Monaco Editor Container */}
                <div className="p-1 bg-[#1e1e1e]">
                  <MonacoEditor
                    height="500px"
                    language="cpp"
                    theme="vs-dark"
                    value={userCode}
                    onChange={(val) => setUserCode(val || '')}
                    options={{
                      fontSize: 13,
                      lineNumbers: 'on',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>

                {/* Editor Bottom Status Bar & Phase 3 Sandbox Hook */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Terminal className="h-4 w-4 text-indigo-400" />
                    <span>Memory cap: 256MB &bull; CPU limit: 1.5s &bull; Network: Isolated</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/30 px-3.5 py-2 text-xs font-medium text-indigo-300">
                      <Cpu className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                      <span>Judge Sandbox: Phase 3 Ready</span>
                    </div>
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

export default function ProblemDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse mt-8">
              <div className="space-y-4">
                <div className="h-8 w-64 rounded bg-slate-800" />
                <div className="h-5 w-32 rounded-full bg-slate-800/60" />
                <div className="h-40 rounded-xl bg-slate-800/40" />
              </div>
              <div className="h-[500px] rounded-2xl bg-slate-800/40" />
            </div>
          </main>
        </div>
      }
    >
      <ProblemDetailContent />
    </Suspense>
  );
}
