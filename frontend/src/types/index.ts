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
  examples: ProblemExample[];
  tags: Tag[];
  test_cases?: TestCase[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProblemListResponse {
  items: ProblemItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
