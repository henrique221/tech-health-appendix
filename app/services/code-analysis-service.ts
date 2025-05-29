import { GitHubService } from './github-service';
import { 
  CodeMetrics, 
  CodeQuality, 
  TechnicalDebt, 
  DeploymentMetrics, 
  Repository,
  Commit
} from '../types';

export class CodeAnalysisService {
  private githubService: GitHubService;

  constructor(githubService: GitHubService) {
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
      const repository = await this.githubService.getRepository(owner, repo);
      const commits = await this.githubService.getCommits(owner, repo);
      
      // Calculate technical debt metrics
      // For MVP, we'll use heuristics and estimations
      
      // Complexity score based on commit frequency and message quality
      const complexityScore = 1 - this.analyzeCommitMessages(commits);
      
      // Estimate duplications based on repository size and age
      const repoAgeInDays = this.calculateRepositoryAge(repository);
      const duplications = Math.min(Math.floor(repoAgeInDays / 30) * 5, 40); // 5% increase per month, max 40%
      
      // Estimate test coverage (would require actual code analysis in production)
      const testCoverage = Math.floor(Math.random() * 60) + 20; // Random between 20-80% for demo
      
      // Mock outdated dependencies (would require package.json analysis in production)
      const outdatedDependencies = Math.floor(Math.random() * 8); // 0-7 outdated dependencies
      
      // Calculate overall technical debt score (0-100, higher is better)
      const score = Math.floor(
        100 - 
        (complexityScore * 30) - 
        (duplications * 0.5) - 
        ((100 - testCoverage) * 0.3) -
        (outdatedDependencies * 5)
      );
      
      // Generate recommendations
      const recommendations = this.generateTechnicalDebtRecommendations({
        complexityScore,
        duplications,
        testCoverage,
        outdatedDependencies
      });
      
      return {
        score: Math.max(0, score),
        metrics: {
          complexityScore: parseFloat(complexityScore.toFixed(2)),
          duplications,
          testCoverage,
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
      // Get workflow runs for CI/CD analysis
      const workflowRuns = await this.githubService.getWorkflowRuns(owner, repo);
      
      // Get commits to estimate lead time
      const commits = await this.githubService.getCommits(owner, repo);
      
      // For MVP, we'll use the workflow runs data to estimate deployment metrics
      // In production, we would need more detailed CI/CD data
      
      // Calculate deployment frequency (deployments per week)
      const totalRuns = workflowRuns.total_count || 0;
      const repository = await this.githubService.getRepository(owner, repo);
      const repoAgeInWeeks = this.calculateRepositoryAge(repository) / 7;
      const frequency = repoAgeInWeeks > 0 ? totalRuns / repoAgeInWeeks : 0;
      
      // Estimate other metrics for the MVP
      const leadTime = Math.floor(Math.random() * 48) + 1; // 1-48 hours
      const changeFailureRate = Math.floor(Math.random() * 20); // 0-20%
      const meanTimeToRecover = Math.floor(Math.random() * 24) + 1; // 1-24 hours
      
      // Calculate score based on these metrics
      const score = this.calculateDeploymentScore(frequency, leadTime, changeFailureRate, meanTimeToRecover);
      
      // Generate recommendations
      const recommendations = this.generateDeploymentRecommendations(frequency, leadTime, changeFailureRate, meanTimeToRecover);
      
      return {
        frequency: parseFloat(frequency.toFixed(2)),
        leadTime,
        changeFailureRate,
        meanTimeToRecover,
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
  async generateHealthReport(owner: string, repo: string): Promise<any> {
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
  private calculateRepositoryAge(repository: Repository): number {
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
  private generateCodeQualityRecommendations(issues: any, commits: Commit[]): string[] {
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
  private generateTechnicalDebtRecommendations(metrics: any): string[] {
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
}
