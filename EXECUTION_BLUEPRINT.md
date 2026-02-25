# Shothik AI - Modular Monolith Execution Blueprint

## Philosophy: Structured, Not Messy

**One Deployment | One Repo | One Database | Domain-Separated Internally**

---

## Target Architecture

```
shothiknew5/
├── 📁 apps/
│   └── 📁 web/                    # Next.js frontend (current src/)
│       ├── app/                   # Next.js App Router
│       ├── components/            # Domain-organized components
│       ├── lib/                   # Utilities
│       └── package.json
│
├── 📁 packages/
│   ├── 📁 core/                   # Shared business logic
│   │   ├── domains/               # Domain modules
│   │   ├── types/                 # Shared TypeScript types
│   │   └── utils/                 # Shared utilities
│   │
│   ├── 📁 ui/                     # Shared UI component library
│   │   ├── components/            # Button, Input, Card, etc.
│   │   ├── hooks/                 # Shared hooks
│   │   └── styles/                # Tailwind config, globals
│   │
│   ├── 📁 config/                 # Shared configurations
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   │
│   └── 📁 database/               # Database layer (Convex)
│       ├── schema/                # Convex schemas
│       ├── functions/             # Convex functions
│       └── migrations/
│
├── 📁 services/                   # Internal services (modules, not microservices)
│   ├── 📁 nlp/                    # NLP analysis module
│   │   ├── api/                   # API routes
│   │   ├── engine/                # NLP engine
│   │   └── types/
│   │
│   ├── 📁 paraphrase/             # Paraphrasing module
│   │   ├── api/
│   │   ├── engine/
│   │   └── types/
│   │
│   ├── 📁 auth/                   # Authentication module
│   ├── 📁 billing/                # Payments & subscriptions
│   ├── 📁 agents/                 # AI agents orchestration
│   └── 📁 marketing/              # Meta automation, ads
│
├── 📁 docs/                       # Consolidated documentation
│   ├── getting-started/
│   ├── architecture/
│   ├── api/
│   └── development/
│
├── 📁 scripts/
│   ├── dev.sh
│   ├── build.sh
│   └── deploy.sh
│
└── [Root Config Files]
    ├── package.json              # Workspace root
    ├── pnpm-workspace.yaml       # Monorepo workspace
    ├── turbo.json                # Build orchestration
    └── README.md
```

---

## Domain Modules (Business Capabilities)

### 1. Writing Tools Domain
```
services/writing/
├── paraphrase/          # Text rewriting
├── grammar/             # Grammar checking
├── humanize/            # AI detection bypass
├── plagiarism/          # Duplicate detection
├── summarizer/          # Text condensation
└── translator/          # Language translation
```

### 2. Agents Domain
```
services/agents/
├── research/            # Deep research agent
├── slides/              # Presentation generator
├── sheets/              # Spreadsheet automation
└── browser/             # Web browsing agent
```

### 3. Marketing Domain
```
services/marketing/
├── meta-automation/     # Meta ads management
├── strategy/            # Campaign strategy
├── creative/            # Ad creative generation
└── analytics/           # Performance tracking
```

### 4. User Management Domain
```
services/user/
├── auth/                # Authentication
├── billing/             # Subscriptions (Stripe)
├── teams/               # Organization/team features
└── settings/            # User preferences
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goals:**
- Set up monorepo structure
- Establish domain boundaries
- Fix immediate issues

**Tasks:**
```bash
# 1. Set up pnpm workspace
echo 'packages:
  - "apps/*"
  - "packages/*"
  - "services/*"' > pnpm-workspace.yaml

# 2. Create directory structure
mkdir -p apps/web packages/{core,ui,config,database} services/{nlp,paraphrase,auth,billing,agents,marketing}

# 3. Fix immediate issues
mv src/components/acount src/components/account  # Fix typo
rm src/app/not-found.jsx  # Remove duplicate

# 4. Move current src to apps/web
mv src apps/web/
mv public apps/web/
mv next.config.ts apps/web/
mv package.json apps/web/
```

### Phase 2: Domain Extraction (Week 3-4)

**Goals:**
- Extract business logic into services/
- Create shared packages
- Maintain working application

**Tasks:**
1. **Create packages/core**
   - Extract shared types
   - Extract domain logic
   - Set up barrel exports

2. **Create packages/ui**
   - Extract reusable UI components
   - Set up Storybook
   - Create component documentation

3. **Extract Services**
   - Move NLP-related code to services/nlp/
   - Move auth logic to services/auth/
   - Create service APIs

### Phase 3: API Consolidation (Week 5-6)

**Goals:**
- Unify API layer
- Document all endpoints
- Set up proper error handling

**Tasks:**
1. **API Structure**
   ```
   apps/web/app/api/
   ├── route.ts              # Health check
   ├── auth/
   ├── writing/
   ├── agents/
   └── marketing/
   ```

2. **Service Integration**
   - Each service exposes clean API
   - Web app calls service APIs
   - No direct database access from web

### Phase 4: Documentation & Polish (Week 7-8)

**Goals:**
- Consolidate all docs
- Create developer guides
- Set up CI/CD

**Tasks:**
1. **Documentation**
   - Move memorybank/ to docs/archive/
   - Create new docs structure
   - Write architecture decision records

2. **Developer Experience**
   - Set up Turborepo
   - Create dev scripts
   - Document environment setup

---

## Key Principles

### 1. Domain-Driven Organization
```
❌ DON'T: Organize by technical layer
src/
  components/
  hooks/
  services/
  utils/

✅ DO: Organize by business domain
services/
  writing/
    components/
    hooks/
    api/
    utils/
  agents/
    components/
    hooks/
    api/
    utils/
```

### 2. Clear Dependencies
```
apps/web ───────► packages/ui
       ───────► packages/core
       ───────► services/*

services/* ─────► packages/core
           ─────► packages/database
```

### 3. No Circular Dependencies
- Services don't depend on each other
- Web app orchestrates service calls
- Core package has no external deps

### 4. Shared Nothing (Within Reason)
- Each service owns its data
- Shared types in packages/core
- Shared UI in packages/ui
- No shared business logic

---

## Migration Strategy

### Step 1: Parallel Structure
Create new structure alongside existing code
```
shothiknew5/
├── src/                  # OLD (keep working)
├── apps/
│   └── web/              # NEW (migrate gradually)
```

### Step 2: Gradual Migration
Move one domain at a time:
1. Auth (simplest)
2. Writing tools
3. Agents
4. Marketing

### Step 3: Feature Flags
Use feature flags to switch between old/new:
```typescript
const useNewParaphrase = process.env.NEW_PARAPHRASE_API === 'true';
```

### Step 4: Cutover
Once all domains migrated:
- Remove `src/` folder
- Update imports
- Run full test suite

---

## Success Metrics

- [ ] Build time < 2 minutes
- [ ] All tests passing
- [ ] Zero circular dependencies
- [ ] Clear domain boundaries
- [ ] New dev setup < 10 minutes
- [ ] Documentation complete

---

## Immediate Next Steps

1. **Approve this blueprint**
2. **Start Phase 1** (I can execute this now)
3. **Review after Phase 1** before proceeding

Ready to start Phase 1?
