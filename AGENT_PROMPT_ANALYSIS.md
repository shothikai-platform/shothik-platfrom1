# Analysis: AgentField + Awesome AI System Prompts

## Date: February 24, 2026
## Sources:
- https://github.com/Agent-Field/agentfield
- https://github.com/dontriskit/awesome-ai-system-prompts

---

## 🏗 AgentField Analysis

### What is AgentField?
**"Kubernetes for AI Agents"** - A control plane for deploying, scaling, and observing multi-agent systems.

### Key Concepts

#### 1. **Control Plane Architecture**
```
┌─────────────────────────────────────────┐
│         AgentField Control Plane        │
│  (Go-based orchestration server)        │
├─────────────────────────────────────────┤
│  • REST/gRPC APIs                       │
│  • Workflow execution                   │
│  • Observability (DAGs, metrics, logs)  │
│  • Cryptographic identity (W3C DIDs)    │
│  • Policy enforcement                   │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Agent A │ │ Agent B │ │ Agent C │
   │ (Python)│ │  (Go)   │ │(TypeS.) │
   └─────────┘ └─────────┘ └─────────┘
```

#### 2. **Core Features**

| Feature | Description | Shothik Equivalent |
|---------|-------------|-------------------|
| **Routing & Discovery** | Agents call each other via REST APIs | Convex actions |
| **Async Execution** | Fire-and-forget tasks | BullMQ job queues |
| **Durable State** | Built-in memory + vector search | Redis + Convex |
| **Observability** | Workflow DAGs, Prometheus metrics | Custom logging |
| **Cryptographic Identity** | W3C DIDs for each agent | JWT auth |
| **Policy Enforcement** | Infrastructure-level boundaries | Middleware |

#### 3. **Agent Structure (Python SDK)**
```python
from agentfield import Agent, AIConfig

app = Agent(node_id="researcher", ai_config=AIConfig(model="gpt-4o"))

@app.skill()
def fetch_url(url: str) -> str:
    """Skills are tools/functions"""
    return requests.get(url).text

@app.reasoner()
async def summarize(url: str) -> dict:
    """Reasoners orchestrate skills with AI"""
    content = fetch_url(url)
    return await app.ai(f"Summarize: {content}")

app.run()  # Exposes: POST /api/v1/execute/researcher.summarize
```

#### 4. **Key Insight: Skills vs Reasoners**
- **Skills**: Deterministic functions (tools)
- **Reasoners**: AI-powered orchestration (uses skills + LLM)

---

## 📝 Awesome AI System Prompts Analysis

### Core Principles for Agentic AI

#### 1. **Clear Role Definition**

**Examples:**
```
Vercel v0: "You are v0, Vercel's AI-powered assistant."

same.new: "You are a powerful agentic AI coding assistant. 
           You operate exclusively in Same, the world's best cloud-based IDE."

Manus: "You are Manus, an AI agent created by the Manus team.
        You excel at:
        1. Information gathering...
        2. Data processing...
        3. Writing multi-chapter articles..."
```

**For Shothik:**
```
Research Agent: "You are Shothik Research Agent, a multi-source academic research assistant. 
                 You excel at finding, synthesizing, and citing scholarly sources."

Slide Agent: "You are Shothik Slide Agent, a presentation design expert.
              You transform research into visually compelling slides."
```

#### 2. **Structured Instructions**

**Patterns:**
- Markdown headings (`## General Instructions`, `# Tools`)
- XML-like tags (`<tool_calling>`, `<making_code_changes>`)
- Code blocks for schemas (TypeScript definitions)

**For Shothik:**
```markdown
## Capabilities
- Multi-source research (ArXiv, PubMed, Scholar)
- Citation extraction
- Report synthesis

## Tools
- search_sources(query, sources[])
- extract_citations(paper)
- synthesize_findings(papers[])

## Rules
1. ALWAYS verify source credibility
2. NEVER fabricate citations
3. ALWAYS provide confidence scores
```

#### 3. **Explicit Tool Integration**

**ChatGPT Example:**
```typescript
namespace dalle {
  type text2im = (_: {
    size?: ("1792x1024" | "1024x1024" | "1024x1792"),
    n?: number, // default: 1
    prompt: string,
    referenced_image_ids?: string[],
  }) => any;
}
```

**same.new Rules:**
```xml
<tool_calling>
  1. ALWAYS follow the tool call schema exactly
  2. NEVER refer to tool names when speaking to the USER
  3. Before calling each tool, first explain to the USER why
</tool_calling>
```

#### 4. **Step-by-Step Reasoning**

**Manus Agent Loop:**
```
<agent_loop>
You are operating in an agent loop, iteratively completing tasks:
1. Analyze Events
2. Select Tools
3. Wait for Execution
4. Iterate (one tool call per iteration)
5. Submit Results
6. Enter Standby
</agent_loop>
```

**For Shothik Research Agent:**
```
<research_loop>
When conducting research:
1. PLAN: Identify key sub-questions
2. SEARCH: Query multiple sources
3. EXTRACT: Pull relevant papers
4. SYNTHESIZE: Combine findings
5. CITE: Format citations
6. REVIEW: Verify completeness
</research_loop>
```

#### 5. **Safety & Refusal Protocols**

**Claude Example:**
```
Claude does not provide information that could be used to make chemical 
or biological or nuclear weapons, and does not write malicious code...

If Claude cannot or will not help, it does not say why or what it could 
lead to, since this comes across as preachy. It offers helpful alternatives.
```

**Hallucination Warning (Claude):**
```
If asked about very obscure topics or very recent events, Claude ends 
its response by reminding the person that it may hallucinate.
```

---

## 🔍 Key Patterns for Shothik

### 1. **Agent Persona Definition**

```markdown
# Shothik Research Agent System Prompt

You are Shothik Research Agent, a multi-source academic research assistant 
created by Shothik AI.

## Your Role
- Find relevant scholarly sources across multiple databases
- Synthesize findings into coherent reports
- Provide proper citations
- Identify research gaps

## Your Capabilities
1. Multi-source search (ArXiv, PubMed, Semantic Scholar, IEEE)
2. Paper metadata extraction
3. Citation formatting (APA, MLA, Chicago)
4. Research synthesis with confidence scoring

## Tools Available
- search_sources(query, sources[], maxResults)
- get_paper_details(paperId)
- synthesize_findings(papers[])
- format_citations(papers[], style)

## Rules
1. ALWAYS verify source credibility before citing
2. NEVER fabricate or hallucinate citations
3. ALWAYS provide confidence scores (0-1) for findings
4. If sources conflict, present multiple perspectives
5. If insufficient information, say "I don't have enough information"

## Output Format
```json
{
  "summary": "...",
  "keyFindings": [
    {"finding": "...", "confidence": 0.9, "sources": [...]}
  ],
  "citations": [...],
  "researchGaps": [...]
}
```
```

### 2. **Tool Calling Pattern**

```markdown
## Tool Usage Guidelines

When using tools:
1. ALWAYS follow the exact schema
2. Explain WHY you're calling the tool before calling it
3. NEVER mention tool names to the user (say "searching" not "calling search_sources")
4. Wait for results before proceeding
5. If a tool fails, try alternative approach

## Tool Schemas

### search_sources
Parameters:
- query: (required) The search query
- sources: (required) Array of sources ["arxiv", "pubmed", ...]
- maxResults: (optional) Max papers to return (default: 20)
```

### 3. **Confidence & Hallucination Prevention**

```markdown
## Confidence Scoring

For every finding, assign confidence:
- 0.9-1.0: Multiple high-quality sources agree
- 0.7-0.9: Limited but credible sources
- 0.5-0.7: Single source or preliminary research
- <0.5: Insufficient evidence

## Hallucination Prevention

When answering:
1. If topic is obscure or very recent, warn: "I may be hallucinating"
2. If asked about papers/books, avoid citing specific works without search
3. If uncertain, say "I don't know" rather than guessing
4. Always provide sources for factual claims
```

---

## 🎯 Action Items for Shothik

### Immediate (This Week)

1. **Create System Prompts for Each Agent**
   - Research Agent prompt
   - Slide Agent prompt
   - Animation Agent prompt

2. **Implement Confidence Scoring**
   - Add confidence field to all agent outputs
   - Show warnings for low-confidence results

3. **Add Hallucination Warnings**
   - Detect obscure/recent topics
   - Show disclaimer when appropriate

### Short-term (Next 2 Weeks)

4. **Structured Tool Definitions**
   - Define all agent tools with schemas
   - Document parameters and return types

5. **Agent Loop Pattern**
   - Implement explicit reasoning steps
   - Show progress through each step

6. **Safety Protocols**
   - Add refusal handling
   - Define content boundaries

---

## 📊 Comparison: Shothik vs Industry Standards

| Aspect | Industry (AgentField/Prompts) | Shothik Current | Gap |
|--------|------------------------------|-----------------|-----|
| **Role Definition** | Explicit system prompts | Implicit | ❌ Missing |
| **Tool Schemas** | Detailed TypeScript/JSON | Basic | ⚠️ Partial |
| **Confidence Scoring** | Built-in | None | ❌ Missing |
| **Hallucination Warnings** | Automatic | None | ❌ Missing |
| **Agent Loop** | Explicit steps | Implicit | ⚠️ Partial |
| **Observability** | DAGs, metrics | Logs | ⚠️ Partial |
| **Multi-agent** | Control plane | Separate services | ✅ Similar |

---

## ✅ Summary

**Key Takeaways:**

1. **AgentField** = Kubernetes-style orchestration (we have similar with Convex + BullMQ)

2. **System Prompts** need:
   - Clear role definition
   - Structured instructions
   - Explicit tool schemas
   - Confidence scoring
   - Hallucination warnings

3. **Shothik is behind on**:
   - Formal system prompts
   - Confidence scoring
   - Hallucination prevention

4. **Quick wins**:
   - Write system prompts for each agent
   - Add confidence scores
   - Implement "I don't know" fallback

**Want me to write the system prompts for Shothik agents?**
