export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  response_time_ms?: number;
  details?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: string;
  services: {
    api?: ServiceStatus;
    database?: ServiceStatus;
    redis?: ServiceStatus;
    [key: string]: ServiceStatus | undefined;
  };
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface User {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  problem_count?: number;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemItem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: Tag[];
  created_at: string;
}

export interface TestCase {
  id: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
  explanation?: string | null;
  order: number;
}

export interface ProblemDetail {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  description: string;
  constraints: string;
  input_format: string;
  output_format: string;
  starter_code: string;
  starter_codes?: Record<string, string>;
  examples: ProblemExample[];
  tags: Tag[];
  test_cases?: TestCase[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  problem_id: string;
  language: string;
  submission_type: 'RUN' | 'SUBMIT';
  status: 'QUEUED' | 'COMPILING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  verdict: string | null;
  execution_time_ms: number | null;
  memory_used_kb: number | null;
  passed_test_cases: number;
  total_test_cases: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  case_results?: { test_case: number; passed: boolean; actual_output: string }[] | null;
}

export interface ProblemListResponse {
  items: ProblemItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type SupportedLanguage = 'cpp' | 'c' | 'java' | 'python' | 'go';

export interface LanguageInfo {
  id: SupportedLanguage;
  name: string;
  monaco_id: string;
  filename: string;
  runtime: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { id: 'cpp', name: 'C++20', monaco_id: 'cpp', filename: 'Solution.cpp', runtime: 'g++ 14' },
  { id: 'c', name: 'C17', monaco_id: 'c', filename: 'Solution.c', runtime: 'gcc 14' },
  { id: 'java', name: 'Java 17', monaco_id: 'java', filename: 'Main.java', runtime: 'OpenJDK 17' },
  { id: 'python', name: 'Python 3', monaco_id: 'python', filename: 'solution.py', runtime: 'Python 3.11' },
  { id: 'go', name: 'Go 1.19', monaco_id: 'go', filename: 'main.go', runtime: 'Go 1.19' },
];

export type EditorFontId =
  | 'anonymous-pro'
  | 'fira-code'
  | 'jetbrains-mono'
  | 'source-code-pro'
  | 'cascadia-code-nerd'
  | 'monospace';

export interface EditorFontOption {
  id: EditorFontId;
  name: string;
  fontFamily: string;
  ligatures: boolean;
  description?: string;
}

export const DEFAULT_EDITOR_FONT_ID: EditorFontId = 'fira-code';

export const EDITOR_FONTS: EditorFontOption[] = [
  {
    id: 'anonymous-pro',
    name: 'Anonymous Pro',
    fontFamily: "'Anonymous Pro', 'Courier New', Courier, monospace",
    ligatures: false,
    description: 'Clean fixed-width designed for coding',
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    fontFamily: "'Fira Code', 'Fira Mono', Menlo, Consolas, monospace",
    ligatures: true,
    description: 'Mozilla-inspired with rich programming ligatures (Default)',
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    fontFamily: "'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace",
    ligatures: true,
    description: 'Developer font crafted for maximum readability',
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    fontFamily: "'Source Code Pro', 'Source Code', Menlo, Monaco, Consolas, monospace",
    ligatures: false,
    description: "Adobe's versatile open-source monospaced typeface",
  },
  {
    id: 'cascadia-code-nerd',
    name: 'Cascadia Code Nerd Font',
    fontFamily: "'Cascadia Code Nerd Font', 'CaskaydiaCove Nerd Font', 'Cascadia Code', Consolas, monospace",
    ligatures: true,
    description: 'Microsoft Cascadia with Nerd Font developer glyphs',
  },
  {
    id: 'monospace',
    name: 'Monospace (system default)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    ligatures: false,
    description: 'Native operating system monospace font',
  },
];

export function getEditorFont(id: string): EditorFontOption {
  return EDITOR_FONTS.find((f) => f.id === id) || EDITOR_FONTS[1]; // Fira Code fallback
}

export const DEFAULT_EDITOR_FONT_SIZE = 16;
export const MIN_EDITOR_FONT_SIZE = 12;
export const MAX_EDITOR_FONT_SIZE = 20;
export const EDITOR_FONT_SIZES = [12, 13, 14, 15, 16, 17, 18, 19, 20] as const;

