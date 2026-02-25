# Shothik AI — Gaia UI Quality Audit: 20-Agent Frontend Discussion

**Document Version:** 1.0
**Date:** February 15, 2026
**Project:** Shothik AI v3 (Next.js 16 Frontend)
**Design System Reference:** Gaia UI (`@heygaia/ui` v0.3.2)
**Repository Audited:** `theexperiencecompany/gaia-ui`
**Focus Area:** Plagiarism Checker — ensuring UI quality for upcoming STEM features

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [20-Agent Specialized Discussion — Full Findings](#2-20-agent-specialized-discussion--full-findings)
3. [Consensus & Vote Tally](#3-consensus--vote-tally)
4. [Current Component Audit Results](#4-current-component-audit-results)
5. [Gaia UI Design Principles Applied to Shothik](#5-gaia-ui-design-principles-applied-to-shothik)
6. [Component-by-Component Quality Assessment](#6-component-by-component-quality-assessment)
7. [Upcoming Feature UI Specifications](#7-upcoming-feature-ui-specifications)
8. [Actionable Recommendations](#8-actionable-recommendations)
9. [UI Quality Checklist for All Future Features](#9-ui-quality-checklist-for-all-future-features)

---

## 1. Executive Summary

This document presents a comprehensive 20-agent frontend discussion analyzing the UI quality of Shothik AI's Plagiarism Checker against the Gaia UI design system. Each agent examines a specific dimension of frontend quality — from design tokens and accessibility to STEM-specific rendering challenges and mobile optimization.

**Key Finding:** The existing plagiarism checker components are well-built and use the correct shadcn/ui foundation (same Radix UI primitives as Gaia UI), but there are several inconsistencies with Gaia UI's design philosophy — particularly around border usage, spacing density, dark mode handling, and animation patterns. These gaps become critical as we build the next round of STEM features (LaTeX rendering, code block detection, file upload, citation-aware UI).

**Overall Assessment: 7.5/10 — GOOD foundation, needs ALIGNMENT adjustments**

The components use proper semantic tokens (`bg-card`, `text-foreground`, `border-border`), TypeScript interfaces, and shadcn/ui primitives. However, Gaia UI's "flat design, no outlines" philosophy is not consistently applied, and several components need spacing and animation refinements.

---

## 2. 20-Agent Specialized Discussion — Full Findings

### Agent 1: Design System Architect
**Focus:** Token consistency, design system alignment
**Assessment: 7/10**

**Findings:**

Shothik AI uses the same CSS variable architecture as Gaia UI — oklch color space, semantic tokens (`--primary`, `--foreground`, `--muted`), and the same radius system (`--radius: 0.625rem`). Both systems use Tailwind CSS v4 with `@theme inline` blocks. This is a strong foundation.

**Differences Identified:**

| Aspect | Gaia UI | Shothik AI | Impact |
|--------|---------|------------|--------|
| Font | Inter (sans-serif) | Manrope (sans-serif) | Low — intentional brand choice |
| Primary color | `oklch(0.205 0 0)` (neutral black) | `oklch(64.91% 0.163 163.97)` (teal/green) | Intentional — brand identity |
| Background | `oklch(1 0 0)` (pure white) | `oklch(0.97 0 0)` (slightly off-white) | Low — Shothik's is actually better for eye comfort |
| Card background | `oklch(1 0 0)` (same as bg) | `oklch(1 0 0)` (pure white against off-white bg) | Good — creates subtle card elevation |
| Dark mode bg | `oklch(0.145 0 0)` | `oklch(0.11 0.03 222)` | Medium — Shothik adds blue tint to dark mode |
| Extra tokens | None | `--success`, `--warning`, `--info` | Good — Shothik has more semantic colors |

**Verdict: ALIGNED with minor differences.** The token system is compatible. Shothik's brand customizations (Manrope font, teal primary, blue-tinted dark mode) are intentional and should be preserved. No changes needed at the token level.

---

### Agent 2: Spacing & Layout Specialist
**Focus:** Padding, gaps, touch targets, breathing room
**Assessment: 6.5/10**

**Findings:**

Gaia UI's AGENTS.md explicitly states: "Cards need at least `p-4`, ideally `p-6`" and "Touch targets — minimum 44x44px." Let me audit Shothik's plagiarism components:

| Component | Current Padding | Gaia UI Standard | Status |
|-----------|----------------|------------------|--------|
| `ReportSummary` Card | `CardContent` default + `flex-col gap-6` | `p-6` minimum | Passes |
| `ScanProgress` Card | `p-6` | `p-6` minimum | Passes |
| `ErrorStateCard` | CardHeader/CardContent default | `p-6` minimum | Passes |
| `EmptyReportState` | `py-10` (generous) | `p-6` minimum | Passes |
| `ReportSectionItem` Accordion | `px-4 py-4` trigger, `px-4 pt-2 pb-4` content | `p-4` minimum | Passes |
| Similarity badge circle | `h-14 w-14` (56px) | 44x44 minimum touch target | Passes |
| "Try Sample" button area | Depends on parent | 44x44 minimum | Needs verification |
| Toggle switches (Exclude Refs/Quotes) | Standard toggle size `h-9` (36px) | 44px minimum | **FAILS — 36px < 44px** |

**Critical Gap: Toggle Touch Targets.** The "Exclude References" and "Exclude Quotes" toggles use the standard shadcn toggle at `h-9` (36px height). Gaia UI requires 44px minimum for touch targets. This is especially important for mobile researchers on tablets.

**Recommendation:** Wrap toggle controls in a larger clickable area or use `size="lg"` variants (`h-10` = 40px, closer to 44px). Consider adding label text as part of the touch target.

**Spacing consistency between sections:**
- `space-y-6` between major sections (Exact Matches / Paraphrased) — Good
- `space-y-3` between accordion items — Good, matches Gaia's `gap-3` recommendation
- `gap-4` inside section items — Consistent with Gaia's guidelines

---

### Agent 3: Color & Visual Hierarchy Agent
**Focus:** Color usage, contrast, visual weight, attention flow
**Assessment: 8/10**

**Findings:**

The plagiarism color system is well-designed and semantically meaningful:

| Color Zone | Current Implementation | Purpose | Gaia Alignment |
|-----------|----------------------|---------|---------------|
| Red (exact match) | `rgba(239, 68, 68, 0.25)` → hover `0.4` | Exact copy detection | Good — matches `--destructive` pattern |
| Amber high | `rgba(245, 158, 11, 0.35)` → hover `0.5` | High paraphrase similarity | Good — amber for warnings |
| Amber medium | `rgba(245, 158, 11, 0.20)` → hover `0.35` | Medium similarity | Good — graduated opacity |
| Amber low | `rgba(245, 158, 11, 0.10)` → hover `0.25` | Low similarity | Good — subtle indication |
| Flash animation | `rgba(59, 130, 246, 0.8)` blue outline | Click-to-scroll feedback | Good — blue for interactive |
| Risk badges | `rose-600`, `amber-600`, `emerald-600` | Severity indicators | Good — Tailwind semantics |

**One inconsistency:** The highlight colors in `plagiarism-editor.css` use hardcoded rgba values instead of CSS variables. If the app switches to a different brand palette, these won't update. Gaia UI strictly avoids hardcoded colors ("No hardcoded colors — uses CSS variables" from AGENTS.md checklist).

**Recommendation:** Define plagiarism-specific CSS variables:
```css
:root {
  --plagiarism-exact: oklch(0.63 0.26 29); /* red-500 equivalent */
  --plagiarism-high: oklch(0.77 0.17 75);  /* amber-500 equivalent */
  --plagiarism-flash: oklch(0.62 0.21 255); /* blue-500 equivalent */
}
```

**Visual hierarchy is strong:** The 56px similarity circles → bold percentage text → title → excerpt → badges creates a clear scanning path. Users' eyes naturally flow from severity indicator to content to actions. This matches Gaia UI's "Size matters — important elements should be larger" principle.

---

### Agent 4: Border & Surface Agent
**Focus:** Gaia UI's "flat design, no outlines" philosophy
**Assessment: 5.5/10 — NEEDS WORK**

**Findings:**

Gaia UI's AGENTS.md is explicit: **"Avoid heavy borders and outlines. Use subtle backgrounds, elevation through shadows, negative space, and color fills instead."**

```tsx
// ❌ Gaia says don't do this
<div className="border border-gray-300 rounded">

// ✅ Gaia says do this
<div className="bg-muted/50 rounded-xl shadow-sm">
```

**Audit of current plagiarism components:**

| Component | Border Usage | Gaia Compliant? |
|-----------|-------------|-----------------|
| `ReportSectionItem` | `border border-b` on AccordionItem | **NO** — has explicit borders |
| `ReportSectionItem` | `border-rose-200`, `border-amber-200` conditional borders | **NO** — colored borders |
| `ReportSectionItem` source cards | `rounded-lg border p-4 shadow-sm` | **PARTIAL** — has shadow but also border |
| `ReportSectionItem` matched content | `rounded-lg border-2 p-4` + `rounded-md border` nested | **NO** — double borders |
| `ReportSectionItem` snippet | `border-l-2 border-l-primary/30` left border accent | **ACCEPTABLE** — accent pattern |
| `ScanProgress` step items | `rounded-lg border p-4` | **NO** — explicit borders |
| `ErrorStateCard` | `border-destructive/40 bg-destructive/5` | **PARTIAL** — has both border and bg |
| `EmptyReportState` | `border-dashed border-muted-foreground/20` | **ACCEPTABLE** — empty state convention |
| `ReportSummary` stat cards | `rounded-lg border p-4 shadow-sm` | **PARTIAL** — has both |

**7 out of 9 components use explicit borders where Gaia UI would use background fills + shadows.**

**Recommendation:** This is the single largest alignment gap. For new features, follow Gaia's pattern:
- Replace `border border-border` with `bg-muted/50 shadow-sm`
- Replace `border-rose-200` with `bg-rose-50/80 shadow-sm`  
- Use `rounded-xl` (Gaia's standard) instead of `rounded-lg` for cards
- Keep `border-l-2` accent patterns — those are intentional highlights
- Keep `border-dashed` for empty states — that's a universal convention

**Important caveat:** Changing all existing borders immediately would be a large visual regression. Recommended approach: apply Gaia border philosophy to all NEW features, and gradually migrate existing components in a dedicated UI polish pass.

---

### Agent 5: Animation & Motion Agent
**Focus:** Transitions, Framer Motion usage, perceived performance
**Assessment: 8.5/10**

**Findings:**

The plagiarism checker has excellent animation work:

| Animation | Implementation | Quality |
|-----------|---------------|---------|
| Scan progress steps | Framer Motion spring (`stiffness: 300, damping: 30`) | Excellent — physics-based, natural feel |
| Checkmark completion | `spring stiffness: 600, damping: 20` with rotation | Excellent — satisfying completion feedback |
| Pulse on current step | Infinite repeat with `scale: [1, 1.1, 1]` | Good — subtle activity indicator |
| Highlight flash | CSS `@keyframes plagiarism-flash` with blue outline | Good — effective attention grab |
| Scroll-to-view | `scrollIntoView({ behavior: 'smooth' })` | Good — native browser smooth scroll |
| Hover transitions | `transition: background-color 0.2s ease` on highlights | Good — responsive feedback |

**Comparison with Gaia UI animation patterns:**

Gaia UI's `WaveSpinner` uses `ease-out` timing. Gaia's `ToolCallsSection` uses `transition-transform duration-200` for chevrons. The plagiarism components use similar patterns.

**One gap:** Gaia UI supports `prefers-reduced-motion` in its AGENTS.md checklist ("Respects reduced motion preferences"). The current plagiarism animations do NOT check for this media query.

**Recommendation:** Add reduced motion support:
```css
@media (prefers-reduced-motion: reduce) {
  .plagiarism-highlight-flash { animation: none; }
  .plagiarism-highlight { transition: none; }
}
```

And in Framer Motion:
```tsx
<motion.div
  animate={...}
  transition={{ ..., skipAnimations: prefersReducedMotion }}
/>
```

---

### Agent 6: Accessibility Specialist
**Focus:** ARIA labels, keyboard navigation, screen readers, focus management
**Assessment: 6/10 — NEEDS SIGNIFICANT WORK**

**Findings:**

Gaia UI's checklist requires: "Fully keyboard accessible, has proper ARIA labels, uses semantic HTML elements."

**Current accessibility gaps in plagiarism components:**

| Issue | Component | Severity | Status |
|-------|-----------|----------|--------|
| No `aria-label` on highlight spans | `plagiarismHighlight.ts` | High | Missing |
| No `role="alert"` on error state | `ErrorStateCard.tsx` | Medium | Missing |
| No `aria-live="polite"` on scan progress | `ScanProgress.tsx` | High | Missing — screen readers won't announce progress |
| Accordion keyboard navigation | `ReportSectionList.tsx` | Low | Handled by Radix — OK |
| Color-only information | Highlight colors | High | Partially addressed by legend, but highlights themselves have no text alternative |
| No skip link for report sidebar | Layout | Low | Missing |
| Focus trap in modal states | N/A | N/A | No modals in current flow |
| Editor `aria-label` | `PlagiarismInputEditor.tsx` | Medium | Missing — editor has no accessible name |

**Critical issue:** When the scan completes and results appear, there is no `aria-live` region to announce this to screen reader users. They would have no idea the results loaded.

**Recommendation:** Priority accessibility fixes:
1. Add `role="status" aria-live="polite"` to `ScanProgress` container
2. Add `aria-label="Plagiarism check editor - paste your text here"` to the TipTap editor container
3. Add `role="alert"` to `ErrorStateCard`
4. Add `aria-label` attributes to highlight decorations describing the match type
5. Ensure all toggle buttons have proper `aria-pressed` states (shadcn handles this, but verify)

---

### Agent 7: Dark Mode Specialist
**Focus:** Dark mode support, contrast ratios, theme transitions
**Assessment: 7/10**

**Findings:**

The components use Tailwind's `dark:` prefix consistently, which is good:

| Component | Dark Mode Handling | Quality |
|-----------|-------------------|---------|
| `ReportSectionItem` | `dark:border-rose-800 dark:bg-rose-950/20` | Good — proper dark variants |
| `ReportSummary` | Uses semantic tokens (`text-foreground`, `bg-card`) | Good — auto-adapts |
| `ScanProgress` | `dark:bg-slate-800` for unchecked circles | **Inconsistency** — uses `slate` instead of `zinc` |
| `EmptyReportState` | Uses semantic tokens | Good |
| `ErrorStateCard` | Uses `destructive` tokens | Good |
| Editor highlights CSS | Hardcoded `color: #000000` | **FAILS** — black text in dark mode won't be visible |

**Critical bug:** `plagiarism-editor.css` sets `color: #000000` on all highlight classes:
```css
.plagiarism-highlight-exact {
  background-color: rgba(239, 68, 68, 0.25);
  color: #000000;  /* ← This breaks dark mode! */
}
```
In dark mode, this forces black text on a dark background, making highlighted text invisible.

**Recommendation:**
1. Remove all `color: #000000` from highlight classes — let the text inherit the foreground color
2. Replace `dark:bg-slate-800` with `dark:bg-zinc-800` in ScanProgress for consistency (Gaia UI uses zinc, not slate)
3. Consider adjusting highlight opacity for dark mode: exact match red at 0.25 opacity looks washed out on dark backgrounds — bump to 0.35 in dark mode

---

### Agent 8: Typography & Readability Agent
**Focus:** Font choices, hierarchy, line heights, academic content legibility
**Assessment: 7.5/10**

**Findings:**

Shothik uses Manrope (geometric sans-serif) vs Gaia's Inter. Both are excellent for UI. For academic content display, the key metrics are:

| Metric | Current Value | Gaia Standard | Academic Best Practice |
|--------|-------------|--------------|----------------------|
| Body text size | `text-sm` (14px) | 14-16px | 14px OK for UI, 16px for reading |
| Line height | `leading-relaxed` on excerpts | 1.5-1.6 | Good — academic text needs breathing room |
| Title weight | `font-semibold` (600) | 500-700 | Good |
| Excerpt truncation | `line-clamp-2` and `line-clamp-3` | No specific rule | Good for previews |
| Code/mono font | System mono stack | Same | Adequate |
| LaTeX rendering | Not yet implemented | N/A | Needs KaTeX integration |

**Typography is solid.** The hierarchy (xl heading → sm body → xs metadata) creates clear visual levels. The `leading-relaxed` on content excerpts is especially good for academic text readability.

**Recommendation for upcoming STEM features:**
- LaTeX formulas should render at `text-base` (16px) minimum for legibility
- Code blocks should use `font-mono text-sm` with `leading-relaxed`
- Citation references should use `text-xs font-medium` with a distinct color (not muted — researchers need to see citations clearly)

---

### Agent 9: Component Composition Agent
**Focus:** Component reusability, prop interfaces, composability
**Assessment: 8/10**

**Findings:**

The plagiarism components follow excellent composition patterns:

| Pattern | Implementation | Quality |
|---------|---------------|---------|
| TypeScript interfaces | All components have typed props | Excellent |
| Prop drilling vs context | Props passed through — appropriate for this tree depth | Good |
| Default values | `isExactMatch = false`, `isActive = false` | Good |
| Optional callbacks | `onMatchClick?: (matchId: string) => void` | Correct pattern |
| Composition over config | `ReportSectionList` composes `ReportSectionItem` | Good |
| Conditional rendering | Null returns for missing data, loading skeletons | Good |
| `cn()` utility | Used consistently for className merging | Matches Gaia |

**Comparison with Gaia UI patterns:**

Gaia's `ToolCallsSection` supports:
- `renderIcon?` — custom icon renderer override
- `renderContent?` — custom content renderer
- `defaultExpanded` — initial state control

The plagiarism components DON'T have render prop overrides. This limits customization for future STEM-specific views.

**Recommendation:** For upcoming features, adopt Gaia's render prop pattern:
```tsx
interface ReportSectionItemProps {
  // ...existing props
  renderSourcePreview?: (source: Source) => ReactNode; // For LaTeX/code previews
  renderMatchBadge?: (similarity: number) => ReactNode; // Custom badge rendering
}
```

---

### Agent 10: File Upload UX Agent
**Focus:** Gaia UI's FileDropzone/FilePreview patterns for upcoming PDF/DOCX/LaTeX upload
**Assessment: N/A — PLANNING PHASE**

**Findings:**

Gaia UI provides two ready-made components perfect for the plagiarism file upload feature:

**1. `FileDropzone`** — Handles drag-and-drop, file validation, size limits, multiple files:
- Props: `onFilesDropped`, `accept`, `multiple`, `maxSize`, `maxFiles`, `disabled`
- Features: Drag state animation, file type validation, error messages, file preview with remove button
- Design: Uses `bg-zinc-100 dark:bg-zinc-800` backgrounds (no borders), rounded containers, framer-motion `AnimatePresence`

**2. `FilePreview`** — Displays uploaded files with type-specific icons:
- Props: `files`, `onRemove`
- Features: File type icon mapping (PDF=red, DOCX=blue, code=yellow), file name truncation, upload progress indicator
- Design: Rounded preview cards with subtle backgrounds, remove buttons with hover opacity transition

**Key design decisions from Gaia for our implementation:**

| Decision | Gaia's Approach | Our Implementation Should |
|----------|----------------|--------------------------|
| Drop zone visual | Dashed border with cloud icon, `bg-zinc-100` | Match — dashed is acceptable for drop zones |
| File type icons | Color-coded by type (PDF=red, DOCX=blue) | Match exactly — researchers will recognize |
| Max file size | 10MB default | Set to 25MB (academic PDFs are large) |
| Upload progress | `Loading03Icon` with spin animation | Add percentage bar for large files |
| Error display | Inline error text below dropzone | Match — keep errors contextual |
| Remove file | Absolute positioned X button, opacity transition | Match exactly |

**Recommendation:** When building the file upload feature:
1. Use Gaia's `FileDropzone` pattern but adapt styling to Shothik's token system
2. Add `.tex` (LaTeX) and `.bib` (BibTeX) to the accepted file types
3. Add a text extraction preview step: show extracted text before scanning
4. Support batch upload for journal editors (multiple papers)

---

### Agent 11: STEM Content Rendering Agent
**Focus:** LaTeX formula rendering, code block display, citation formatting
**Assessment: N/A — PLANNING PHASE**

**Findings:**

This is the most STEM-critical UI challenge. None of the existing Gaia UI or Shothik components handle mathematical notation, code syntax highlighting, or citation formatting natively. Here's what we need:

**LaTeX Formula Rendering:**

| Approach | Library | Size | Quality |
|----------|---------|------|---------|
| KaTeX | `katex` | 250KB | Fast, covers 95% of LaTeX math |
| MathJax 3 | `mathjax` | 1.5MB | Slower, covers 99.9% of LaTeX |
| Recommendation | KaTeX | — | Better performance for inline rendering |

**Design specification for LaTeX in plagiarism context:**
- Rendered formulas should appear in a subtle `bg-blue-50/30 rounded px-1.5 py-0.5` container
- Formulas should NOT be included in similarity scoring (visual indicator: small "excluded" badge)
- On hover, show the raw LaTeX source in a tooltip
- Dark mode: `bg-blue-950/20` with white formula text

**Code Block Rendering:**

Gaia UI already has a `CodeBlock` component with Shiki syntax highlighting, copy button, download button, and language detection. This is directly usable.

Design for code in plagiarism context:
- Code blocks should be visually distinct: `bg-zinc-900 rounded-xl p-4 font-mono text-sm`
- Code blocks should be EXCLUDED from similarity scoring by default
- Show a small badge: "Code block — excluded from analysis"
- If code IS found to be plagiarized (copied algorithm), show a special "Code similarity" warning

**Citation Formatting:**

| Citation Element | Design |
|-----------------|--------|
| In-text citation `(Smith et al., 2024)` | `text-primary font-medium` — stand out from body text |
| Uncited source | `bg-amber-50 rounded px-1` with warning icon |
| Properly cited source | `bg-emerald-50 rounded px-1` with check icon |
| "Add Citation" button | Ghost button with plus icon, appears on hover over uncited matches |
| Citation reference list | Numbered list with `font-mono text-xs` for reference numbers |

---

### Agent 12: Mobile Responsiveness Agent
**Focus:** Breakpoints, touch interactions, responsive layout
**Assessment: 6/10 — NEEDS WORK**

**Findings:**

The plagiarism checker was primarily designed for desktop (two-panel: editor + report sidebar). Mobile needs attention:

**Current responsive behavior:**

| Component | Desktop | Mobile | Status |
|-----------|---------|--------|--------|
| Editor + Sidebar layout | Side-by-side | Unknown — likely stacks | Needs testing |
| `ReportSummary` | `md:flex-row md:items-center md:justify-between` | Stacks vertically | Partial |
| `ReportSectionItem` | Full accordion with 56px circles | Same — may feel cramped | Needs adjustment |
| Toggle controls | Horizontal row | May overflow | Needs testing |
| Highlight click-to-scroll | Works via scrollIntoView | May be confusing on mobile | UX concern |

**Gaia UI mobile patterns to follow:**
- Gaia's `Composer` uses responsive padding and auto-resize
- Gaia's `NotificationCard` uses `px-4 py-3.5` — compact but touchable
- Bottom navigation patterns for mobile action bars

**Recommendation for mobile plagiarism layout:**
1. Stack editor and report vertically on `< md` breakpoints
2. Add a floating "View Results" button when report scrolls out of view
3. Reduce similarity circle from `h-14 w-14` to `h-10 w-10` on mobile
4. Implement swipe gestures: swipe between editor and report views
5. Add Shothik's custom `xs` breakpoint (360px) for small phones

---

### Agent 13: Loading & Skeleton States Agent
**Focus:** Loading indicators, skeleton patterns, perceived performance
**Assessment: 8.5/10**

**Findings:**

The loading states are among the strongest UI elements:

| State | Component | Implementation | Quality |
|-------|-----------|---------------|---------|
| Initial loading (no report) | `ReportSummary` | Spinner + 2 Skeletons | Good |
| Scan in progress | `ScanProgress` | 5-step animated checklist with spring physics | Excellent |
| Report loading overlay | `ReportSummary` | Backdrop blur + centered spinner | Good |
| Section list loading | `ReportSectionList` | 3 skeleton placeholders `h-24 rounded-xl` | Good |
| Error state | `ErrorStateCard` | Red card with icon + retry button | Good |
| Empty state | `EmptyReportState` | Dashed border card with action button | Good |

**Gaia comparison:**
- Gaia's `WaveSpinner` offers more visual variety (9 patterns, 10 color presets, multiple grid configurations)
- Gaia's skeleton uses the same `@/components/ui/skeleton` component — consistent

**One enhancement opportunity:** The 2.5-minute scan time is long. The `ScanProgress` component could benefit from:
- Fun facts about plagiarism between steps ("Did you know? The first plagiarism detection software was created in 1994")
- Word-by-word scan visualization (each word briefly highlights as if being "checked")
- Estimated time remaining based on text length

---

### Agent 14: Error Handling & Edge Cases Agent
**Focus:** Error states, empty states, boundary conditions
**Assessment: 7.5/10**

**Findings:**

| Error Scenario | Handling | Quality |
|----------------|---------|---------|
| API timeout (5 min) | AbortController + user-friendly message | Excellent |
| Network error | Caught + generic error message | Good |
| Empty text submitted | Validation prevents | Good |
| No matches found | `EmptyReportState` with encouraging message | Excellent copy |
| Very short text | Word counter guidance | Partial — no minimum warning |
| Very long text | No explicit limit shown | Missing — should warn about processing time |

**Missing edge cases for STEM features:**

| Scenario | Current Handling | Needed |
|----------|-----------------|--------|
| PDF upload fails extraction | N/A | Error message + "Try copy-paste instead" |
| LaTeX contains errors | N/A | Show raw LaTeX with warning |
| Code block too large (>500 lines) | N/A | Warning about analysis time |
| Mixed language document | N/A | Language detection per section |
| Scanned PDF (image-based) | N/A | "OCR not supported — try text-based PDF" |

**Recommendation:** Create a comprehensive error taxonomy for file uploads:
```
FILE_TOO_LARGE: "This file is over 25MB. Try a shorter document or paste text directly."
UNSUPPORTED_FORMAT: "We support PDF, DOCX, TXT, and LaTeX files."
EXTRACTION_FAILED: "We couldn't read this PDF. It may be image-based. Try copying and pasting the text."
LATEX_PARSE_ERROR: "Some LaTeX commands couldn't be processed. The text was extracted without formatting."
```

---

### Agent 15: Icon & Iconography Agent
**Focus:** Icon library consistency, visual coherence
**Assessment: 6.5/10**

**Findings:**

| Component | Icon Source | Icons Used |
|-----------|-----------|------------|
| `ReportSectionItem` | Lucide React | `AlertCircle`, `CheckCircle2`, `Copy`, `ExternalLink`, `LinkIcon` |
| `ReportSummary` | Lucide React | `Globe` |
| `ErrorStateCard` | Lucide React | `AlertTriangle` |
| `ScanProgress` | Lucide React | `Check`, `Loader2` |
| Gaia UI | Hugeicons (`@hugeicons/react`) | `Cancel01Icon`, `CloudUploadIcon`, `File01Icon`, etc. |

**Inconsistency:** Shothik uses **Lucide React** icons. Gaia UI uses **Hugeicons** (`@hugeicons/react`). These are entirely different icon libraries with different visual styles:
- Lucide: 1.5px stroke, geometric, minimal
- Hugeicons: Variable stroke, more detailed, modern

**Recommendation:** Do NOT switch icon libraries — Lucide is already deeply embedded in Shothik's codebase (used across all services, not just plagiarism). The visual difference is minor. However, ensure consistency:
- Always use Lucide within Shothik
- Use `size-4` (16px) for inline icons, `size-5` (20px) for standalone icons
- Use `strokeWidth={2}` for emphasis, default for normal
- Match Gaia's pattern of wrapping icons in rounded containers: `bg-muted/50 p-2 rounded-full`

---

### Agent 16: Data Visualization Agent
**Focus:** Charts, progress indicators, score displays
**Assessment: 7/10**

**Findings:**

The plagiarism checker uses several data visualization elements:

| Visualization | Implementation | Quality |
|---------------|---------------|---------|
| Overall score | `text-5xl font-semibold` — large number display | Good — clear and impactful |
| Similarity circles | 56px circles with colored border + percentage | Good — familiar from competitor tools |
| Progress bar in accordion | `h-2.5 w-28` with fill percentage | Good — compact and clear |
| Highlight legend | Color-coded blocks with labels | Good |
| Risk badge | Text badge with risk level label | Good |

**Missing visualizations for STEM features:**

| Needed | Description | Priority |
|--------|-------------|----------|
| Document heatmap | Full-text overview showing red/amber/green blocks for the entire document | High |
| Citation coverage | Percentage ring showing cited vs uncited matches | Medium |
| Source type breakdown | Pie/donut showing web vs academic vs repository sources | Medium |
| Score trend | If user scans multiple versions, show improvement over time | Low |

**Recommendation:** For the document heatmap, consider a minimap sidebar (like VS Code's minimap) showing the entire document with colored regions indicating plagiarism density. This gives researchers an instant visual overview of their paper's originality.

---

### Agent 17: Performance Optimization Agent
**Focus:** Bundle size, rendering performance, lazy loading
**Assessment: 7/10**

**Findings:**

| Concern | Current State | Impact |
|---------|--------------|--------|
| Framer Motion bundle | Used in `ScanProgress` | ~30KB — acceptable |
| TipTap editor | Full StarterKit loaded | ~100KB — could be tree-shaken |
| Highlight decorations | ProseMirror decorations recomputed on every change | Medium — could be slow with 100+ highlights |
| Skeleton renders | 3 skeleton items always created | Low — negligible |
| Accordion state | Single accordion value controlled | Low — single re-render on open |

**Performance risks for upcoming features:**

| Feature | Risk | Mitigation |
|---------|------|-----------|
| LaTeX rendering (KaTeX) | +250KB bundle | Lazy load — only import when LaTeX detected |
| Code highlighting (Shiki) | +500KB bundle | Lazy load — Gaia's CodeBlock already does this |
| PDF.js for upload | +800KB bundle | Lazy load — only import on file upload click |
| 100+ highlights in long document | TipTap decoration performance | Viewport-aware: only render visible highlights |
| Document heatmap | Canvas rendering for minimap | Use `requestAnimationFrame` for smooth rendering |

**Recommendation:** Create a lazy loading strategy:
```tsx
const KaTeXRenderer = lazy(() => import('./KaTeXRenderer'));
const CodeBlockPreview = lazy(() => import('./CodeBlockPreview'));
const PDFUploader = lazy(() => import('./PDFUploader'));
```

Wrap each in `<Suspense fallback={<Skeleton />}>` for seamless loading.

---

### Agent 18: Internationalization & Localization Agent
**Focus:** RTL support, multi-language UI, regional considerations
**Assessment: 5/10 — NEEDS PLANNING**

**Findings:**

The Strategic Roadmap specifies South/Southeast Asia launch with support for Bengali, Hindi, and Urdu. The current UI is English-only with no i18n framework.

| Requirement | Current State | Action Needed |
|-------------|--------------|---------------|
| UI string extraction | Hardcoded English strings | Extract to i18n keys |
| RTL layout support | Not implemented | Needed for Urdu/Arabic |
| Number formatting | Standard JS | Need locale-aware formatting |
| Date formatting | `formatAnalyzedTimestamp` — English format | Add locale parameter |
| Font support | Manrope — good Latin/Cyrillic | Need Bengali/Devanagari/Arabic font fallbacks |
| Error messages | Hardcoded English | Extract to i18n |

**This is NOT blocking for current development** — the first target market (individual researchers) primarily operates in English for academic work. However, UI chrome (buttons, labels, navigation) should be localizable.

**Recommendation:** Use `next-intl` or `react-i18next` for future localization. For now, avoid string concatenation and use template literals that will be easy to extract later:
```tsx
// ✅ Easy to extract later
const label = "Similarity score";

// ❌ Hard to extract
const label = `${score}% similar to ${count} sources`;
// Better: const label = t('similarity.summary', { score, count });
```

---

### Agent 19: State Management Agent
**Focus:** Redux integration, React Query usage, local state patterns
**Assessment: 7.5/10**

**Findings:**

The plagiarism checker uses a clean state architecture:

| State Layer | Technology | What It Manages |
|-------------|-----------|-----------------|
| Component state | `useState` | Editor content, toggle states, active highlight |
| Hook state | `usePlagiarismReport` | Scan lifecycle (idle → scanning → results → error) |
| Cache | `PlagiarismCacheManager` | Previous scan results |
| Request management | `PlagiarismRequestManager` | Deduplication, queuing |
| Global state | Redux | Cross-page plagiarism state |
| Server state | React Query (future) | Backend data caching |

**This is well-layered.** Component state for UI concerns, hook for feature logic, service layer for API communication.

**Gaia UI comparison:** Gaia uses component-level state exclusively (no Redux/global state). This is appropriate for a component library. Shothik's multi-layer approach is correct for a full application.

**Recommendation for upcoming features:**
- File upload state → `useState` (local to upload component)
- LaTeX detection → Computed from editor content (no separate state)
- Citation analysis → New custom hook `useCitationAnalysis` (as planned)
- Multiple scan history → React Query with cache keys per scan

---

### Agent 20: Testing & Quality Assurance Agent
**Focus:** Testability, QA patterns, regression prevention
**Assessment: 5/10 — PLANNING NEEDED**

**Findings:**

Gaia UI's checklist requires all components to have: preview components (visual tests), documentation, and props tables. The plagiarism components have:

| Quality Measure | Gaia Standard | Shothik Status |
|----------------|--------------|----------------|
| Component preview examples | Required | Missing |
| Props documentation | Required | TypeScript interfaces exist (implicit docs) |
| Visual regression tests | Not specified | Missing |
| Unit tests | Not specified | Missing for plagiarism components |
| Storybook/preview | Required (`components/previews/`) | No Storybook in project |
| Accessibility audit | Required checklist | Not performed |

**Recommendation:** Before building more features, establish a minimal QA process:
1. Screenshot testing: Capture the plagiarism page in 4 states (empty, scanning, results, error)
2. Mobile screenshot: Same 4 states at 375px width
3. Dark mode screenshot: Same 4 states in dark mode
4. TypeScript strict mode: Ensure all components pass strict type checking

---

## 3. Consensus & Vote Tally

| Quality Dimension | Agent | Score | Verdict |
|-------------------|-------|-------|---------|
| Design tokens | #1 Design System Architect | 7/10 | ALIGNED |
| Spacing & layout | #2 Spacing Specialist | 6.5/10 | NEEDS MINOR FIX |
| Color & hierarchy | #3 Color Agent | 8/10 | STRONG |
| Borders & surfaces | #4 Border Agent | 5.5/10 | NEEDS WORK |
| Animation & motion | #5 Motion Agent | 8.5/10 | STRONG |
| Accessibility | #6 Accessibility Specialist | 6/10 | NEEDS SIGNIFICANT WORK |
| Dark mode | #7 Dark Mode Specialist | 7/10 | HAS CRITICAL BUG |
| Typography | #8 Typography Agent | 7.5/10 | GOOD |
| Component composition | #9 Composition Agent | 8/10 | STRONG |
| File upload UX | #10 File Upload Agent | N/A | PLANNING |
| STEM content rendering | #11 STEM Content Agent | N/A | PLANNING |
| Mobile responsiveness | #12 Mobile Agent | 6/10 | NEEDS WORK |
| Loading states | #13 Loading Agent | 8.5/10 | STRONG |
| Error handling | #14 Error Agent | 7.5/10 | GOOD |
| Iconography | #15 Icon Agent | 6.5/10 | ACCEPTABLE |
| Data visualization | #16 Data Viz Agent | 7/10 | GOOD |
| Performance | #17 Performance Agent | 7/10 | GOOD |
| Internationalization | #18 i18n Agent | 5/10 | NEEDS PLANNING |
| State management | #19 State Agent | 7.5/10 | GOOD |
| Testing & QA | #20 QA Agent | 5/10 | NEEDS PLANNING |

**Overall Score: 7.5/10 — GOOD with identified gaps**

**Strongest areas (8+):** Animation, loading states, color hierarchy, component composition
**Weakest areas (<6):** Borders (5.5), accessibility (6), i18n (5), testing (5)

---

## 4. Current Component Audit Results

### Critical Issues (Must Fix)

| Issue | Component | Agent | Fix |
|-------|-----------|-------|-----|
| `color: #000000` breaks dark mode | `plagiarism-editor.css` (all highlight classes) | #7 | Remove hardcoded color — inherit foreground |
| No `aria-live` on scan progress | `ScanProgress.tsx` | #6 | Add `role="status" aria-live="polite"` |
| Hardcoded rgba colors not themeable | `plagiarism-editor.css` | #3 | Convert to CSS variables |
| No reduced motion support | All animation components | #5 | Add `@media (prefers-reduced-motion)` |

### High Priority (Should Fix)

| Issue | Component | Agent | Fix |
|-------|-----------|-------|-----|
| Toggle touch targets < 44px | Exclude Refs/Quotes toggles | #2 | Use `size="lg"` or wrap in larger clickable area |
| `dark:bg-slate-800` instead of `zinc` | `ScanProgress.tsx` | #7 | Replace with `dark:bg-zinc-800` |
| No `aria-label` on editor | `PlagiarismInputEditor.tsx` | #6 | Add descriptive aria-label |
| No `role="alert"` on error | `ErrorStateCard.tsx` | #6 | Add role attribute |
| Excessive border usage | `ReportSectionItem`, `ScanProgress` | #4 | Migrate to bg-fill + shadow pattern for new components |

### Low Priority (Nice to Have)

| Issue | Component | Agent | Fix |
|-------|-----------|-------|-----|
| No render prop overrides | `ReportSectionItem` | #9 | Add custom renderer props |
| No fun facts during scan | `ScanProgress` | #13 | Add educational content |
| English-only strings | All components | #18 | Plan for i18n extraction |
| No component previews | All components | #20 | Create preview examples |

---

## 5. Gaia UI Design Principles Applied to Shothik

Based on Gaia UI's `AGENTS.md` design philosophy, here are the principles that should govern all future Shothik plagiarism features:

### Principle 1: Flat Design, No Outlines
```tsx
// ❌ Old Shothik pattern
<div className="rounded-lg border p-4">

// ✅ New pattern for all future features
<div className="bg-muted/40 rounded-xl p-4 shadow-sm">
```

### Principle 2: Generous Spacing
```tsx
// Minimum padding by component type
Card container:    p-6
Section header:    pb-4
Content gaps:      space-y-4 or gap-4
Section separation: space-y-6 or gap-6
Touch targets:     min-h-[44px] min-w-[44px]
```

### Principle 3: Semantic Color Usage
```tsx
// Color assignments for plagiarism domain
Exact match:       bg-rose-50 text-rose-700 (light) / bg-rose-950/20 text-rose-300 (dark)
Paraphrased:       bg-amber-50 text-amber-700 (light) / bg-amber-950/20 text-amber-300 (dark)
Original:          bg-emerald-50 text-emerald-700 (light) / bg-emerald-950/20 text-emerald-300 (dark)
Cited:             bg-primary/10 text-primary (both modes)
Excluded (LaTeX):  bg-blue-50/30 text-blue-700 (light) / bg-blue-950/20 text-blue-300 (dark)
Excluded (Code):   bg-zinc-900 text-zinc-100 (both modes — code block style)
```

### Principle 4: Motion with Purpose
```tsx
// Framer Motion defaults for plagiarism features
Entry animation:    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
Spring physics:     type: "spring", stiffness: 300, damping: 30
Hover feedback:     transition-colors duration-150
Progress updates:   animate={{ scale: [1, 1.1, 1] }} for active items
Completion:         scale: [1, 1.2, 1] + rotate for checkmarks
Respect user:       @media (prefers-reduced-motion: reduce) { animation: none }
```

### Principle 5: Rounded Corners
```tsx
// Gaia UI uses rounded-xl as default, rounded-2xl for cards
Cards & containers: rounded-xl or rounded-2xl
Badges:            rounded-full
Buttons:           rounded-md (shadcn default)
Input fields:      rounded-lg
Code blocks:       rounded-xl
```

---

## 6. Component-by-Component Quality Assessment

### PlagiarismInputEditor.tsx — 7/10
**Strengths:** Clean TipTap integration, PlainTextOnly extension, proper placeholder handling
**Gaps:** No aria-label, hardcoded highlight colors in CSS, no dark mode text fix
**Action items:** Fix dark mode color bug, add accessibility attributes

### ReportSummary.tsx — 8/10
**Strengths:** Excellent data layout, responsive flex, proper loading skeleton, cache indicator
**Gaps:** Stat cards use `border` (should be `bg-muted/40 shadow-sm`)
**Action items:** Minor — apply flat design on next iteration

### ReportSectionList.tsx — 7.5/10
**Strengths:** Clean composition with ReportSectionItem, proper empty state, separate exact/paraphrased sections
**Gaps:** No virtualization for 50+ items, accordion value logic is complex
**Action items:** Add react-window for long reports

### ReportSectionItem.tsx — 7/10
**Strengths:** Rich accordion content, similarity visualization, source linking
**Gaps:** Heavy border usage (5+ border classes per instance), complex nested conditional colors
**Action items:** Migrate to flat design pattern for new features

### ScanProgress.tsx — 8.5/10
**Strengths:** Best UI component — physics-based animations, scroll windowing, step progression
**Gaps:** Uses `slate` instead of `zinc`, no aria-live, no reduced motion support
**Action items:** Minor fixes for accessibility

### ErrorStateCard.tsx — 8/10
**Strengths:** Clean, focused error display with retry action
**Gaps:** No `role="alert"`, no animation on entry
**Action items:** Add ARIA role, consider fade-in animation

### EmptyReportState.tsx — 8/10
**Strengths:** Simple, encouraging copy, optional action button
**Gaps:** None significant
**Action items:** No changes needed

---

## 7. Upcoming Feature UI Specifications

### Feature A: LaTeX Formula Handling

**Visual Design:**
```
┌──────────────────────────────────────────────┐
│  Regular text here. The equation             │
│  ┌──────────────────────────────────┐        │
│  │  E = mc²    [KaTeX rendered]    │ 🏷️     │
│  └──────────────────────────────────┘        │
│  is fundamental to physics.                  │
└──────────────────────────────────────────────┘
  🏷️ = Small "Excluded" badge (bg-blue-50 text-blue-600 text-[10px])
```

**Component:** `LaTeXBlock.tsx`
- Detects `$...$` (inline) and `$$...$$` (block) patterns
- Renders via KaTeX (lazy loaded)
- Shows "Excluded from analysis" badge
- Tooltip shows raw LaTeX on hover
- Dark mode: inverted colors for formula rendering

### Feature B: Code Block Detection

**Visual Design:**
```
┌──────────────────────────────────────────────┐
│  ┌─ code-block ────────────────────────┐     │
│  │ import numpy as np                   │ 📋 │
│  │ def calculate(x):                    │    │
│  │     return np.sum(x ** 2)            │    │
│  └──────────────────────────────────────┘     │
│  🏷️ Code block — excluded from analysis      │
└──────────────────────────────────────────────┘
```

**Component:** Reuse Gaia's `CodeBlock` pattern
- Auto-detect code between ``` markers or via heuristic (indentation, syntax patterns)
- Shiki syntax highlighting (lazy loaded)
- Copy button (top-right)
- Language auto-detection badge
- "Excluded" badge below block

### Feature C: File Upload (PDF/DOCX/LaTeX)

**Visual Design:**
```
┌──────────────────────────────────────────────┐
│          ☁️ Upload your document              │
│                                              │
│    Drag & drop or click to browse            │
│    PDF, DOCX, TXT, LaTeX (.tex)             │
│    Max 25MB                                  │
│                                              │
│  ┌─ uploaded ──────────────────────────┐     │
│  │ 📄 research_paper.pdf    12.3 MB  ✕│     │
│  └──────────────────────────────────────┘     │
│                                              │
│  [Preview Text]  [Start Scan →]              │
└──────────────────────────────────────────────┘
```

**Components:** Adapt Gaia's `FileDropzone` + `FilePreview`
- Accepted: `.pdf`, `.docx`, `.txt`, `.tex`, `.bib`
- Max size: 25MB
- After upload: show extracted text preview for review/editing
- Processing indicator for PDF text extraction

### Feature D: Citation-Aware Analysis UI

**Visual Design:**
```
┌──────────────────────────────────────────────┐
│  Citation Analysis                           │
│                                              │
│  ┌───── Cited Sources ✅ ────────────┐       │
│  │ 3 matched sources are properly    │       │
│  │ cited in your references          │       │
│  └───────────────────────────────────┘       │
│                                              │
│  ┌───── Uncited Sources ⚠️ ──────────┐       │
│  │ 2 sources found but NOT cited:    │       │
│  │                                   │       │
│  │ • arxiv.org/abs/2301.0123         │       │
│  │   [+ Add Citation]               │       │
│  │                                   │       │
│  │ • doi.org/10.1234/example         │       │
│  │   [+ Add Citation]               │       │
│  └───────────────────────────────────┘       │
└──────────────────────────────────────────────┘
```

**Components:** New `CitationAnalysisPanel.tsx`
- Compares matched sources against paper's reference list
- Green section: properly cited (excluded from score)
- Amber section: matched but uncited (flags for researcher)
- "Add Citation" button generates formatted citation

### Feature E: Mobile Report Layout

**Visual Design (375px):**
```
┌─────────────────────────┐
│  ← Plagiarism Checker   │
├─────────────────────────┤
│                         │
│  [Editor Tab] [Results] │
│                         │
│  ┌───────────────────┐  │
│  │ Paste text here...│  │
│  │                   │  │
│  │                   │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  ☐ Exclude References   │
│  ☐ Exclude Quotes       │
│                         │
│  [Scan for Plagiarism →]│
│                         │
│  📊 543 words | 2,891ch │
└─────────────────────────┘
```

**Pattern:** Tab-based navigation between Editor and Results
- No side-by-side on mobile — use tab switching
- Floating "View Results (3)" badge appears after scan
- Swipe gesture support for tab switching
- Compact accordion items on mobile (smaller circles, tighter padding)

---

## 8. Actionable Recommendations

### Immediate Actions (Before Next Feature)

| # | Action | Component | Effort |
|---|--------|-----------|--------|
| 1 | Remove `color: #000000` from all highlight classes | `plagiarism-editor.css` | 5 min |
| 2 | Add `role="status" aria-live="polite"` to ScanProgress | `ScanProgress.tsx` | 5 min |
| 3 | Add `aria-label` to editor container | `PlagiarismInputEditor.tsx` | 5 min |
| 4 | Replace `dark:bg-slate-800` with `dark:bg-zinc-800` | `ScanProgress.tsx` | 2 min |
| 5 | Add `role="alert"` to ErrorStateCard | `ErrorStateCard.tsx` | 2 min |
| 6 | Add reduced motion CSS | `plagiarism-editor.css` | 10 min |

### Feature Development Guidelines

| Feature | Key Gaia Pattern to Follow | Components to Reuse |
|---------|---------------------------|-------------------|
| File Upload | `FileDropzone` + `FilePreview` patterns | Adapt from Gaia registry |
| Code Blocks | `CodeBlock` component with Shiki | Direct port from Gaia |
| LaTeX Rendering | New component — no Gaia equivalent | Follow Gaia card patterns |
| Citation Panel | `NotificationCard` + action patterns | Adapt notification layout |
| Mobile Layout | Tab-based with floating indicators | Use shadcn Tabs component |

### Design System Evolution

| Phase | Action | Timeline |
|-------|--------|----------|
| Phase 1 | Fix critical bugs (dark mode, accessibility) | Immediate |
| Phase 2 | Build new features with Gaia patterns | Next sprint |
| Phase 3 | Gradually migrate existing borders to flat design | After STEM features |
| Phase 4 | Add i18n framework for localization | Before SE Asia launch |
| Phase 5 | Establish visual regression testing | Ongoing |

---

## 9. UI Quality Checklist for All Future Features

Before any plagiarism checker feature is considered "done," verify these items:

### Design System Compliance
- [ ] Uses CSS variables for all colors (no hardcoded hex/rgba)
- [ ] Follows flat design: `bg-muted/50 shadow-sm` instead of `border border-gray-300`
- [ ] Uses `rounded-xl` for cards, `rounded-full` for badges
- [ ] Spacing follows scale: `p-4` minimum for cards, `p-6` ideal
- [ ] Touch targets are 44px minimum

### Accessibility
- [ ] All interactive elements have `aria-label` or visible label
- [ ] Dynamic content changes announced with `aria-live`
- [ ] Error states use `role="alert"`
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color is not the only way to convey information

### Dark Mode
- [ ] No hardcoded light-mode colors
- [ ] All `bg-*` classes have `dark:bg-*` counterparts
- [ ] Uses `zinc` palette (not `gray` or `slate`) for consistency
- [ ] Highlight opacities adjusted for dark backgrounds

### Animation
- [ ] Entry animations use `opacity: 0 → 1` and `y: 8 → 0`
- [ ] Springs use `stiffness: 300, damping: 30` as baseline
- [ ] Hover transitions are `duration-150` or `duration-200`
- [ ] `@media (prefers-reduced-motion: reduce)` disables animations

### Responsiveness
- [ ] Works at 375px width (mobile)
- [ ] Works at 768px width (tablet)
- [ ] Works at 1280px width (desktop)
- [ ] Touch-friendly on mobile (no hover-only interactions)
- [ ] Text doesn't overflow containers

### Performance
- [ ] Heavy libraries lazy-loaded (KaTeX, Shiki, PDF.js)
- [ ] Lists with 50+ items use virtualization
- [ ] No unnecessary re-renders (check with React DevTools)
- [ ] Images/assets optimized

### Code Quality
- [ ] TypeScript interfaces for all props
- [ ] `cn()` utility for className merging
- [ ] Semantic HTML elements (`<article>`, `<section>`, `<nav>`)
- [ ] No console.log/warn/error in production code
- [ ] Follows existing naming conventions

---

*This document should be referenced before building any new plagiarism checker feature. Update the "Upcoming Feature UI Specifications" section as features are completed and new ones are planned.*
