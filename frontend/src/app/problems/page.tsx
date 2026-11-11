'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
} from 'lucide-react';

function ProblemsContent() {
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
    const timer = setTimeout(() => {
      loadProblems();
    }, 0);

    // Sync to URL
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedDifficulty !== 'All') params.set('difficulty', selectedDifficulty);
    if (selectedTag !== 'All') params.set('tag', selectedTag);

    const queryString = params.toString();
    const newPath = queryString ? `/problems?${queryString}` : '/problems';
    window.history.replaceState(null, '', newPath);

    return () => clearTimeout(timer);
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

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F3F6] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#273244]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Problem Library
              </h1>
              <span className="rounded-full bg-[#FFA116]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FFA116] border border-[#FFA116]/20">
                {totalCount} {totalCount === 1 ? 'problem' : 'problems'}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#929BA8]">
              Explore C++ coding challenges with detailed constraints, starter templates, and test specifications.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#929BA8]">
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
              className="w-full rounded-xl border border-[#273244] bg-[#161D27] py-2.5 pl-10 pr-10 text-sm text-[#F0F3F6] placeholder-[#929BA8] transition focus:border-[#FFA116] focus:outline-none focus:ring-1 focus:ring-[#FFA116]"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#929BA8] hover:text-[#F0F3F6] transition"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Difficulty & Tag Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Difficulty Pill Selectors */}
            <div className="flex items-center rounded-xl border border-[#273244] bg-[#161D27] p-1">
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setSelectedDifficulty(diff);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    selectedDifficulty === diff
                      ? 'bg-[#FFA116] text-black font-semibold shadow-sm'
                      : 'text-[#929BA8] hover:text-[#F0F3F6] hover:bg-[#1C2532]'
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
                className="appearance-none rounded-xl border border-[#273244] bg-[#161D27] py-2 pl-3.5 pr-8 text-xs font-medium text-[#929BA8] transition focus:border-[#FFA116] focus:outline-none focus:ring-1 focus:ring-[#FFA116] cursor-pointer"
              >
                <option value="All">All Topics</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name} {t.problem_count ? `(${t.problem_count})` : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#929BA8]">
                <Filter className="h-3 w-3" />
              </div>
            </div>

            {/* Clear All Filters Button */}
            {(searchQuery || selectedDifficulty !== 'All' || selectedTag !== 'All') && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 rounded-xl border border-[#273244] bg-transparent px-3 py-2 text-xs font-medium text-[#929BA8] hover:text-[#F0F3F6] hover:bg-[#1C2532] transition"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Problems Table / List */}
        <div className="mt-6 rounded-xl border border-[#273244] bg-[#161D27] overflow-hidden">
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#1C2532] animate-pulse border border-[#273244]"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-[#273244]" />
                    <div className="space-y-2">
                      <div className="h-4 w-48 rounded bg-[#273244]" />
                      <div className="h-3 w-28 rounded bg-[#273244]/60" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-16 rounded-full bg-[#273244]" />
                    <div className="h-5 w-20 rounded bg-[#273244]/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            /* Error & Retry State */
            <div className="p-12 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#EF4743]/10 text-[#EF4743] ring-1 ring-[#EF4743]/20 mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-[#F0F3F6]">
                Failed to load problem library
              </h3>
              <p className="mt-1 text-xs text-[#929BA8] max-w-sm mx-auto">
                {errorMessage}
              </p>
              <button
                onClick={loadProblems}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FFA116]/10 border border-[#FFA116]/20 px-4 py-2 text-xs font-semibold text-[#FFA116] hover:bg-[#FFA116] hover:text-black transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : problems.length === 0 ? (
            /* Empty State */
            <div className="p-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFA116]/10 text-[#FFA116] ring-1 ring-[#FFA116]/20 mb-4">
                <CodeXml className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-[#F0F3F6]">
                No problems match your criteria
              </h3>
              <p className="mt-1 text-xs text-[#929BA8] max-w-xs mx-auto">
                Try searching with different keywords or clearing your active difficulty and topic filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-[#273244] bg-[#1C2532] px-4 py-2 text-xs font-semibold text-[#F0F3F6] hover:bg-[#273244] hover:text-white transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </button>
            </div>
          ) : (
            /* Problem Listing */
            <div className="divide-y divide-[#273244]">
              {problems.map((problem, index) => (
                <div
                  key={problem.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition hover:bg-[#1C2532]"
                >
                  {/* Left: Index & Title */}
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1C2532] text-xs font-mono font-medium text-[#929BA8] transition">
                      {(currentPage - 1) * 10 + index + 1}
                    </span>
                    <div>
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="text-base font-medium text-[#F0F3F6] hover:text-[#FFA116] transition"
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
                            className="inline-flex items-center gap-1 rounded-md bg-[#1C2532] px-2 py-0.5 text-[11px] text-[#929BA8] hover:text-[#FFA116] transition"
                          >
                            <TagIcon className="h-2.5 w-2.5" />
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#FFA116]/20 bg-[#FFA116]/10 px-3 py-1.5 text-xs font-semibold text-[#FFA116] hover:bg-[#FFA116] hover:text-black transition"
                    >
                      <span>Solve</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-xs text-[#929BA8]">
            <div>
              Showing page <span className="font-semibold text-[#F0F3F6]">{currentPage}</span> of{' '}
              <span className="font-semibold text-[#F0F3F6]">{totalPages}</span> ({totalCount} total)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 rounded-lg border border-[#273244] bg-[#161D27] px-3 py-1.5 font-medium text-[#929BA8] hover:bg-[#1C2532] hover:text-[#F0F3F6] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#273244] bg-[#161D27] px-3 py-1.5 font-medium text-[#929BA8] hover:bg-[#1C2532] hover:text-[#F0F3F6] transition disabled:opacity-40 disabled:cursor-not-allowed"
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
    <Suspense fallback={<div className="min-h-screen bg-[#0D1117] text-[#929BA8] p-8">Loading problem library...</div>}>
      <ProblemsContent />
    </Suspense>
  );
}
