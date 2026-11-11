'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  updateUserProfile,
  changeUserPassword,
  fetchProblems,
  fetchSubmissionHistory,
} from '@/lib/api';
import { ProblemItem, Submission } from '@/types';
import {
  Mail,
  Calendar as CalendarIcon,
  ShieldCheck,
  Edit3,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  Layers,
  MapPin,
  Check,
  AlertCircle,
  X,
  Code2,
  LogOut,
} from 'lucide-react';

// Skill categorization mappings
const FUNDAMENTAL_TAGS = new Set([
  'array',
  'string',
  'math',
  'basic math',
  'two pointers',
  'sorting',
  'simulation',
  'bit manipulation',
]);

const ADVANCED_TAGS = new Set([
  'dynamic programming',
  'graph',
  'graph theory',
  'backtracking',
  'trie',
  'segment tree',
  'union find',
  'monotonic stack',
  'divide and conquer',
]);

interface CalendarDay {
  date: string;
  count: number;
  level: number;
  formattedDate: string;
}

interface CalendarDataState {
  weeks: CalendarDay[][];
  monthLabels: { label: string; weekIndex: number }[];
  totalSubmissionsInYear: number;
  activeDays: number;
  maxStreak: number;
  currentStreak: number;
}

function ProfileContent() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout, updateUser } = useAuth();

  // Profile data states
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  // Tab state in right column
  const [activeTab, setActiveTab] = useState<'accepted' | 'all'>('accepted');

  // Edit Profile Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state in modal
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  // Tooltip for heatmap
  const [hoveredDay, setHoveredDay] = useState<{ day: CalendarDay; x: number; y: number } | null>(
    null
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login?returnUrl=/profile');
    }
    if (user?.display_name) {
      const timer = setTimeout(() => {
        setDisplayName(user.display_name);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading, user, router]);

  // Load real submission history & problem catalog from backend
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    async function loadData() {
      setDataError(null);
      try {
        const [problemsData, userSubs] = await Promise.all([
          fetchProblems({ page_size: 100 }).catch(() => ({ items: [], total: 0 })),
          fetchSubmissionHistory(undefined, 100).catch(() => []),
        ]);

        if (isMounted) {
          setProblems(problemsData.items || []);
          setSubmissions(userSubs || []);
        }
      } catch (err) {
        if (isMounted) {
          setDataError(err instanceof Error ? err.message : 'Failed to load profile data.');
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Map problems by ID for quick lookup
  const problemsMap = useMemo(() => {
    const map = new Map<string, ProblemItem>();
    problems.forEach((p) => {
      map.set(p.id, p);
    });
    return map;
  }, [problems]);

  // Statistics Computations
  const stats = useMemo(() => {
    // Unique accepted problem IDs
    const acceptedSubs = submissions.filter(
      (s) => s.verdict && s.verdict.toUpperCase().includes('ACCEPTED')
    );
    const solvedProblemIds = new Set(acceptedSubs.map((s) => s.problem_id));
    const totalSolved = solvedProblemIds.size;

    // Difficulty breakdown of solved problems
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    solvedProblemIds.forEach((pid) => {
      const problem = problemsMap.get(pid);
      if (problem) {
        if (problem.difficulty === 'Easy') easySolved++;
        else if (problem.difficulty === 'Medium') mediumSolved++;
        else if (problem.difficulty === 'Hard') hardSolved++;
      }
    });

    // Total available problems by difficulty
    let totalEasy = 0;
    let totalMedium = 0;
    let totalHard = 0;

    problems.forEach((p) => {
      if (p.difficulty === 'Easy') totalEasy++;
      else if (p.difficulty === 'Medium') totalMedium++;
      else if (p.difficulty === 'Hard') totalHard++;
    });

    const totalProblemsCount = problems.length || Math.max(totalSolved, 1);
    const totalSubmissions = submissions.length;
    const acceptanceRate =
      totalSubmissions > 0
        ? Math.round((acceptedSubs.length / totalSubmissions) * 1000) / 10
        : 0;

    // Language statistics: count unique solved problems per language
    const langSolvedMap: Record<string, Set<string>> = {};
    acceptedSubs.forEach((sub) => {
      const lang = sub.language || 'cpp';
      if (!langSolvedMap[lang]) langSolvedMap[lang] = new Set();
      langSolvedMap[lang].add(sub.problem_id);
    });

    const languagesStats = Object.entries(langSolvedMap).map(([lang, pids]) => ({
      name:
        lang === 'cpp'
          ? 'C++'
          : lang === 'c'
          ? 'C'
          : lang === 'java'
          ? 'Java'
          : lang === 'python'
          ? 'Python'
          : lang === 'go'
          ? 'Go'
          : lang.toUpperCase(),
      solvedCount: pids.size,
    }));

    // Categorized skills: calculate how many solved problems match each tag
    const fundamentalSkills: { name: string; count: number }[] = [];
    const intermediateSkills: { name: string; count: number }[] = [];
    const advancedSkills: { name: string; count: number }[] = [];

    const skillCounts: Record<string, number> = {};
    solvedProblemIds.forEach((pid) => {
      const prob = problemsMap.get(pid);
      if (prob?.tags) {
        prob.tags.forEach((t) => {
          skillCounts[t.name] = (skillCounts[t.name] || 0) + 1;
        });
      }
    });

    Object.entries(skillCounts).forEach(([tagName, count]) => {
      const lower = tagName.toLowerCase();
      if (FUNDAMENTAL_TAGS.has(lower)) {
        fundamentalSkills.push({ name: tagName, count });
      } else if (ADVANCED_TAGS.has(lower)) {
        advancedSkills.push({ name: tagName, count });
      } else {
        intermediateSkills.push({ name: tagName, count });
      }
    });

    return {
      totalSolved,
      totalProblemsCount,
      easySolved,
      totalEasy: Math.max(totalEasy, easySolved),
      mediumSolved,
      totalMedium: Math.max(totalMedium, mediumSolved),
      hardSolved,
      totalHard: Math.max(totalHard, hardSolved),
      totalSubmissions,
      acceptanceRate,
      languagesStats,
      fundamentalSkills,
      intermediateSkills,
      advancedSkills,
    };
  }, [submissions, problems, problemsMap]);

  // Submission Activity Calendar State & Computation (computed on client)
  const [calendarData, setCalendarData] = useState<CalendarDataState>({
    weeks: [],
    monthLabels: [],
    totalSubmissionsInYear: 0,
    activeDays: 0,
    maxStreak: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    // Map submissions by YYYY-MM-DD
    const subsByDay = new Map<string, number>();
    submissions.forEach((s) => {
      if (s.created_at) {
        const d = s.created_at.slice(0, 10);
        subsByDay.set(d, (subsByDay.get(d) || 0) + 1);
      }
    });

    const now = new Date();
    const days: CalendarDay[] = [];

    // Past 364 days + today = 365 days
    for (let i = 364; i >= 0; i--) {
      const dateObj = new Date(now);
      dateObj.setDate(now.getDate() - i);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const count = subsByDay.get(dateStr) || 0;

      let level = 0;
      if (count >= 7) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      days.push({
        date: dateStr,
        count,
        level,
        formattedDate: dateObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      });
    }

    // Compute active days, max streak, and current streak
    let activeDays = 0;
    let maxStreak = 0;
    let currentRun = 0;
    let currentStreak = 0;

    days.forEach((day, index) => {
      if (day.count > 0) {
        activeDays++;
        currentRun++;
        if (currentRun > maxStreak) {
          maxStreak = currentRun;
        }
      } else {
        currentRun = 0;
      }

      // Check current streak at the end
      if (index === days.length - 1) {
        currentStreak = currentRun;
      }
    });

    // Group into 53 weeks (columns of 7 days)
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    // Pad beginning with empty slots so first day aligns to its day of week
    const firstDate = new Date(days[0].date);
    const startDayOfWeek = firstDate.getDay(); // 0 is Sunday

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        date: '',
        count: 0,
        level: -1,
        formattedDate: '',
      });
    }

    days.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          count: 0,
          level: -1,
          formattedDate: '',
        });
      }
      weeks.push(currentWeek);
    }

    // Month headers
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, wIdx) => {
      const validDay = week.find((d) => d.date);
      if (validDay) {
        const dObj = new Date(validDay.date);
        const m = dObj.getMonth();
        if (m !== lastMonth) {
          monthLabels.push({
            label: dObj.toLocaleDateString(undefined, { month: 'short' }),
            weekIndex: wIdx,
          });
          lastMonth = m;
        }
      }
    });

    const timer = setTimeout(() => {
      setCalendarData({
        weeks,
        monthLabels,
        totalSubmissionsInYear: submissions.length,
        activeDays,
        maxStreak,
        currentStreak,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [submissions]);

  // Earned Badges derived from authentic user actions
  const badges = useMemo(() => {
    const list: {
      id: string;
      name: string;
      description: string;
      earned: boolean;
      icon: typeof Award;
      color: string;
    }[] = [
      {
        id: 'first-solve',
        name: 'First Accepted',
        description: 'Solved your first problem on CodeArena',
        earned: stats.totalSolved >= 1,
        icon: CheckCircle2,
        color: 'text-[#2CBB5D] bg-[#2CBB5D]/10 border-[#2CBB5D]/30',
      },
      {
        id: 'novice-coder',
        name: 'Problem Solver',
        description: 'Solved 3 or more problems',
        earned: stats.totalSolved >= 3,
        icon: Award,
        color: 'text-[#FFA116] bg-[#FFA116]/10 border-[#FFA116]/30',
      },
      {
        id: 'polyglot',
        name: 'Polyglot',
        description: 'Executed solutions in 2 or more programming languages',
        earned: stats.languagesStats.length >= 2,
        icon: Code2,
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      },
      {
        id: 'streak-keeper',
        name: 'Streak Keeper',
        description: 'Achieved an active 2+ day submission streak',
        earned: calendarData.maxStreak >= 2,
        icon: Flame,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      },
      {
        id: 'judge-veteran',
        name: 'Sandbox Master',
        description: 'Submitted 10+ solutions to the Docker judge',
        earned: stats.totalSubmissions >= 10,
        icon: ShieldCheck,
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      },
    ];

    return list;
  }, [stats, calendarData]);

  // Filtered submissions for recent activity list
  const recentAcceptedSubmissions = useMemo(() => {
    const seen = new Set<string>();
    return submissions.filter((s) => {
      const isAcc = s.verdict && s.verdict.toUpperCase().includes('ACCEPTED');
      if (isAcc && !seen.has(s.problem_id)) {
        seen.add(s.problem_id);
        return true;
      }
      return false;
    });
  }, [submissions]);

  // Profile Edit Handlers
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setProfileError('Display name must be at least 2 characters.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateUserProfile({ display_name: trimmed });
      updateUser(updated);
      setProfileSuccess('Profile display name updated successfully.');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSuccess(null);
    setPwdError(null);

    if (!currentPassword) {
      setPwdError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPwdError('New password must contain at least one letter and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeUserPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPwdSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(null), 3000);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-[#F0F3F6] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-[#929BA8] text-sm">
            <span className="h-5 w-5 border-2 border-[#FFA116] border-t-transparent rounded-full animate-spin" />
            <span>Loading profile...</span>
          </div>
        </main>
      </div>
    );
  }

  const formattedJoinDate = new Date(user.created_at).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const usernameHandle = user.email ? user.email.split('@')[0] : 'coder';

  // SVG circular progress calculation
  const circleRadius = 52;
  const circumference = 2 * Math.PI * circleRadius;
  const progressRatio = stats.totalProblemsCount > 0 ? stats.totalSolved / stats.totalProblemsCount : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F3F6] flex flex-col selection:bg-[#FFA116]/30 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-[1520px] w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Error notification if problem loading fails */}
        {dataError && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#EF4743]/30 bg-[#EF4743]/10 p-3.5 text-xs text-[#EF4743]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{dataError}</span>
          </div>
        )}

        {/* ══════════════ TWO-COLUMN PROFILE LAYOUT (LeetCode-Inspired) ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ───────────────── LEFT COLUMN: PROFILE SIDEBAR (4 cols) ───────────────── */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* User Identity Card */}
            <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-6 shadow-xl">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFA116] to-[#FF6B35] text-black font-extrabold text-3xl shadow-lg shadow-[#FFA116]/20">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>

                {/* Name & Handle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#F0F3F6] truncate">
                      {user.display_name}
                    </h1>
                    <span title="Verified Session">
                      <ShieldCheck className="h-4 w-4 text-[#2CBB5D] shrink-0" />
                    </span>
                  </div>
                  <p className="text-xs text-[#929BA8] font-mono mt-0.5 truncate">
                    @{usernameHandle}
                  </p>
                  <p className="text-xs text-[#FFA116] mt-2 font-medium">
                    CodeArena Challenger
                  </p>
                </div>
              </div>

              {/* Action Buttons: Edit Profile & Sign Out */}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#273244] bg-[#1C2532] py-2 text-xs font-semibold text-[#F0F3F6] hover:border-[#FFA116]/40 hover:text-[#FFA116] transition"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center justify-center px-3 rounded-xl border border-[#273244] bg-[#1C2532] text-xs font-semibold text-[#929BA8] hover:border-[#EF4743]/40 hover:text-[#EF4743] hover:bg-[#EF4743]/10 transition"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Bio & Details */}
              <div className="mt-5 pt-5 border-t border-[#273244] space-y-3 text-xs text-[#929BA8]">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-[#929BA8] shrink-0" />
                  <span>Earth</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarIcon className="h-4 w-4 text-[#929BA8] shrink-0" />
                  <span>Joined {formattedJoinDate}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-[#929BA8] shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              {/* Community Counters */}
              <div className="mt-5 pt-5 border-t border-[#273244] grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-[#111820] p-2.5 border border-[#273244]">
                  <p className="text-sm font-bold text-[#F0F3F6]">{stats.totalSolved}</p>
                  <p className="text-[10px] text-[#929BA8] mt-0.5">Solutions</p>
                </div>
                <div className="rounded-xl bg-[#111820] p-2.5 border border-[#273244]">
                  <p className="text-sm font-bold text-[#F0F3F6]">{stats.totalSubmissions}</p>
                  <p className="text-[10px] text-[#929BA8] mt-0.5">Runs</p>
                </div>
                <div className="rounded-xl bg-[#111820] p-2.5 border border-[#273244]">
                  <p className="text-sm font-bold text-[#F0F3F6]">{calendarData.activeDays}</p>
                  <p className="text-[10px] text-[#929BA8] mt-0.5">Active Days</p>
                </div>
              </div>
            </div>

            {/* Languages Card */}
            <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#273244]">
                <h3 className="text-sm font-semibold text-[#F0F3F6] flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#FFA116]" />
                  <span>Languages</span>
                </h3>
                <span className="text-xs text-[#929BA8]">
                  {stats.languagesStats.length} used
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {stats.languagesStats.length === 0 ? (
                  <p className="text-xs text-[#929BA8]">No language submissions recorded yet.</p>
                ) : (
                  stats.languagesStats.map((l) => (
                    <div key={l.name} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#F0F3F6]">{l.name}</span>
                      <span className="font-mono text-[#929BA8]">
                        <strong className="text-[#F0F3F6]">{l.solvedCount}</strong> problems solved
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Skills & Topic Proficiency Card */}
            <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#273244]">
                <h3 className="text-sm font-semibold text-[#F0F3F6] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <span>Skills</span>
                </h3>
              </div>

              <div className="mt-4 space-y-4">
                {/* Advanced */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#EF4743] mb-2">
                    <span>Advanced</span>
                    <span className="text-[10px] font-mono text-[#929BA8]">
                      x{stats.advancedSkills.reduce((acc, s) => acc + s.count, 0)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.advancedSkills.length === 0 ? (
                      <span className="text-[11px] text-[#929BA8]/70 italic">None yet</span>
                    ) : (
                      stats.advancedSkills.map((s) => (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 rounded-md bg-[#1C2532] px-2 py-0.5 text-[11px] text-[#F0F3F6] border border-[#273244]"
                        >
                          <span>{s.name}</span>
                          <span className="text-[#929BA8] font-mono">x{s.count}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Intermediate */}
                <div className="pt-2 border-t border-[#273244]/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#FFA116] mb-2">
                    <span>Intermediate</span>
                    <span className="text-[10px] font-mono text-[#929BA8]">
                      x{stats.intermediateSkills.reduce((acc, s) => acc + s.count, 0)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.intermediateSkills.length === 0 ? (
                      <span className="text-[11px] text-[#929BA8]/70 italic">None yet</span>
                    ) : (
                      stats.intermediateSkills.map((s) => (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 rounded-md bg-[#1C2532] px-2 py-0.5 text-[11px] text-[#F0F3F6] border border-[#273244]"
                        >
                          <span>{s.name}</span>
                          <span className="text-[#929BA8] font-mono">x{s.count}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Fundamental */}
                <div className="pt-2 border-t border-[#273244]/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#2CBB5D] mb-2">
                    <span>Fundamental</span>
                    <span className="text-[10px] font-mono text-[#929BA8]">
                      x{stats.fundamentalSkills.reduce((acc, s) => acc + s.count, 0)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.fundamentalSkills.length === 0 ? (
                      <span className="text-[11px] text-[#929BA8]/70 italic">None yet</span>
                    ) : (
                      stats.fundamentalSkills.map((s) => (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 rounded-md bg-[#1C2532] px-2 py-0.5 text-[11px] text-[#F0F3F6] border border-[#273244]"
                        >
                          <span>{s.name}</span>
                          <span className="text-[#929BA8] font-mono">x{s.count}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────── RIGHT COLUMN: MAIN PROFILE CONTENT (8 cols) ───────────────── */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* A. Problem-Solving Statistics Card */}
            <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                
                {/* Donut Progress Chart */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-36 h-36 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="72"
                      cy="72"
                      r={circleRadius}
                      stroke="#1C2532"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="72"
                      cy="72"
                      r={circleRadius}
                      stroke="#FFA116"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>

                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-[#F0F3F6]">
                      {stats.totalSolved}
                    </span>
                    <span className="text-[10px] text-[#929BA8] uppercase tracking-wider font-semibold">
                      /{stats.totalProblemsCount} Solved
                    </span>
                  </div>
                </div>

                {/* Difficulty Rows & Progress Bars */}
                <div className="flex-1 w-full space-y-3.5">
                  {/* Easy */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2CBB5D]">Easy</span>
                      <span className="font-mono text-[#929BA8]">
                        <strong className="text-[#F0F3F6]">{stats.easySolved}</strong>/{stats.totalEasy}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1C2532] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2CBB5D] transition-all duration-500"
                        style={{
                          width: `${stats.totalEasy > 0 ? (stats.easySolved / stats.totalEasy) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#FFA116]">Medium</span>
                      <span className="font-mono text-[#929BA8]">
                        <strong className="text-[#F0F3F6]">{stats.mediumSolved}</strong>/{stats.totalMedium}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1C2532] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FFA116] transition-all duration-500"
                        style={{
                          width: `${stats.totalMedium > 0 ? (stats.mediumSolved / stats.totalMedium) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Hard */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#EF4743]">Hard</span>
                      <span className="font-mono text-[#929BA8]">
                        <strong className="text-[#F0F3F6]">{stats.hardSolved}</strong>/{stats.totalHard}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#1C2532] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#EF4743] transition-all duration-500"
                        style={{
                          width: `${stats.totalHard > 0 ? (stats.hardSolved / stats.totalHard) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Acceptance Rate Footer */}
                  <div className="pt-2 flex items-center justify-between text-xs text-[#929BA8] border-t border-[#273244]/60">
                    <span>Total Submissions: <strong className="text-[#F0F3F6]">{stats.totalSubmissions}</strong></span>
                    <span>Acceptance Rate: <strong className="text-[#FFA116]">{stats.acceptanceRate}%</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* B. Achievements & Badges Card */}
            <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#273244]">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#FFA116]" />
                  <h3 className="text-sm font-semibold text-[#F0F3F6]">Badges & Milestones</h3>
                </div>
                <span className="text-xs text-[#929BA8]">
                  {badges.filter((b) => b.earned).length}/{badges.length} Unlocked
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {badges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.id}
                      className={`rounded-xl border p-3 flex flex-col items-center text-center transition ${
                        badge.earned
                          ? `${badge.color} shadow-sm`
                          : 'border-[#273244] bg-[#111820]/40 opacity-40'
                      }`}
                    >
                      <Icon className="h-6 w-6 mb-1.5" />
                      <span className="text-xs font-semibold text-[#F0F3F6] line-clamp-1">
                        {badge.name}
                      </span>
                      <span className="text-[10px] text-[#929BA8] mt-1 line-clamp-2">
                        {badge.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C. 12-Month Submission Activity Heatmap Calendar */}
            <div className="rounded-2xl border border-[#273244] bg-[#161D27] p-6 shadow-xl relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#273244]">
                <div>
                  <h3 className="text-sm font-semibold text-[#F0F3F6] flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-[#FFA116]" />
                    <span>
                      {calendarData.totalSubmissionsInYear} submissions in the past year
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#929BA8] font-mono">
                  <span>
                    Active: <strong className="text-[#F0F3F6]">{calendarData.activeDays}</strong> days
                  </span>
                  <span>
                    Max Streak: <strong className="text-[#FFA116]">{calendarData.maxStreak}</strong> days
                  </span>
                </div>
              </div>

              {/* Heatmap Grid Container */}
              <div className="mt-4 overflow-x-auto pb-2">
                <div className="min-w-[680px]">
                  {/* Month header labels */}
                  <div className="grid grid-cols-53 text-[10px] text-[#929BA8] mb-1 pl-6">
                    {calendarData.weeks.map((_, idx) => {
                      const mMatch = calendarData.monthLabels.find((m) => m.weekIndex === idx);
                      return (
                        <div key={idx} className="h-3 truncate">
                          {mMatch ? mMatch.label : ''}
                        </div>
                      );
                    })}
                  </div>

                  {/* Days grid with day-of-week labels */}
                  <div className="flex gap-1.5 items-start">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-1 text-[9px] text-[#929BA8] pt-0.5 select-none w-5">
                      <span className="h-2.5"></span>
                      <span className="h-2.5">Mon</span>
                      <span className="h-2.5"></span>
                      <span className="h-2.5">Wed</span>
                      <span className="h-2.5"></span>
                      <span className="h-2.5">Fri</span>
                      <span className="h-2.5"></span>
                    </div>

                    {/* Heatmap Week Columns */}
                    <div className="flex gap-1 flex-1">
                      {calendarData.weeks.map((week, wIdx) => (
                        <div key={wIdx} className="flex flex-col gap-1 flex-1">
                          {week.map((day, dIdx) => {
                            if (!day.date) {
                              return <div key={dIdx} className="h-2.5 w-2.5" />;
                            }

                            // Intensity colors
                            let bgClass = 'bg-[#1C2532] border-[#273244]/40';
                            if (day.level === 1) bgClass = 'bg-[#0e4429] border-[#006d32]/50';
                            else if (day.level === 2) bgClass = 'bg-[#006d32] border-[#26a641]/50';
                            else if (day.level === 3) bgClass = 'bg-[#26a641] border-[#39d353]/50';
                            else if (day.level === 4) bgClass = 'bg-[#39d353] border-[#39d353]';

                            return (
                              <div
                                key={dIdx}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredDay({
                                    day,
                                    x: rect.left + rect.width / 2,
                                    y: rect.top - 8,
                                  });
                                }}
                                onMouseLeave={() => setHoveredDay(null)}
                                className={`h-2.5 w-2.5 rounded-xs border transition-all cursor-pointer hover:ring-1 hover:ring-white ${bgClass}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heatmap Legend */}
                  <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-[#929BA8]">
                    <span>Less</span>
                    <div className="h-2.5 w-2.5 rounded-xs bg-[#1C2532] border border-[#273244]" />
                    <div className="h-2.5 w-2.5 rounded-xs bg-[#0e4429]" />
                    <div className="h-2.5 w-2.5 rounded-xs bg-[#006d32]" />
                    <div className="h-2.5 w-2.5 rounded-xs bg-[#26a641]" />
                    <div className="h-2.5 w-2.5 rounded-xs bg-[#39d353]" />
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Floating Tooltip */}
              {hoveredDay && (
                <div
                  className="fixed z-50 -translate-x-1/2 -translate-y-full px-2.5 py-1 rounded-md bg-[#111820] text-[11px] font-mono text-[#F0F3F6] border border-[#273244] shadow-xl pointer-events-none whitespace-nowrap"
                  style={{ left: hoveredDay.x, top: hoveredDay.y }}
                >
                  <strong className="text-[#FFA116]">
                    {hoveredDay.day.count}{' '}
                    {hoveredDay.day.count === 1 ? 'submission' : 'submissions'}
                  </strong>{' '}
                  on {hoveredDay.day.formattedDate}
                </div>
              )}
            </div>

            {/* D. Recent Activity & Submissions Card */}
            <div className="rounded-2xl border border-[#273244] bg-[#161D27] shadow-xl overflow-hidden">
              {/* Tab Selector */}
              <div className="flex items-center px-4 border-b border-[#273244] bg-[#111820]">
                <button
                  onClick={() => setActiveTab('accepted')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'accepted'
                      ? 'border-[#FFA116] text-[#FFA116]'
                      : 'border-transparent text-[#929BA8] hover:text-[#F0F3F6]'
                  }`}
                >
                  Recent Accepted ({recentAcceptedSubmissions.length})
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'all'
                      ? 'border-[#FFA116] text-[#FFA116]'
                      : 'border-transparent text-[#929BA8] hover:text-[#F0F3F6]'
                  }`}
                >
                  All Submissions ({submissions.length})
                </button>
              </div>

              {/* Submissions List */}
              <div className="divide-y divide-[#273244]/80 max-h-96 overflow-y-auto">
                {activeTab === 'accepted' ? (
                  recentAcceptedSubmissions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#929BA8]">
                      No accepted solutions yet. Solve a problem to see it highlighted here!
                    </div>
                  ) : (
                    recentAcceptedSubmissions.map((sub) => {
                      const prob = problemsMap.get(sub.problem_id);
                      const title = prob?.title || `Problem ${sub.problem_id.slice(0, 8)}`;
                      const slug = prob?.slug || sub.problem_id;
                      const dateStr = new Date(sub.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-4 hover:bg-[#1C2532] transition group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2CBB5D]/10 text-[#2CBB5D] shrink-0">
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                            <div>
                              <Link
                                href={`/problems/${slug}`}
                                className="text-sm font-semibold text-[#F0F3F6] group-hover:text-[#FFA116] transition"
                              >
                                {title}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#929BA8]">
                                {prob && (
                                  <span
                                    className={
                                      prob.difficulty === 'Easy'
                                        ? 'text-[#2CBB5D]'
                                        : prob.difficulty === 'Medium'
                                        ? 'text-[#FFA116]'
                                        : 'text-[#EF4743]'
                                    }
                                  >
                                    {prob.difficulty}
                                  </span>
                                )}
                                <span>•</span>
                                <span className="uppercase font-mono text-[10px] text-[#929BA8]">
                                  {sub.language}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-[#929BA8] font-mono">
                            {sub.execution_time_ms != null && (
                              <span>{sub.execution_time_ms} ms</span>
                            )}
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : submissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#929BA8]">
                    No submissions recorded yet. Head over to the problem library and start coding!
                  </div>
                ) : (
                  submissions.map((sub) => {
                    const prob = problemsMap.get(sub.problem_id);
                    const title = prob?.title || `Problem ${sub.problem_id.slice(0, 8)}`;
                    const slug = prob?.slug || sub.problem_id;
                    const isPassed = sub.verdict && sub.verdict.toUpperCase().includes('ACCEPTED');
                    const dateStr = new Date(sub.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-4 hover:bg-[#1C2532] transition group"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                              isPassed
                                ? 'bg-[#2CBB5D]/10 text-[#2CBB5D]'
                                : 'bg-[#EF4743]/10 text-[#EF4743]'
                            }`}
                          >
                            {isPassed ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </span>
                          <div>
                            <Link
                              href={`/problems/${slug}`}
                              className="text-sm font-semibold text-[#F0F3F6] group-hover:text-[#FFA116] transition"
                            >
                              {title}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#929BA8]">
                              <span
                                className={`font-semibold ${
                                  isPassed ? 'text-[#2CBB5D]' : 'text-[#EF4743]'
                                }`}
                              >
                                {sub.verdict || sub.status}
                              </span>
                              <span>•</span>
                              <span className="uppercase font-mono text-[10px]">
                                {sub.language}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#929BA8] font-mono">
                          <span>
                            {sub.passed_test_cases}/{sub.total_test_cases} tests
                          </span>
                          {sub.execution_time_ms != null && (
                            <span>{sub.execution_time_ms} ms</span>
                          )}
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════ EDIT PROFILE & SECURITY MODAL ══════════════ */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-2xl border border-[#273244] bg-[#161D27] p-6 shadow-2xl space-y-6">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#273244]">
                <h3 className="text-base font-bold text-[#F0F3F6] flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-[#FFA116]" />
                  <span>Account & Profile Settings</span>
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg p-1 text-[#929BA8] hover:text-white hover:bg-[#1C2532] transition"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form 1: Display Name */}
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#929BA8]">
                  Public Identity
                </h4>
                <div>
                  <label className="block text-xs font-medium text-[#929BA8] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-[#273244] bg-[#0D1117] px-3.5 py-2 text-xs text-white placeholder-[#929BA8] focus:border-[#FFA116] focus:outline-none transition"
                    placeholder="Your coding alias"
                  />
                </div>

                {profileError && (
                  <div className="flex items-center gap-2 text-xs text-[#EF4743] bg-[#EF4743]/10 border border-[#EF4743]/20 rounded-lg p-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                {profileSuccess && (
                  <div className="flex items-center gap-2 text-xs text-[#2CBB5D] bg-[#2CBB5D]/10 border border-[#2CBB5D]/20 rounded-lg p-2.5">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSavingProfile || displayName.trim() === user.display_name}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#FFA116] px-4 py-2 text-xs font-semibold text-black hover:bg-[#FFA116]/90 disabled:opacity-50 transition"
                  >
                    {isSavingProfile ? 'Saving...' : 'Update Name'}
                  </button>
                </div>
              </form>

              {/* Form 2: Password Change */}
              <form onSubmit={handleChangePassword} className="pt-4 border-t border-[#273244] space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#929BA8]">
                  Security Credentials
                </h4>

                <div>
                  <label className="block text-xs font-medium text-[#929BA8] mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#273244] bg-[#0D1117] px-3.5 py-2 text-xs text-white focus:border-[#FFA116] focus:outline-none transition"
                    placeholder="Current password"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#929BA8] mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#273244] bg-[#0D1117] px-3.5 py-2 text-xs text-white focus:border-[#FFA116] focus:outline-none transition"
                      placeholder="Min 8 chars, letter & number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#929BA8] mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#273244] bg-[#0D1117] px-3.5 py-2 text-xs text-white focus:border-[#FFA116] focus:outline-none transition"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                {pwdError && (
                  <div className="flex items-center gap-2 text-xs text-[#EF4743] bg-[#EF4743]/10 border border-[#EF4743]/20 rounded-lg p-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}

                {pwdSuccess && (
                  <div className="flex items-center gap-2 text-xs text-[#2CBB5D] bg-[#2CBB5D]/10 border border-[#2CBB5D]/20 rounded-lg p-2.5">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{pwdSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !currentPassword || !newPassword}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#273244] bg-[#1C2532] px-4 py-2 text-xs font-semibold text-[#F0F3F6] hover:border-[#FFA116]/40 hover:text-[#FFA116] disabled:opacity-50 transition"
                  >
                    {isChangingPassword ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D1117] text-[#F0F3F6] flex flex-col">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 text-[#929BA8] text-sm">
              <span className="h-5 w-5 border-2 border-[#FFA116] border-t-transparent rounded-full animate-spin" />
              <span>Loading profile...</span>
            </div>
          </main>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
