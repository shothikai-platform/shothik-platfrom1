// ============================================
// Shothik AI - Domain Interfaces
// Core contracts between all domains
// ============================================

// ============================================
// USER & AUTHENTICATION
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'basic' | 'pro' | 'premium';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
}

export interface IAuthService {
  login(email: string, password: string): Promise<AuthSession>;
  register(email: string, password: string, name: string): Promise<User>;
  logout(sessionId: string): Promise<void>;
  validateToken(token: string): Promise<User | null>;
}

// ============================================
// BILLING & SUBSCRIPTIONS
// ============================================

export interface Subscription {
  userId: string;
  tier: 'basic' | 'pro' | 'premium';
  expiresAt: Date;
  features: string[];
}

export interface UsageQuota {
  userId: string;
  paraphraseUsed: number;
  paraphraseLimit: number;
  plagiarismUsed: number;
  plagiarismLimit: number;
  resetsAt: Date;
}

export interface IBillingService {
  getSubscription(userId: string): Promise<Subscription>;
  getUsageQuota(userId: string): Promise<UsageQuota>;
  checkQuota(userId: string, feature: string): Promise<boolean>;
  incrementUsage(userId: string, feature: string, amount: number): Promise<void>;
  purchaseTopUp(userId: string, type: string, amount: number): Promise<void>;
}

// ============================================
// WRITING DOMAIN
// ============================================

export type ParaphraseMode = 'basic' | 'formal' | 'creative' | 'academic';

export interface ParaphraseRequest {
  text: string;
  mode: ParaphraseMode;
  preserveWords?: string[];
}

export interface ParaphraseResult {
  text: string;
  originalLength: number;
  newLength: number;
  changes: TextChange[];
}

export interface TextChange {
  original: string;
  replacement: string;
  position: number;
}

export interface GrammarIssue {
  message: string;
  suggestion: string;
  start: number;
  end: number;
  severity: 'error' | 'warning' | 'info';
}

export interface PlagiarismResult {
  score: number; // 0-100
  matches: PlagiarismMatch[];
}

export interface PlagiarismMatch {
  text: string;
  source: string;
  similarity: number;
}

export interface AIDetectionResult {
  isAI: boolean;
  confidence: number;
  perplexity: number;
  burstiness: number;
}

export interface IParaphrasingService {
  paraphrase(request: ParaphraseRequest): Promise<ParaphraseResult>;
}

export interface IGrammarService {
  check(text: string): Promise<GrammarIssue[]>;
}

export interface IPlagiarismService {
  check(text: string): Promise<PlagiarismResult>;
}

export interface IAIDetectionService {
  detect(text: string): Promise<AIDetectionResult>;
}

export interface HumanizeRequest {
  text: string;
  intensity: 'light' | 'medium' | 'aggressive';
  preserveMeaning?: boolean;
}

export interface HumanizeResult {
  text: string;
  changes: HumanizeChange[];
  metrics: {
    originalPerplexity: number;
    newPerplexity: number;
    burstiness: number;
  };
}

export interface HumanizeChange {
  original: string;
  replacement: string;
  type: 'synonym' | 'restructure' | 'idiom' | 'variation';
}

export interface IHumanizerService {
  humanize(request: HumanizeRequest): Promise<HumanizeResult>;
}

export interface ISummarizerService {
  summarize(text: string, ratio?: number): Promise<string>;
}

export interface ITranslatorService {
  translate(text: string, from: string, to: string): Promise<string>;
}

// ============================================
// AGENT DOMAIN
// ============================================

export interface AgentInput {
  query: string;
  context?: Record<string, unknown>;
  userId: string;
}

export interface AgentOutput {
  result: string;
  sources?: string[];
  metadata?: Record<string, unknown>;
}

export interface IAgent {
  execute(input: AgentInput): Promise<AgentOutput>;
}

export interface IResearchAgent extends IAgent {
  research(query: string, depth?: number): Promise<{
    summary: string;
    sources: ResearchSource[];
    keyPoints: string[];
  }>;
}

export interface ResearchSource {
  title: string;
  url: string;
  relevance: number;
}

export interface ISlideGeneratorAgent extends IAgent {
  generate(topic: string, slideCount?: number): Promise<{
    title: string;
    slides: Slide[];
  }>;
}

export interface Slide {
  title: string;
  content: string;
  notes?: string;
}

export interface ISheetGeneratorAgent extends IAgent {
  generate(description: string): Promise<{
    headers: string[];
    rows: string[][];
  }>;
}

// ============================================
// STUDIO DOMAIN
// ============================================

export interface Project {
  id: string;
  userId: string;
  title: string;
  type: 'assignment' | 'book' | 'blog' | 'marketing';
  status: 'draft' | 'editing' | 'published';
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  versions: Version[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Version {
  id: string;
  chapterId: string;
  content: string;
  createdAt: Date;
}

export interface IProjectService {
  createProject(userId: string, title: string, type: Project['type']): Promise<Project>;
  getProject(projectId: string): Promise<Project>;
  updateProject(projectId: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
}

export interface IChapterService {
  createChapter(projectId: string, title: string): Promise<Chapter>;
  updateContent(chapterId: string, content: string): Promise<Chapter>;
  saveVersion(chapterId: string): Promise<Version>;
}

// ============================================
// MARKETING DOMAIN
// ============================================

export interface AdCampaign {
  id: string;
  userId: string;
  name: string;
  platform: 'meta' | 'google' | 'linkedin';
  objective: string;
  budget: number;
  status: 'draft' | 'active' | 'paused';
}

export interface IMetaAutomationService {
  createCampaign(userId: string, config: Omit<AdCampaign, 'id' | 'userId'>): Promise<AdCampaign>;
  generateCreative(prompt: string): Promise<{
    headline: string;
    body: string;
    imagePrompt: string;
  }>;
}

// ============================================
// INFRASTRUCTURE
// ============================================

export interface CacheConfig {
  ttl: number; // seconds
  key: string;
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface LLMRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  tokensUsed: number;
  model: string;
}

export interface ILLMService {
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<string>;
}

export interface INLPService {
  analyze(text: string): Promise<{
    tokens: string[];
    entities: Entity[];
    sentiment: number;
  }>;
  checkGrammar(text: string): Promise<GrammarIssue[]>;
}

export interface Entity {
  text: string;
  type: string;
  start: number;
  end: number;
}
