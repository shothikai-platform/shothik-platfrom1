# Shothik AI - Modular Monolith Implementation Plan

## Architecture Overview

```
shothiknew5/
├── 📁 apps/
│   └── 📁 web/                    # Next.js frontend UI
│
├── 📁 core/                       # Core business logic
│   ├── 📁 auth/                   # Authentication & authorization
│   ├── 📁 billing/                # Payments & subscriptions
│   └── 📁 users/                  # User management
│
├── 📁 domains/                    # Business domains
│   ├── 📁 writing/                # Writing tools (Quillbot competitor)
│   │   ├── paraphrasing/          # LLM paraphrase engine
│   │   ├── grammar/               # NLP grammar check
│   │   ├── summarizer/            # Text summarization
│   │   ├── translator/            # Language translation
│   │   ├── ai-detector/           # AI detection
│   │   └── plagiarism/            # Plagiarism checker
│   │
│   ├── 📁 agents/                 # AI agents (orchestrators)
│   │   ├── deep-research/         # Research agent
│   │   ├── slide-generator/       # Presentation agent
│   │   ├── sheet-generator/       # Spreadsheet agent
│   │   └── work4me/               # General task agent
│   │
│   └── 📁 studio/                 # Writing studio (killer feature)
│       ├── editor/                # Long-form editor
│       ├── project-manager/       # Project organization
│       └── publishing/            # Publishing workflows
│
├── 📁 marketing/                  # Marketing automation
│   ├── meta-automation/           # Meta ads
│   └── seo-tools/                 # SEO optimization
│
├── 📁 infrastructure/             # Technical infrastructure
│   ├── 📁 llm/                    # LLM providers (Gemini, etc.)
│   ├── 📁 nlp/                    # NLP engine (spaCy, etc.)
│   ├── 📁 cache/                  # Redis caching
│   └── 📁 external-apis/          # Third-party integrations
│
└── 📁 shared/                     # Shared resources
    ├── 📁 types/                  # TypeScript types
    ├── 📁 ui/                     # UI components
    ├── 📁 utils/                  # Utilities
    └── 📁 config/                 # Shared configs
```

---

## Core Product Architecture

### 1️⃣ Writing Engine (Core Revenue Layer)

**Shared Pipeline Pattern:**
```
Input → Preprocess → LLM/NLP → Postprocess → Detection → Return
```

**Implementation:**
```typescript
// domains/writing/shared/TextProcessingPipeline.ts
export class TextProcessingPipeline {
  async process(input: TextInput): Promise<TextOutput> {
    const preprocessed = await this.preprocess(input);
    const processed = await this.executeEngine(preprocessed);
    const postprocessed = await this.postprocess(processed);
    return await this.validate(postprocessed);
  }
}
```

**Cost Control Strategy:**
| Feature | Engine | Caching |
|---------|--------|---------|
| Grammar | NLP (spaCy) | Yes |
| Light Paraphrase | NLP | Yes |
| Academic Paraphrase | LLM (Gemini) | Yes |
| AI Detection | NLP + LLM | Yes |
| Plagiarism | External API | No |
| Summarizer | LLM | Yes |
| Translator | LLM | Yes |

### 2️⃣ Agent Layer (Differentiation Layer)

**Rule: Agents NEVER call frontend directly. Agents call domain services.**

```typescript
// domains/agents/deep-research/ResearchAgent.ts
export class ResearchAgent {
  constructor(
    private writingService: WritingService,
    private searchService: SearchService,
    private summarizer: SummarizerService
  ) {}

  async execute(query: string): Promise<ResearchReport> {
    const sources = await this.searchService.search(query);
    const summaries = await this.summarizer.summarizeBatch(sources);
    return this.writingService.generateReport(summaries);
  }
}
```

### 3️⃣ Writing Studio (Experience Layer)

**User Journey:**
```
Student Phase → Creator Phase → Earning Phase
     ↓               ↓               ↓
Assignments     Book writing    Marketing
Research help   Formatting      SEO blogs
Slides          Publishing      Social promo
```

**Data Model:**
```typescript
interface Project {
  id: string;
  userId: string;
  type: 'assignment' | 'book' | 'blog' | 'marketing';
  chapters: Chapter[];
  status: 'draft' | 'editing' | 'published';
}

interface Chapter {
  id: string;
  projectId: string;
  content: string;
  versions: Version[];
}
```

---

## Monetization Implementation

### Tier Model

```typescript
// core/billing/TierConfig.ts
export const TIER_CONFIG = {
  basic: {
    paraphraseLimit: 100,        // per day
    plagiarismWords: 0,
    aiDetector: false,
    agents: false,
    price: 0
  },
  pro: {
    paraphraseLimit: Infinity,
    plagiarismWords: 1000,       // per month
    aiDetector: true,
    agents: ['basic'],
    price: 9.99
  },
  premium: {
    paraphraseLimit: Infinity,
    plagiarismWords: 10000,      // per month
    aiDetector: true,
    agents: ['all'],
    publishing: true,
    marketing: true,
    price: 29.99
  }
};
```

### Plagiarism Top-up
```typescript
// core/billing/TopUpService.ts
export class TopUpService {
  async purchasePlagiarismWords(userId: string, words: number) {
    // Stripe payment
    // Add words to user's balance
  }
}
```

---

## Cost Control Implementation

### 1. Engine Selection Logic
```typescript
// infrastructure/llm/EngineSelector.ts
export class EngineSelector {
  selectEngine(request: ProcessingRequest): Engine {
    // Use NLP for simple tasks
    if (request.type === 'grammar' || request.type === 'light-paraphrase') {
      return this.nlpEngine;
    }
    // Use LLM for complex tasks
    if (request.type === 'academic-paraphrase' || request.type === 'creative-writing') {
      return this.llmEngine;
    }
    // Hybrid for detection
    if (request.type === 'ai-detection') {
      return this.hybridEngine;
    }
  }
}
```

### 2. Caching Strategy
```typescript
// infrastructure/cache/CacheService.ts
export class CacheService {
  async getOrProcess<T>(
    key: string,
    processor: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const result = await processor();
    await this.redis.setex(key, ttl, JSON.stringify(result));
    return result;
  }
}
```

### 3. Circuit Breaker
```typescript
// infrastructure/llm/CircuitBreaker.ts
export class LLMCircuitBreaker {
  private failureCount = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async call<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      return fallback();
    }
    try {
      const result = await primary();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      return fallback();
    }
  }
}
```

---

## Phase 1: Foundation (Execute Now)

### Step 1: Create Directory Structure
```bash
#!/bin/bash
# scripts/setup-structure.sh

echo "Creating modular monolith structure..."

# Apps
mkdir -p apps/web

# Core
mkdir -p core/{auth,billing,users}

# Domains
mkdir -p domains/writing/{paraphrasing,grammar,summarizer,translator,ai-detector,plagiarism}
mkdir -p domains/agents/{deep-research,slide-generator,sheet-generator,work4me}
mkdir -p domains/studio/{editor,project-manager,publishing}

# Marketing
mkdir -p marketing/{meta-automation,seo-tools}

# Infrastructure
mkdir -p infrastructure/{llm,nlp,cache,external-apis}

# Shared
mkdir -p shared/{types,ui,utils,config}

# Docs
echo "Structure created!"
```

### Step 2: Move Current Code
```bash
# Move frontend to apps/web/
mv src/* apps/web/
mv public apps/web/
mv next.config.ts apps/web/
mv package.json apps/web/
mv tsconfig.json apps/web/
mv tailwind.config.* apps/web/

# Fix immediate issues
mv apps/web/components/acount apps/web/components/account
rm apps/web/app/not-found.jsx
```

### Step 3: Set Up Workspace
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'core/*'
  - 'domains/*'
  - 'marketing/*'
  - 'infrastructure/*'
  - 'shared/*'
```

```json
// package.json (root)
{
  "name": "shothik-ai",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

### Step 4: Domain Interface Definition
```typescript
// shared/types/DomainInterfaces.ts

// Writing Domain
export interface IParaphrasingService {
  paraphrase(text: string, mode: ParaphraseMode): Promise<string>;
}

export interface IGrammarService {
  check(text: string): Promise<GrammarIssue[]>;
}

// Agent Domain
export interface IAgent {
  execute(input: AgentInput): Promise<AgentOutput>;
}

export interface IResearchAgent extends IAgent {
  research(query: string): Promise<ResearchResult>;
}
```

---

## Migration Checklist

### Immediate (Today)
- [ ] Create directory structure
- [ ] Move current code to apps/web/
- [ ] Fix `acount` typo
- [ ] Remove duplicate files
- [ ] Set up pnpm workspace

### Week 1
- [ ] Define domain interfaces
- [ ] Extract shared types to shared/types/
- [ ] Set up Turbo build pipeline
- [ ] Create service registry

### Week 2
- [ ] Migrate writing tools to domains/writing/
- [ ] Implement TextProcessingPipeline
- [ ] Set up caching layer
- [ ] Add rate limiting

### Week 3
- [ ] Migrate agents to domains/agents/
- [ ] Implement agent orchestration
- [ ] Set up LLM circuit breaker

### Week 4
- [ ] Create Writing Studio foundation
- [ ] Implement project/chapter data model
- [ ] Set up publishing workflows

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Build Time | < 2 minutes |
| Domain Coupling | Zero circular deps |
| Test Coverage | > 70% |
| Cache Hit Rate | > 60% |
| LLM Cost per Request | < $0.01 |

---

## Developer Guidelines

### Domain Rules
1. **No cross-domain imports** - Use interfaces
2. **Services expose APIs** - No direct DB access
3. **Agents orchestrate** - Don't do work directly
4. **Cache aggressively** - Especially LLM calls

### Code Organization
```typescript
// ✅ Good: Domain-organized
domains/writing/paraphrasing/
  ├── api/
  │   └── route.ts
  ├── engine/
  │   ├── LLMEngine.ts
  │   └── NLPEngine.ts
  ├── types/
  │   └── index.ts
  └── index.ts

// ❌ Bad: Scattered
src/components/paraphrase/
src/hooks/useParaphrase/
src/services/paraphrase/
```

---

## Strategic Positioning

**Quillbot = Tool**  
**Shothik = Ecosystem**

**Tagline:** "From first assignment to first business"

**User Journey:**
1. Student discovers Shothik for assignments
2. Uses paraphraser, plagiarism checker
3. Graduates to creator - writes books, blogs
4. Becomes entrepreneur - uses marketing automation
5. Stays on platform for entire career

---

Ready to execute Phase 1?
