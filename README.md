# Shothik AI v4 - Modular Monolith

> From first assignment to first business

## Architecture

This is a **modular monolith** - one deployment, one repo, one database, but internally separated by business domain.

```
shothiknew5/
├── apps/web/              # Next.js frontend
├── core/                  # Auth, billing, users
├── domains/               # Business domains
│   ├── writing/           # Paraphrase, grammar, humanizer, AI detector
│   ├── agents/            # Deep research, slides, sheets
│   └── studio/            # Editor, projects, publishing
├── marketing/             # Meta automation, SEO
├── infrastructure/        # LLM, NLP, cache
└── shared/                # Types, UI, utils
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Domains

### Writing Domain (`domains/writing/`)
Your Quillbot competitor. All tools use a shared `TextProcessingPipeline`:

```
Input → Preprocess → LLM/NLP → Postprocess → Detection → Return
```

| Feature | Engine | Caching |
|---------|--------|---------|
| Grammar | NLP | Yes |
| Light Paraphrase | NLP | Yes |
| Academic Paraphrase | LLM | Yes |
| **Humanizer** | **LLM** | **Yes** |
| AI Detection | Hybrid | Yes |
| Plagiarism | External | No |

### Agents Domain (`domains/agents/`)
AI agents that orchestrate domain services:
- **Deep Research**: Calls writing.summarizer + external search
- **Slide Generator**: Creates presentations
- **Sheet Generator**: Automates spreadsheets
- **Work4Me**: General task automation

### Studio Domain (`domains/studio/`)
Your killer feature - long-form writing environment:

```
Student Phase → Creator Phase → Earning Phase
     ↓               ↓               ↓
Assignments     Book writing    Marketing
Research help   Formatting      SEO blogs
Slides          Publishing      Social promo
```

**Components:**
- **Project Manager**: Create, organize, version control
- **Editor**: AI-assisted long-form writing with inline suggestions
- **Publishing**: Export (PDF, DOCX, MD) + Publish (Medium, WordPress, Ghost)

**AI Features:**
- Continue writing
- Rewrite selection
- Summarize/Expand/Shorten
- Tone adjustment
- Grammar suggestions
- Readability analysis

## Monetization

| Tier | Price | Features |
|------|-------|----------|
| Basic | Free | Limited paraphrasing |
| Pro | $9.99 | Unlimited + 1K plagiarism words |
| Premium | $29.99 | + Publishing + Marketing |

## Development

### Domain Rules
1. **No cross-domain imports** - Use interfaces from `shared/types/`
2. **Services expose APIs** - No direct DB access from web
3. **Agents orchestrate** - Don't do work directly
4. **Cache aggressively** - Especially LLM calls

### Adding a New Feature

1. Identify the domain (writing, agents, studio, marketing)
2. Create service in appropriate `domains/` folder
3. Implement interface from `shared/types/`
4. Add API route in `apps/web/app/api/`
5. Update tests

## Cost Control

- **NLP for**: Grammar, light paraphrasing, preprocessing
- **LLM for**: Academic paraphrasing, creative writing, agents
- **Always cache**: LLM responses with 24h TTL
- **Circuit breaker**: Between Gemini/other LLM providers

## Roadmap

### Phase 1: Foundation ✅
- [x] Modular monolith structure
- [x] Domain interfaces
- [x] Text processing pipeline

### Phase 2: Domain Extraction
- [ ] Migrate writing tools
- [ ] Implement caching layer
- [ ] Add rate limiting

### Phase 3: Agents & Studio
- [ ] Agent orchestration
- [ ] Writing studio foundation
- [ ] Project/chapter model

### Phase 4: Marketing
- [ ] Meta automation
- [ ] SEO tools
- [ ] Publishing workflows

## When to Microservices?

ONLY when:
- 50k+ active users
- Heavy LLM load requiring separate scaling
- Team scaling beyond 20 developers

Then extract in order:
1. LLM Service
2. Agents Service
3. Publishing + Marketing
4. Writing Tools

## License

Private - Shothik AI Limited
