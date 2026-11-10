'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { FontSelector } from '@/components/FontSelector';
import { FontSizeSelector } from '@/components/FontSizeSelector';
import { createSubmission, fetchProblemBySlug, fetchProblemTestCases, fetchSubmission, fetchSubmissionHistory } from '@/lib/api';
import {
  ProblemDetail,
  Difficulty,
  TestCase,
  Submission,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  EditorFontId,
  DEFAULT_EDITOR_FONT_ID,
  EDITOR_FONTS,
  getEditorFont,
  DEFAULT_EDITOR_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  MAX_EDITOR_FONT_SIZE,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Tag as TagIcon,
  Copy,
  Check,
  AlertCircle,
  FileCode2,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  Lock,
  Layers,
  Code2,
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] flex items-center justify-center bg-slate-950 text-slate-500 font-mono text-xs border border-slate-800 rounded-xl">
      <span className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
      Initializing Monaco Code Editor...
    </div>
  ),
});

function ProblemDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('cpp');
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>({});
  const [userCode, setUserCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [history, setHistory] = useState<Submission[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollRetry, setPollRetry] = useState(0);
  const [selectedFontId, setSelectedFontId] = useState<EditorFontId>(DEFAULT_EDITOR_FONT_ID);
  const [fontSize, setFontSize] = useState<number>(DEFAULT_EDITOR_FONT_SIZE);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const { user } = useAuth();

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.id === selectedLang) || SUPPORTED_LANGUAGES[0];
  const currentFontInfo = getEditorFont(selectedFontId);

  // Restore font & size preferences from localStorage
  useEffect(() => {
    try {
      const savedFont = localStorage.getItem('codearena_editor_font') as EditorFontId | null;
      if (savedFont && EDITOR_FONTS.some((f) => f.id === savedFont)) {
        setSelectedFontId(savedFont);
      }
    } catch {
      // In case localStorage is disabled or restricted
    }

    try {
      const savedSize = localStorage.getItem('codearena_editor_font_size');
      if (savedSize) {
        const parsed = parseInt(savedSize, 10);
        if (!isNaN(parsed) && parsed >= MIN_EDITOR_FONT_SIZE && parsed <= MAX_EDITOR_FONT_SIZE) {
          setFontSize(parsed);
        }
      }
    } catch {
      // In case localStorage is disabled or restricted
    }
  }, []);

  const handleFontChange = (newFontId: EditorFontId) => {
    setSelectedFontId(newFontId);
    try {
      localStorage.setItem('codearena_editor_font', newFontId);
    } catch (err) {
      console.error('Failed to persist editor font preference:', err);
    }
    const targetFont = getEditorFont(newFontId);
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontFamily: targetFont.fontFamily,
        fontLigatures: targetFont.ligatures,
      });
    }
    if (monacoRef.current?.editor?.remeasureFonts) {
      requestAnimationFrame(() => {
        monacoRef.current?.editor?.remeasureFonts();
      });
    }
  };

  const handleFontSizeChange = (newSize: number) => {
    const clamped = Math.max(MIN_EDITOR_FONT_SIZE, Math.min(MAX_EDITOR_FONT_SIZE, Math.round(newSize)));
    setFontSize(clamped);
    try {
      localStorage.setItem('codearena_editor_font_size', clamped.toString());
    } catch (err) {
      console.error('Failed to persist editor font size:', err);
    }
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: clamped,
      });
    }
    if (monacoRef.current?.editor?.remeasureFonts) {
      requestAnimationFrame(() => {
        monacoRef.current?.editor?.remeasureFonts();
      });
    }
  };

  const handleResetTypography = () => {
    handleFontChange(DEFAULT_EDITOR_FONT_ID);
    handleFontSizeChange(DEFAULT_EDITOR_FONT_SIZE);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    const activeFont = getEditorFont(selectedFontId);
    editor.updateOptions({
      fontFamily: activeFont.fontFamily,
      fontLigatures: activeFont.ligatures,
      fontSize: fontSize,
    });
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        monaco.editor.remeasureFonts();
      });
    }
  };

  useEffect(() => {
    if (!slug) return;

    async function loadProblem() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [data, samples] = await Promise.all([
          fetchProblemBySlug(slug),
          fetchProblemTestCases(slug, true).catch(() => []),
        ]);
        const starterMap: Record<string, string> = {
          cpp: data.starter_code,
          c: '#include <stdio.h>\n\nint main() {\n    // Read input and write output\n    return 0;\n}\n',
          java: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Read input and write output\n    }\n}\n',
          python: 'import sys\n\ndef main():\n    # Read input from sys.stdin and write output to sys.stdout\n    pass\n\nif __name__ == "__main__":\n    main()\n',
          go: 'package main\n\nimport (\n    "fmt"\n)\n\nfunc main() {\n    // Read input and write output\n}\n',
          ...(data.starter_codes || {}),
        };
        setProblem({ ...data, test_cases: samples });
        setCodeByLang(starterMap);
        setUserCode(starterMap[selectedLang] || data.starter_code);
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

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setCodeByLang((prev) => ({ ...prev, [selectedLang]: userCode }));
    setSelectedLang(newLang);
    const nextCode = codeByLang[newLang] || problem?.starter_codes?.[newLang] || (newLang === 'cpp' ? problem?.starter_code : '') || '';
    setUserCode(nextCode);
  };

  useEffect(() => {
    if (!activeSubmission || ['COMPLETED', 'FAILED'].includes(activeSubmission.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        const refreshed = await fetchSubmission(activeSubmission.id);
        setActiveSubmission(refreshed);
        setHistory((previous) => previous.map((item) => item.id === refreshed.id ? refreshed : item));
      }
      catch (error) {
        setActionError(error instanceof Error ? error.message : 'Status polling failed.');
        setPollRetry((retry) => retry + 1);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeSubmission, pollRetry]);

  useEffect(() => {
    if (!problem || !user) return;
    fetchSubmissionHistory(problem.id).then(setHistory).catch(() => setHistory([]));
  }, [problem, user]);

  const handleJudge = async (action: 'run' | 'submit') => {
    setActionError(null);
    if (!user) { setActionError('Sign in to run or submit a solution.'); return; }
    setIsSubmitting(true);
    try {
      const queued = await createSubmission(slug, action, userCode, selectedLang);
      setActiveSubmission(queued);
      setHistory((previous) => [queued, ...previous].slice(0, 20));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to queue solution.');
    } finally { setIsSubmitting(false); }
  };

  const handleCopyCode = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleResetCode = () => {
    const defaultCode = problem?.starter_codes?.[selectedLang] || (selectedLang === 'cpp' ? problem?.starter_code : '');
    if (defaultCode) {
      setUserCode(defaultCode);
      setCodeByLang((prev) => ({ ...prev, [selectedLang]: defaultCode }));
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
                      Hidden suite
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
                {/* Editor Top Bar with Language Selector */}
                <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70 gap-3">
                  <div className="flex items-center gap-3">
                    {/* Language Selector Dropdown */}
                    <div className="flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-indigo-400" />
                      <select
                        value={selectedLang}
                        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                        className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                        title="Select programming language"
                      >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <option key={lang.id} value={lang.id} className="bg-slate-900 text-white">
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                      <FileCode2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-mono text-slate-300">{currentLangInfo.filename}</span>
                      <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-indigo-300 ring-1 ring-slate-700/50">
                        {currentLangInfo.runtime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Font Family Selector Dropdown */}
                    <FontSelector
                      selectedFontId={selectedFontId}
                      onSelectFont={handleFontChange}
                      onResetTypography={handleResetTypography}
                    />

                    {/* Font Size Selector (Stepper + Slider) */}
                    <FontSizeSelector
                      fontSize={fontSize}
                      onFontSizeChange={handleFontSizeChange}
                      onResetTypography={handleResetTypography}
                    />

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
                    language={currentLangInfo.monaco_id}
                    theme="vs-dark"
                    value={userCode}
                    onChange={(val) => setUserCode(val || '')}
                    onMount={handleEditorDidMount}
                    options={{
                      fontFamily: currentFontInfo.fontFamily,
                      fontLigatures: currentFontInfo.ligatures,
                      fontSize: fontSize,
                      lineNumbers: 'on',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>

                {/* Editor actions and confirmed judge result */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Terminal className="h-4 w-4 text-indigo-400" />
                    <span>Run checks public examples. Submit checks the complete judge suite.</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button disabled={isSubmitting || (!!activeSubmission && !['COMPLETED','FAILED'].includes(activeSubmission.status))} onClick={() => handleJudge('run')} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 disabled:opacity-50"><Play className="h-4 w-4" />Run Code</button>
                    <button disabled={isSubmitting || (!!activeSubmission && !['COMPLETED','FAILED'].includes(activeSubmission.status))} onClick={() => handleJudge('submit')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Submit</button>
                  </div>
                </div>
                {(actionError || activeSubmission) && <section aria-live="polite" className="border-t border-slate-800 bg-slate-950 p-4 text-sm">
                  {actionError && <p className="mb-2 text-rose-300">{actionError}</p>}
                  {activeSubmission && <><div className="flex flex-wrap items-center gap-3"><strong className="text-white">{activeSubmission.verdict || activeSubmission.status}</strong><span className="text-slate-400">{activeSubmission.passed_test_cases}/{activeSubmission.total_test_cases} tests passed</span>{activeSubmission.execution_time_ms != null && <span className="text-slate-400">{activeSubmission.execution_time_ms} ms</span>}</div>{activeSubmission.error_message && <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-xs text-rose-200">{activeSubmission.error_message}</pre>}{activeSubmission.case_results?.map((result) => <div key={result.test_case} className="mt-2 text-xs"><span className={result.passed ? 'text-emerald-300' : 'text-rose-300'}>Sample {result.test_case}: {result.passed ? 'Passed' : 'Failed'}</span>{!result.passed && <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-slate-400">{result.actual_output}</pre>}</div>)}</>}
                </section>}
              </div>
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="text-sm font-semibold text-white">Recent submissions</h2>{history.length === 0 ? <p className="mt-3 text-xs text-slate-400">No submissions yet.</p> : <ul className="mt-3 space-y-2">{history.map((item) => <li key={item.id} className="flex justify-between border-t border-slate-800 pt-2 text-xs"><span className="text-slate-300">{item.submission_type} · {new Date(item.created_at).toLocaleString()}</span><span className="text-indigo-300">{item.verdict || item.status}</span></li>)}</ul>}</section>
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
