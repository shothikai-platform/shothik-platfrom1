# Shothik AI — Frontend Implementation Roadmap: 12-Agent Development Discussion

**Document Version:** 2.0
**Date:** February 15, 2026
**Project:** Shothik AI v3 — Plagiarism Checker Frontend
**Prerequisite:** Gaia UI Quality Audit (7.5/10 baseline score)
**Goal:** Implement STEM-native plagiarism detection UI, fix audit gaps, ship to South/Southeast Asia researchers

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Agent Roster & Specializations](#2-agent-roster--specializations)
3. [12-Agent Development Discussion](#3-12-agent-development-discussion)
4. [Implementation Phase Timeline](#4-implementation-phase-timeline)
5. [Dependency Graph](#5-dependency-graph)
6. [File-Level Implementation Specifications](#6-file-level-implementation-specifications)
7. [Risk Register & Mitigations](#7-risk-register--mitigations)
8. [Definition of Done](#8-definition-of-done)
9. [Cross-Cutting Concerns](#9-cross-cutting-concerns)

---

## 1. Executive Summary

This document is the output of a 12-agent development discussion that translates the Gaia UI Quality Audit findings into a concrete, sequenced implementation plan. Each agent brings a specialized perspective — from bug triage to STEM rendering to deployment strategy — and together they negotiate priorities, dependencies, and trade-offs to produce a unified roadmap.

**Key decisions from the discussion:**

1. **Phase 1.5 (UI Bug Fixes) must ship first** — dark mode, accessibility, and design consistency fixes are prerequisites for credibility with academic users
2. **LaTeX and Code Block detection are frontend-only** — no backend changes needed; text preprocessing strips these before API call
3. **File Upload requires backend coordination** — PDF extraction can be client-side (pdfjs-dist), but LaTeX `.tex` parsing needs a shared utility
4. **Citation Analysis is the differentiator** — highest business value but highest complexity; build iteratively
5. **Mobile layout is Phase 3** — desktop-first for researcher workflow, but must not regress mobile usability

**Total estimated effort:** 6-8 weeks for Phases 1.5 through 3

---

## 2. Agent Roster & Specializations

| # | Agent | Specialization | Perspective |
|---|-------|---------------|-------------|
| 1 | **Release Engineer** | Sequencing, dependencies, risk | "What order minimizes risk and rework?" |
| 2 | **Bug Triage Lead** | Phase 1.5 bug fixes from audit | "What breaks users right now?" |
| 3 | **STEM Rendering Specialist** | LaTeX/KaTeX, code blocks/Shiki | "How do researchers' documents actually look?" |
| 4 | **File Systems Architect** | PDF/DOCX/LaTeX upload pipeline | "How do we extract text reliably from academic formats?" |
| 5 | **Citation Intelligence Agent** | Citation detection, gap analysis | "What separates plagiarism from proper citation?" |
| 6 | **Accessibility Champion** | ARIA, keyboard nav, screen readers | "Can a visually impaired researcher use this?" |
| 7 | **Performance Engineer** | Bundle size, lazy loading, rendering | "Will this stay fast with 50-page papers?" |
| 8 | **State & Data Flow Architect** | Redux, hooks, caching, API integration | "Where does each piece of state live?" |
| 9 | **Design System Enforcer** | Gaia UI compliance for new components | "Does this match the design system?" |
| 10 | **Mobile & Responsive Agent** | Breakpoints, touch, layout adaptation | "Does this work on a tablet in a university lab?" |
| 11 | **Integration & API Agent** | Backend contracts, error handling | "What does the backend expect and return?" |
| 12 | **Testing & Quality Gate** | Verification strategy, regression prevention | "How do we know this actually works?" |

---

## 3. 12-Agent Development Discussion

### Round 1: Sequencing Debate — What Ships First?

---

**Agent 1 (Release Engineer):** I propose we sequence into four phases. Phase 1.5 is mandatory — the Gaia audit identified 6 critical bugs including invisible text in dark mode. If an academic user evaluates us in dark mode, they see broken highlights and leave. That's a deal-breaker for credibility.

**Agent 2 (Bug Triage Lead):** Agreed. I've triaged the 7 bugs by effort and impact:

| # | Bug | Impact | Effort | Dependencies |
|---|-----|--------|--------|-------------|
| 1 | `color: #000000` in highlight CSS (`plagiarism-editor.css` lines 78, 89, 100, 111) | Critical — dark mode unusable | 5 min | None |
| 2 | Missing `aria-live` on ScanProgress (`ScanProgress.tsx`, card wrapper) | High — screen readers miss progress updates | 10 min | None |
| 3 | Missing `aria-label` on editor (`PlagiarismInputEditor.tsx`, editorProps.attributes) | Medium — no accessible name for TipTap | 5 min | None |
| 4 | `border-slate-300 bg-white dark:bg-slate-800` in ScanProgress line 244 | Low — visual inconsistency with zinc palette | 2 min | None |
| 5 | Missing reduced motion support (all animation components) | Medium — motion-sensitive users affected | 15 min | None |
| 6 | Missing `role="alert"` on ErrorStateCard (`ErrorStateCard.tsx`, root Card) | Medium — errors not announced to screen readers | 2 min | None |
| 7 | Missing `role="textbox"` + `aria-multiline="true"` on editor contenteditable | Medium — TipTap doesn't set ARIA roles on contenteditable | 2 min | None |

Total effort: ~45 minutes. No dependencies. Zero risk. **Ship today.**

**Agent 6 (Accessibility Champion):** Bug 7 is important — TipTap renders a contenteditable div but doesn't set `role="textbox"` or `aria-multiline="true"` by default. Screen readers may not properly identify it as a text input. This is a quick addition to `editorProps.attributes` in `PlagiarismInputEditor.tsx`.

**Agent 2:** Good catch. Adding that to the list — still zero risk, another 2 minutes.

**Agent 1:** Phase 1.5 is locked. Now for Phase 2 — STEM features. I see four independent work streams:

| Stream | Features | Dependencies |
|--------|----------|-------------|
| A | LaTeX detection + exclusion | Frontend only — text preprocessing |
| B | Code block detection + exclusion | Frontend only — text preprocessing |
| C | File upload (PDF/DOCX/LaTeX) | Frontend + pdfjs-dist/mammoth libraries |
| D | Citation-aware analysis UI | Frontend + may need backend enhancement |

Streams A and B are independent and can be built in parallel. Stream C needs library integration. Stream D is the most complex and should start after A+B prove the preprocessing pattern works.

---

### Round 2: LaTeX & Code Block Implementation

---

**Agent 3 (STEM Rendering Specialist):** Let me break down exactly how LaTeX and code blocks work in a plagiarism checker context. The key insight: **we are NOT building an editor that renders LaTeX.** We are building a preprocessor that:

1. **Detects** LaTeX/code in the input text
2. **Excludes** those regions from the text sent to the plagiarism API
3. **Visually marks** those regions in the editor so users know they're excluded
4. **Preserves** positions so highlights from the API map back to the correct text

**LaTeX Detection Logic:**

```
Input:  "The equation $E = mc^2$ is fundamental to..."
         ├─ text ─┤├── LaTeX ──┤├──── text ────────┤

Preprocessor output:
  textForAPI: "The equation  is fundamental to..."
  excludedRegions: [{ start: 13, end: 24, type: "latex", raw: "$E = mc^2$" }]
```

**Patterns to detect (ordered by specificity):**

| Pattern | Regex | Example | Priority |
|---------|-------|---------|----------|
| Display math | `/\$\$[\s\S]+?\$\$/g` | `$$\int_0^1 x dx$$` | Highest — match before inline |
| LaTeX environments | `/\\begin\{(equation|align|gather|multline|displaymath|math)\*?\}[\s\S]*?\\end\{\1\*?\}/g` | `\begin{equation}...\end{equation}` | High |
| Inline math | `/(?<!\$)\$(?!\$)[^$\n]+?\$/g` | `$E = mc^2$` | Medium |
| Common commands | `/\\(frac|int|sum|prod|lim|sqrt|alpha|beta|gamma|delta|theta|lambda|sigma|omega|partial|nabla|infty|forall|exists|in|notin|subset|supset|cup|cap|vee|wedge|neg|implies|iff)\b/g` | `\frac{a}{b}` | Low — only flag if dense (3+ per paragraph) |
| `\cite{}` references | `/\\cite\{[^}]+\}/g` | `\cite{smith2024}` | Medium — also used in citation analysis |

**Agent 7 (Performance Engineer):** What about KaTeX for rendering? The audit suggested lazy loading at 250KB.

**Agent 3:** For Phase 2, I recommend **NOT** rendering LaTeX visually yet. The priority is detection and exclusion. We just need:
- A regex-based detector (no library needed, ~5KB of utility code)
- Visual markers in the editor (styled spans via TipTap decorations, same pattern as plagiarism highlights)
- An "Excluded" badge on each region

Rendering with KaTeX can be Phase 4 — it's a nice-to-have for researchers who want to see their formulas, but the core value is accurate exclusion from plagiarism scoring.

**Agent 9 (Design System Enforcer):** For the visual markers, following Gaia's flat design:

```tsx
// LaTeX region in editor — TipTap decoration class
.plagiarism-excluded-latex {
  background-color: oklch(0.95 0.02 255 / 0.3);  /* blue-50/30 equivalent */
  border-radius: 4px;
  padding: 0 4px;
  cursor: default;
}
.dark .plagiarism-excluded-latex {
  background-color: oklch(0.25 0.04 255 / 0.2);  /* blue-950/20 equivalent */
}

// Code region in editor — TipTap decoration class
.plagiarism-excluded-code {
  background-color: oklch(0.95 0 0 / 0.5);       /* zinc-100 equivalent */
  border-radius: 8px;
  padding: 4px 8px;
  font-family: var(--font-geist-mono), monospace;
  font-size: 0.85em;
  cursor: default;
}
.dark .plagiarism-excluded-code {
  background-color: oklch(0.25 0 0 / 0.5);       /* zinc-800 equivalent */
}
```

No borders on these regions — use background fills only. This matches Gaia's "flat design, no outlines" principle.

**Agent 3:** For code blocks, the detection patterns:

| Pattern | Detection Method | Example |
|---------|-----------------|---------|
| Fenced blocks | ` ```language ... ``` ` (triple backtick) | Standard markdown code |
| Indented blocks | 4+ spaces or tab at start, 3+ consecutive lines | Traditional code indentation |
| Inline code | `` `code` `` (single backticks) | Variable names, short snippets |
| Heuristic | Lines with high density of: `import`, `def`, `function`, `class`, `return`, `{`, `}`, `;`, `=>`, `#include` | Unformatted code pasted directly |

**Agent 8 (State & Data Flow Architect):** Where does the preprocessing state live?

**Agent 3:** I propose a new utility module — a pure function, not a hook:

```typescript
// File: src/utils/plagiarism/stemPreprocessor.ts

export interface PreprocessOptions {
  excludeLatex: boolean;
  excludeCode: boolean;
  excludeReferences: boolean;  // Existing logic, moved here
  excludeQuotes: boolean;      // Existing logic, moved here
}

export interface ExcludedRegion {
  start: number;
  end: number;
  type: 'latex' | 'code' | 'reference' | 'quote';
  raw: string;      // Original text in this region
  label: string;    // Human-readable label, e.g. "LaTeX equation", "Python code"
}

export interface PreprocessResult {
  processedText: string;
  excludedRegions: ExcludedRegion[];
  positionMap: { original: number; processed: number }[];
  stats: {
    latexRegions: number;
    codeBlocks: number;
    referencesExcluded: boolean;
    quotesExcluded: boolean;
    originalWordCount: number;
    processedWordCount: number;
  };
}

export function preprocessForAnalysis(
  text: string,
  options: PreprocessOptions
): PreprocessResult { ... }
```

**Agent 8:** Good. This is a pure function — no state management needed. It takes input text + toggles, returns processed text + metadata. The existing `usePlagiarismReport` hook calls this before sending to the API. The excluded regions feed into the editor's highlight system via the same TipTap decoration pattern used for plagiarism highlights.

**Agent 1 (Release Engineer):** I'm noting that this preprocessor also consolidates the existing "Exclude References" and "Exclude Quotes" logic, which is currently inline in the `PlagiarismCheckerContentSection/index.jsx` page component. We should refactor those into this same utility during Phase 2.

**Agent 3:** Correct. The current reference exclusion logic (detecting "References" / "Bibliography" / "Works Cited" / "Literature Cited" headers and stripping everything below) moves into `stemPreprocessor.ts`. This creates a single source of truth for all text preprocessing.

**Agent 12 (Testing & Quality Gate):** This preprocessor is a pure function — perfect for unit testing. I want tests for:

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Simple LaTeX inline | `"The equation $E=mc^2$ shows"` | processedText: `"The equation  shows"`, 1 excluded region |
| Display math | `"Given $$\int_0^1 x\,dx = \frac{1}{2}$$ we see"` | processedText: `"Given  we see"`, 1 excluded region |
| Fenced code block | `"Code:\n\`\`\`python\nprint('hi')\n\`\`\`\nEnd"` | processedText: `"Code:\n\nEnd"`, 1 excluded region |
| No LaTeX (toggle off) | `"$E=mc^2$"` with excludeLatex: false | processedText: `"$E=mc^2$"`, 0 excluded regions |
| Mixed content | Text with both LaTeX and code | Both detected, both excluded |
| Nested dollar signs | `"Price is $5 and $10"` | NOT detected as LaTeX (heuristic: no backslashes, no math operators) |
| Reference section | `"...text\n\nReferences\n1. Smith..."` | Reference section stripped |
| Empty input | `""` | processedText: `""`, empty stats |

---

### Round 3: File Upload Pipeline

---

**Agent 4 (File Systems Architect):** File upload is the most technically complex feature. Here's my architecture:

**Supported formats and extraction strategy:**

| Format | Library | Size (gzipped) | Loading | Strategy |
|--------|---------|---------------|---------|----------|
| PDF | `pdfjs-dist` | ~300KB | Lazy — on file drop | Client-side `getPage().getTextContent()` |
| DOCX | `mammoth` | ~60KB | Lazy — on file drop | Client-side conversion to plain text |
| TXT | Native `FileReader` | 0KB | Eager | Direct `readAsText()` |
| LaTeX (.tex) | Custom parser | ~5KB | Eager | Strip LaTeX commands, extract text |
| BibTeX (.bib) | Custom parser | ~3KB | Eager | Parse for citation entries |

**Agent 7 (Performance Engineer):** 300KB for pdfjs-dist is significant. Can we lazy-load it?

**Agent 4:** Yes — the upload UI loads instantly with zero extra JS. When the user actually drops a PDF, we dynamically import:

```typescript
// File: src/components/plagiarism/FileUpload/extractors/pdfExtractor.ts

export async function extractPDFText(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }
  
  return pages.join('\n\n');
}
```

**Agent 4:** The file upload component architecture:

```
New files:
  src/components/plagiarism/FileUpload/
    ├── FileDropzone.tsx      — Drag-and-drop zone (adapted from Gaia pattern)
    │     Props: onTextExtracted, accept, maxSize, disabled
    │     States: idle → dragging → extracting → previewing → error
    │     Accessibility: role="button", tabIndex=0, aria-label, keyboard Enter/Space
    │
    ├── FilePreview.tsx       — Shows uploaded file with type icon + size + remove button
    │     Props: file, onRemove
    │     Design: bg-muted/40 rounded-xl p-3, type-specific icon color
    │
    ├── TextPreview.tsx       — Shows extracted text for review before inserting into editor
    │     Props: text, onConfirm, onCancel, wordCount
    │     Design: max-h-[300px] overflow-y-auto, word count badge, edit warning
    │
    └── extractors/
        ├── pdfExtractor.ts   — PDF text extraction (lazy-loaded pdfjs-dist)
        ├── docxExtractor.ts  — DOCX text extraction (lazy-loaded mammoth)
        ├── latexExtractor.ts — LaTeX command stripping (custom, no dependencies)
        └── index.ts          — Format router: file extension → correct extractor
```

**Agent 9 (Design System Enforcer):** The FileDropzone must follow Gaia patterns:

```tsx
// FileDropzone.tsx — Gaia-compliant design
<div
  role="button"
  tabIndex={0}
  aria-label="Upload document for plagiarism check"
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openFilePicker(); }}
  className={cn(
    "relative rounded-xl p-8 text-center transition-all cursor-pointer",
    "bg-muted/30 hover:bg-muted/50",
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
    isDragging && "bg-primary/10 shadow-md",
    hasError && "bg-destructive/5",
  )}
>
  <CloudUpload className="mx-auto size-10 text-muted-foreground/60" />
  <p className="mt-3 text-sm font-medium text-foreground">Upload your document</p>
  <p className="mt-1 text-xs text-muted-foreground">
    PDF, DOCX, TXT, LaTeX (.tex) — Max 25MB
  </p>
</div>
```

No borders — flat design. Use `bg-muted/30` for idle, `bg-primary/10` for drag-active. The dashed border convention from Gaia's `FileDropzone` is acceptable ONLY for the drop zone (it's a universal UX convention).

**Agent 6 (Accessibility Champion):** The dropzone needs:
- `role="button"` for keyboard activation
- `aria-label="Upload document for plagiarism check"` (descriptive, not generic)
- `tabIndex={0}` for keyboard focus
- `onKeyDown` handler for Enter/Space activation
- Visual focus ring: `focus-visible:ring-2 focus-visible:ring-primary`
- `aria-live="polite"` region for announcing extraction progress
- Screen reader announcement on file accepted/rejected: `aria-live` region that updates with "File accepted: research_paper.pdf" or "Error: File too large"

**Agent 4:** File extraction failure taxonomy — every failure mode with user-facing message:

| Failure Mode | Detection | User Message | Recovery Action |
|-------------|-----------|-------------|----------------|
| Image-based PDF (scanned) | Extracted text < 10 words from a multi-page PDF | "This PDF appears to be a scanned image. We can't extract text from image-based PDFs yet. Try a text-based PDF or paste your text directly." | Show paste fallback |
| Corrupted/unreadable file | Library throws parse error | "We couldn't read this file. It may be damaged. Try a different copy or paste your text directly." | Show paste fallback |
| File too large (>25MB) | `File.size > 25 * 1024 * 1024` before extraction | "This file is over 25MB. Try a shorter document or split it into sections." | Block upload, keep UI in idle state |
| Unsupported format | Extension check against allowlist | "We support PDF, DOCX, TXT, and LaTeX (.tex) files." | Block upload, show supported formats |
| Password-protected PDF | pdfjs-dist throws `PasswordException` | "This PDF is password-protected. Please unlock it first or paste the text directly." | Show paste fallback |
| DOCX with only images | mammoth returns empty/whitespace text | "This document contains only images. Try a text-based document or paste your text directly." | Show paste fallback |
| Extraction timeout (>30s) | setTimeout wrapper | "Text extraction is taking too long. The file may be too complex. Try a simpler document or paste your text directly." | Cancel extraction, show paste fallback |

**Agent 8 (State & Data Flow):** The file upload state lifecycle:

```
idle → selecting → extracting → previewing → confirmed
  │        │           │            │            │
  │        │           │            │            └→ Text inserted into editor, upload UI collapses
  │        │           │            └→ User reviews extracted text in TextPreview
  │        │           └→ Library processing (show progress bar/spinner)
  │        └→ File selected via click or drag-drop
  └→ Initial state — dropzone visible

Error can occur at: selecting (invalid format), extracting (corrupt/password/timeout), previewing (user cancels)
All errors return to idle state with error message in aria-live region.
```

This is component-local state (`useState`) — no need for Redux since it doesn't persist across pages and is only relevant while the upload UI is active.

---

### Round 4: Citation-Aware Analysis

---

**Agent 5 (Citation Intelligence Agent):** Citation analysis is our competitive moat. Here's how it works:

**The problem:** Most plagiarism checkers flag properly cited content as plagiarism. A sentence like *"As Smith (2024) demonstrated, machine learning models exhibit emergent capabilities"* will match Smith's paper — but that's a proper citation, not plagiarism.

**Our solution:** Detect citation patterns in the text and cross-reference matched sources against the document's reference list.

**Citation Pattern Detection (citationDetector.ts):**

| Pattern | Regex | Example | False Positive Risk |
|---------|-------|---------|-------------------|
| APA in-text (parenthetical) | `/\([\w\s,&]+,\s*\d{4}[a-z]?\)/g` | (Smith et al., 2024) | Low |
| APA narrative | `/\b[A-Z][a-z]+\s*\(\d{4}[a-z]?\)/g` | Smith (2024) | Medium — matches "Figure (2024)" |
| IEEE numeric | `/\[\d+(?:[-–,]\s*\d+)*\]/g` | [1], [1-3], [1, 2, 5] | Medium — matches footnotes |
| Vancouver | `/\(\d+(?:[-–,]\s*\d+)*\)/g` | (1), (1-3) | High — matches many parentheticals |
| DOI references | `/doi:\s*10\.\d{4,}\/\S+/gi` | doi: 10.1234/example | Low |
| URL citations | `/https?:\/\/(?:dx\.doi\.org|arxiv\.org|doi\.org|scholar\.google)\S+/g` | https://arxiv.org/abs/... | Low |
| LaTeX cite | `/\\cite[pt]?\{[^}]+\}/g` | \cite{smith2024} | Very Low |

**Cross-Reference Logic (useCitationAnalysis hook):**

```typescript
// File: src/hooks/useCitationAnalysis.ts

interface CitationAnalysisResult {
  citedSources: AnalyzedSource[];      // Sources found AND cited
  uncitedSources: AnalyzedSource[];    // Sources found but NOT cited  
  partiallyCited: AnalyzedSource[];    // Citation pattern near match but source not in refs
  citationPatterns: CitationPattern[]; // All detected citations in text
  referenceEntries: string[];          // Extracted reference list entries
  citationCoverage: number;            // Percentage of matches that are properly cited (0-100)
}

// Logic:
for (const match of report.sections) {
  const matchRegion = text.substring(match.span.start, match.span.end);
  const surroundingText = text.substring(
    Math.max(0, match.span.start - 200), 
    Math.min(text.length, match.span.end + 200)
  );
  
  const hasCitationNearby = citationPatterns.some(
    c => c.position >= match.span.start - 200 && c.position <= match.span.end + 200
  );
  
  const sourceInReferences = referenceEntries.some(
    ref => match.sources.some(s => urlMatchesReference(s.url, ref))
  );
  
  if (hasCitationNearby && sourceInReferences) {
    // PROPERLY CITED — exclude from concern
    citedSources.push({ ...match, status: 'cited' });
  } else if (hasCitationNearby) {
    // PARTIALLY CITED — citation exists but source not in reference list
    partiallyCited.push({ ...match, status: 'partial' });
  } else {
    // UNCITED — flagged for researcher attention
    uncitedSources.push({ ...match, status: 'uncited' });
  }
}
```

**Agent 11 (Integration & API Agent):** Does the backend provide citation analysis, or is this frontend-only?

**Agent 5:** Currently frontend-only. The backend returns matched sources with URLs and snippet text. We compare those URLs against:
1. Citation patterns detected in the user's text (regex-based)
2. The reference list at the bottom of the paper (if present, detected by `referenceExtractor.ts`)

The API already returns `citations` in the response (see `PlagiarismReport.citations` in `src/types/plagiarism.ts`), but this appears to be backend-generated citation formatting — not citation gap analysis.

**Agent 8 (State & Data Flow):** The hook runs after the scan completes — it's derived state from `text + report`. Pure computation, no API calls:

```
useCitationAnalysis(text: string, report: PlagiarismReport | null)
  ├── Runs when report changes (useEffect/useMemo)
  ├── Calls detectCitations(text) → CitationPattern[]
  ├── Calls extractReferences(text) → string[]
  ├── Cross-references with report.sections and report.exactMatches
  └── Returns CitationAnalysisResult
```

**Agent 5:** The UI component structure for the citation panel:

```
New files:
  src/components/plagiarism/CitationAnalysis/
    ├── CitationAnalysisPanel.tsx    — Main collapsible section below ReportSummary
    │     Props: analysis (CitationAnalysisResult), loading
    │     States: collapsed (default), expanded
    │     Shows: coverage ring + summary stats when collapsed,
    │            full source cards when expanded
    │
    ├── CitedSourceCard.tsx          — Green card for properly cited source
    │     Props: source (AnalyzedSource)
    │     Design: bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 shadow-sm
    │     Content: Source title, URL, "Cited" badge, matching citation text
    │
    ├── UncitedSourceCard.tsx        — Amber card with "Add Citation" action
    │     Props: source (AnalyzedSource), onAddCitation
    │     Design: bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 shadow-sm
    │     Content: Source title, URL, similarity %, "Add Citation" button
    │
    ├── CitationCoverageRing.tsx     — SVG donut chart showing citation coverage %
    │     Props: coverage (number 0-100), size
    │     Design: Emerald fill for cited portion, amber for uncited
    │     Accessibility: aria-label="Citation coverage: 75% of matched sources are cited"
    │
    └── AddCitationDialog.tsx        — Dialog showing formatted citation in APA/MLA/Chicago
          Props: source (PlagiarismSource), isOpen, onClose
          Design: Uses shadcn Dialog, tab group for format selection
          Features: Copy-to-clipboard button, format preview
          Accessibility: Focus trap, aria-modal, Escape to close
```

**Agent 9 (Design System Enforcer):** For the citation cards, following Gaia's flat design:

```tsx
// CitedSourceCard — properly cited (green, positive state)
<div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 shadow-sm">
  <div className="flex items-center gap-3">
    <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-full p-1.5">
      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{source.title}</p>
      <p className="text-xs text-muted-foreground truncate">{source.url}</p>
    </div>
    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs rounded-full">
      Cited
    </Badge>
  </div>
</div>

// UncitedSourceCard — needs attention (amber, warning state)
<div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 shadow-sm">
  <div className="flex items-center gap-3">
    <div className="bg-amber-100 dark:bg-amber-900/40 rounded-full p-1.5">
      <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground truncate">{source.title}</p>
      <p className="text-xs text-muted-foreground">{source.similarity}% match</p>
    </div>
    <Button variant="ghost" size="sm" className="text-xs text-primary h-8 px-3">
      + Add Citation
    </Button>
  </div>
</div>
```

No borders on either card. Rounded-xl. Shadow-sm for subtle elevation. Background fill for semantic color.

**Agent 6 (Accessibility Champion):** The "Add Citation" dialog must be a proper dialog with:
- Focus trap inside the dialog (shadcn Dialog handles this)
- `aria-modal="true"` (shadcn Dialog handles this)
- Close on Escape key (shadcn Dialog handles this)
- Return focus to trigger button on close (shadcn Dialog handles this)
- Citation text selectable and copyable — use a `<textarea readOnly>` or a `<code>` block with a copy button
- Copy button: `aria-label="Copy APA citation to clipboard"`, with visual+screen reader confirmation "Copied!"

---

### Round 5: Mobile Layout Strategy

---

**Agent 10 (Mobile & Responsive Agent):** The current plagiarism checker is a two-panel layout (editor left, results right) inside `PlagiarismCheckerContentSection/index.jsx`. On mobile, this must collapse into a single-panel with navigation.

**My proposal: Tab-based navigation on mobile (< 768px / `md:` breakpoint)**

```
┌─ Desktop (≥ 768px) ─────────────────────────────────────────────┐
│ ┌─ Editor Panel ──────────────┐  ┌─ Results Panel ───────────┐  │
│ │                              │  │                           │  │
│ │  [File Upload Dropzone]      │  │  [ReportSummary]          │  │
│ │  [TipTap Editor]             │  │  [CitationAnalysisPanel]  │  │
│ │                              │  │  [ReportSectionList]      │  │
│ │                              │  │                           │  │
│ │  [Controls: toggles, scan]   │  │                           │  │
│ └──────────────────────────────┘  └───────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌─ Mobile (< 768px) ──────────────┐
│  [Editor] [Results (3)]          │  ← Tab bar (shadcn Tabs)
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │  [File Upload Dropzone]      │ │  ← Active tab content
│ │  [TipTap Editor]             │ │
│ │                              │ │
│ │  [Toggles: LaTeX, Code, etc] │ │
│ └──────────────────────────────┘ │
│                                  │
│  ┌──────────────────────────┐    │
│  │ [Scan for Plagiarism →]  │    │  ← Sticky bottom bar
│  │  📊 543 words | 2,891ch  │    │
│  └──────────────────────────┘    │
└──────────────────────────────────┘
```

**Key mobile decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout approach | Tab bar at top (not swipe) | More accessible, predictable for researchers |
| Tab bar design | shadcn Tabs with Gaia-styled TabsList | Consistent with design system |
| Results badge | Red badge with match count | Researcher immediately knows results exist |
| Sticky action bar | Bottom of viewport, only on mobile | Always accessible scan button |
| Similarity circles | Shrink from `h-14 w-14` to `h-10 w-10` | Fit smaller screens without overflow |
| Accordion content | Full width, text-xs for metadata | Maximize reading area |
| File upload | Full-width dropzone | Easier tap target on mobile |
| Highlight click behavior | Switches to Results tab + scrolls to match | Cross-tab navigation |
| Tab persistence | `useState` for active tab, resets on new scan | Simple, predictable |

**Agent 7 (Performance Engineer):** On mobile, we should also:
- Disable ScanProgress spring animations on low-end devices (check `navigator.hardwareConcurrency < 4`)
- Use `will-change: transform` sparingly — mobile GPUs are weaker
- Consider `content-visibility: auto` for off-screen accordion items in long result lists

**Agent 10:** Implementation files:

```
Modified files:
  PlagiarismCheckerContentSection/index.jsx
    — Add tab state: const [mobileTab, setMobileTab] = useState<'editor' | 'results'>('editor')
    — Wrap panels in responsive layout: desktop = flex side-by-side, mobile = tabbed
    — Auto-switch to 'results' tab when scan completes
    — Handle highlight click cross-tab: switch to results + scroll

New files:
  src/components/plagiarism/MobileTabLayout.tsx
    — Encapsulates mobile tab switching logic
    — Tab: "Editor" / "Results (N)" with dynamic match count badge
    — Handles cross-tab navigation (highlight click → switch tab → scroll to match)
    — Only renders on mobile (hidden md:)
  
  src/components/plagiarism/StickyActionBar.tsx
    — Fixed bottom bar for mobile with scan button + word count
    — Only visible on mobile: className="fixed bottom-0 left-0 right-0 md:hidden"
    — Safe area padding for iPhone notch: pb-safe
    — Design: bg-background/95 backdrop-blur-sm shadow-lg
```

**Agent 9 (Design System Enforcer):** The tab bar should use shadcn's Tabs with Gaia styling:

```tsx
// Mobile tab bar — Gaia-compliant
<Tabs value={mobileTab} onValueChange={setMobileTab} className="md:hidden">
  <TabsList className="w-full bg-muted/50 rounded-xl p-1 h-11">
    <TabsTrigger 
      value="editor" 
      className="flex-1 rounded-lg h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
    >
      Editor
    </TabsTrigger>
    <TabsTrigger 
      value="results"
      className="flex-1 rounded-lg h-9 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
    >
      Results {matchCount > 0 && (
        <Badge className="ml-1.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] px-1.5 py-0 rounded-full min-h-0 leading-tight">
          {matchCount}
        </Badge>
      )}
    </TabsTrigger>
  </TabsList>
</Tabs>
```

Touch targets: `h-11` (44px) for TabsList, `h-9` (36px) for each trigger — but the list has extra padding making the tap area 44px. The sticky action bar button must be `min-h-[44px]`.

---

### Round 6: State Architecture for All New Features

---

**Agent 8 (State & Data Flow Architect):** Let me map the complete state architecture after all Phase 2-3 features:

```
State Architecture — Post Phase 3
═══════════════════════════════════

Component State (useState) in PlagiarismCheckerContentSection:
  ├── inputText: string                     (EXISTING)
  ├── excludeReferences: boolean            (EXISTING)
  ├── excludeQuotes: boolean                (EXISTING)
  ├── excludeLatex: boolean                 ← NEW (default: true for STEM users)
  ├── excludeCode: boolean                  ← NEW (default: true for STEM users)
  ├── activeMatchId: string | null          (EXISTING)
  ├── mobileTab: 'editor' | 'results'      ← NEW
  └── showFileUpload: boolean               ← NEW (toggle upload dropzone)

Component State in FileUpload (component-local):
  ├── uploadState: 'idle' | 'dragging' | 'extracting' | 'previewing' | 'error'
  ├── selectedFile: File | null
  ├── extractedText: string
  ├── extractionError: string | null
  └── extractionProgress: { page: number, total: number } | null

Component State in AddCitationDialog (component-local):
  ├── isOpen: boolean
  ├── selectedFormat: 'apa' | 'mla' | 'chicago'
  └── copied: boolean

Custom Hooks:
  ├── usePlagiarismReport(text)             (EXISTING — no changes to interface)
  │     Internal change: calls preprocessForAnalysis() before API
  │     Returns: { loading, report, error, fromCache, analyze, stop, reset }
  │
  └── useCitationAnalysis(text, report)     ← NEW
        Returns: { citedSources, uncitedSources, partiallyCited, coverage,
                   citationPatterns, referenceEntries }

Pure Utility Functions:
  ├── stemPreprocessor.ts                   ← NEW
  │     preprocessForAnalysis(text, options) → PreprocessResult
  │
  ├── citationDetector.ts                   ← NEW
  │     detectCitations(text) → CitationPattern[]
  │
  ├── referenceExtractor.ts                 ← NEW
  │     extractReferences(text) → string[]
  │
  └── riskHelpers.ts                        (EXISTING — no changes)

Redux:
  └── tools slice                           (EXISTING — no changes needed)
      Plagiarism doesn't need new Redux state — all feature state is local

API Layer:
  └── plagiarismService.ts                  (EXISTING)
        analyzePlagiarism() — no changes to interface
        analyzePlagiarismFile() — already exists, may use as fallback
```

**Agent 1 (Release Engineer):** I like that new features are mostly additions (new files), not modifications of existing working code. The only existing file with significant modification is `PlagiarismCheckerContentSection/index.jsx`:
- Add new toggle states for LaTeX/Code exclusion
- Call `preprocessForAnalysis()` before `analyzePlagiarism()`
- Pass excluded regions to editor for visualization
- Add file upload section (collapsible)
- Add citation analysis panel (below report summary)
- Add mobile tab layout wrapper

**Agent 8:** The modification pattern for the content section:

```
Current flow:
  1. User types/pastes text
  2. User clicks "Scan"
  3. Text is sent directly to analyzePlagiarism()
  4. Results rendered in sidebar

New flow:
  1. User types/pastes text OR uploads file (text extracted and inserted)
  2. User configures toggles (References, Quotes, LaTeX, Code)
  3. User clicks "Scan"
  4. preprocessForAnalysis(text, toggles) → processedText + excludedRegions
  5. processedText sent to analyzePlagiarism()
  6. excludedRegions sent to editor for visual markers
  7. Results rendered in sidebar + citation analysis panel
```

---

### Round 7: Performance Budget & Lazy Loading

---

**Agent 7 (Performance Engineer):** Performance budget for the plagiarism checker page:

**Current page bundle:**

| Library | Size (gzipped) | Loading |
|---------|---------------|---------|
| TipTap (StarterKit + custom extension) | ~45KB | Eager — needed for editor |
| Framer Motion | ~30KB | Eager — shared across app |
| Lucide icons (tree-shaken) | ~5KB | Eager |
| **Current total** | **~80KB** | |

**New library budget — ALL lazy-loaded:**

| Library | Size (gzipped) | Trigger | Impact on Initial Load |
|---------|---------------|---------|----------------------|
| pdfjs-dist | ~300KB | User drops PDF file | Zero |
| pdfjs worker | ~200KB | PDF selected (Web Worker) | Zero |
| mammoth | ~60KB | User drops DOCX file | Zero |
| KaTeX (Phase 4) | ~100KB | LaTeX detected in text | Zero |
| Shiki (Phase 4) | ~200KB | Code block detected | Zero |
| **New total** | **~860KB** | **All lazy** | **Zero on page load** |

**Critical rule: None of these libraries load on initial page visit.** A user who pastes text and scans will never download any of them. They're imported only when the specific feature is activated.

**Implementation pattern for all lazy imports:**

```typescript
// Standard lazy import pattern — used consistently across all extractors
const importPDFJS = () => import('pdfjs-dist');
const importMammoth = () => import('mammoth');
const importKaTeX = () => import('katex');

// In component:
const [isExtracting, setIsExtracting] = useState(false);

const handlePDFUpload = async (file: File) => {
  setIsExtracting(true);
  try {
    const { extractPDFText } = await import('./extractors/pdfExtractor');
    const text = await extractPDFText(file);
    onTextExtracted(text);
  } catch (err) {
    setError(getExtractionErrorMessage(err));
  } finally {
    setIsExtracting(false);
  }
};
```

**Rendering performance for long documents:**

| Scenario | Risk | Mitigation |
|----------|------|-----------|
| 100+ highlight decorations | TipTap decoration recompute is O(n) | Batch updates with `requestAnimationFrame`, throttle to max 1 update per 100ms |
| 50+ accordion items in results | DOM bloat, slow scroll | Virtual scrolling with `react-window` for lists > 30 items |
| PDF with 100+ pages | Memory spike during extraction | Extract page-by-page with progress callback, free pages after extraction |
| LaTeX-heavy document (50+ equations) | KaTeX render blocking (Phase 4) | IntersectionObserver to render only visible equations, placeholder for off-screen |
| Multiple excluded region types | Decoration count doubles | Combine excluded region decorations with highlight decorations in single pass |

**Performance benchmarks (manual verification):**

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Initial page load (FCP) | < 1.5s | Chrome DevTools Performance tab |
| Scan button → API call | < 200ms | console.time() around preprocessing |
| Highlight rendering (50 matches) | < 500ms | console.time() around decoration update |
| PDF extraction (20 pages) | < 3s | console.time() in extractor |
| Mobile scroll (results list) | 60fps | Chrome DevTools FPS overlay |

---

### Round 8: Backend API Contract & Error Handling

---

**Agent 11 (Integration & API Agent):** Current API contract (verified from `plagiarismService.ts`):

```
POST {baseUrl}/plagiarism/analyze
  Headers: Authorization: Bearer <token>
  Body: { text: string, options?: { analysisType, maxChunks, sourcesPerChunk } }
  Timeout: 5 minutes (AbortController)
  Response: RawPlagiarismResponse → mapped by PlagiarismDataMapper → PlagiarismReport

POST {baseUrl}/plagiarism/analyze-file
  Headers: Authorization: Bearer <token>
  Body: FormData { file: File, options?: string (JSON) }
  Timeout: 5 minutes (AbortController)
  Response: Same as above
```

**What's frontend-only vs needs backend:**

| Feature | Frontend-Only? | Notes |
|---------|---------------|-------|
| LaTeX detection + exclusion | Yes | Preprocessing strips LaTeX before API call |
| Code block detection + exclusion | Yes | Same preprocessing approach |
| Reference/Quote exclusion | Yes | Already implemented, moving to stemPreprocessor |
| PDF text extraction | Yes (client-side) | pdfjs-dist runs in browser; fallback: backend `/analyze-file` |
| DOCX text extraction | Yes (client-side) | mammoth runs in browser |
| LaTeX .tex text extraction | Yes (client-side) | Custom parser, no dependencies |
| Citation pattern detection | Yes | Regex-based, runs on text |
| Citation gap analysis | Yes | Cross-references detected citations with API results |
| Citation formatting (APA/MLA) | Partially | Basic template formatting is client-side; DOI → full citation would need backend |
| Cross-lingual detection | No | Requires backend NLP — Phase 5+ |

**Key insight: Phase 2 is almost entirely frontend work.** The backend already provides core plagiarism detection. We're building smarter preprocessing and richer result visualization.

**Error handling for preprocessing — non-fatal philosophy:**

```typescript
// In PlagiarismCheckerContentSection, before calling analyzePlagiarism():

let textToAnalyze = inputText;
let excludedRegions: ExcludedRegion[] = [];

try {
  const preprocessResult = preprocessForAnalysis(inputText, {
    excludeLatex, excludeCode, excludeReferences, excludeQuotes
  });
  textToAnalyze = preprocessResult.processedText;
  excludedRegions = preprocessResult.excludedRegions;
} catch (err) {
  // Preprocessing failed — send raw text, show subtle warning
  console.warn('[Plagiarism] Preprocessing failed, using raw text:', err);
  toast.info('Text preprocessing skipped. Results may include formulas and code blocks.');
}

// Always proceed with the scan — never block because of preprocessing
analyze(textToAnalyze);
```

**Agent 8:** Important principle: **preprocessing enhances accuracy but never prevents functionality.** If LaTeX detection fails, the scan still runs. If citation analysis fails, results still show. If file extraction fails, we offer paste-as-text fallback.

---

### Round 9: Design System Compliance Specification

---

**Agent 9 (Design System Enforcer):** Mandatory specification for every new component:

```
═══════════════════════════════════════════════════
GAIA UI COMPLIANCE RULES — ALL NEW COMPONENTS
═══════════════════════════════════════════════════

1. SURFACES (no borders on cards)
   ✅ bg-muted/40 rounded-xl shadow-sm          — standard card
   ✅ bg-muted/30 rounded-xl                    — subtle container
   ✅ bg-{color}-50/50 rounded-xl shadow-sm     — semantic card (cited/uncited)
   ❌ border border-gray-300 rounded-lg          — NEVER on new components
   ❌ border-2 border-{color}                    — NEVER on new cards

   EXCEPTION: Existing AccordionItem borders kept for backward compatibility.
   Migration to flat design happens in Phase 4 dedicated PR.

2. SPACING
   Card padding:         p-4 minimum, p-6 preferred
   Section gaps:         space-y-4 (tight) or space-y-6 (standard)
   Touch targets:        min-h-[44px] min-w-[44px] on all interactive elements
   Icon-to-text gaps:    gap-2 (tight) or gap-3 (standard)
   Content-to-action:    gap-4 or justify-between

3. TYPOGRAPHY
   Card title:           text-sm font-semibold text-foreground
   Card body:            text-sm leading-relaxed text-foreground
   Card metadata:        text-xs text-muted-foreground
   Badge text:           text-xs or text-[10px]
   Stat numbers:         text-2xl font-bold text-foreground (from ReportSummary pattern)
   Timestamp:            text-[11px] text-muted-foreground

4. ANIMATION
   Entry:                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
   Spring:               type: "spring", stiffness: 300, damping: 30
   Duration transitions:  transition-colors duration-150
   Tap feedback:         whileTap={{ scale: 0.98 }} (optional)
   Reduced motion:       ALWAYS check useReducedMotion() or CSS media query
   Implementation:
     const prefersReducedMotion = useReducedMotion();
     <motion.div animate={prefersReducedMotion ? {} : { ... }} />

5. DARK MODE
   Every bg-{color}-50 MUST have dark:bg-{color}-950/20 counterpart
   Every text-{color}-700 MUST have dark:text-{color}-300 counterpart
   Use zinc (NOT slate, NOT gray) for neutral dark backgrounds
   CSS custom properties for highlight colors (not hardcoded rgba)
   Test: toggle dark mode and verify ALL text is readable

6. ACCESSIBILITY
   Buttons/links:        aria-label (if icon-only) or visible text label
   Dynamic content:      aria-live="polite" on regions that update
   Error messages:       role="alert"
   Progress indicators:  role="status" aria-live="polite"
   Dialogs:              aria-modal="true" (shadcn handles this)
   Keyboard:             Tab → Enter/Space → Escape fully works
   Color:                NEVER the only way to convey information
   Focus:                focus-visible:ring-2 focus-visible:ring-primary
```

---

### Round 10: Testing & Verification Strategy

---

**Agent 12 (Testing & Quality Gate):** The project doesn't have automated component tests. I recommend a tiered approach:

**Tier 1: Unit Tests for Pure Functions (Phase 2A)**

```
Files to test:
  src/utils/plagiarism/__tests__/stemPreprocessor.test.ts
  src/utils/plagiarism/__tests__/citationDetector.test.ts
  src/utils/plagiarism/__tests__/referenceExtractor.test.ts

These are pure functions with clear inputs/outputs — ideal for unit testing.
```

| Function | Test Cases |
|----------|-----------|
| `preprocessForAnalysis` | LaTeX detection (inline, display, environments), code detection (fenced, indented, heuristic), reference stripping, quote removal, position mapping accuracy, edge cases (empty, no matches, all excluded), dollar-sign-but-not-LaTeX |
| `detectCitations` | APA parenthetical, APA narrative, IEEE numeric, DOI, URL citations, LaTeX \cite, no false positives on dates/numbers |
| `extractReferences` | "References" header, "Bibliography" header, "Works Cited" header, numbered references, no reference section |

**Tier 2: Manual Verification Matrix (every feature)**

| Scenario | Editor | Results | Mobile | Dark Mode |
|----------|--------|---------|--------|-----------|
| Empty state | Placeholder visible | No results | Tab shows "Editor" | All text readable |
| Text pasted | Text appears, counters update | Not visible | Same | Same |
| File uploaded | Extracted text in editor | Not visible | Full-width dropzone | Same |
| Scan running | Disabled, progress visible | Steps animate | Tabs disabled | Same |
| Results loaded | Highlights appear | Report + sections | Badge on Results tab | Highlights visible |
| LaTeX excluded | Blue markers visible | Stats show count | Same | Blue markers visible |
| Code excluded | Gray markers visible | Stats show count | Same | Gray markers visible |
| Citation panel | — | Cited/Uncited cards | Cards stack vertically | Card colors visible |
| Highlight clicked | Scrolls to highlight | Accordion expands | Switches tab + scrolls | Same |
| Error state | Re-enabled | Error card with retry | Same | Same |

**Tier 3: Visual Regression (Phase 4)**

Screenshot comparison at 4 viewport widths (375px, 768px, 1024px, 1440px) x 2 themes (light/dark) x 4 states (empty, scanning, results, error) = 32 reference screenshots. Prevents visual regressions during Phase 4 migration.

---

### Round 11: Migration Strategy for Existing Components

---

**Agent 9 (Design System Enforcer):** The audit identified 7 existing components with explicit borders. Migration plan:

**Agent 1 (Release Engineer):** Phased migration to avoid visual regression:

```
Phase 1.5 (now):     Fix critical bugs only — no visual layout changes
Phase 2 (features):  All NEW components follow Gaia flat design — no borders
Phase 3 (mobile):    Mobile layout is new code — Gaia from the start
Phase 4 (migration): Dedicated PR to migrate existing components:

  ReportSectionItem.tsx:
    Before: border border-b border-rose-200 bg-rose-50/50
    After:  bg-rose-50/60 dark:bg-rose-950/20 rounded-xl shadow-sm

  ScanProgress.tsx step items:
    Before: rounded-lg border p-4
    After:  bg-muted/40 dark:bg-muted/20 rounded-xl p-4 shadow-sm

  ReportSummary.tsx stat cards:
    Before: rounded-lg border p-4 shadow-sm
    After:  bg-muted/30 dark:bg-muted/20 rounded-xl p-4 shadow-sm
```

**Agent 9:** Phase 4 migration is a single PR with:
- Before/after screenshots of every modified component
- Light mode + dark mode comparison
- No logic changes — only className updates
- Easy to review, easy to revert if needed

---

### Round 12: Final Roadmap Agreement & Sign-Off

---

**Agent 1 (Release Engineer):** Final roadmap compiled with all agents' input. All 12 agents confirm:

```
PHASE 1.5: UI Bug Fixes (Day 1)
├── Fix 7 bugs from Gaia audit (dark mode, accessibility, consistency)
├── Zero dependencies, zero regression risk
├── Effort: ~45 minutes
├── Files: plagiarism-editor.css, ScanProgress.tsx, ErrorStateCard.tsx,
│          PlagiarismInputEditor.tsx
└── Gate: Dark mode screenshot shows readable highlights + aria-live verified

PHASE 2A: STEM Preprocessing (Week 1-2)
├── Build stemPreprocessor.ts
│     ├── LaTeX detection (inline $, display $$, environments, commands)
│     ├── Code block detection (fenced, indented, heuristic)
│     └── Consolidate reference/quote exclusion from page component
├── Add LaTeX/Code exclusion toggles to page UI
├── Visual markers in editor (blue=LaTeX, gray=code via TipTap decorations)
├── Unit tests for preprocessor
├── Effort: 3-4 days
└── Gate: Sample STEM paper with LaTeX + code correctly excluded + visualized

PHASE 2B: File Upload (Week 2-3)
├── Build FileDropzone.tsx (Gaia-compliant, accessible)
├── Build extractors: PDF (lazy pdfjs-dist), DOCX (lazy mammoth), TXT, LaTeX
├── Build TextPreview.tsx (review extracted text before scan)
├── Error handling for all 7 failure modes
├── Effort: 4-5 days
└── Gate: Upload real academic PDF → extract text → scan → results

PHASE 2C: Citation Analysis (Week 3-4)
├── Build citationDetector.ts (regex patterns for APA, IEEE, DOI, etc.)
├── Build referenceExtractor.ts (reference section parser)
├── Build useCitationAnalysis hook (derived state from text + report)
├── Build CitationAnalysisPanel + CitedSourceCard + UncitedSourceCard
├── Build AddCitationDialog (APA/MLA/Chicago formatting)
├── Build CitationCoverageRing (SVG donut chart)
├── Unit tests for detector + extractor
├── Effort: 4-5 days
└── Gate: Cited sources shown green, uncited shown amber, "Add Citation" works

PHASE 3: Mobile Layout (Week 5-6)
├── Build MobileTabLayout.tsx (Editor/Results tabs)
├── Build StickyActionBar.tsx (bottom scan button + word count)
├── Responsive adjustments to all components (circle sizes, padding, text)
├── Cross-tab navigation (highlight click → switch to Results → scroll)
├── Touch target verification (all ≥ 44px)
├── Effort: 3-4 days
└── Gate: Full scan workflow on 375px viewport with no overflow

PHASE 4: Polish & Migration (Week 7-8) — OPTIONAL
├── Migrate existing borders to flat design (single PR, className only)
├── KaTeX LaTeX rendering (lazy-loaded, visual enhancement)
├── Shiki code syntax highlighting (lazy-loaded, visual enhancement)
├── Performance optimization for long documents (virtualization, throttling)
├── Unit tests for all preprocessing utilities
├── Visual regression screenshots (32 reference images)
├── Effort: 3-5 days
└── Gate: 9/10 Gaia UI quality score

PHASE 5: LaTeX Engine Integration — "Write → Check → Submit" (Week 9-14)
│
│  PURPOSE: Complete the strategic workflow loop by integrating the
│  shothikai/writing-studio LaTeX backend. This gives STEM researchers
│  professional journal-ready PDF output (IEEE, Springer, MDPI, Academic Modern)
│  directly from the Writing Studio — no need to leave Shothik for Overleaf.
│
│  PREREQUISITE: Phases 1.5–4 must be stable. LaTeX backend must be deployed
│  and accessible via API. Shared JWT auth must be confirmed working.
│
├── 5A: Backend Integration & API Proxy (Week 9-10)
│     ├── Set up Next.js API proxy routes for LaTeX microservice (/api/latex/*)
│     ├── Implement shared JWT authentication pass-through
│     ├── Build LaTeX compilation service client (HTML → LaTeX → PDF pipeline)
│     ├── Implement async job status polling (RabbitMQ worker pattern)
│     ├── PDF download endpoint with Google Cloud Storage signed URLs
│     ├── Error handling for compilation failures (LaTeX errors, timeouts)
│     ├── Effort: 4-5 days
│     └── Gate: API proxy returns compiled PDF from test HTML content
│
├── 5B: Template Selection & Export UI (Week 10-11)
│     ├── Build TemplateSelector.tsx — visual template picker (Gaia UI compliant)
│     │     Templates: IEEE Conference, IEEE Journal, Springer, MDPI, Academic Modern
│     │     Design: Card grid with template previews, bg-muted/50 shadow-sm, rounded-xl
│     ├── Build ExportPanel.tsx — unified export drawer (DOCX, HTML, TXT, LaTeX PDF)
│     │     Replace current basic export buttons with structured export panel
│     │     LaTeX PDF option shows template selection + compilation progress
│     ├── Build CompilationProgress.tsx — async PDF generation status
│     │     States: queued → compiling → uploading → ready → download
│     │     Design: Framer Motion spring animations, aria-live for screen readers
│     ├── Build PDFPreview.tsx — in-browser PDF preview before download
│     │     Lazy-load PDF.js for preview rendering
│     ├── Effort: 4-5 days
│     └── Gate: User selects IEEE template → sees progress → downloads formatted PDF
│
├── 5C: AI Co-Writer & Autocomplete (Week 11-13)
│     ├── Build CoWriterPanel.tsx — AI writing assistant sidebar
│     │     Streaming chat powered by Gemini (via LaTeX backend)
│     │     Context-aware: sends current document content for relevant suggestions
│     │     Design: Gaia flat design, bg-muted/30, message bubbles without borders
│     ├── Build GhostText.tsx — inline autocomplete suggestions
│     │     Tab to accept, Escape to dismiss (standard UX)
│     │     Gray ghost text overlay in TipTap editor
│     │     Debounced trigger: 500ms pause after typing
│     ├── Build ResearchSearch.tsx — find sources while writing
│     │     Serper API integration via LaTeX backend
│     │     Insert citation directly from search results into citation manager
│     ├── Integrate AI tools with existing Writing Studio toolbar
│     │     Co-Writer button in toolbar, autocomplete toggle in settings
│     ├── Effort: 5-7 days
│     └── Gate: AI suggestions stream in real-time, autocomplete feels natural
│
├── 5D: Document Import & LaTeX Round-Trip (Week 13-14)
│     ├── Build document import UI for PDF and DOCX ingestion
│     │     Uses LaTeX backend's mammoth.js + pdfjs-dist extraction
│     │     Server-side extraction (unlike plagiarism checker's client-side)
│     │     Clearly communicate to users: "File will be processed on our server"
│     ├── Build LaTeX source viewer — see generated LaTeX code
│     │     Monaco Editor integration (already in project) for LaTeX syntax
│     │     "Edit LaTeX" toggle for advanced users who want manual control
│     ├── Build Prism AI integration — edit LaTeX via natural language
│     │     "Make the abstract shorter" → modifies LaTeX directly
│     │     Diff preview before applying changes (reuse existing diff pattern)
│     ├── Effort: 4-5 days
│     └── Gate: Import existing PDF → edit in Writing Studio → export as IEEE PDF
│
├── 5E: Mobile & Polish (Week 14)
│     ├── Responsive layout for all Phase 5 components
│     │     Template selector: 2-column on mobile, 3-column on desktop
│     │     Co-Writer panel: bottom sheet on mobile, sidebar on desktop
│     │     Export panel: full-screen drawer on mobile
│     ├── Accessibility audit for all new components (ARIA, keyboard nav)
│     ├── Performance verification: lazy-load all Phase 5 code
│     │     Zero impact on users who don't use LaTeX features
│     ├── Effort: 2-3 days
│     └── Gate: Full Write → Check → Submit workflow on 375px viewport
│
│  BUSINESS IMPACT:
│  - Completes the "Write → Check → Submit" workflow — no competitor offers this
│  - Eliminates Overleaf dependency for target users (STEM researchers)
│  - AI Co-Writer + autocomplete creates daily engagement (retention driver)
│  - Professional PDF output justifies premium tier ($8-10/month)
│  - Competitive positioning: "The only platform a STEM researcher needs"
│
│  RISKS:
│  - LaTeX backend adds operational complexity (RabbitMQ, GCS, MongoDB)
│  - Server-side file processing changes privacy model (vs client-side)
│  - LaTeX compilation errors can be cryptic — need user-friendly error messages
│  - Gemini API costs for Co-Writer/autocomplete need monitoring
│
│  TOTAL PHASE 5 EFFORT: 5-6 weeks
│
└── Gate: End-to-end workflow verified:
    Write paper in Writing Studio → Run AI detection → Check plagiarism
    → Paraphrase flagged sections → Humanize if needed → Grammar check
    → Select IEEE template → Export professional PDF → Ready for journal submission
```

**All agents unanimously agree. Total: 6-8 weeks (Phases 1.5-4) + 5-6 weeks (Phase 5) = 11-14 weeks.**

---

## 4. Implementation Phase Timeline

```
Week 1  ──────────────────────────────────────────────────
  Day 1:    Phase 1.5 — Fix 7 UI bugs (45 min)
  Day 1-2:  stemPreprocessor.ts — LaTeX detection regex + tests
  Day 2-3:  stemPreprocessor.ts — Code block detection + tests
  Day 3-4:  Editor visual markers (TipTap decorations for excluded regions)
  Day 4-5:  UI toggles for LaTeX/Code exclusion + integration

Week 2  ──────────────────────────────────────────────────
  Day 1-2:  Consolidate reference/quote logic into stemPreprocessor
  Day 2-3:  FileDropzone.tsx + FilePreview.tsx
  Day 3-4:  PDF extractor (pdfjs-dist, lazy-loaded)
  Day 4-5:  DOCX extractor (mammoth, lazy-loaded) + LaTeX extractor

Week 3  ──────────────────────────────────────────────────
  Day 1:    TXT extractor + format router (index.ts)
  Day 1-2:  TextPreview.tsx (review before inserting into editor)
  Day 2-3:  File upload error handling (all 7 failure modes)
  Day 3-4:  citationDetector.ts (regex patterns + tests)
  Day 4-5:  referenceExtractor.ts (reference list parser + tests)

Week 4  ──────────────────────────────────────────────────
  Day 1-2:  useCitationAnalysis hook (cross-reference logic)
  Day 2-3:  CitationAnalysisPanel.tsx + CitationCoverageRing.tsx
  Day 3-4:  CitedSourceCard.tsx + UncitedSourceCard.tsx
  Day 4-5:  AddCitationDialog.tsx + integration testing

Week 5  ──────────────────────────────────────────────────
  Day 1-2:  MobileTabLayout.tsx (tab navigation)
  Day 2-3:  StickyActionBar.tsx (bottom bar)
  Day 3-4:  Responsive adjustments to existing components
  Day 4-5:  Cross-tab navigation + highlight linking

Week 6  ──────────────────────────────────────────────────
  Day 1-2:  Mobile testing at 375px, 768px breakpoints
  Day 2-3:  Touch target verification + fixes
  Day 3-5:  Integration testing — full workflow on all viewports + themes

Week 7-8 (Optional Polish)  ──────────────────────────────
  Day 1-2:  Migrate existing borders to flat design
  Day 2-3:  KaTeX LaTeX rendering (lazy-loaded)
  Day 3-4:  Shiki code highlighting (lazy-loaded)
  Day 4-5:  Performance benchmarks + optimization + documentation

Week 9-10 (Phase 5A+5B: LaTeX Backend + Export UI)  ─────
  Day 1-2:  Next.js API proxy routes for LaTeX microservice
  Day 2-3:  JWT auth pass-through + LaTeX compilation client
  Day 3-4:  Async job polling + PDF download (GCS signed URLs)
  Day 4-5:  TemplateSelector.tsx — visual template picker
  Day 6-7:  ExportPanel.tsx — unified export drawer
  Day 8-9:  CompilationProgress.tsx + PDFPreview.tsx
  Day 9-10: Integration testing — HTML → LaTeX → PDF round-trip

Week 11-13 (Phase 5C: AI Co-Writer + Autocomplete)  ─────
  Day 1-3:  CoWriterPanel.tsx — streaming AI chat sidebar
  Day 3-5:  GhostText.tsx — inline autocomplete (Tab/Escape UX)
  Day 5-7:  ResearchSearch.tsx — find & cite sources while writing
  Day 7-9:  Toolbar integration + settings for new AI features
  Day 9-10: Streaming stability testing + debounce tuning

Week 13-14 (Phase 5D+5E: Import + Mobile + Polish)  ─────
  Day 1-2:  Document import UI (PDF/DOCX via LaTeX backend)
  Day 2-3:  LaTeX source viewer (Monaco Editor integration)
  Day 3-4:  Prism AI — natural language LaTeX editing
  Day 4-5:  Mobile responsive layout for all Phase 5 components
  Day 5-6:  Accessibility audit + performance verification
  Day 6-7:  End-to-end Write → Check → Submit workflow testing
```

---

## 5. Dependency Graph

```
Phase 1.5 (Bug Fixes) ─────── No dependencies, ship first
  │
  ▼
Phase 2A (STEM Preprocessing) ─── Creates: stemPreprocessor.ts, decoration patterns
  │
  │  Establishes the preprocessing pattern used by all subsequent features
  │
  ├────────────────────────────────┐
  ▼                                ▼
Phase 2B (File Upload)           Phase 2C (Citation Analysis)
  │                                │
  │  Independent of 2C             │  Depends on 2A for preprocessor
  │  Uses: file extractors         │  pattern and position mapping
  │  Output: text → editor         │  Uses: citationDetector,
  │                                │  referenceExtractor, useCitationAnalysis
  │                                │
  └────────────┬───────────────────┘
               │
               ▼
Phase 3 (Mobile Layout)
  │
  │  Depends on: All Phase 2 features finalized
  │  Wraps ALL components (existing + new) in responsive layout
  │
  ▼
Phase 4 (Polish & Migration) ─── Optional
  │
  │  Depends on: All features stable and tested
  │  Safe to modify visuals: no logic changes, className updates only
  │
  ▼
  CHECKPOINT — Target: 9/10 Gaia UI Quality Score
  │
  │  ══════════════════════════════════════════════════
  │  PREREQUISITE GATE: Before starting Phase 5:
  │  1. LaTeX backend (shothikai/writing-studio) deployed and accessible
  │  2. Shared JWT auth confirmed working between platforms
  │  3. RabbitMQ + MongoDB + GCS infrastructure provisioned
  │  4. Phases 1.5–4 stable with no critical bugs
  │  ══════════════════════════════════════════════════
  │
  ▼
Phase 5A (Backend Integration) ─── API proxy + auth + compilation pipeline
  │
  │  Creates: /api/latex/* proxy routes, LaTeX compilation client
  │
  ▼
Phase 5B (Export UI) ─── Template selection + PDF export
  │
  │  Depends on: 5A for working compilation pipeline
  │  Creates: TemplateSelector, ExportPanel, CompilationProgress, PDFPreview
  │
  ├────────────────────────────────┐
  ▼                                ▼
Phase 5C (AI Co-Writer)          Phase 5D (Document Import)
  │                                │
  │  Independent of 5D             │  Independent of 5C
  │  Uses: Gemini streaming        │  Uses: LaTeX backend extraction
  │  Creates: CoWriterPanel,       │  Creates: Import UI, LaTeX viewer,
  │  GhostText, ResearchSearch     │  Prism AI natural language editing
  │                                │
  └────────────┬───────────────────┘
               │
               ▼
Phase 5E (Mobile & Polish)
  │
  │  Depends on: All Phase 5 features finalized
  │  Responsive layout + accessibility audit + performance check
  │
  ▼
  DONE — Complete "Write → Check → Submit" workflow
```

---

## 6. File-Level Implementation Specifications

### New Files to Create

```
src/utils/plagiarism/
  ├── stemPreprocessor.ts           — Text preprocessing (LaTeX, code, refs, quotes)
  │     Exports: preprocessForAnalysis(), PreprocessOptions, PreprocessResult, ExcludedRegion
  │
  ├── citationDetector.ts           — Citation pattern regex matching
  │     Exports: detectCitations(), CitationPattern, CitationType
  │
  ├── referenceExtractor.ts         — Reference list extraction from document
  │     Exports: extractReferences(), hasReferenceSection()
  │
  └── __tests__/
      ├── stemPreprocessor.test.ts  — Unit tests for preprocessing
      ├── citationDetector.test.ts  — Unit tests for citation detection
      └── referenceExtractor.test.ts — Unit tests for reference extraction

src/hooks/
  └── useCitationAnalysis.ts        — Derived state hook: text + report → citation analysis

src/components/plagiarism/
  ├── FileUpload/
  │     ├── FileDropzone.tsx         — Drag-and-drop upload zone
  │     ├── FilePreview.tsx          — File display with icon + size + remove
  │     ├── TextPreview.tsx          — Extracted text review before scan
  │     └── extractors/
  │           ├── pdfExtractor.ts    — PDF → text (lazy pdfjs-dist)
  │           ├── docxExtractor.ts   — DOCX → text (lazy mammoth)
  │           ├── latexExtractor.ts  — .tex → text (custom, 0 dependencies)
  │           └── index.ts           — Format router by file extension
  │
  ├── CitationAnalysis/
  │     ├── CitationAnalysisPanel.tsx — Collapsible citation analysis section
  │     ├── CitedSourceCard.tsx       — Green card for properly cited match
  │     ├── UncitedSourceCard.tsx     — Amber card with "Add Citation" action
  │     ├── CitationCoverageRing.tsx  — SVG donut chart for coverage %
  │     └── AddCitationDialog.tsx     — Dialog with APA/MLA/Chicago formatting
  │
  ├── MobileTabLayout.tsx            — Tab-based mobile navigation (Editor/Results)
  └── StickyActionBar.tsx            — Mobile-only sticky bottom action bar

src/services/latex/                    — Phase 5: LaTeX engine integration
  ├── latexCompilationService.ts       — API client for LaTeX microservice
  │     Exports: compileToLatex(), getJobStatus(), downloadPDF()
  │
  ├── latexAuthProxy.ts                — JWT pass-through to LaTeX backend
  │     Exports: createProxiedRequest(), validateSharedAuth()
  │
  └── latexTemplates.ts                — Template metadata and configuration
        Exports: TEMPLATES, TemplateConfig, getTemplateById()

src/components/tools/writing-studio/components/latex/  — Phase 5 UI components
  ├── TemplateSelector.tsx             — Visual template picker (IEEE, Springer, etc.)
  │     Props: onSelect, selectedTemplate, disabled
  │     Design: Card grid, bg-muted/50 shadow-sm, rounded-xl, template previews
  │
  ├── ExportPanel.tsx                  — Unified export drawer (DOCX/HTML/TXT/LaTeX PDF)
  │     Props: editorContent, onExport
  │     Replaces current basic export buttons
  │
  ├── CompilationProgress.tsx          — Async PDF generation status display
  │     Props: jobId, onComplete, onError
  │     States: queued → compiling → uploading → ready → download
  │
  ├── PDFPreview.tsx                   — In-browser PDF preview before download
  │     Props: pdfUrl, onDownload, onClose
  │     Lazy-loads PDF.js for rendering
  │
  ├── CoWriterPanel.tsx                — AI writing assistant sidebar
  │     Props: documentContext, onInsertSuggestion
  │     Streaming chat via Gemini (through LaTeX backend)
  │
  ├── GhostText.tsx                    — Inline autocomplete suggestions
  │     TipTap extension: gray ghost text, Tab to accept, Escape to dismiss
  │     Debounced trigger: 500ms pause after typing
  │
  ├── ResearchSearch.tsx               — Find & cite sources while writing
  │     Props: onCitationInsert
  │     Serper API via LaTeX backend
  │
  └── PrismAI.tsx                      — Natural language LaTeX editing
        Props: latexSource, onApplyEdit
        "Make the abstract shorter" → modifies LaTeX → diff preview

src/app/api/latex/                     — Phase 5: Next.js API proxy routes
  ├── compile/route.ts                 — POST: Submit HTML for LaTeX compilation
  ├── status/[jobId]/route.ts          — GET: Poll compilation job status
  ├── download/[jobId]/route.ts        — GET: Download compiled PDF (GCS signed URL)
  ├── templates/route.ts               — GET: List available LaTeX templates
  ├── cowriter/route.ts                — POST: AI Co-Writer streaming chat
  ├── autocomplete/route.ts            — POST: Inline autocomplete suggestions
  ├── search/route.ts                  — POST: Research search (Serper API)
  └── import/route.ts                  — POST: Import PDF/DOCX for extraction
```

### Existing Files to Modify

```
Phase 1.5 (bug fixes — minimal changes):
  src/components/plagiarism/plagiarism-editor.css
    — Remove color: #000000 from lines 78, 89, 100, 111
    — Add CSS variables for highlight colors
    — Add @media (prefers-reduced-motion: reduce) { ... }
    — Add dark mode opacity adjustments for highlights

  src/components/plagiarism/ScanProgress.tsx
    — Line 170: Add role="status" aria-live="polite" to Card
    — Line 244: Replace border-slate-300 bg-white dark:bg-slate-800
                 → border-zinc-300 bg-white dark:bg-zinc-800

  src/components/plagiarism/ErrorStateCard.tsx
    — Line 28: Add role="alert" to Card

  src/components/plagiarism/PlagiarismInputEditor.tsx
    — Line 298: Add aria-label and role to editorProps.attributes

Phase 2 (feature additions):
  src/components/(primary-layout)/(plagiarism-checker)/
    PlagiarismCheckerContentSection/index.jsx
    — Add excludeLatex/excludeCode toggle states
    — Add file upload toggle + FileDropzone integration
    — Integrate stemPreprocessor before API call
    — Pass excludedRegions to editor for decoration
    — Add CitationAnalysisPanel after ReportSummary
    — Add mobile tab layout wrapper (MobileTabLayout)
    — Add StickyActionBar for mobile

  src/components/plagiarism/PlagiarismInputEditor.tsx
    — Support new decoration types: 'latex' and 'code' (in addition to highlight)
    — New CSS classes: plagiarism-excluded-latex, plagiarism-excluded-code

  src/components/plagiarism/extensions/plagiarismHighlight.ts
    — Add decoration support for excluded regions (blue/gray markers)

  src/types/plagiarism.ts
    — Add ExcludedRegion type
    — Add CitationPattern type
    — Add CitationAnalysisResult type
    — Add PreprocessResult type (or import from utility)
```

---

## 7. Risk Register & Mitigations

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|-------------|--------|-----------|-------|
| 1 | pdfjs-dist extraction quality varies by PDF type (scanned, complex layout) | Medium | High | Show TextPreview for user to review/edit; offer paste fallback | Agent 4 |
| 2 | LaTeX regex fails on complex/nested patterns or non-standard LaTeX | Medium | Medium | Graceful degradation — send raw text; maintain pattern library | Agent 3 |
| 3 | Citation detection false positives (parenthetical numbers, dates) | Medium | Medium | Confidence scoring; only high-confidence patterns flagged; user can dismiss | Agent 5 |
| 4 | Dollar signs in non-LaTeX context ($5, $10) detected as LaTeX | Medium | Low | Heuristic: require math operators/backslashes near $, not just digits | Agent 3 |
| 5 | Backend API response format changes break mapping | Low | High | Existing PlagiarismDataMapper with fallbacks handles gracefully | Agent 11 |
| 6 | Mobile layout breaks desktop experience | Low | High | Use `md:` breakpoint exclusively; desktop layout code unchanged | Agent 10 |
| 7 | Bundle size regression from eager-loading new libraries | Low | Medium | All new libraries lazy-loaded; verify with `next build` analyzer | Agent 7 |
| 8 | TipTap performance with many decorations (100+ highlights + excluded regions) | Medium | Medium | Throttle decoration updates; combine passes; viewport-aware rendering | Agent 7 |
| 9 | User uploads sensitive/confidential research (privacy concern) | Medium | High | All file extraction is client-side; only extracted text sent to API | Agent 11 |
| 10 | Phase 4 border migration causes visual regression | Low | Medium | Single PR with before/after screenshots; easy revert | Agent 9 |
| 11 | LaTeX compilation fails on complex documents (Phase 5) | Medium | High | Show user-friendly error with raw LaTeX for manual debugging; fallback to DOCX export | Phase 5 |
| 12 | Gemini API costs for Co-Writer/autocomplete exceed budget (Phase 5) | Medium | Medium | Rate limiting per user tier; debounce autocomplete at 500ms; monitor usage | Phase 5 |
| 13 | Server-side file processing changes privacy model (Phase 5) | Medium | High | Clear UI disclosure: "File will be processed on our server"; opt-in only | Phase 5 |
| 14 | LaTeX backend availability/latency impacts Writing Studio (Phase 5) | Medium | High | Graceful degradation: LaTeX features disabled when backend unreachable; core writing tools unaffected | Phase 5 |
| 15 | RabbitMQ/GCS/MongoDB infrastructure complexity (Phase 5) | Medium | Medium | Health checks, monitoring dashboards, circuit breakers; fallback to synchronous compilation for small docs | Phase 5 |

---

## 8. Definition of Done

### Feature-Level Definition of Done

A feature is "Done" when ALL of the following are verified:

1. **Functional:** Works in all states (empty, loading, success, error, edge cases)
2. **Accessible:** Passes Component Quality Gate (Section 9 of Gaia Audit)
   - All interactive elements have `aria-label` or visible label
   - Dynamic content has `aria-live`
   - Keyboard navigation works (Tab → Enter/Space → Escape)
   - Color is not the only indicator
3. **Dark mode:** Verified visually in both themes — all text readable
4. **Responsive:** Verified at 375px, 768px, 1440px widths
5. **Performance:** No new library loads on initial page visit
6. **Error handling:** All failure modes handled gracefully with recovery path
7. **Design system:** Follows Gaia flat design — no new borders on cards
8. **TypeScript:** All props typed with interfaces, no `any` types
9. **Code quality:** No console.log/warn/error, no hardcoded colors

### Phase-Level Gates

| Phase | Gate Criteria | Verification Method |
|-------|-------------|-------------------|
| 1.5 | Highlights readable in dark mode; ScanProgress announces to screen reader | Screenshot dark mode; VoiceOver/NVDA test |
| 2A | STEM paper with LaTeX + code correctly preprocessed and visualized | Paste sample paper with equations and code |
| 2B | Real academic PDF uploaded, text extracted, scan completes | Upload actual research PDF end-to-end |
| 2C | Cited sources green, uncited amber, "Add Citation" generates valid format | Test with paper that has in-text citations |
| 3 | Full workflow on 375px viewport, no overflow, no broken interactions | Chrome DevTools mobile emulation |
| 4 | 9/10 Gaia UI score; all borders migrated | Side-by-side comparison with Gaia components |
| 5A | API proxy returns compiled PDF from test HTML content | Send test document through /api/latex/compile, verify PDF output |
| 5B | User selects IEEE template → sees progress → downloads formatted PDF | End-to-end template selection → compilation → download flow |
| 5C | AI Co-Writer streams suggestions; autocomplete feels natural (<200ms perceived latency) | User testing with real writing session; measure autocomplete response time |
| 5D | Import existing PDF → edit in Writing Studio → export as IEEE PDF | Full round-trip test with real academic PDF |
| 5E | Full Write → Check → Submit workflow on 375px viewport | Chrome DevTools mobile emulation, all Phase 5 features accessible |

---

## 9. Cross-Cutting Concerns

### Error Recovery Philosophy
- Preprocessing errors are **non-fatal** — fall back to raw text + subtle toast notification
- File extraction errors show **helpful alternatives** — "Try pasting text directly"
- Network errors use **existing timeout/retry** infrastructure (5-min AbortController)
- Citation analysis errors are **invisible** — results show without citation panel
- LaTeX compilation errors show **user-friendly messages** — "Your document couldn't be compiled. Here's the raw LaTeX for manual review." with fallback to DOCX export
- AI Co-Writer/autocomplete failures are **silent** — features degrade gracefully without blocking writing
- **Principle: never block a scan because of a preprocessing failure**
- **Principle: never block writing because of a LaTeX backend failure**

### Data Privacy
- All file processing (PDF/DOCX extraction) happens **entirely client-side in the browser** (Phases 1.5–4)
- No file is uploaded to any server — only extracted text is sent to the plagiarism API
- This is a significant privacy advantage over competitors who upload files to their servers
- Exception: the backend's `/plagiarism/analyze-file` endpoint exists as a fallback if client-side extraction fails — clearly communicate to user that the file will be sent to the server in this case
- **Phase 5 privacy note:** LaTeX compilation and document import require **server-side processing** via the LaTeX microservice. The UI must clearly distinguish when data stays in the browser (plagiarism text extraction) vs when it's sent to the server (LaTeX compilation, PDF import). Use an explicit disclosure: "Your document will be processed on our secure server to generate the PDF."

### Backward Compatibility
- No existing features are removed, hidden, or changed in behavior
- All new features are additive: new toggles, new panels, new upload option
- The existing core workflow (paste text → scan → view results) remains the primary path
- Mobile layout is additive — desktop layout rendered identically to current
- New toggles (LaTeX, Code) default to `true` for STEM users — existing behavior preserved for users who don't use these features
- **Phase 5 backward compatibility:** All LaTeX/Co-Writer features are additive. The existing Writing Studio (editor + AI tools + export to DOCX/HTML/TXT) works identically without LaTeX backend. LaTeX features are lazy-loaded and only initialized when the user interacts with them. Zero impact on users who don't use LaTeX export.

### Deployment Considerations
- No database changes needed — all new state is client-side (Phases 1.5–4)
- No new environment variables needed — all libraries are npm packages (Phases 1.5–4)
- No new API endpoints needed for Phase 2 (frontend-only preprocessing)
- npm packages to install: `pdfjs-dist`, `mammoth` (both lazy-loaded, no impact on build unless used)
- **Phase 5 deployment requirements:**
  - LaTeX microservice must be deployed and accessible (separate deployment from shothikai/writing-studio repo)
  - Environment variables needed: `LATEX_SERVICE_URL`, `LATEX_SERVICE_API_KEY`
  - Infrastructure: RabbitMQ (message queue), MongoDB (job tracking), Google Cloud Storage (PDF storage)
  - Next.js API routes added: `/api/latex/*` (8 proxy endpoints)
  - JWT shared auth must be configured between platforms
- CDN dependency: pdfjs worker loaded from cdnjs.cloudflare.com — verify CORS headers in deployment environment
- Alternative: bundle pdfjs worker locally to avoid CDN dependency

---

*This roadmap should be reviewed and updated after each phase completion. Phase timelines may shift based on complexity discovered during implementation.*

*Related documents:*
- *Gaia_UI_Quality_Audit.md — 20-agent quality analysis (7.5/10 baseline)*
- *Service_Tracker.md — Master service tracking*
- *Strategic_Roadmap.md — Business strategy*
