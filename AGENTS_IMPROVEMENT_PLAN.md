# Shothik Agents Analysis + Improvement Plan

## Date: February 24, 2026
## Based on: AgentField + Awesome AI System Prompts Analysis

---

## 🔍 Current Agent Architecture Analysis

### 1. Research Agent

**Current Implementation:**
```
Frontend: ResearchAgentPage.jsx
├── useResearchStream - SSE streaming
├── useResearchHistory - Chat history
├── useResearchSimulation - Replay mode
└── Redux slices (4 slices)

Backend: research-service (NEW - built today)
├── ArXiv scraper
├── Semantic Scholar scraper
├── Multi-source orchestration
└── AI synthesis
```

**Strengths:**
- ✅ Real-time streaming via SSE
- ✅ Multi-source aggregation
- ✅ Simulation/replay mode
- ✅ Chat-based interface

**Gaps (vs AgentField/Industry):**
- ❌ No explicit system prompt
- ❌ No confidence scoring
- ❌ No hallucination warnings
- ❌ No structured reasoning steps

---

### 2. Sheet Agent

**Current Implementation:**
```
Frontend: SheetAgentPage.jsx
├── SheetChatArea - Chat interface
├── SheetDataArea - FortuneSheet preview
├── useSheetStream - Streaming
└── Redux slice

Backend: (Not built yet - needs implementation)
```

**Strengths:**
- ✅ Split view (chat + spreadsheet)
- ✅ FortuneSheet integration
- ✅ Real-time streaming
- ✅ Mobile responsive

**Gaps:**
- ❌ No backend service
- ❌ No system prompt
- ❌ No tool definitions

---

### 3. Slide Agent

**Current Implementation:**
```
Frontend: AgentPage.jsx (shared with other agents)
├── Phase-based generation (planning → preferences → content → design → validation)
├── PresentationAgentForm - Input form
├── Slide preview
└── Quality validation panel

Backend: Convex (existing)
├── slide generation
├── editing tools
└── version history
```

**Strengths:**
- ✅ Phase-based workflow
- ✅ Quality validation
- ✅ Rich editing tools
- ✅ Version history

**Gaps:**
- ❌ No explicit system prompt
- ❌ No tool schemas
- ❌ Missing undo/redo (83% complete)

---

### 4. Animation Agent

**Current Implementation:**
```
Frontend: (Not built)

Backend: animation-service (NEW - built today)
├── Video generation pipeline
├── ElevenLabs voiceover
├── Suno music
└── Template system
```

**Status:** Backend ready, frontend needed

---

## 🎯 How AgentField Can Help Shothik

### 1. **Control Plane Pattern**

**AgentField Approach:**
```
Control Plane (Go)
├── REST/gRPC APIs
├── Workflow DAGs
├── Agent discovery
└── Policy enforcement

Agents (Python/Go/TS)
├── Skills (tools)
├── Reasoners (AI orchestration)
└── Register with control plane
```

**Shothik Equivalent:**
```
Convex (Control Plane)
├── Actions/mutations
├── Schema enforcement
└── Real-time sync

Backend Services (Node.js)
├── Research Service ✅
├── Animation Service ✅
└── Sheet Service (needed)
```

**Action:** Shothik already has similar architecture. Need to add:
- Agent registration/discovery
- Workflow DAG visualization
- Policy enforcement layer

---

### 2. **Skills vs Reasoners Pattern**

**AgentField:**
```python
@app.skill()  # Deterministic tool
def fetch_url(url: str) -> str:
    return requests.get(url).text

@app.reasoner()  # AI orchestration
async def summarize(url: str) -> dict:
    content = fetch_url(url)  # Use skill
    return await app.ai(f"Summarize: {content}")
```

**Shothik Research Agent (Current):**
```javascript
// Mixed - no clear separation
const research = async (query) => {
  const papers = await searchSources(query);  // Skill
  const summary = await llm.synthesize(papers);  // Reasoner
  return summary;
};
```

**Improved Shothik:**
```javascript
// skills.js - Deterministic tools
export const searchSources = async (query, sources) => { ... };
export const extractCitations = async (paper) => { ... };
export const formatBibliography = async (papers, style) => { ... };

// reasoners.js - AI orchestration
export const researchReasoner = async (query) => {
  const papers = await searchSources(query, ['arxiv', 'pubmed']);  // Skill
  const synthesis = await llm.complete({
    prompt: `Synthesize these papers: ${JSON.stringify(papers)}`,
    systemPrompt: RESEARCH_SYSTEM_PROMPT
  });
  return synthesis;
};
```

---

### 3. **Observability & DAGs**

**AgentField:** Automatic workflow DAGs

**Shothik:** Add to Research/Animation agents
```javascript
// Track execution flow
const workflowDAG = {
  nodes: [
    { id: '1', type: 'search', status: 'completed', duration: 2000 },
    { id: '2', type: 'extract', status: 'completed', duration: 1500 },
    { id: '3', type: 'synthesize', status: 'in_progress', duration: null }
  ],
  edges: [
    { from: '1', to: '2' },
    { from: '2', to: '3' }
  ]
};
```

---

## 📝 How System Prompts Can Help

### Current State: No Explicit System Prompts

**What we have:** Implicit behavior in code
**What we need:** Explicit system prompts for each agent

### 1. Research Agent System Prompt

```markdown
# Shothik Research Agent System Prompt

You are Shothik Research Agent, a multi-source academic research assistant.

## Your Role
- Find relevant scholarly sources across multiple databases
- Synthesize findings into coherent reports
- Provide proper citations
- Identify research gaps

## Capabilities
1. Multi-source search (ArXiv, PubMed, Semantic Scholar, IEEE)
2. Paper metadata extraction
3. Citation formatting (APA, MLA, Chicago, IEEE)
4. Research synthesis with confidence scoring

## Tools
- search_sources(query, sources[], maxResults)
- get_paper_details(paperId)
- synthesize_findings(papers[])
- format_citations(papers[], style)

## Workflow
1. PLAN: Break query into sub-questions
2. SEARCH: Query multiple sources in parallel
3. EXTRACT: Pull relevant papers with metadata
4. SYNTHESIZE: Combine findings, identify patterns
5. CITE: Format citations in requested style
6. REVIEW: Verify completeness, identify gaps

## Rules
1. ALWAYS verify source credibility before citing
2. NEVER fabricate or hallucinate citations
3. ALWAYS provide confidence scores (0-1) for findings
4. If sources conflict, present multiple perspectives
5. If insufficient information, say "I don't have enough information"
6. For obscure/recent topics, warn: "This is a niche topic - verify independently"

## Output Format
```json
{
  "summary": "2-3 paragraph synthesis",
  "keyFindings": [
    {
      "finding": "...",
      "confidence": 0.9,
      "supportingSources": ["id1", "id2"]
    }
  ],
  "citations": [
    {
      "id": "...",
      "formatted": "APA/MLA/etc citation"
    }
  ],
  "researchGaps": ["..."],
  "confidence": "high|medium|low"
}
```
```

---

### 2. Slide Agent System Prompt

```markdown
# Shothik Slide Agent System Prompt

You are Shothik Slide Agent, a presentation design expert.

## Your Role
- Transform research/content into visually compelling slides
- Structure information for audience comprehension
- Apply appropriate design principles

## Capabilities
1. Content structuring (title, bullets, visuals)
2. Layout selection (title slide, content, split, etc.)
3. Design theme application
4. Visual element suggestions

## Tools
- create_slide(type, content, layout)
- apply_theme(slideId, theme)
- suggest_visuals(content)
- validate_slide(slide)

## Workflow
1. ANALYZE: Understand content and audience
2. STRUCTURE: Create slide outline
3. DESIGN: Apply layouts and themes
4. ENHANCE: Suggest visuals
5. VALIDATE: Check quality metrics

## Rules
1. One idea per slide
2. Max 6 bullet points per slide
3. Use consistent typography
4. Ensure sufficient contrast
5. Add visual elements every 2-3 slides

## Quality Metrics
- Content clarity (0-10)
- Visual appeal (0-10)
- Audience appropriateness (0-10)
- Overall score (average)
```

---

### 3. Animation Agent System Prompt

```markdown
# Shothik Animation Agent System Prompt

You are Shothik Animation Agent, a video production assistant.

## Your Role
- Transform slides into professional videos
- Generate appropriate voiceover scripts
- Select background music
- Apply motion graphics

## Capabilities
1. Script generation from slide content
2. Voiceover timing calculation
3. Music mood selection
4. Template-based animation

## Tools
- generate_script(slides[])
- calculate_timing(script)
- select_music(mood, duration)
- render_video(slides, voiceover, music, template)

## Workflow
1. SCRIPT: Convert slides to narration script
2. TIMING: Calculate duration per slide
3. VOICE: Generate voiceover (ElevenLabs)
4. MUSIC: Select background track (Suno)
5. RENDER: Compose video with animations

## Rules
1. Script must match slide content exactly
2. Voiceover pace: 150 words/minute
3. Music volume: 20% of voiceover
4. Transitions: Max 1 second
5. Text must be readable (min 24pt equivalent)

## Templates
- explainer: Clean, educational
- product_launch: Bold, energetic
- tutorial: Step-by-step
- storytelling: Cinematic
- data_presentation: Charts focused
- minimal: Simple, elegant
```

---

## 🚀 Implementation Roadmap

### Phase 1: System Prompts (This Week)

| Agent | Prompt | Confidence | Hallucination Warnings |
|-------|--------|------------|----------------------|
| Research | ✅ | ✅ | ✅ |
| Sheet | ✅ | ✅ | ✅ |
| Slide | ✅ | ⚠️ | ⚠️ |
| Animation | ✅ | ⚠️ | ⚠️ |

### Phase 2: Skills/Reasoners Separation (Next Week)

```
apps/web/lib/agents/
├── research/
│   ├── skills.js       # Deterministic tools
│   ├── reasoners.js    # AI orchestration
│   └── systemPrompt.js # System prompt
├── sheet/
├── slide/
└── animation/
```

### Phase 3: Observability (Week 3)

- Workflow DAG tracking
- Execution metrics
- Confidence scoring dashboard

### Phase 4: Policy Enforcement (Week 4)

- Content safety checks
- Rate limiting per agent
- Usage quotas

---

## 📊 Quick Wins (Can Do Today)

1. **Add system prompts to existing agents**
   - Research: 1 hour
   - Sheet: 1 hour
   - Slide: 30 min

2. **Implement confidence scoring**
   - Research: citation count + source quality
   - Slide: template match score
   - 2-3 hours total

3. **Add "I don't know" fallback**
   - All agents: 1 hour

4. **Create agent registry**
   - List all agents with capabilities
   - 30 minutes

---

## ✅ Summary

**What AgentField teaches us:**
1. Separate skills (tools) from reasoners (AI)
2. Control plane for orchestration
3. Observability with workflow DAGs

**What System Prompts teach us:**
1. Explicit role definition
2. Structured instructions
3. Confidence scoring
4. Hallucination prevention

**Shothik's current gaps:**
1. No explicit system prompts
2. No confidence scoring
3. No structured reasoning steps
4. Missing observability DAGs

**Priority actions:**
1. Write system prompts for all agents
2. Implement confidence scoring
3. Add "I don't know" fallback
4. Build workflow visualization
