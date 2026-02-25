# Shothik Agent Architecture v2.0

## Date: February 24, 2026
## Architecture: Modular Agent System with Add-on Pattern

---

## 🏗 Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     SHOTHIK AI PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              BASE AGENTS (Core Features)                 │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Slide Agent  │  │ Sheet Agent  │  │ Deep Research│  │   │
│  │  │   (Core)     │  │   (Core)     │  │    Agent     │  │   │
│  │  └──────┬───────┘  └──────────────┘  └──────┬───────┘  │   │
│  │         │                                    │          │   │
│  │         │         ┌──────────────────────────┘          │   │
│  │         │         │                                     │   │
│  │         ▼         ▼                                     │   │
│  │  ┌─────────────────────────────────────────┐            │   │
│  │  │         ADD-ON AGENTS                  │            │   │
│  │  │    (Enhance base agent output)         │            │   │
│  │  ├─────────────────────────────────────────┤            │   │
│  │  │                                          │            │   │
│  │  │  ┌──────────────────────────────────┐   │            │   │
│  │  │  │     Animation Agent              │   │            │   │
│  │  │  │  (Video from Slide output)       │   │            │   │
│  │  │  │                                  │   │            │   │
│  │  │  │  Input: Slide deck               │   │            │   │
│  │  │  │  Output: MP4 video with          │   │            │   │
│  │  │  │          voiceover + music       │   │            │   │
│  │  │  └──────────────────────────────────┘   │            │   │
│  │  │                                          │            │   │
│  │  │  [Future Add-ons]                        │            │   │
│  │  │  • Translation Agent                     │            │   │
│  │  │  • Interactive Agent (add quizzes)       │            │   │
│  │  │  • Export Agent (multi-format)           │            │   │
│  │  │                                          │            │   │
│  │  └─────────────────────────────────────────┘            │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Agent Specifications

### 1. Slide Agent (Core)
**Status:** ✅ Existing (83% complete)

**Purpose:** Generate presentation slides from various inputs

**Inputs:**
- Text prompt
- Document (PDF, Word)
- Research output (from Deep Research Agent)
- URL

**Outputs:**
- Slide deck (JSON format)
- Layout suggestions
- Content structured for presentation

**Key Features:**
- Template-based layouts
- Text editing
- Style editing
- Positioning controls
- Delete/Duplicate/Save
- [Missing] Undo/Redo

---

### 2. Sheet Agent (Core)
**Status:** ✅ Existing (100% ready)

**Purpose:** Generate and manipulate spreadsheets/CSV data

**Inputs:**
- Text prompt
- Data requirements
- Existing CSV/Excel

**Outputs:**
- Structured data
- CSV/Excel files
- Data analysis

**Key Features:**
- Data generation
- Formula suggestions
- Data visualization
- Export formats

---

### 3. Deep Research Agent (Core)
**Status:** 🆕 New (Priority: HIGH)

**Purpose:** Multi-source research and synthesis

**Inputs:**
- Research query (text/voice)
- Source preferences
- Depth requirements

**Outputs:**
- Structured research report
- Citations
- Key findings
- Ready for Slide Agent consumption

**Key Features:**
- Multi-source scraping (ArXiv, PubMed, Scholar, IEEE)
- Parallel execution
- Voice input
- Citation tracking
- AI synthesis

**Integration:**
```
Deep Research Agent → Research Report → Slide Agent → Slides
```

---

### 4. Animation Agent (Add-on)
**Status:** 🆕 New (Priority: MEDIUM)

**Purpose:** Transform Slide output into professional video

**Inputs:**
- Slide deck (from Slide Agent)
- Voice preferences
- Music preferences
- Template selection

**Outputs:**
- MP4 video (720p/1080p, 30/60fps)
- Voiceover track
- Background music
- Subtitles (optional)

**Key Features:**
- Slide-to-scene mapping
- AI voiceover (ElevenLabs)
- AI background music (Suno)
- Motion graphics templates
- Export to YouTube

**Integration:**
```
Slide Agent → Slide Deck → Animation Agent → Video
```

---

## 🔄 Agent Workflows

### Workflow 1: Research → Slides
```
User Query
    ↓
Deep Research Agent (multi-source)
    ↓
Research Report (structured)
    ↓
Slide Agent (auto-generate)
    ↓
Slide Deck (editable)
```

### Workflow 2: Slides → Video
```
Slide Deck
    ↓
Animation Agent
    ├─ Scene mapping
    ├─ Voiceover generation (ElevenLabs)
    ├─ Music generation (Suno)
    └─ Motion graphics
    ↓
MP4 Video
```

### Workflow 3: Complete Pipeline
```
User Query (voice/text)
    ↓
Deep Research Agent
    ↓
Research Report
    ↓
Slide Agent
    ↓
Slide Deck
    ↓
Animation Agent (optional add-on)
    ↓
Video with voiceover + music
```

### Workflow 4: Data → Slides
```
User Data Request
    ↓
Sheet Agent
    ↓
Structured Data
    ↓
Slide Agent (data visualization)
    ↓
Data Presentation Slides
    ↓
Animation Agent (optional)
    ↓
Data Video
```

---

## 🛠 Technical Implementation

### Directory Structure

```
shothiknew5/
├── apps/
│   └── web/
│       ├── components/
│       │   ├── slide/           # Slide Agent UI
│       │   ├── sheet/           # Sheet Agent UI
│       │   ├── research/        # Deep Research Agent UI
│       │   └── animation/       # Animation Agent UI
│       └── app/
│           ├── slide/
│           ├── sheet/
│           ├── research/
│           └── animation/
│
├── convex/
│   ├── agents/
│   │   ├── slide.ts             # Slide Agent logic
│   │   ├── sheet.ts             # Sheet Agent logic
│   │   ├── research.ts          # Deep Research Agent logic
│   │   └── animation.ts         # Animation Agent logic
│   └── schema.ts                # Database schema
│
├── backend-services/
│   ├── ai-detector-onnx/        # Existing
│   ├── nlp-inference-service/   # Existing
│   ├── research-service/        # NEW: Multi-source research
│   │   ├── scrapers/
│   │   │   ├── arxiv.ts
│   │   │   ├── pubmed.ts
│   │   │   ├── scholar.ts
│   │   │   └── ieee.ts
│   │   └── synthesis.ts
│   └── animation-service/       # NEW: Video generation
│       ├── templates/
│       ├── voiceover.ts         # ElevenLabs integration
│       ├── music.ts             # Suno integration
│       └── renderer.ts          # Video rendering
│
└── packages/
    └── shared/
        └── types/
            ├── slide.ts
            ├── sheet.ts
            ├── research.ts
            └── animation.ts
```

---

## 📊 Agent Capabilities Matrix

| Capability | Slide | Sheet | Research | Animation |
|------------|-------|-------|----------|-----------|
| **Text Input** | ✅ | ✅ | ✅ | ❌ (uses Slide) |
| **Voice Input** | 🆕 | ❌ | ✅ | ❌ |
| **Document Import** | 🆕 | ✅ | ✅ | ❌ |
| **Web Scraping** | ❌ | ❌ | ✅ | ❌ |
| **Multi-source** | ❌ | ❌ | ✅ | ❌ |
| **Export PPTX** | ✅ | ❌ | ❌ | ❌ |
| **Export PDF** | ✅ | ❌ | ❌ | ❌ |
| **Export CSV** | ❌ | ✅ | ❌ | ❌ |
| **Export MP4** | ❌ | ❌ | ❌ | ✅ |
| **Voiceover** | ❌ | ❌ | ❌ | ✅ |
| **Music** | ❌ | ❌ | ❌ | ✅ |
| **Templates** | ✅ | ✅ | ❌ | ✅ |

---

## 🎯 Implementation Priority

### Phase 1: Complete Core Agents
1. **Slide Agent** - Finish undo/redo (2-3 days)
2. **Deep Research Agent** - Build multi-source research (1 week)

### Phase 2: Integration
3. **Research → Slide** - Connect agents (3-4 days)
4. **Sheet → Slide** - Data visualization (3-4 days)

### Phase 3: Add-on Agents
5. **Animation Agent v1** - Basic video from slides (1 week)
6. **Animation Agent v2** - Voice + music (1 week)

### Phase 4: Polish
7. **Template gallery** - Pre-built designs (1 week)
8. **Export options** - Multi-format support (3-4 days)

---

## 💡 Key Design Decisions

### 1. **Add-on Pattern**
- Animation Agent depends on Slide Agent output
- Cannot be used standalone
- Enhances rather than replaces

### 2. **Agent Communication**
- Standardized output formats
- JSON-based data exchange
- Convex for state management

### 3. **User Experience**
- Clear agent selection UI
- Visual workflow indicators
- Progress tracking per agent

### 4. **Pricing Strategy**
- Core agents: Included in base plan
- Add-on agents: Premium feature
- Usage-based for video generation

---

## 🚀 Next Steps

1. **Finalize Slide Agent** (undo/redo)
2. **Build Deep Research Agent** (multi-source)
3. **Design Animation Agent** (slide-to-video)
4. **Create agent integration layer**

---

## 📝 Notes

- Animation Agent is an **add-on**, not standalone
- Deep Research feeds into Slide Agent
- Sheet Agent can feed into Slide Agent (data viz)
- All agents share common UI patterns
- Template system applies to Slide + Animation
