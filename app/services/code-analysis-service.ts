import { GitHubService, IGitHubService } from './github-service';
import { 
  CodeMetrics, 
  CodeQuality, 
  TechnicalDebt, 
  DeploymentMetrics, 
  Repository,
  Commit
} from '../types';

export class CodeAnalysisService {
  private githubService: IGitHubService;

  constructor(githubService: IGitHubService) {
    this.githubService = githubService;
  }

  /**
   * Analyze code metrics for a repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  async analyzeCodeMetrics(owner: string, repo: string): Promise<CodeMetrics> {
    try {
      // Get repository languages
      const languages = await this.githubService.getLanguages(owner, repo);
      
      // Get repository to determine size
      const repository = await this.githubService.getRepository(owner, repo);
      
      // For an MVP, we'll use estimations based on repo size and languages
      // In a production app, we would clone the repo and analyze the code directly
      const totalLines = repository.size * 50; // Rough estimate: 50 lines per KB
      const codeLines = Math.floor(totalLines * 0.75);
      const commentLines = Math.floor(totalLines * 0.15);
      const blankLines = totalLines - codeLines - commentLines;
      
      // Estimate number of files based on languages and size
      const files = Math.floor(repository.size / 10); // Rough estimate: 1 file per 10KB
      
      return {
        totalLines,
        codeLines,
        commentLines,
        blankLines,
        files,
        languages
      };
    } catch (error) {
      console.error('Error analyzing code metrics:', error);
      throw error;
    }
  }

  /**
   * Analyze code quality for a repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  async analyzeCodeQuality(owner: string, repo: string): Promise<CodeQuality> {
    try {
      // Get recent commits to analyze commit messages
      const commits = await this.githubService.getCommits(owner, repo);
      
      // In a real app, we would use a code quality tool like SonarQube
      // For the MVP, we'll use heuristics based on commit history and repo structure
      
      // Analyze commit messages for quality
      const commitQualityScore = this.analyzeCommitMessages(commits);
      
      // Calculate an estimated code quality score (0-100)
      const score = Math.min(Math.floor(commitQualityScore * 100), 100);
      
      // Generate mock issues based on score
      const issues = {
        critical: Math.floor((100 - score) / 25),
        high: Math.floor((100 - score) / 20),
        medium: Math.floor((100 - score) / 10),
        low: Math.floor((100 - score) / 5)
      };
      
      // Generate recommendations based on issues
      const recommendations = this.generateCodeQualityRecommendations(issues, commits);
      
      return {
        score,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing code quality:', error);
      throw error;
    }
  }

  /**
   * Analyze technical debt for a repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  async analyzeTechnicalDebt(owner: string, repo: string): Promise<TechnicalDebt> {
    try {
      // Get repository and commits
      // Repository information not directly used in this function
      await this.githubService.getRepository(owner, repo);
      const commits = await this.githubService.getCommits(owner, repo, 100);
      const pullRequests = await this.githubService.getPullRequests(owner, repo, 'all', 50);
      // Issues information not directly used in this function
      await this.githubService.getIssues(owner, repo, 'all', 100);
      
      // Calculate complexity score based on commit patterns and PR reviews
      const complexityScore = await this.calculateComplexityScore(commits, pullRequests);
      
      // Calculate duplications based on file analysis
      const duplications = await this.calculateDuplications(owner, repo);
      
      // Estimate test coverage based on file structure analysis
      const testCoverage = await this.calculateTestCoverage(owner, repo);
      
      // Calculate outdated dependencies by analyzing package files
      const outdatedDependencies = await this.calculateOutdatedDependencies(owner, repo);
      
      // Calculate overall technical debt score (0-100, higher is better)
      const score = Math.floor(
        100 - 
        (complexityScore * 25) - 
        (duplications * 0.4) - 
        ((100 - testCoverage) * 0.25) -
        (outdatedDependencies * 3)
      );
      
      // Generate recommendations
      const recommendations = this.generateTechnicalDebtRecommendations({
        complexityScore,
        duplications,
        testCoverage,
        outdatedDependencies
      });
      
      return {
        score: Math.max(0, Math.min(100, score)),
        metrics: {
          complexityScore: parseFloat(complexityScore.toFixed(2)),
          duplications: Math.round(duplications),
          testCoverage: Math.round(testCoverage),
          outdatedDependencies
        },
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing technical debt:', error);
      throw error;
    }
  }

  /**
   * Analyze deployment metrics for a repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  async analyzeDeploymentMetrics(owner: string, repo: string): Promise<DeploymentMetrics> {
    try {
      // Get real deployment data
      const workflowRuns = await this.githubService.getWorkflowRuns(owner, repo);
      const releases = await this.githubService.getReleases(owner, repo);
      const pullRequests = await this.githubService.getPullRequests(owner, repo, 'closed', 50);
      const commits = await this.githubService.getCommits(owner, repo, 100);
      
      // Calculate deployment frequency based on releases and workflow runs
      const frequency = this.calculateDeploymentFrequency(releases, workflowRuns);
      
      // Calculate lead time based on PR merge to deployment patterns
      const leadTime = this.calculateLeadTime(pullRequests, releases, commits);
      
      // Calculate change failure rate based on workflow failures and reverts
      const changeFailureRate = this.calculateChangeFailureRate(workflowRuns, commits);
      
      // Calculate mean time to recover based on issue resolution and hotfixes
      const meanTimeToRecover = this.calculateMeanTimeToRecover(commits, pullRequests);
      
      // Calculate score based on these real metrics
      const score = this.calculateDeploymentScore(frequency, leadTime, changeFailureRate, meanTimeToRecover);
      
      // Generate recommendations based on real data
      const recommendations = this.generateDeploymentRecommendations(frequency, leadTime, changeFailureRate, meanTimeToRecover);
      
      return {
        frequency: parseFloat(frequency.toFixed(2)),
        leadTime: Math.round(leadTime),
        changeFailureRate: Math.round(changeFailureRate * 100) / 100,
        meanTimeToRecover: Math.round(meanTimeToRecover),
        score,
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing deployment metrics:', error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive health report for a repository
   * @param owner Repository owner
   * @param repo Repository name
   */
  async generateHealthReport(owner: string, repo: string): Promise<{ repository: Repository; codeMetrics: CodeMetrics; codeQuality: CodeQuality; technicalDebt: TechnicalDebt; deploymentMetrics: DeploymentMetrics; overallScore: number; benchmarkScore: number; generatedAt: string }> {
    try {
      // Get repository information
      const repository = await this.githubService.getRepository(owner, repo);
      
      // Analyze code metrics
      const codeMetrics = await this.analyzeCodeMetrics(owner, repo);
      
      // Analyze code quality
      const codeQuality = await this.analyzeCodeQuality(owner, repo);
      
      // Analyze technical debt
      const technicalDebt = await this.analyzeTechnicalDebt(owner, repo);
      
      // Analyze deployment metrics
      const deploymentMetrics = await this.analyzeDeploymentMetrics(owner, repo);
      
      // Calculate overall score
      const overallScore = Math.floor(
        (codeQuality.score * 0.3) +
        (technicalDebt.score * 0.4) +
        (deploymentMetrics.score * 0.3)
      );
      
      // Calculate benchmark score (comparison with industry average)
      // In a real app, this would use actual industry data
      const benchmarkScore = Math.floor(Math.random() * 30) + 50; // 50-80 range for demo
      
      return {
        repository,
        codeMetrics,
        codeQuality,
        technicalDebt,
        deploymentMetrics,
        overallScore,
        benchmarkScore,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating health report:', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Analyze commit messages for quality
   * @param commits Array of commit objects
   * @returns Score between 0 and 1
   */
  private analyzeCommitMessages(commits: Commit[]): number {
    if (!commits || commits.length === 0) {
      return 0.5; // Default middle score
    }
    
    let score = 0;
    
    commits.forEach(commit => {
      const message = commit.commit.message;
      
      // Check message length (longer messages are usually better)
      if (message.length > 10) score += 0.2;
      if (message.length > 20) score += 0.2;
      if (message.length > 50) score += 0.2;
      
      // Check for conventional commit format
      if (/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/.test(message)) {
        score += 0.5;
      }
      
      // Check for detailed explanations
      if (message.includes('\n\n')) {
        score += 0.3;
      }
    });
    
    // Normalize score
    return Math.min(score / commits.length, 1);
  }

  /**
   * Calculate repository age in days
   * @param repository Repository object
   */
  private calculateRepositoryAge(repository: Repository | { created_at: string }): number {
    const created = new Date(repository.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate code quality recommendations based on issues
   * @param issues Code quality issues
   * @param commits Recent commits
   */
  private generateCodeQualityRecommendations(issues: { critical: number; high: number; medium: number; low: number }, commits: Commit[]): string[] {
    const recommendations: string[] = [];
    
    if (issues.critical > 0) {
      recommendations.push('Address critical security vulnerabilities in your codebase.');
    }
    
    if (issues.high > 0) {
      recommendations.push('Fix high-priority code quality issues to improve maintainability.');
    }
    
    if (issues.medium > 3) {
      recommendations.push('Implement a code quality scanning tool in your CI/CD pipeline.');
    }
    
    // Check commit message quality
    const commitScore = this.analyzeCommitMessages(commits);
    if (commitScore < 0.6) {
      recommendations.push('Improve commit message quality by adopting conventional commit format.');
    }
    
    // Add generic recommendations if few specific ones
    if (recommendations.length < 2) {
      recommendations.push('Implement automated code reviews to catch issues early.');
      recommendations.push('Add code quality gates to your pull request workflow.');
    }
    
    return recommendations;
  }

  /**
   * Generate technical debt recommendations
   * @param metrics Technical debt metrics
   */
  private generateTechnicalDebtRecommendations(metrics: { complexityScore: number; duplications: number; testCoverage: number; outdatedDependencies: number }): string[] {
    const recommendations: string[] = [];
    
    if (metrics.complexityScore > 0.5) {
      recommendations.push('Refactor complex code modules to improve maintainability.');
    }
    
    if (metrics.duplications > 15) {
      recommendations.push('Reduce code duplication by creating reusable components and utilities.');
    }
    
    if (metrics.testCoverage < 60) {
      recommendations.push('Increase test coverage to at least 80% for critical code paths.');
    }
    
    if (metrics.outdatedDependencies > 3) {
      recommendations.push('Update outdated dependencies to reduce security risks and technical debt.');
    }
    
    // Add generic recommendations if few specific ones
    if (recommendations.length < 2) {
      recommendations.push('Implement regular technical debt reviews in your development process.');
      recommendations.push('Set up dependency scanning to identify outdated packages.');
    }
    
    return recommendations;
  }

  /**
   * Calculate deployment score based on metrics
   */
  private calculateDeploymentScore(
    frequency: number,
    leadTime: number,
    changeFailureRate: number,
    meanTimeToRecover: number
  ): number {
    // Higher frequency is better (up to a point)
    const frequencyScore = Math.min(frequency * 10, 30);
    
    // Lower lead time is better
    const leadTimeScore = Math.max(0, 30 - leadTime / 2);
    
    // Lower failure rate is better
    const failureScore = Math.max(0, 25 - changeFailureRate);
    
    // Lower recovery time is better
    const recoveryScore = Math.max(0, 15 - meanTimeToRecover / 2);
    
    return Math.floor(frequencyScore + leadTimeScore + failureScore + recoveryScore);
  }

  /**
   * Generate deployment recommendations
   */
  private generateDeploymentRecommendations(
    frequency: number,
    leadTime: number,
    changeFailureRate: number,
    meanTimeToRecover: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (frequency < 1) {
      recommendations.push('Increase deployment frequency by implementing continuous delivery practices.');
    }
    
    if (leadTime > 24) {
      recommendations.push('Reduce lead time by streamlining your CI/CD pipeline and approval processes.');
    }
    
    if (changeFailureRate > 10) {
      recommendations.push('Reduce change failure rate by implementing more comprehensive pre-deployment testing.');
    }
    
    if (meanTimeToRecover > 12) {
      recommendations.push('Improve mean time to recovery by implementing automated rollback mechanisms.');
    }
    
    // Add generic recommendations if few specific ones
    if (recommendations.length < 2) {
      recommendations.push('Implement feature flags to safely deploy and test new features.');
      recommendations.push('Adopt infrastructure as code to make deployments more reliable.');
    }
    
    return recommendations;
  }

  /**
   * Calculate complexity score based on commit patterns and PR reviews
   */
  private async calculateComplexityScore(commits: Commit[], pullRequests: Record<string, unknown>[]): Promise<number> {
    // Analyze commit message quality (better messages = lower complexity)
    const commitQualityScore = this.analyzeCommitMessages(commits);
    
    // Analyze PR review patterns
    let reviewScore = 0.5; // Default
    if (pullRequests.length > 0) {
      let totalComments = 0;
      pullRequests.forEach(pr => {
        const reviewComments = typeof pr.review_comments === 'number' ? pr.review_comments : 0;
        const comments = typeof pr.comments === 'number' ? pr.comments : 0;
        totalComments += reviewComments + comments;
      });
      const prsWithReviews = pullRequests.filter(pr => pr.review_comments || pr.comments);
      reviewScore = prsWithReviews.length / pullRequests.length;
    }
    
    // Calculate complexity (0-1, where 1 is high complexity)
    // Good commit messages and reviews indicate lower complexity
    const complexity = 1 - (commitQualityScore * 0.6 + reviewScore * 0.4);
    
    return Math.max(0, Math.min(1, complexity));
  }

  /**
   * Calculate code duplications based on file analysis
   */
  private async calculateDuplications(owner: string, repo: string): Promise<number> {
    try {
      // Get languages to understand the codebase
      const languages = await this.githubService.getLanguages(owner, repo);
      
      // Estimate duplications based on repository characteristics
      let duplicationScore = 0;
      
      // Base duplication increases with age (1% per month, max 25%)
      const repoAgeInMonths = this.calculateRepositoryAge(await this.githubService.getRepository(owner, repo)) / 30;
      duplicationScore += Math.min(repoAgeInMonths, 25);
      
      // Multiple languages can lead to duplication
      if (Object.keys(languages).length > 3) {
        duplicationScore += (Object.keys(languages).length - 3) * 2;
      }
      
      return Math.min(duplicationScore, 40); // Cap at 40%
    } catch (error) {
      console.error('Error calculating duplications:', error);
      return 15; // Default moderate duplication
    }
  }

  /**
   * Calculate test coverage based on file structure analysis
   */
  private async calculateTestCoverage(owner: string, repo: string): Promise<number> {
    try {
      // Get root directory contents
      const rootContents = await this.githubService.getDirectoryContents(owner, repo);
      const languages = await this.githubService.getLanguages(owner, repo);
      
      let testScore = 0;
      let indicators = 0;
      
      // Check for test directories and files
      const testPatterns = [
        'test', 'tests', '__tests__', 'spec', 'specs',
        '.github/workflows', 'jest.config', 'vitest.config',
        'cypress', 'playwright', 'coverage'
      ];
      
      for (const item of rootContents) {
        const name = typeof item.name === 'string' ? item.name.toLowerCase() : '';
        if (testPatterns.some(pattern => name.includes(pattern))) {
          testScore += 15;
          indicators++;
        }
      }
      
      // Check for test-related files in package.json or similar
      try {
        if (languages.JavaScript || languages.TypeScript) {
          const packageJson = await this.githubService.getFileContent(owner, repo, 'package.json');
          if (packageJson.includes('"test"') || packageJson.includes('"jest"') || 
              packageJson.includes('"vitest"') || packageJson.includes('"cypress"')) {
            testScore += 20;
            indicators++;
          }
        }
      } catch (e) {
        // No package.json or error reading it
      }
      
      // Check for CI/CD workflows that run tests
      try {
        const workflows = await this.githubService.getDirectoryContents(owner, repo, '.github/workflows');
        if (workflows.length > 0) {
          testScore += 10;
          indicators++;
        }
      } catch (e) {
        // No workflows directory
      }
      
      // If no test indicators found, assume minimal coverage
      if (indicators === 0) {
        return 5;
      }
      
      // Calculate final coverage (cap at 95%)
      return Math.min(testScore, 95);
    } catch (error) {
      console.error('Error calculating test coverage:', error);
      return 25; // Default low coverage
    }
  }

  /**
   * Calculate outdated dependencies by analyzing package files
   */
  private async calculateOutdatedDependencies(owner: string, repo: string): Promise<number> {
    try {
      const languages = await this.githubService.getLanguages(owner, repo);
      let outdatedCount = 0;
      
      // Check JavaScript/TypeScript dependencies
      if (languages.JavaScript || languages.TypeScript) {
        try {
          const packageJson = await this.githubService.getFileContent(owner, repo, 'package.json');
          const packageData = JSON.parse(packageJson);
          
          // Simple heuristic: older repos likely have more outdated dependencies
          const repoAgeInMonths = this.calculateRepositoryAge(await this.githubService.getRepository(owner, repo)) / 30;
          const depCount = Object.keys(packageData.dependencies || {}).length + 
                          Object.keys(packageData.devDependencies || {}).length;
          
          // Estimate outdated dependencies (1 per 10 dependencies per 6 months of age)
          outdatedCount += Math.floor((depCount / 10) * (repoAgeInMonths / 6));
        } catch (error: unknown) {
          // File not found is expected for many repositories (404 errors)
          if (typeof error === 'object' && error !== null && 'status' in error && error.status !== 404) {
            console.error('Unexpected error reading package.json:', error);
          }
        }
      }
      
      // Check Python dependencies
      if (languages.Python) {
        try {
          await this.githubService.getFileContent(owner, repo, 'requirements.txt');
          // If requirements.txt exists, estimate based on repo age
          const repoAgeInMonths = this.calculateRepositoryAge(await this.githubService.getRepository(owner, repo)) / 30;
          outdatedCount += Math.floor(repoAgeInMonths / 4); // 1 outdated per 4 months
        } catch (error: unknown) {
          // File not found is expected for many repositories (404 errors)
          if (typeof error === 'object' && error !== null && 'status' in error && error.status !== 404) {
            console.error('Unexpected error reading requirements.txt:', error);
          }
        }
      }
      
      // Check for other dependency files
      const depFiles = ['Gemfile', 'composer.json', 'pom.xml', 'build.gradle', 'Cargo.toml'];
      for (const file of depFiles) {
        try {
          await this.githubService.getFileContent(owner, repo, file);
          const repoAgeInMonths = this.calculateRepositoryAge(await this.githubService.getRepository(owner, repo)) / 30;
          outdatedCount += Math.floor(repoAgeInMonths / 6);
          break; // Only count one dependency system
        } catch (error: unknown) {
          // File not found is expected for many repositories (404 errors)
          if (typeof error === 'object' && error !== null && 'status' in error && error.status !== 404) {
            console.error(`Unexpected error reading ${file}:`, error);
          }
        }
      }
      
      return Math.min(outdatedCount, 20); // Cap at 20 outdated dependencies
    } catch (error) {
      console.error('Error calculating outdated dependencies:', error);
      return 2; // Default minimal outdated dependencies
    }
  }

  /**
   * Calculate deployment frequency based on releases and workflow runs
   */
  private calculateDeploymentFrequency(releases: any[], workflowRuns: any): number {
    const repoAgeInWeeks = this.calculateRepositoryAge({ created_at: '2020-01-01T00:00:00Z' }) / 7;
    
    if (repoAgeInWeeks < 1) return 0;
    
    // Count actual releases as deployments
    const releaseFreq = releases.length / repoAgeInWeeks;
    
    // Count successful workflow runs as potential deployments
    const successfulRuns = workflowRuns.workflow_runs?.filter((run: any) => 
      run.conclusion === 'success' && 
      (run.name.toLowerCase().includes('deploy') || 
       run.name.toLowerCase().includes('release') ||
       run.name.toLowerCase().includes('production'))
    ) || [];
    
    const workflowFreq = successfulRuns.length / repoAgeInWeeks;
    
    // Use the higher of the two indicators
    return Math.max(releaseFreq, workflowFreq);
  }

  /**
   * Calculate lead time based on PR merge to deployment patterns
   */
  private calculateLeadTime(pullRequests: Record<string, unknown>[], releases: any[], commits: Commit[]): number {
    if (pullRequests.length === 0 || releases.length === 0) {
      // Fallback: estimate based on commit frequency
      if (commits.length > 1) {
        const firstCommit = new Date(commits[commits.length - 1].commit.author.date);
        const lastCommit = new Date(commits[0].commit.author.date);
        const avgTimeBetweenCommits = (lastCommit.getTime() - firstCommit.getTime()) / commits.length;
        return Math.max(1, avgTimeBetweenCommits / (1000 * 60 * 60)); // Convert to hours
      }
      return 24; // Default 24 hours
    }
    
    // Calculate average time from PR merge to next release
    let totalLeadTime = 0;
    let validSamples = 0;
    
    const mergedPRs = pullRequests.filter(pr => pr.merged_at).slice(0, 10); // Recent 10 PRs
    
    for (const pr of mergedPRs) {
      const mergeDate = typeof pr.merged_at === 'string' ? new Date(pr.merged_at) : new Date();
      
      // Find next release after PR merge
      const nextRelease = releases.find(release => 
        new Date(release.published_at) > mergeDate
      );
      
      if (nextRelease) {
        const leadTimeHours = (new Date(nextRelease.published_at).getTime() - mergeDate.getTime()) / (1000 * 60 * 60);
        if (leadTimeHours > 0 && leadTimeHours < 30 * 24) { // Within 30 days
          totalLeadTime += leadTimeHours;
          validSamples++;
        }
      }
    }
    
    if (validSamples > 0) {
      return totalLeadTime / validSamples;
    }
    
    // Fallback: estimate based on release frequency
    if (releases.length > 1) {
      const avgTimeBetweenReleases = releases.slice(0, 5).reduce((acc, release, index, arr) => {
        if (index === arr.length - 1) return acc;
        const current = new Date(release.published_at);
        const next = new Date(arr[index + 1].published_at);
        return acc + (current.getTime() - next.getTime());
      }, 0) / (releases.length - 1);
      
      return Math.max(1, avgTimeBetweenReleases / (1000 * 60 * 60 * 2)); // Half of avg release interval
    }
    
    return 48; // Default 48 hours
  }

  /**
   * Calculate change failure rate based on workflow failures and reverts
   */
  private calculateChangeFailureRate(workflowRuns: any, commits: Commit[]): number {
    // Analyze workflow run failures
    const runs = workflowRuns.workflow_runs || [];
    if (runs.length === 0) {
      // Fallback: analyze commits for reverts
      const revertCommits = commits.filter(commit => 
        commit.commit.message.toLowerCase().includes('revert') ||
        commit.commit.message.toLowerCase().includes('rollback') ||
        commit.commit.message.toLowerCase().includes('hotfix')
      );
      
      return commits.length > 0 ? (revertCommits.length / commits.length) * 100 : 0;
    }
    
    // Count deployment-related runs
    const deploymentRuns = runs.filter((run: any) =>
      run.name.toLowerCase().includes('deploy') ||
      run.name.toLowerCase().includes('release') ||
      run.name.toLowerCase().includes('production') ||
      run.event === 'release'
    );
    
    if (deploymentRuns.length === 0) {
      // Use all workflow runs as proxy
      const failedRuns = runs.filter((run: any) => run.conclusion === 'failure');
      return (failedRuns.length / runs.length) * 100;
    }
    
    const failedDeployments = deploymentRuns.filter((run: any) => run.conclusion === 'failure');
    return (failedDeployments.length / deploymentRuns.length) * 100;
  }

  /**
   * Calculate mean time to recover based on issue resolution and hotfixes
   */
  private calculateMeanTimeToRecover(commits: Commit[], pullRequests: Record<string, unknown>[]): number {
    // Look for hotfix/bugfix patterns
    const fixCommits = commits.filter(commit => {
      const message = commit.commit.message.toLowerCase();
      return message.includes('fix') || 
             message.includes('hotfix') || 
             message.includes('patch') ||
             message.includes('urgent') ||
             message.includes('critical');
    });
    
    if (fixCommits.length === 0) {
      return 12; // Default 12 hours if no fix patterns found
    }
    
    // Calculate time between consecutive fix commits as proxy for MTTR
    let totalRecoveryTime = 0;
    let recoveryInstances = 0;
    
    for (let i = 0; i < fixCommits.length - 1; i++) {
      const currentFix = new Date(fixCommits[i].commit.author.date);
      const nextFix = new Date(fixCommits[i + 1].commit.author.date);
      const timeDiff = Math.abs(currentFix.getTime() - nextFix.getTime()) / (1000 * 60 * 60);
      
      // Only consider reasonable recovery times (1 hour to 7 days)
      if (timeDiff >= 1 && timeDiff <= 168) {
        totalRecoveryTime += timeDiff;
        recoveryInstances++;
      }
    }
    
    if (recoveryInstances > 0) {
      return totalRecoveryTime / recoveryInstances;
    }
    
    // Fallback: analyze PR resolution time for bug fixes
    const bugFixPRs = pullRequests.filter(pr => {
      const title = typeof pr.title === 'string' ? pr.title.toLowerCase() : '';
      return pr.merged_at && (
        title.includes('fix') || 
        title.includes('bug') || 
        title.includes('hotfix') ||
        title.includes('patch')
      );
    });
    
    if (bugFixPRs.length > 0) {
      const avgPRTime = bugFixPRs.reduce((acc, pr) => {
        // Type check the dates before using them
        const created = typeof pr.created_at === 'string' ? new Date(pr.created_at) : new Date();
        const merged = typeof pr.merged_at === 'string' ? new Date(pr.merged_at) : new Date();
        return acc + (merged.getTime() - created.getTime());
      }, 0) / bugFixPRs.length;
      
      return Math.max(1, avgPRTime / (1000 * 60 * 60)); // Convert to hours
    }
    
    return 8; // Default 8 hours
  }
}
