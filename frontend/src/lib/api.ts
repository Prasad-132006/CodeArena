import {
  AuthResponse,
  HealthResponse,
  ProblemDetail,
  ProblemListResponse,
  Tag,
  TestCase,
  User,
  Submission,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function createSubmission(
  slug: string,
  action: 'run' | 'submit',
  source_code: string,
  language: string = 'cpp'
): Promise<Submission> {
  const res = await fetch(`${API_BASE_URL}/submissions/problems/${encodeURIComponent(slug)}/${action}`, {
    method: 'POST',
    headers: getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ source_code, language }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Unable to queue submission.');
  return data;
}

export async function fetchSubmission(id: string): Promise<Submission> {
  const res = await fetch(`${API_BASE_URL}/submissions/${encodeURIComponent(id)}`, { headers: getHeaders(), credentials: 'include', cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Unable to retrieve submission.');
  return data;
}

export async function fetchSubmissionHistory(problemId: string): Promise<Submission[]> {
  const query = new URLSearchParams({ problem_id: problemId, page_size: '20' });
  const res = await fetch(`${API_BASE_URL}/submissions?${query}`, { headers: getHeaders(), credentials: 'include', cache: 'no-store' });
  if (!res.ok) throw new Error('Unable to retrieve submission history.');
  return res.json();
}

// In-memory token store for backup Authorization header
let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

function getHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (inMemoryToken) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }
  return headers;
}

export async function checkSystemHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Health check returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    return {
      status: 'unhealthy',
      version: '0.1.0',
      environment: 'development',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'unhealthy',
          details:
            error instanceof Error
              ? error.message
              : 'Failed to connect to backend server',
        },
        database: {
          status: 'unknown',
          details: 'Backend offline, database status unknown',
        },
        redis: {
          status: 'unknown',
          details: 'Backend offline, Redis status unknown',
        },
      },
    };
  }
}

// ==================== AUTHENTICATION API ====================

export async function registerUser(payload: {
  email: string;
  display_name: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Registration failed.');
  }

  setAuthToken(data.access_token);
  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Invalid email or password.');
  }

  setAuthToken(data.access_token);
  return data;
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    setAuthToken(null);
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}

export async function updateUserProfile(payload: { display_name: string }): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to update profile.');
  }

  return data;
}

export async function changeUserPassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/me/change-password`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Failed to change password.');
  }

  return data;
}


// ==================== PROBLEM LIBRARY API ====================

export interface ProblemFilterParams {
  page?: number;
  page_size?: number;
  search?: string;
  difficulty?: string;
  tag?: string;
  sort_by?: string;
}

export async function fetchProblems(
  params: ProblemFilterParams = {}
): Promise<ProblemListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.page_size) query.append('page_size', params.page_size.toString());
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.difficulty && params.difficulty !== 'All') query.append('difficulty', params.difficulty);
  if (params.tag && params.tag !== 'All') query.append('tag', params.tag);
  if (params.sort_by) query.append('sort_by', params.sort_by);

  const res = await fetch(`${API_BASE_URL}/problems?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch problems (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function fetchProblemBySlug(slug: string): Promise<ProblemDetail> {
  const res = await fetch(`${API_BASE_URL}/problems/${encodeURIComponent(slug)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Problem not found (HTTP ${res.status})`);
  }

  return await res.json();
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await fetch(`${API_BASE_URL}/tags`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to load topic tags');
  }

  return await res.json();
}

export async function fetchProblemTestCases(
  slug: string,
  samplesOnly = true
): Promise<TestCase[]> {
  const res = await fetch(
    `${API_BASE_URL}/problems/${slug}/test-cases?samples_only=${samplesOnly}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error('Failed to load test cases');
  }

  return await res.json();
}

