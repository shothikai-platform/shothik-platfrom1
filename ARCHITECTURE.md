# Shothik Platform Architecture

## 🏗️ Project Structure

```
shothik-platfrom/
├── apps/
│   └── web/                 # Next.js 16 application
├── backend-services/        # Microservices
│   ├── ai-detector-onnx/   # ONNX AI detection
│   ├── animation-service/  # Video generation
│   ├── research-service/   # Research scraping
│   ├── sheet-service/      # Spreadsheet generation
│   └── slide-generation-service/  # Slide generation
├── convex/                 # Backend (Convex)
│   ├── schema.ts          # Database schema
│   ├── projects.ts        # Project management
│   ├── chat.ts            # AI chat
│   ├── ai.ts              # AI analysis
│   └── llmActions.ts      # LLM integration
├── domains/               # Domain logic
├── infrastructure/        # Shared infrastructure
├── shared/               # Shared utilities
└── ml-training/          # ML model training
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Convex (serverless), Fastify (services) |
| Database | Convex (real-time) |
| AI/ML | Kimi API, OpenAI, Anthropic, ONNX Runtime |
| Caching | Redis |
| Payments | Stripe |
| Deployment | Docker, Docker Compose |

## 🔒 Security

- All dependencies pinned to exact versions
- GitHub Actions security scan on every PR
- Branch protection rules enforced
- Pre-commit hooks for linting

## 🚀 Deployment

1. Push to `main` branch
2. GitHub Actions runs tests, lint, build
3. Auto-deploys to staging
4. Manual promotion to production

## 📝 Conventions

- **Components**: PascalCase (e.g., `WritingStudio.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAnimation`)
- **Services**: camelCase (e.g., `llmService`)
- **Types**: PascalCase with descriptive names

## 🧪 Testing

```bash
# Run type check
cd apps/web && npx tsc --noEmit

# Run linter
cd apps/web && npm run lint

# Run tests
cd apps/web && npm test
```

## 📚 Key Decisions

1. **Monorepo**: Turbo + pnpm for efficient builds
2. **TypeScript**: Full type safety across codebase
3. **Convex**: Real-time backend with automatic sync
4. **Microservices**: Separate services for AI tasks
5. **Security First**: Automated security scanning
