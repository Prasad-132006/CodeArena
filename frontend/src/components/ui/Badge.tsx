'use client';

import React from 'react';

/* ── Difficulty Badge ──────────────────────────────────────────────── */

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

const difficultyStyles: Record<Difficulty, string> = {
  Easy:   'bg-[#2CBB5D]/15 text-[#2CBB5D] border border-[#2CBB5D]/30',
  Medium: 'bg-[#FFA116]/15 text-[#FFA116] border border-[#FFA116]/30',
  Hard:   'bg-[#EF4743]/15 text-[#EF4743] border border-[#EF4743]/30',
};

export function DifficultyBadge({ difficulty, className = '' }: DifficultyBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        difficultyStyles[difficulty],
        className,
      ].join(' ')}
    >
      {difficulty}
    </span>
  );
}

/* ── Status Badge ──────────────────────────────────────────────────── */

type Verdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING';

interface StatusBadgeProps {
  verdict: Verdict;
  className?: string;
}

const verdictLabel: Record<Verdict, string> = {
  ACCEPTED:              'Accepted',
  WRONG_ANSWER:          'Wrong Answer',
  COMPILATION_ERROR:     'Compilation Error',
  RUNTIME_ERROR:         'Runtime Error',
  TIME_LIMIT_EXCEEDED:   'Time Limit Exceeded',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
  PENDING:               'Pending',
  QUEUED:                'Queued',
  RUNNING:               'Running',
};

const verdictStyles: Record<Verdict, string> = {
  ACCEPTED:              'bg-[#2CBB5D]/15 text-[#2CBB5D] border border-[#2CBB5D]/30',
  WRONG_ANSWER:          'bg-[#EF4743]/15 text-[#EF4743] border border-[#EF4743]/30',
  COMPILATION_ERROR:     'bg-[#EF4743]/15 text-[#EF4743] border border-[#EF4743]/30',
  RUNTIME_ERROR:         'bg-[#EF4743]/15 text-[#EF4743] border border-[#EF4743]/30',
  TIME_LIMIT_EXCEEDED:   'bg-[#FFA116]/15 text-[#FFA116] border border-[#FFA116]/30',
  MEMORY_LIMIT_EXCEEDED: 'bg-[#FFA116]/15 text-[#FFA116] border border-[#FFA116]/30',
  PENDING:               'bg-slate-700/40 text-slate-300 border border-slate-600/40',
  QUEUED:                'bg-slate-700/40 text-slate-300 border border-slate-600/40',
  RUNNING:               'bg-amber-500/15 text-amber-400 border border-amber-500/30',
};

export function StatusBadge({ verdict, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        verdictStyles[verdict],
        className,
      ].join(' ')}
    >
      {verdictLabel[verdict]}
    </span>
  );
}

export type { Difficulty, Verdict, DifficultyBadgeProps, StatusBadgeProps };
