'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { FontSelector } from '@/components/FontSelector';
import { FontSizeSelector } from '@/components/FontSizeSelector';
import {
  createSubmission,
  fetchProblemBySlug,
  fetchProblemTestCases,
  fetchSubmission,
  fetchSubmissionHistory,
} from '@/lib/api';
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
  FileText,
  History,
  Brain,
  Sparkles,
  Clock,
  Cpu,
  ChevronDown,
} from 'lucide-react';

interface MonacoEditorInstance {
  updateOptions: (options: Record<string, unknown>) => void;
}

interface MonacoInstance {
  editor?: {
    remeasureFonts?: () => void;
  };
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] flex items-center justify-center bg-[#1e1e1e] text-[#929BA8] font-mono text-xs border border-[#273244] rounded-xl">
      <span className="h-4 w-4 border-2 border-[#FFA116] border-t-transparent rounded-full animate-spin mr-2" />
      Initializing Monaco Code Editor...
    </div>
  ),
});

type LeftTab = 'description' | 'submissions' | 'ai-coach';
type ConsoleTab = 'testcase' | 'result';

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
  const [selectedFontId, setSelectedFontId] = useState<EditorFontId>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFont = localStorage.getItem('codearena_editor_font') as EditorFontId | null;
        if (savedFont && EDITOR_FONTS.some((f) => f.id === savedFont)) {
          return savedFont;
        }
      } catch {
        // In case localStorage is disabled or restricted
      }
    }
    return DEFAULT_EDITOR_FONT_ID;
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSize = localStorage.getItem('codearena_editor_font_size');
        if (savedSize) {
          const parsed = parseInt(savedSize, 10);
          if (!isNaN(parsed) && parsed >= MIN_EDITOR_FONT_SIZE && parsed <= MAX_EDITOR_FONT_SIZE) {
            return parsed;
          }
        }
      } catch {
        // In case localStorage is disabled or restricted
      }
    }
    return DEFAULT_EDITOR_FONT_SIZE;
  });
  
  // UI Tabs & Console state
  const [leftTab, setLeftTab] = useState<LeftTab>('description');
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>('testcase');
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});

  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const monacoRef = useRef<MonacoInstance | null>(null);
  const { user } = useAuth();

  const currentLangInfo =
    SUPPORTED_LANGUAGES.find((l) => l.id === selectedLang) || SUPPORTED_LANGUAGES[0];
  const currentFontInfo = getEditorFont(selectedFontId);

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
    const remeasure = monacoRef.current?.editor?.remeasureFonts;
    if (remeasure) {
      requestAnimationFrame(() => {
        remeasure();
      });
    }
  };

  const handleFontSizeChange = (newSize: number) => {
    const clamped = Math.max(
      MIN_EDITOR_FONT_SIZE,
      Math.min(MAX_EDITOR_FONT_SIZE, Math.round(newSize))
    );
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
    const remeasure = monacoRef.current?.editor?.remeasureFonts;
    if (remeasure) {
      requestAnimationFrame(() => {
        remeasure();
      });
    }
  };

  const handleResetTypography = () => {
    handleFontChange(DEFAULT_EDITOR_FONT_ID);
    handleFontSizeChange(DEFAULT_EDITOR_FONT_SIZE);
  };

  const handleEditorDidMount = (editor: MonacoEditorInstance, monaco: MonacoInstance) => {
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
        monaco.editor?.remeasureFonts?.();
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
          python:
            'import sys\n\ndef main():\n    # Read input from sys.stdin and write output to sys.stdout\n    pass\n\nif __name__ == "__main__":\n    main()\n',
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
    const nextCode =
      codeByLang[newLang] ||
      problem?.starter_codes?.[newLang] ||
      (newLang === 'cpp' ? problem?.starter_code : '') ||
      '';
    setUserCode(nextCode);
  };

  useEffect(() => {
    if (!activeSubmission || ['COMPLETED', 'FAILED'].includes(activeSubmission.status)) return;
    const timer = window.setTimeout(async () => {
      try {
        const refreshed = await fetchSubmission(activeSubmission.id);
        setActiveSubmission(refreshed);
        setHistory((previous) =>
          previous.map((item) => (item.id === refreshed.id ? refreshed : item))
        );
        // Switch to result tab when done
        if (['COMPLETED', 'FAILED'].includes(refreshed.status)) {
          setConsoleTab('result');
        }
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Status polling failed.');
        setPollRetry((retry) => retry + 1);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [activeSubmission, pollRetry]);

  useEffect(() => {
    if (!problem || !user) return;
    fetchSubmissionHistory(problem.id)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [problem, user]);

  const handleJudge = async (action: 'run' | 'submit') => {
    setActionError(null);
    if (!user) {
      setActionError('Sign in to run or submit a solution.');
      return;
    }
    setIsSubmitting(true);
    setConsoleTab('result');
    try {
      const queued = await createSubmission(slug, action, userCode, selectedLang);
      setActiveSubmission(queued);
      setHistory((previous) => [queued, ...previous].slice(0, 20));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to queue solution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleResetCode = () => {
    const defaultCode =
      problem?.starter_codes?.[selectedLang] ||
      (selectedLang === 'cpp' ? problem?.starter_code : '');
    if (defaultCode) {
      setUserCode(defaultCode);
      setCodeByLang((prev) => ({ ...prev, [selectedLang]: defaultCode }));
    }
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2CBB5D]/10 text-[#2CBB5D] ring-1 ring-[#2CBB5D]/20">
            Easy
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFA116]/10 text-[#FFA116] ring-1 ring-[#FFA116]/20">
            Medium
          </span>
        );
      case 'Hard':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EF4743]/10 text-[#EF4743] ring-1 ring-[#EF4743]/20">
            Hard
          </span>
        );
      default:
        return null;
    }
  };

  const getVerdictStyle = (verdict: string | null, status: string) => {
    if (status !== 'COMPLETED' && status !== 'FAILED') {
      return {
        badge: 'bg-[#FFA116]/10 text-[#FFA116] border border-[#FFA116]/30',
        label: status || 'Running...',
      };
    }
    const v = (verdict || status).toUpperCase();
    if (v.includes('ACCEPTED')) {
      return {
        badge: 'bg-[#2CBB5D]/15 text-[#2CBB5D] border border-[#2CBB5D]/30',
        label: 'Accepted',
      };
    }
    if (v.includes('WRONG')) {
      return {
        badge: 'bg-[#EF4743]/15 text-[#EF4743] border border-[#EF4743]/30',
        label: 'Wrong Answer',
      };
    }
    if (v.includes('TIME_LIMIT')) {
      return {
        badge: 'bg-[#FFA116]/15 text-[#FFA116] border border-[#FFA116]/30',
        label: 'Time Limit Exceeded',
      };
    }
    if (v.includes('MEMORY_LIMIT')) {
      return {
        badge: 'bg-[#FFA116]/15 text-[#FFA116] border border-[#FFA116]/30',
        label: 'Memory Limit Exceeded',
      };
    }
    if (v.includes('COMPILATION')) {
      return {
        badge: 'bg-[#EF4743]/15 text-[#EF4743] border border-[#EF4743]/30',
        label: 'Compilation Error',
      };
    }
    return {
      badge: 'bg-[#EF4743]/15 text-[#EF4743] border border-[#EF4743]/30',
      label: verdict || status,
    };
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

  // Progressive hints derived for problem
  const defaultHints = [
    {
      level: 1,
      title: 'High-Level Intuition',
      content: `Consider the problem input constraints: ${problem?.constraints || 'check array bounds'}. Look for standard data structures like hash maps, two pointers, or binary search.`,
    },
    {
      level: 2,
      title: 'Algorithmic Strategy',
      content: `Analyze whether an O(N) or O(N log N) solution is feasible. If looking up past seen elements, store intermediate calculations in a hash table or sorted container.`,
    },
    {
      level: 3,
      title: 'Edge Cases & Bounds',
      content: `Check for 0-length inputs, negative numbers, overflow in integer arithmetic (e.g. 32-bit vs 64-bit), and off-by-one errors on boundary indices.`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F3F6] flex flex-col selection:bg-[#FFA116]/30 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-[1720px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 flex flex-col">
        {/* Navigation Breadcrumb */}
        <div className="mb-3 flex items-center justify-between">
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#929BA8] hover:text-[#FFA116] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Problem Library</span>
          </Link>

          {problem && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#929BA8] hidden sm:inline">Difficulty:</span>
              {getDifficultyBadge(problem.difficulty)}
            </div>
          )}
        </div>

        {isLoading ? (
          /* Skeleton Loader */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse flex-1">
            <div className="lg:col-span-5 rounded-2xl border border-[#273244] bg-[#161D27] p-6 space-y-4">
              <div className="h-7 w-64 rounded bg-[#1C2532]" />
              <div className="h-5 w-24 rounded-full bg-[#1C2532]" />
              <div className="h-40 rounded-xl bg-[#1C2532]" />
            </div>
            <div className="lg:col-span-7 rounded-2xl border border-[#273244] bg-[#161D27] p-6 h-[640px]" />
          </div>
        ) : errorMessage || !problem ? (
          /* Error / 404 State */
          <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-12 text-center max-w-lg mx-auto my-auto">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EF4743]/10 text-[#EF4743] ring-1 ring-[#EF4743]/20 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Problem Not Found</h2>
            <p className="mt-2 text-xs text-[#929BA8]">
              {errorMessage || `We couldn't locate problem '${slug}'. It may be unpublished or does not exist.`}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FFA116] px-4 py-2 text-xs font-semibold text-black hover:bg-[#FFA116]/90 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Library</span>
              </Link>
            </div>
          </div>
        ) : (
          /* LeetCode-Inspired Two-Panel Workspace Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start flex-1">
            
            {/* ══════════════ LEFT PANEL: Description / Submissions / AI Coach (5 cols) ══════════════ */}
            <div className="lg:col-span-5 flex flex-col rounded-2xl border border-[#273244] bg-[#161D27] shadow-xl overflow-hidden min-h-[700px]">
              
              {/* Tab Header */}
              <div className="flex items-center justify-between px-3 border-b border-[#273244] bg-[#111820]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLeftTab('description')}
                    className={`flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition ${
                      leftTab === 'description'
                        ? 'border-[#FFA116] text-[#FFA116]'
                        : 'border-transparent text-[#929BA8] hover:text-[#F0F3F6]'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Description</span>
                  </button>

                  <button
                    onClick={() => setLeftTab('submissions')}
                    className={`flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition ${
                      leftTab === 'submissions'
                        ? 'border-[#FFA116] text-[#FFA116]'
                        : 'border-transparent text-[#929BA8] hover:text-[#F0F3F6]'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>Submissions</span>
                    {history.length > 0 && (
                      <span className="rounded-full bg-[#1C2532] px-1.5 py-0.2 text-[10px] text-[#929BA8]">
                        {history.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setLeftTab('ai-coach')}
                    className={`flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition ${
                      leftTab === 'ai-coach'
                        ? 'border-[#FFA116] text-[#FFA116]'
                        : 'border-transparent text-[#929BA8] hover:text-[#F0F3F6]'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#FFA116]" />
                    <span>AI Coach</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 pr-2">
                  {getDifficultyBadge(problem.difficulty)}
                </div>
              </div>

              {/* Tab Content Container */}
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-210px)] flex-1 space-y-6">
                
                {/* ── TAB 1: DESCRIPTION ── */}
                {leftTab === 'description' && (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-xl font-bold text-[#F0F3F6] tracking-tight">
                        {problem.title}
                      </h1>

                      {/* Tag badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {problem.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-md bg-[#1C2532] px-2.5 py-1 text-xs text-[#929BA8] border border-[#273244]"
                          >
                            <TagIcon className="h-3 w-3 text-[#929BA8]" />
                            <span>{tag.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Problem Statement */}
                    <div className="border-t border-[#273244] pt-4">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#929BA8] mb-3">
                        Problem Statement
                      </h2>
                      <div className="text-sm text-[#F0F3F6] leading-relaxed whitespace-pre-line font-sans">
                        {problem.description}
                      </div>
                    </div>

                    {/* Input & Output Format */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-[#273244] bg-[#0D1117] p-3.5">
                        <span className="text-xs font-semibold text-[#929BA8] uppercase tracking-wider block mb-1">
                          Input Format
                        </span>
                        <p className="text-xs text-[#F0F3F6] font-mono leading-relaxed">
                          {problem.input_format || 'Standard input streams'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#273244] bg-[#0D1117] p-3.5">
                        <span className="text-xs font-semibold text-[#929BA8] uppercase tracking-wider block mb-1">
                          Output Format
                        </span>
                        <p className="text-xs text-[#F0F3F6] font-mono leading-relaxed">
                          {problem.output_format || 'Standard return output'}
                        </p>
                      </div>
                    </div>

                    {/* Examples Showcase */}
                    {problem.examples && problem.examples.length > 0 && (
                      <div className="border-t border-[#273244] pt-4">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#929BA8] mb-3">
                          Examples
                        </h2>
                        <div className="space-y-4">
                          {problem.examples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-[#273244] bg-[#111820] p-4 text-xs font-mono space-y-2.5"
                            >
                              <div className="font-semibold text-[#FFA116] uppercase text-[11px] font-sans">
                                Example {idx + 1}
                              </div>
                              <div className="space-y-1">
                                <span className="text-[#929BA8] block">Input:</span>
                                <div className="p-2 rounded-lg bg-[#0D1117] text-[#2CBB5D] border border-[#273244] overflow-x-auto whitespace-pre-wrap">
                                  {ex.input}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[#929BA8] block">Output:</span>
                                <div className="p-2 rounded-lg bg-[#0D1117] text-[#FFA116] border border-[#273244] overflow-x-auto whitespace-pre-wrap">
                                  {ex.output}
                                </div>
                              </div>
                              {ex.explanation && (
                                <div className="pt-1 text-[#929BA8] font-sans text-xs">
                                  <span className="font-semibold text-[#F0F3F6]">Explanation: </span>
                                  {ex.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    <div className="border-t border-[#273244] pt-4">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#929BA8] mb-3">
                        Constraints
                      </h2>
                      <div className="rounded-xl border border-[#273244] bg-[#0D1117] p-4 font-mono text-xs text-[#929BA8] whitespace-pre-line leading-relaxed">
                        {problem.constraints || 'Standard memory and execution limits apply.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: SUBMISSIONS HISTORY ── */}
                {leftTab === 'submissions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#273244]">
                      <h3 className="text-sm font-semibold text-[#F0F3F6]">Submission History</h3>
                      <span className="text-xs text-[#929BA8]">{history.length} attempts</span>
                    </div>

                    {!user ? (
                      <div className="p-8 text-center rounded-xl border border-[#273244] bg-[#0D1117]">
                        <Lock className="h-8 w-8 text-[#929BA8] mx-auto mb-2" />
                        <p className="text-xs text-[#929BA8]">Sign in to track your submission history.</p>
                        <Link
                          href="/login"
                          className="mt-3 inline-block rounded-lg bg-[#FFA116] px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-[#FFA116]/90"
                        >
                          Sign In
                        </Link>
                      </div>
                    ) : history.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#929BA8] rounded-xl border border-[#273244] bg-[#0D1117]">
                        No submissions recorded for this problem yet. Run or submit your solution to view results here!
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {history.map((item) => {
                          const vStyle = getVerdictStyle(item.verdict, item.status);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setActiveSubmission(item);
                                setConsoleTab('result');
                              }}
                              className="group cursor-pointer rounded-xl border border-[#273244] bg-[#111820] p-3.5 hover:border-[#FFA116]/40 transition space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${vStyle.badge}`}>
                                  {vStyle.label}
                                </span>
                                <span className="text-[11px] text-[#929BA8] font-mono">
                                  {new Date(item.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-[#929BA8]">
                                <span>
                                  {item.passed_test_cases}/{item.total_test_cases} tests passed
                                </span>
                                <div className="flex items-center gap-3">
                                  {item.execution_time_ms != null && (
                                    <span className="flex items-center gap-1 font-mono">
                                      <Clock className="h-3 w-3 text-[#FFA116]" />
                                      {item.execution_time_ms} ms
                                    </span>
                                  )}
                                  <span className="uppercase text-[10px] font-semibold text-[#FFA116]">
                                    {item.submission_type}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 3: AI CODING COACH ── */}
                {leftTab === 'ai-coach' && (
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="rounded-xl border border-[#FFA116]/30 bg-[#FFA116]/5 p-4 flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFA116]/10 text-[#FFA116] shrink-0">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">AI Evidence Coach</h3>
                        <p className="text-xs text-[#929BA8] mt-0.5 leading-relaxed">
                          Evidence-based failure diagnostics derived from compiler output, test diffs, and problem constraints.
                        </p>
                      </div>
                    </div>

                    {/* Active Submission Diagnostics */}
                    {activeSubmission && activeSubmission.status === 'COMPLETED' && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#929BA8]">
                          Latest Run Analysis
                        </h4>
                        
                        {activeSubmission.verdict?.toUpperCase().includes('ACCEPTED') ? (
                          <div className="rounded-xl border border-[#2CBB5D]/30 bg-[#2CBB5D]/10 p-4">
                            <div className="flex items-center gap-2 text-[#2CBB5D] font-semibold text-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Optimal Solution Confirmed!</span>
                            </div>
                            <p className="text-xs text-[#929BA8] mt-2">
                              All {activeSubmission.total_test_cases} test cases executed cleanly in {activeSubmission.execution_time_ms || 0} ms. Your implementation respects all space and time bounds.
                            </p>
                          </div>
                        ) : activeSubmission.error_message ? (
                          <div className="rounded-xl border border-[#EF4743]/30 bg-[#EF4743]/10 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-[#EF4743] font-semibold text-xs">
                              <AlertCircle className="h-4 w-4" />
                              <span>Compiler / Runtime Diagnostic</span>
                            </div>
                            <p className="text-xs text-[#F0F3F6] leading-relaxed">
                              The compiler encountered an error during build. Check syntax, type mismatches, or missing include headers.
                            </p>
                            <pre className="p-2.5 rounded-lg bg-[#0D1117] text-[11px] font-mono text-[#EF4743] overflow-x-auto whitespace-pre-wrap max-h-36">
                              {activeSubmission.error_message}
                            </pre>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-[#FFA116]/30 bg-[#FFA116]/10 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-[#FFA116] font-semibold text-xs">
                              <AlertCircle className="h-4 w-4" />
                              <span>Test Mismatch Detected</span>
                            </div>
                            <p className="text-xs text-[#F0F3F6] leading-relaxed">
                              Passed {activeSubmission.passed_test_cases} of {activeSubmission.total_test_cases} tests. Review boundary inputs and edge conditions.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progressive Hints Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#929BA8]">
                          Progressive Hints
                        </h4>
                        <span className="text-[11px] text-[#FFA116]">Step-by-step guidance</span>
                      </div>

                      <div className="space-y-3">
                        {defaultHints.map((hint) => {
                          const isRevealed = !!revealedHints[hint.level];
                          return (
                            <div
                              key={hint.level}
                              className="rounded-xl border border-[#273244] bg-[#111820] overflow-hidden transition"
                            >
                              <div
                                onClick={() =>
                                  setRevealedHints((prev) => ({
                                    ...prev,
                                    [hint.level]: !prev[hint.level],
                                  }))
                                }
                                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#1C2532] transition"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFA116]/10 text-[#FFA116] text-xs font-bold">
                                    {hint.level}
                                  </div>
                                  <span className="text-xs font-semibold text-[#F0F3F6]">
                                    {hint.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#FFA116]">
                                  <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                                  <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform ${
                                      isRevealed ? 'rotate-180' : ''
                                    }`}
                                  />
                                </div>
                              </div>

                              {isRevealed && (
                                <div className="p-3.5 border-t border-[#273244] bg-[#0D1117] text-xs text-[#929BA8] leading-relaxed">
                                  {hint.content}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ══════════════ RIGHT PANEL: Monaco IDE + Test/Results Drawer (7 cols) ══════════════ */}
            <div className="lg:col-span-7 flex flex-col space-y-4">
              
              {/* Editor Workspace Card */}
              <div className="rounded-2xl border border-[#273244] bg-[#161D27] shadow-xl overflow-hidden flex flex-col">
                
                {/* Editor Toolbar */}
                <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-[#273244] bg-[#111820] gap-2">
                  
                  {/* Left: Language Selection */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Code2 className="h-4 w-4 text-[#FFA116]" />
                      <select
                        value={selectedLang}
                        onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                        className="rounded-lg border border-[#273244] bg-[#161D27] px-2.5 py-1 text-xs font-semibold text-white hover:border-[#FFA116]/40 focus:border-[#FFA116] focus:outline-none transition cursor-pointer"
                        title="Select programming language"
                      >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <option key={lang.id} value={lang.id} className="bg-[#161D27] text-white">
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 border-l border-[#273244] pl-3">
                      <FileCode2 className="h-3.5 w-3.5 text-[#929BA8]" />
                      <span className="text-xs font-mono text-[#F0F3F6]">{currentLangInfo.filename}</span>
                      <span className="rounded-md bg-[#1C2532] px-1.5 py-0.5 text-[10px] font-mono text-[#FFA116] border border-[#273244]">
                        {currentLangInfo.runtime}
                      </span>
                    </div>
                  </div>

                  {/* Right: Typography, Reset, Copy */}
                  <div className="flex items-center gap-1.5">
                    <FontSelector
                      selectedFontId={selectedFontId}
                      onSelectFont={handleFontChange}
                      onResetTypography={handleResetTypography}
                    />

                    <FontSizeSelector
                      fontSize={fontSize}
                      onFontSizeChange={handleFontSizeChange}
                      onResetTypography={handleResetTypography}
                    />

                    <button
                      onClick={handleResetCode}
                      className="flex items-center gap-1 rounded-lg border border-[#273244] bg-[#161D27] px-2.5 py-1 text-xs font-medium text-[#929BA8] hover:text-[#F0F3F6] hover:border-[#FFA116]/40 transition"
                      title="Reset to starter template"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>

                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 rounded-lg border border-[#273244] bg-[#161D27] px-2.5 py-1 text-xs font-medium text-[#929BA8] hover:text-[#F0F3F6] hover:border-[#FFA116]/40 transition"
                      title="Copy code to clipboard"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#2CBB5D]" />
                          <span className="text-[#2CBB5D] hidden sm:inline">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Monaco Editor Container */}
                <div className="p-1 bg-[#1e1e1e]">
                  <MonacoEditor
                    height="460px"
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

                {/* Bottom Test Case & Results Console Drawer */}
                <div className="border-t border-[#273244] bg-[#111820]">
                  
                  {/* Console Tabs Header */}
                  <div className="flex items-center justify-between px-4 border-b border-[#273244]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConsoleTab('testcase')}
                        className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
                          consoleTab === 'testcase'
                            ? 'border-[#FFA116] text-[#FFA116]'
                            : 'border-transparent text-[#929BA8] hover:text-white'
                        }`}
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>Testcase</span>
                      </button>

                      <button
                        onClick={() => setConsoleTab('result')}
                        className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-medium border-b-2 transition ${
                          consoleTab === 'result'
                            ? 'border-[#FFA116] text-[#FFA116]'
                            : 'border-transparent text-[#929BA8] hover:text-white'
                        }`}
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        <span>Test Result</span>
                        {activeSubmission && !['COMPLETED', 'FAILED'].includes(activeSubmission.status) && (
                          <span className="h-2 w-2 rounded-full bg-[#FFA116] animate-ping" />
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] text-[#929BA8] hidden sm:block">
                      {consoleTab === 'testcase' ? `${sampleTestCases.length} sample cases` : 'Docker Sandbox Judge'}
                    </div>
                  </div>

                  {/* Console Body */}
                  <div className="p-4 max-h-56 overflow-y-auto">
                    
                    {/* TAB: TEST CASES */}
                    {consoleTab === 'testcase' && (
                      <div>
                        {sampleTestCases.length > 0 ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {sampleTestCases.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTestCaseIdx(idx)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                    selectedTestCaseIdx === idx
                                      ? 'bg-[#FFA116] text-black font-semibold'
                                      : 'bg-[#1C2532] text-[#929BA8] hover:text-white'
                                  }`}
                                >
                                  Case {idx + 1}
                                </button>
                              ))}
                            </div>

                            {sampleTestCases[selectedTestCaseIdx] && (
                              <div className="space-y-2 text-xs font-mono">
                                <div>
                                  <span className="text-[#929BA8] text-[10px] uppercase tracking-wider block mb-1">
                                    Input
                                  </span>
                                  <div className="p-2.5 rounded-lg bg-[#0D1117] border border-[#273244] text-[#2CBB5D] overflow-x-auto whitespace-pre-wrap">
                                    {sampleTestCases[selectedTestCaseIdx].input_data}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[#929BA8] text-[10px] uppercase tracking-wider block mb-1">
                                    Expected Output
                                  </span>
                                  <div className="p-2.5 rounded-lg bg-[#0D1117] border border-[#273244] text-[#FFA116] overflow-x-auto whitespace-pre-wrap">
                                    {sampleTestCases[selectedTestCaseIdx].expected_output}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#929BA8]">No public test cases specified.</p>
                        )}
                      </div>
                    )}

                    {/* TAB: TEST RESULT */}
                    {consoleTab === 'result' && (
                      <div>
                        {actionError && (
                          <div className="p-3 rounded-lg border border-[#EF4743]/30 bg-[#EF4743]/10 text-xs text-[#EF4743] mb-3">
                            {actionError}
                          </div>
                        )}

                        {!activeSubmission && !actionError && (
                          <div className="text-center py-6 text-xs text-[#929BA8]">
                            Run code or submit to inspect execution results and test diagnostics.
                          </div>
                        )}

                        {activeSubmission && (
                          <div className="space-y-3">
                            {/* Verdict Banner */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const vStyle = getVerdictStyle(
                                    activeSubmission.verdict,
                                    activeSubmission.status
                                  );
                                  return (
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${vStyle.badge}`}>
                                      {vStyle.label}
                                    </span>
                                  );
                                })()}
                                <span className="text-xs text-[#929BA8]">
                                  {activeSubmission.passed_test_cases}/{activeSubmission.total_test_cases} passed
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-xs font-mono text-[#929BA8]">
                                {activeSubmission.execution_time_ms != null && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-[#FFA116]" />
                                    {activeSubmission.execution_time_ms} ms
                                  </span>
                                )}
                                {activeSubmission.memory_used_kb != null && (
                                  <span className="flex items-center gap-1">
                                    <Cpu className="h-3.5 w-3.5 text-[#2CBB5D]" />
                                    {activeSubmission.memory_used_kb} KB
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Compiler Error Log */}
                            {activeSubmission.error_message && (
                              <div className="mt-2">
                                <span className="text-[10px] text-[#EF4743] font-semibold uppercase tracking-wider block mb-1">
                                  Diagnostic Log
                                </span>
                                <pre className="p-3 rounded-lg bg-[#0D1117] border border-[#EF4743]/30 text-[#EF4743] text-xs font-mono overflow-auto max-h-32 whitespace-pre-wrap">
                                  {activeSubmission.error_message}
                                </pre>
                              </div>
                            )}

                            {/* Individual Sample Case Results */}
                            {activeSubmission.case_results && activeSubmission.case_results.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                {activeSubmission.case_results.map((result) => (
                                  <div
                                    key={result.test_case}
                                    className="p-2.5 rounded-lg border border-[#273244] bg-[#0D1117] text-xs"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-[#F0F3F6]">
                                        Sample {result.test_case}
                                      </span>
                                      <span
                                        className={`font-semibold ${
                                          result.passed ? 'text-[#2CBB5D]' : 'text-[#EF4743]'
                                        }`}
                                      >
                                        {result.passed ? 'Passed' : 'Failed'}
                                      </span>
                                    </div>
                                    {!result.passed && result.actual_output && (
                                      <div className="mt-2 text-xs font-mono text-[#929BA8]">
                                        <span className="block text-[10px] uppercase text-[#EF4743]">
                                          Actual Output:
                                        </span>
                                        <pre className="p-1.5 rounded bg-[#161D27] text-white mt-1 overflow-x-auto whitespace-pre-wrap">
                                          {result.actual_output}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Execution Bar */}
                <div className="px-5 py-3 border-t border-[#273244] bg-[#111820] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#929BA8]">
                    <Terminal className="h-4 w-4 text-[#FFA116]" />
                    <span className="hidden sm:inline">
                      Run validates public test cases. Submit runs complete judge suite.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      disabled={
                        isSubmitting ||
                        (!!activeSubmission &&
                          !['COMPLETED', 'FAILED'].includes(activeSubmission.status))
                      }
                      onClick={() => handleJudge('run')}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#273244] bg-[#1C2532] px-4 py-2 text-xs font-semibold text-[#F0F3F6] hover:border-[#FFA116]/40 hover:text-[#FFA116] transition disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Run</span>
                    </button>

                    <button
                      disabled={
                        isSubmitting ||
                        (!!activeSubmission &&
                          !['COMPLETED', 'FAILED'].includes(activeSubmission.status))
                      }
                      onClick={() => handleJudge('submit')}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#FFA116] px-5 py-2 text-xs font-semibold text-black shadow-lg shadow-[#FFA116]/20 hover:bg-[#FFA116]/90 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Submit</span>
                    </button>
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
        <div className="min-h-screen bg-[#0D1117] text-[#F0F3F6] flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse mt-8">
              <div className="h-[600px] rounded-2xl bg-[#161D27] border border-[#273244]" />
              <div className="h-[600px] rounded-2xl bg-[#161D27] border border-[#273244]" />
            </div>
          </main>
        </div>
      }
    >
      <ProblemDetailContent />
    </Suspense>
  );
}
