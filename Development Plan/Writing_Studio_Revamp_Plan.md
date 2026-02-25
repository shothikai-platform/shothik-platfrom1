# Writing Studio Revamp — Front-End Implementation Plan

## "Shothik Research Notebook" — Inspired by Deta Surf

**Date:** February 17, 2026
**Status:** Planning Phase
**Vision:** Transform Shothik's Writing Studio from a "tool page" into an AI Research Notebook — a book-like writing environment where research, writing, paraphrasing, and verification happen in one continuous flow.

**Target Users:** 40M+ university students in Bangladesh, India, Indonesia, Philippines, Vietnam
**Price Point:** $2.99/student, $7.99/researcher (vs Quillbot $8.33/mo, Grammarly $30/mo)

---

## Part 1: Current State Audit

### What We Have (WritingStudioContent.jsx — 1,444 lines)

| Component | Status | Lines | What It Does |
|-----------|--------|-------|-------------|
| Tiptap Editor | Working | ~200 | Rich text editing, StarterKit, Placeholder, Highlight, TextAlign, Link |
| InlineSuggestion | Working | 156 | Tiptap extension: ghost text autocomplete via /api/ai-cowriter, Tab to accept |
| BubbleMenu | Working | ~40 | Select text → Paraphrase / Fix Grammar / Humanize buttons |
| AI Actions sidebar | Working | ~200 | Paraphrase (6 modes), Grammar, Humanize, Summarize with diff preview |
| AI Co-Writer sidebar | Working | 327 | Continue/Paragraph/Expand/Instruct modes, streaming output |
| Citation sidebar | Working | 470 | Semantic Scholar search, auto-suggest from text, APA/MLA/IEEE/Chicago/Harvard/Vancouver formats, inline citation insert, auto-references section |
| Research Search | Working | 268 | Semantic Scholar 214M+ papers, save to references, insert summary |
| Review sidebar | Working | 842 | Academic Tone Score, AI detection scan, plagiarism check, reference list, citation lookup |
| Export Panel | Working | 436 | LaTeX PDF (IEEE/APA/Chicago/Harvard/Essay/Lab Report), DOCX, HTML, TXT |
| Document Import | Working | — | PDF/DOCX/TXT import into editor |
| Writing Templates | Working | — | Pre-built academic templates (thesis, essay, lab report) |
| DiffPreview | Working | — | Side-by-side original vs modified text comparison |
| Onboarding | Working | — | First-time tour of features |
| Usage Limits | Working | — | Free/Pro tier gate with upgrade modal |

### Architecture Strengths
- Tiptap with ProseMirror = same editor framework as Deta Surf
- Already has BubbleMenu for inline AI actions
- InlineSuggestion extension already provides ghost-text autocomplete
- Semantic Scholar integration already provides 214M+ papers
- Citation system already handles APA/MLA/IEEE/Chicago/Harvard/Vancouver
- SSE streaming already works for AI Co-Writer
- Export to LaTeX PDF already works

### Architecture Gaps (vs Surf / vs User Needs)

| Gap | Impact | Difficulty |
|-----|--------|-----------|
| No split view (write + reference side by side) | High — researchers can't compare sources while writing | Medium |
| No source library (upload/save papers for later) | High — users re-search every session | Medium |
| No @-mention system for sources | High — no way to reference saved sources inline | Medium |
| Editor feels like a "tool" not a "notebook" | High — doesn't feel like a place to think and write | Medium |
| No interconnection between tools | High — paraphrase, grammar, plagiarism are separate | Low |
| Sidebar is cramped with 4 tabs | Medium — too many features fighting for space | Medium |
| No offline draft mode | Medium — South Asian connectivity issues | Low |
| 1,444-line monolith component | Medium — hard to maintain, slow to iterate | Medium |
| No contextual prompts (auto-suggest actions based on content) | Medium — user must know which tool to use | Low |
| No citation deep-linking (click citation → see source) | Low initially — differentiator for researchers | High |

---

## Part 2: Design Philosophy — Surf-Inspired Principles

### The "Book" Feeling

What makes Surf feel like a real book — and what we should adopt:

#### 1. Clean Canvas First
**Current:** Editor has a toolbar at top, cramped `min-h-[400px]`, inside a Card with border.
**Target:** Full-height writing area with minimal chrome. The page IS the notebook. No visible "card boundary" — just white paper with generous margins.

```
Current layout:
┌──────────────────────────────────────────────────┐
│ [Toolbar: Bold|Italic|...] [Import] [Export]     │
│ ┌─────────────── Card ───────────────────┐       │
│ │ [Tiptap Editor - 400px min height]     │       │
│ │                                        │       │
│ └────────────────────────────────────────┘       │
│           ↕ separated ↕                          │
│ ┌─────────── Sidebar Card ──────────────┐        │
│ │ [AI Actions] [Co-Write] [Cite] [Review]│       │
│ │ ... scrollable content ...             │        │
│ └────────────────────────────────────────┘       │
└──────────────────────────────────────────────────┘

Target layout:
┌─────────────────────────────────────────────────────────────┐
│ [≡ Notebook Title] [word count] [formality score]  [Export] │
├────────────────────────────────────────┬────────────────────┤
│                                        │                    │
│            WRITING CANVAS              │   CONTEXT PANEL    │
│                                        │  (collapsible)     │
│  Clean white page, full height,        │                    │
│  generous margins (px-12 py-8),        │  - Source viewer   │
│  max-w-[720px] centered               │  - AI actions      │
│                                        │  - Citations       │
│  Book-like typography:                 │  - Review          │
│  - serif headings (optional)           │                    │
│  - 1.75 line-height                    │                    │
│  - 18px base font                      │                    │
│                                        │                    │
│                                        │                    │
├────────────────────────────────────────┴────────────────────┤
│ [⚡ Paraphrase] [✓ Grammar] [🔍 Plagiarism] [📄 Cite] [AI] │
│ ─── Bottom Action Bar (Quillbot Flow inspired) ─────────── │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Context Panel = Split View
The right panel isn't a "sidebar with tabs" — it's a **context panel** that shows whatever is relevant to what the user is doing right now:
- Writing → shows AI suggestions, formality score
- Selected text → shows paraphrase/grammar/humanize actions
- Clicked a citation → shows the referenced paper
- Searching papers → shows search results
- Reviewing → shows plagiarism/AI detection results

This is Surf's key pattern: the right side responds to what's happening on the left.

#### 3. Bottom Action Bar (Quillbot Flow Inspired)
Move the most-used tools to a persistent bottom bar. This is what Quillbot Flow does and it's brilliant for reducing tab-switching:

```
┌─────────────────────────────────────────────────────────┐
│ [⚡Paraphrase ▾] [✓ Fix] [🤖 Humanize] [💬 AI Write]  │
│ [🔍 Plagiarism] [📊 AI Check] [📄 Cite] [📤 Export]   │
└─────────────────────────────────────────────────────────┘
```

Each button either:
- Acts on selected text instantly (paraphrase, grammar)
- Opens a panel in the context area (citations, plagiarism results)
- Opens a modal (export)

#### 4. Document-Centric AI Output
**Current:** AI Co-Writer generates text in the sidebar, then user clicks "Insert" to add it.
**Target (Surf pattern):** AI output appears directly in the document as an inline block that can be accepted, edited, or dismissed. Like Google Docs suggestions.

```
The results indicate that the proposed method...

┌─── AI Suggestion ─────────────────────────────┐
│ ...demonstrates a 23% improvement over the    │
│ baseline approach, particularly in cases where │
│ input data contains high-dimensional features. │
│                                                │
│ [✓ Accept]  [✎ Edit]  [✕ Dismiss]  [↻ Retry] │
└────────────────────────────────────────────────┘
```

#### 5. Smart Contextual Prompts
When the editor detects the user's writing context, suggest relevant actions:

| Context Detected | Auto-Suggested Prompts |
|-----------------|----------------------|
| Introduction section, <200 words | "Write a thesis statement", "Expand introduction" |
| Just pasted text from another source | "Paraphrase this", "Check for plagiarism", "Add citation" |
| Methods section | "Describe your methodology", "Add statistical methods" |
| Reference to a paper but no citation | "Find citation for [mentioned author]" |
| Long paragraph, high complexity | "Simplify this paragraph", "Break into smaller sections" |
| Text flagged as AI-generated | "Humanize this section" |
| Near end of document | "Write conclusion", "Summarize key findings" |

---

## Part 3: Connected Flow Architecture

### The Interconnected Tool Pipeline

The key differentiator: tools feed into each other, not exist in isolation.

```
User writes text
       │
       ├──► Real-time formality score updates (Academic Tone Meter)
       │
       ├──► Inline autocomplete suggestions (existing InlineSuggestion extension)
       │
       ├──► User selects text
       │    │
       │    ├──► BubbleMenu: [Paraphrase] [Grammar] [Humanize] [Cite]
       │    │
       │    ├──► Paraphrase result appears as DiffPreview inline
       │    │    │
       │    │    └──► If accepted, auto-run: plagiarism quick-check on that sentence
       │    │         │
       │    │         └──► If flagged, suggest: "Rephrase further" or "Add citation"
       │    │
       │    └──► Grammar fix applied in-place, highlighted briefly
       │
       ├──► User types @
       │    │
       │    └──► Mention menu: saved references, recent searches, notebooks
       │         │
       │         └──► Selecting a reference auto-inserts inline citation
       │
       ├──► "Pre-Submit Checklist" button
       │    │
       │    └──► Runs: Plagiarism + AI Detection + Citation completeness + Formatting
       │         │
       │         └──► Shows: ✅ / ⚠️ / ❌ for each check with one-click fixes
       │
       └──► Export: PDF (LaTeX) / DOCX / HTML / TXT with auto-generated references
```

### How Paraphrase Connects to Everything

Current: Paraphrase is a standalone tool on /paraphrase page. Also available in Writing Studio sidebar but disconnected.

Target: Paraphrase is woven into the writing fabric:

| Touchpoint | How Paraphrase Appears | Extra Intelligence |
|-----------|----------------------|-------------------|
| BubbleMenu | Select text → click "Paraphrase" → diff appears inline | STEM masking auto-applied |
| Bottom bar | Click ⚡ → applies to selected text or full paragraph | Mode selector dropdown |
| Post-paste detection | "Looks like pasted text. Paraphrase to make it yours?" | Auto-suggests citation |
| Post-plagiarism flag | "This sentence is too similar to [source]. Rephrase?" | Links to source |
| Context panel | Shows paraphrase result with word change %, alternatives | Rich copy, accept/reject |
| After citation insert | "Want to paraphrase this quote into your own words?" | Preserves citation |

---

## Part 4: Component Architecture — Decomposition Plan

### Current Problem
`WritingStudioContent.jsx` is a 1,444-line monolith with 25+ useState calls. This needs to be decomposed.

### Proposed Component Tree

```
WritingStudioPage (route: /writing-studio)
│
├── WritingStudioProvider (context: editor, refs, sources, citations)
│   │
│   ├── NotebookHeader
│   │   ├── DocumentTitle (editable, auto-save)
│   │   ├── WordCountBadge
│   │   ├── FormalityScoreBadge
│   │   ├── DocumentActions (Import, Export, Share)
│   │   └── BackendStatusIndicator
│   │
│   ├── WritingCanvas (main content area)
│   │   ├── EditorToolbar (floating, appears on scroll-up)
│   │   │   ├── FormatButtons (Bold, Italic, Heading, List, Link)
│   │   │   ├── AlignButtons
│   │   │   └── UndoRedoButtons
│   │   │
│   │   ├── TiptapEditor (clean full-page canvas)
│   │   │   ├── Extensions:
│   │   │   │   ├── StarterKit
│   │   │   │   ├── InlineSuggestion (existing)
│   │   │   │   ├── CitationNode (NEW — Surf-inspired Tiptap node)
│   │   │   │   ├── MentionExtension (NEW — @-mention sources)
│   │   │   │   ├── InlineAIBlock (NEW — AI output appears in doc)
│   │   │   │   ├── PasteDetector (NEW — detects pasted content)
│   │   │   │   └── STEMMask (NEW — auto-detects LaTeX/code)
│   │   │   │
│   │   │   ├── BubbleMenu (enhanced)
│   │   │   │   ├── ParaphraseAction
│   │   │   │   ├── GrammarFixAction
│   │   │   │   ├── HumanizeAction
│   │   │   │   ├── CiteAction (NEW)
│   │   │   │   ├── ExplainAction (NEW)
│   │   │   │   └── TranslateAction (NEW — for ESL students)
│   │   │   │
│   │   │   └── InlineDiffPreview (NEW — shows changes in-place)
│   │   │
│   │   └── SelectionInfoBar (bottom of canvas)
│   │
│   ├── ContextPanel (right side, collapsible)
│   │   ├── ContextPanelHeader (title, collapse button)
│   │   ├── ContextRoutes:
│   │   │   ├── AIActionsView (paraphrase modes, results, diff)
│   │   │   ├── CoWriterView (continue/paragraph/expand/instruct)
│   │   │   ├── SourceView (NEW — shows a paper/PDF in reader mode)
│   │   │   ├── CitationView (search, suggest, insert, references list)
│   │   │   ├── ReviewView (analysis, AI score, plagiarism, checklist)
│   │   │   └── PreSubmitChecklist (NEW — all checks in one view)
│   │   └── ResizeDragHandle
│   │
│   └── BottomActionBar (persistent)
│       ├── ParaphraseButton (with mode dropdown)
│       ├── GrammarButton
│       ├── HumanizeButton
│       ├── AIWriteButton
│       ├── PlagiarismButton
│       ├── AICheckButton
│       ├── CiteButton
│       └── ExportButton
│
└── Modals
    ├── ExportModal
    ├── DocumentImportModal
    ├── UpgradeModal
    └── OnboardingModal
```

### State Management — Move to Context Provider

```tsx
// WritingStudioProvider.tsx — replaces 25+ useState calls

interface WritingStudioState {
  // Document
  documentTitle: string;
  wordCount: number;
  textAnalysis: TextAnalysis | null;

  // Tools
  activeTool: ToolType | null;
  isProcessing: boolean;
  processedResult: string;
  showDiff: boolean;

  // Citations
  savedReferences: Reference[];
  citationFormat: CitationFormat;
  citationSuggestions: Paper[];

  // Review
  aiScore: AIScore | null;
  plagiarismResult: PlagiarismResult | null;

  // Sources (NEW)
  savedSources: Source[];
  activeSourceView: Source | null;

  // UI
  contextPanelOpen: boolean;
  contextPanelView: ContextView;
  showExportPanel: boolean;
}
```

---

## Part 5: New Tiptap Extensions (Surf-Inspired)

### Extension 1: CitationNode

Directly inspired by Surf's `Citation` extension. Creates an inline citation marker that is clickable.

```tsx
// Renders as: [1] or (Author, 2024) depending on format
// Click → opens source in ContextPanel split view
// Hover → shows paper title, authors, year

const CitationNode = Node.create({
  name: 'citation',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      referenceId: { default: null },      // links to savedReferences index
      format: { default: 'apa' },          // citation format
      paper: { default: null },            // paper metadata
    }
  },

  // Renders as styled inline element
  // Click handler opens source in context panel
})
```

### Extension 2: MentionExtension

Type `@` to search and insert a reference to a saved source or paper.

```tsx
// @-mention menu shows:
// - Saved references (papers you've added)
// - Recent Semantic Scholar searches
// - Template sections (@introduction, @methodology, @conclusion)

// Selecting a paper auto-inserts:
// 1. Inline citation marker
// 2. Adds to references list if not already there
// 3. Opens paper in context panel
```

### Extension 3: InlineAIBlock

AI-generated content appears inside the document, not in a sidebar.

```tsx
// When AI generates text:
// 1. Insert an InlineAIBlock node at cursor position
// 2. Stream text into the block (visible to user in real-time)
// 3. Show accept/reject/edit controls
// 4. On accept: dissolve block, content becomes regular text
// 5. On reject: remove block entirely
```

### Extension 4: PasteDetector

Detects when user pastes text and suggests actions.

```tsx
// On paste event:
// 1. Detect if pasted text is >50 words
// 2. Show inline hint: "Pasted text detected"
// 3. Suggest: [Paraphrase] [Check Plagiarism] [Add Citation]
// 4. If STEM content detected, apply masking automatically
```

---

## Part 6: The "Book-Like" Visual Design

### Typography

```css
/* Writing canvas typography — book-like feel */
.writing-canvas {
  max-width: 720px;          /* Optimal reading width */
  margin: 0 auto;
  padding: 3rem 3rem 6rem;   /* Generous margins like a printed page */
  min-height: calc(100vh - 120px);
  background: var(--background);
}

.writing-canvas .ProseMirror {
  font-family: 'Georgia', 'Times New Roman', serif;  /* Book feel for body */
  font-size: 18px;
  line-height: 1.8;           /* Generous line height */
  color: var(--foreground);
  letter-spacing: 0.01em;
}

.writing-canvas .ProseMirror h1 {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.writing-canvas .ProseMirror h2 {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.writing-canvas .ProseMirror p {
  margin-bottom: 1.25rem;
}

.writing-canvas .ProseMirror blockquote {
  border-left: 3px solid var(--primary);
  padding-left: 1.5rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--muted-foreground);
}

/* Code blocks (STEM) get monospace treatment */
.writing-canvas .ProseMirror code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  background: var(--muted);
  padding: 0.15em 0.4em;
  border-radius: 0.25rem;
  font-size: 0.9em;
}

/* Inline citations */
.writing-canvas .citation-node {
  color: var(--primary);
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.2s;
}

.writing-canvas .citation-node:hover {
  opacity: 0.7;
  text-decoration: underline;
}

/* AI suggestion ghost text */
.writing-canvas .inline-suggestion {
  color: var(--muted-foreground);
  opacity: 0.5;
  font-style: italic;
}

/* Dark mode adjustments */
.dark .writing-canvas {
  background: hsl(var(--background));
}

.dark .writing-canvas .ProseMirror {
  color: hsl(var(--foreground));
}
```

### Context Panel Design

```css
/* Resizable context panel */
.context-panel {
  border-left: 1px solid var(--border);
  background: var(--muted)/5;
  min-width: 320px;
  max-width: 50vw;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

/* When showing a source (PDF/paper) — reader mode */
.context-panel.source-view {
  padding: 2rem;
  font-size: 15px;
  line-height: 1.7;
}

/* Collapse animation */
.context-panel.collapsed {
  width: 0;
  min-width: 0;
  border-left: none;
  overflow: hidden;
  transition: width 0.3s ease, min-width 0.3s ease;
}
```

### Bottom Action Bar Design

```css
/* Persistent bottom action bar */
.bottom-action-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--background);
  border-top: 1px solid var(--border);
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  z-index: 20;
  backdrop-filter: blur(12px);
  background: var(--background)/95;
}

.bottom-action-bar button {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.15s;
  color: var(--muted-foreground);
}

.bottom-action-bar button:hover {
  background: var(--muted);
  color: var(--foreground);
}

.bottom-action-bar button.active {
  background: var(--primary)/10;
  color: var(--primary);
}
```

---

## Part 7: ESL Academic Tone Features (Market Differentiator)

### Real-Time Formality Meter

```
┌──────────────────────────────────────────────┐
│ Academic Tone Score: 72/100  [████████░░] 🎓 │
│                                              │
│ ⚠ 3 informal phrases detected               │
│  • "a lot of" → "numerous" / "a significant" │
│  • "things" → "factors" / "elements"          │
│  • "really good" → "highly effective"         │
│                                              │
│ ✓ Good use of passive voice (18%)            │
│ ✓ Complex sentence variety detected          │
│ ⚠ Consider more hedging language             │
│   e.g., "suggests" instead of "proves"        │
└──────────────────────────────────────────────┘
```

### ESL-Specific Corrections (South Asian Context)

Common L1 transfer errors for Bengali/Hindi speakers:
- Article misuse: "the" where not needed, missing "a/an"
- Word order: Subject placement issues
- Preposition confusion: "in" vs "at" vs "on"
- Tense consistency issues
- Run-on sentences (common in Bengali academic writing)

These should appear as gentle inline hints (not red underlines), with explanations in simple English.

---

## Part 8: Pre-Submission Checklist (One-Click Verification)

### UI Design

```
┌─────────── Pre-Submission Checklist ──────────┐
│                                                │
│ ✅ Plagiarism Check         2.3% similarity   │
│    All clear — no significant matches          │
│                                                │
│ ✅ AI Content Detection     8% AI probability  │
│    Within acceptable range                     │
│                                                │
│ ⚠️  Citation Completeness   3 of 5 claims cited │
│    2 unsupported claims found:                 │
│    → Para 3: "Studies show that..." [Add cite] │
│    → Para 7: "Research indicates..." [Add cite]│
│                                                │
│ ✅ Formatting Check         APA compliant      │
│    References section present and formatted    │
│                                                │
│ ⚠️  Academic Tone            72/100            │
│    3 informal phrases — [Fix automatically]    │
│                                                │
│ ✅ Word Count                2,847 words       │
│    Within target range (2,500-3,500)           │
│                                                │
│ ───────────────────────────────────────────── │
│ Overall: Ready with minor issues               │
│                                                │
│ [Fix All Issues]  [Export Anyway]  [Cancel]     │
└────────────────────────────────────────────────┘
```

---

## Part 9: Implementation Phases

### Phase 1: Foundation (Week 1-2) — "Book Feel + Bottom Bar"

**Goal:** Make the Writing Studio feel like a notebook, not a tool page.

| Task | Description | Estimated Time |
|------|-------------|---------------|
| 1.1 | Decompose WritingStudioContent.jsx into component tree | 4h |
| 1.2 | Create WritingStudioProvider context | 2h |
| 1.3 | New layout: full-height canvas + collapsible context panel | 3h |
| 1.4 | Book-like typography CSS (serif body, generous margins) | 2h |
| 1.5 | Bottom Action Bar component | 3h |
| 1.6 | Move AI Actions from sidebar tabs to bottom bar | 2h |
| 1.7 | Floating toolbar (appears on scroll-up, hides on scroll-down) | 2h |
| 1.8 | Resizable context panel with drag handle | 2h |
| **Total** | | **20h** |

### Phase 2: Inline AI (Week 3-4) — "AI In the Document"

**Goal:** AI outputs appear inside the document, not in a sidebar.

| Task | Description | Estimated Time |
|------|-------------|---------------|
| 2.1 | InlineAIBlock Tiptap extension (generation node in editor) | 4h |
| 2.2 | Inline diff preview (paraphrase result shown in-place) | 3h |
| 2.3 | PasteDetector extension (detect paste, suggest actions) | 2h |
| 2.4 | Contextual prompts (auto-suggest actions based on content) | 3h |
| 2.5 | Enhanced BubbleMenu (+Cite, +Explain, +Translate) | 2h |
| 2.6 | Context panel becomes reactive (responds to editor state) | 3h |
| **Total** | | **17h** |

### Phase 3: Connected Citations (Week 5-6) — "Write with Sources"

**Goal:** Citations are a first-class part of the writing experience.

| Task | Description | Estimated Time |
|------|-------------|---------------|
| 3.1 | CitationNode Tiptap extension (clickable inline citations) | 4h |
| 3.2 | @-mention extension for sources/references | 4h |
| 3.3 | Source viewer in context panel (read paper alongside writing) | 3h |
| 3.4 | Auto-citation from paraphrase (paraphrase → suggest citation) | 2h |
| 3.5 | Citation completeness scanner (find unsupported claims) | 3h |
| 3.6 | Pre-submission checklist UI | 3h |
| **Total** | | **19h** |

### Phase 4: ESL & Market Fit (Week 7-8) — "South Asian Scholar Mode"

**Goal:** Features specifically for South/Southeast Asian university students.

| Task | Description | Estimated Time |
|------|-------------|---------------|
| 4.1 | Real-time Academic Tone Meter (formality score widget) | 3h |
| 4.2 | Informal phrase detector with academic alternatives | 3h |
| 4.3 | ESL-specific grammar hints (Bengali/Hindi L1 transfer errors) | 4h |
| 4.4 | Offline draft mode (IndexedDB save, queue paraphrase requests) | 4h |
| 4.5 | Template library expansion (university-specific formats) | 2h |
| 4.6 | Mobile-responsive bottom bar and context panel | 3h |
| **Total** | | **19h** |

### Total: ~75 hours across 8 weeks

---

## Part 10: Competitive Positioning Summary

### What We'll Have That Nobody Else Does

| Feature | Quillbot Flow | Grammarly | NotebookLM | Surf | Shothik (After Revamp) |
|---------|:---:|:---:|:---:|:---:|:---:|
| Book-like writing canvas | ❌ | ❌ | ❌ | ✅ | ✅ |
| Inline AI generation in doc | ❌ | ❌ | ❌ | ✅ | ✅ |
| @-mention sources | ❌ | ❌ | ❌ | ✅ | ✅ |
| Citation deep-linking | ❌ | ❌ | ❌ | ✅ | ✅ |
| Split view (write + reference) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Bottom action bar | ✅ | ❌ | ❌ | ❌ | ✅ |
| STEM-safe paraphrase (LaTeX) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Plagiarism check | ✅ (paid) | ✅ (paid) | ❌ | ❌ | ✅ |
| AI detection | ✅ (paid) | ❌ | ❌ | ❌ | ✅ |
| Pre-submission checklist | ❌ | ❌ | ❌ | ❌ | ✅ |
| ESL academic tone coaching | ❌ | Basic | ❌ | ❌ | ✅ |
| Bengali/Hindi awareness | ❌ | ❌ | ❌ | ❌ | ✅ |
| Offline draft mode | ❌ | ❌ | ❌ | ✅ | ✅ |
| $2.99 student pricing | ❌ | ❌ | Free (limited) | Free (beta) | ✅ |
| Export to LaTeX PDF (IEEE/APA) | ❌ | ❌ | ❌ | ❌ | ✅ |

### The Pitch

> **"Quillbot is a paraphrasing tool. Grammarly is a grammar checker. Shothik AI is where South Asian scholars write their research."**

The revamped Writing Studio becomes the place where the entire research-to-submission journey happens. Not a tool you visit, but a workspace you live in.

---

## Appendix A: Key Files to Modify

### Existing Files (Refactor)
- `src/components/tools/writing-studio/WritingStudioContent.jsx` → decompose into 15+ components
- `src/components/tools/writing-studio/components/AiCoWriterPanel.jsx` → integrate into inline AI
- `src/components/tools/writing-studio/components/ReviewPanels.jsx` (842 lines) → decompose
- `src/components/tools/writing-studio/components/CitationSuggestionPanel.jsx` → integrate with @-mention
- `src/lib/tiptap-inline-suggestion.js` → extend or keep alongside new extensions
- `src/assets/styles/components/tiptap.css` → add book-like typography

### New Files to Create
- `src/components/tools/writing-studio/providers/WritingStudioProvider.tsx`
- `src/components/tools/writing-studio/canvas/WritingCanvas.tsx`
- `src/components/tools/writing-studio/canvas/NotebookHeader.tsx`
- `src/components/tools/writing-studio/canvas/FloatingToolbar.tsx`
- `src/components/tools/writing-studio/canvas/BottomActionBar.tsx`
- `src/components/tools/writing-studio/context-panel/ContextPanel.tsx`
- `src/components/tools/writing-studio/context-panel/SourceViewer.tsx`
- `src/components/tools/writing-studio/context-panel/PreSubmitChecklist.tsx`
- `src/lib/tiptap-extensions/CitationNode.ts`
- `src/lib/tiptap-extensions/MentionExtension.ts`
- `src/lib/tiptap-extensions/InlineAIBlock.ts`
- `src/lib/tiptap-extensions/PasteDetector.ts`
- `src/hooks/useWritingStudioContext.ts`
- `src/hooks/useContextPanel.ts`
- `src/hooks/useFormalityScore.ts`

### Styles
- `src/assets/styles/components/writing-canvas.css` — book-like typography
- `src/assets/styles/components/context-panel.css` — split view styles
- `src/assets/styles/components/bottom-action-bar.css` — persistent bar

---

## Appendix B: Deta Surf Source References

Key patterns studied from `github.com/deta/surf`:

| Surf Component | Path | What We Learn |
|---------------|------|-------------|
| Citation extension | `packages/editor/src/lib/extensions/Citation/citation.ts` | Tiptap inline citation node with click handling |
| AI Generation | `packages/editor/src/lib/extensions/AIGeneration/generation.ts` | AI output as ProseMirror node in document |
| AI Prompt | `packages/editor/src/lib/extensions/AIPrompt/prompt.ts` | User prompt embedded in editor |
| AI Output | `packages/editor/src/lib/extensions/AIOutput/output.ts` | Generated content as editable block |
| Context Manager | `packages/services/src/lib/ai/contextManager.ts` | Multi-source context for AI queries |
| Mention system | `packages/services/src/lib/ai/mentions.ts` | @-mention fetcher for resources |
| Editor AI integration | `packages/services/src/lib/ai/editor.ts` | How AI generation interacts with Tiptap |
| Resource context | `packages/services/src/lib/ai/context/resource.ts` | How saved sources provide context |
| Web parser | `packages/web-parser/src/` | URL/PDF/YouTube content extraction |
| Prompts | `packages/services/src/lib/ai/prompts.ts` | Summarize, Explain, Translate, Grammar prompts |

**License:** Deta Surf is Apache 2.0 — patterns can be studied and adapted.
