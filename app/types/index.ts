// GitHub Repository Types
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  language: string;
  default_branch: string;
}

// Commit Types
export interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

// Code Analysis Types
export interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  files: number;
  languages: { [key: string]: number };
}

export interface CodeQuality {
  score: number;
  issues: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recommendations: string[];
}

export interface TechnicalDebt {
  score: number;
  metrics: {
    complexityScore: number;
    duplications: number;
    testCoverage: number;
    outdatedDependencies: number;
  };
  recommendations: string[];
}

export interface DeploymentMetrics {
  frequency: number; // deployments per week
  leadTime: number; // average time from commit to deployment in hours
  changeFailureRate: number; // percentage of deployments causing failures
  meanTimeToRecover: number; // average time to recover from failures in hours
  score: number;
  recommendations: string[];
}

// Overall Health Report
export interface HealthReport {
  repository: Repository;
  codeMetrics: CodeMetrics;
  codeQuality: CodeQuality;
  technicalDebt: TechnicalDebt;
  deploymentMetrics: DeploymentMetrics;
  overallScore: number;
  benchmarkScore: number; // comparison with industry peers
  generatedAt: string;
}

// GitHub Authentication
export interface GitHubAuth {
  token?: string;
  username?: string;
  password?: string;
}
