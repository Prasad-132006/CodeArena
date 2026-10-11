'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { fetchProblems, fetchTags } from '@/lib/api';
import { ProblemItem, Tag, Difficulty } from '@/types';
import {
  Search,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  CodeXml,
  AlertCircle,
  RefreshCw,
  Tag as TagIcon,
  Sparkles,
} from 'lucide-react';

function ProblemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state synchronization
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';
  const initialDifficulty = searchParams.get('difficulty') || 'All';
  const initialTag = searchParams.get('tag') || 'All';

  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(initialDifficulty);
  const [selectedTag, setSelectedTag] = useState<string>(initialTag);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Debounce search query input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load available tags on mount
  useEffect(() => {
    async function loadTags() {
      try {
        const fetchedTags = await fetchTags();
        setTags(fetchedTags);
      } catch (err) {
        console.error('Failed to load topic tags', err);
      }
    }
    loadTags();
  }, []);

  // Fetch problems based on current state
  const loadProblems = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const data = await fetchProblems({
        page: currentPage,
        page_size: 10,
        search: debouncedSearch,
        difficulty: selectedDifficulty,
        tag: selectedTag,
        sort_by: 'newest',
      });
      setProblems(data.items);
      setTotalCount(data.total);
      setTotalPages(data.total_pages);
    } catch (err: unknown) {
      setIsError(true);
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to connect to the problem database.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedDifficulty, selectedTag]);

  // Trigger problem fetch and update URL params
  useEffect(() => {
    loadProblems();

    // Sync to URL
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedDifficulty !== 'All') params.set('difficulty', selectedDifficulty);
    if (selectedTag !== 'All') params.set('tag', selectedTag);

    const queryString = params.toString();
    const newPath = queryString ? `/problems?${queryString}` : '/problems';
    window.history.replaceState(null, '', newPath);
  }, [loadProblems, currentPage, debouncedSearch, selectedDifficulty, selectedTag]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedDifficulty('All');
    setSelectedTag('All');
    setCurrentPage(1);
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Problem Library
              </h1>
              <span className="rounded-full bg-indigo-950/80 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
                {totalCount} {totalCount === 1 ? 'problem' : 'problems'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Explore C++ coding challenges with detailed constraints, starter templates, and test specifications.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search problems by title or keyword..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Difficulty & Tag Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Difficulty Pill Selectors */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/60 p-1">
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setSelectedDifficulty(diff);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    selectedDifficulty === diff
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* Tag Dropdown */}
            <div className="relative">
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-3.5 pr-8 text-xs font-medium text-slate-300 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Topics</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name} {t.problem_count ? `(${t.problem_count})` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500">
                <Filter className="h-3 w-3" />
              </div>
            </div>

            {/* Clear All Filters Button */}
            {(searchQuery || selectedDifficulty !== 'All' || selectedTag !== 'All') && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Problems Table / List */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 animate-pulse border border-slate-800/60"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 rounded bg-slate-800" />
                      <div className="h-3 w-28 rounded bg-slate-800/60" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-16 rounded-full bg-slate-800" />
                    <div className="h-5 w-20 rounded bg-slate-800/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            /* Error & Retry State */
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20 mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Failed to load problem library
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                {errorMessage}
              </p>
              <button
                onClick={loadProblems}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : problems.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20 mb-4">
                <CodeXml className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-white">
                No problems match your criteria
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
                Try searching with different keywords or clearing your active difficulty and topic filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </button>
            </div>
          ) : (
            /* Problem Listing */
            <div className="divide-y divide-slate-800/80">
              {problems.map((problem, index) => (
                <div
                  key={problem.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition hover:bg-slate-850/50"
                >
                  {/* Left: Index & Title */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/70 text-xs font-mono font-medium text-slate-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-300 transition">
                      {(currentPage - 1) * 10 + index + 1}
                    </span>
                    <div>
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="text-base font-semibold text-white group-hover:text-indigo-400 transition"
                      >
                        {problem.title}
                      </Link>

                      {/* Tag badges */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {problem.tags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => {
                              setSelectedTag(tag.slug);
                              setCurrentPage(1);
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-indigo-950/60 hover:text-indigo-300 hover:ring-1 hover:ring-indigo-500/30 transition"
                          >
                            <TagIcon className="h-2.5 w-2.5 text-slate-500" />
                            <span>{tag.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Difficulty & Solve Action */}
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    {getDifficultyBadge(problem.difficulty)}
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 group-hover:border-indigo-500/40 group-hover:bg-indigo-600/20 group-hover:text-white transition"
                    >
                      <span>Inspect</span>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-slate-200">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalPages}</span> ({totalCount} total)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F19] text-slate-400 p-8">Loading problem library...</div>}>
      <ProblemsContent />
    </Suspense>
  );
}
