# TOON + LaTeX Integration: Non-Breaking Implementation Plan

**Date:** February 25, 2026  
**Goal:** Add TOON and LaTeX without breaking current Writing Studio  
**Current Stack:** TipTap Editor + Convex + React

---

## 🎯 CURRENT IMPLEMENTATION ANALYSIS

### What We Have Now:
```
┌─────────────────────────────────────────────────────────┐
│  Writing Studio Current Stack                           │
├─────────────────────────────────────────────────────────┤
│  Frontend: React + Next.js + Tailwind                   │
│  Editor: TipTap (ProseMirror-based)                     │
│  Backend: Convex (real-time sync)                       │
│  Storage: Convex + External APIs                        │
│  Format: HTML (TipTap's native)                         │
│  Export: HTML → PDF (via API)                           │
└─────────────────────────────────────────────────────────┘
```

### Current Data Flow:
```
User Types → TipTap Editor → HTML → Convex → Auto-save
                                      ↓
                              Export: HTML → PDF API
```

---

## 🔧 TOON INTEGRATION (NON-BREAKING)

### What is TOON For?
**Internal optimization only** - Users never see TOON directly.

### Where TOON is Used:
| Layer | Current | With TOON | User Impact |
|-------|---------|-----------|-------------|
| **User Interface** | HTML/JSON | HTML/JSON | ✅ No change |
| **AI Prompts** | JSON | TOON | ✅ Faster, cheaper |
| **API Calls** | JSON | TOON | ✅ 40-60% savings |
| **Database** | Convex native | Convex native | ✅ No change |

### TOON Data Flow (Behind the Scenes):
```
┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   User      │───→│  TipTap  │───→│  JSON    │───→│  Convex  │
│   Types     │    │  Editor  │    │  (save)  │    │  (store) │
└─────────────┘    └──────────┘    └──────────┘    └──────────┘
                                                        │
                              ┌─────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │  AI Agent Needs  │
                    │  Context         │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Convert to TOON │  ← NEW: Format Agent
                    │  (40-60% savings)│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Send to LLM     │
                    │  (cheaper API)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  LLM Response    │
                    │  (JSON/TOON)     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Convert back    │
                    │  to HTML/JSON    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Show to User    │
                    └──────────────────┘
```

### TOON Implementation Code:

```typescript
// services/FormatAgent.ts - NEW FILE
// Converts between formats, users never interact directly

class FormatAgent {
  // Convert rich content to TOON for AI prompts
  static toTOON(content: any): string {
    // Example: Chapter data
    // INPUT (JSON): 45 tokens
    // {
    //   "chapters": [
    //     { "id": 1, "title": "The Beginning", "status": "complete" },
    //     { "id": 2, "title": "The Conflict", "status": "draft" }
    //   ]
    // }
    
    // OUTPUT (TOON): 18 tokens (60% savings)
    // chapters[2]{id,title,status}:
    //   1,The Beginning,complete
    //   2,The Conflict,draft
    
    return convertToTOON(content);
  }
  
  // Convert TOON back to usable format
  static fromTOON(toonString: string): any {
    return parseTOON(toonString);
  }
  
  // Main method: Optimize AI context
  static optimizeForAI(context: AIContext): OptimizedContext {
    return {
      ...context,
      content: this.toTOON(context.content),
      savings: calculateSavings(context.content)
    };
  }
}

// Usage in AI Agent:
async function getWritingSuggestion(content: string) {
  // Current (expensive):
  // const prompt = JSON.stringify({ chapters, characters, currentScene });
  // tokens: ~500
  
  // New (cheaper):
  const optimized = FormatAgent.optimizeForAI({
    chapters, characters, currentScene
  });
  // tokens: ~200 (60% savings)
  
  const response = await llm.call(optimized);
  return FormatAgent.fromTOON(response);
}
```

### UI Indicator (Optional):
```
Bottom Bar shows:
"TOON ⚡ 45% saved" 

On hover:
"AI processing optimized. 450 tokens → 198 tokens."
```

---

## 📄 LATEX INTEGRATION (NON-BREAKING)

### LaTeX is OPTIONAL - Not Required

**Current users:** Continue with HTML/TipTap (no change)  
**Research users:** Can switch to LaTeX mode (new option)  
**Book users:** HTML remains default (better for fiction)

### Implementation Strategy:

```typescript
// Editor mode selector (NEW in settings)
interface EditorConfig {
  mode: 'richtext' | 'latex' | 'markdown';
  // Default: 'richtext' (current TipTap)
}
```

### Mode 1: Rich Text (CURRENT - DEFAULT)
```
┌─────────────────────────────────────────┐
│ WriteView (Rich Text Mode)              │
├─────────────────────────────────────────┤
│                                         │
│  [TipTap Editor - WYSIWYG]              │
│                                         │
│  What you see is what you get           │
│  Bold, italic, headings, etc.           │
│                                         │
│  Best for: Books, general writing       │
│                                         │
└─────────────────────────────────────────┘

Storage: HTML (TipTip JSON)
Export: PDF (via API), ePub
```

### Mode 2: LaTeX (NEW - OPTIONAL)
```
┌─────────────────────────────────────────┐
│ WriteView (LaTeX Mode)                  │
├─────────────────────────────────────────┤
│                                         │
│  [CodeMirror / Monaco Editor]           │
│                                         │
│  \\section{Introduction}                │
│  This is \\textbf{bold} text.          │
│  \\cite{smith2023}                     │
│                                         │
│  Best for: Research papers, math        │
│                                         │
├─────────────────────────────────────────┤
│ 👁️ Live PDF Preview                     │
│ [Auto-compiled every 2 seconds]         │
└─────────────────────────────────────────┘

Storage: LaTeX source (.tex)
Export: PDF (local compilation)
```

### LaTeX Integration Code:

```typescript
// components/writing-studio/modes/LaTeXEditor.tsx - NEW FILE

import CodeMirror from '@uiw/react-codemirror';
import { latex } from '@codemirror/latex';

function LaTeXEditor({ project }) {
  const [latexSource, setLatexSource] = useState(project.latexContent);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // Compile LaTeX to PDF
  const compile = useCallback(async (source: string) => {
    // Option 1: Server-side compilation (Docker + texlive)
    const response = await fetch('/api/latex/compile', {
      method: 'POST',
      body: JSON.stringify({ source })
    });
    
    // Option 2: WebAssembly compilation (client-side)
    // const pdf = await compileLaTeXWasm(source);
    
    setPdfUrl(response.pdfUrl);
  }, []);
  
  // Auto-compile on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => compile(latexSource), 2000);
    return () => clearTimeout(timer);
  }, [latexSource]);
  
  return (
    <div className="flex h-full">
      {/* Left: LaTeX Editor */}
      <div className="w-1/2">
        <CodeMirror
          value={latexSource}
          extensions={[latex()]}
          onChange={setLatexSource}
        />
      </div>
      
      {/* Right: PDF Preview */}
      <div className="w-1/2">
        <iframe src={pdfUrl} className="w-full h-full" />
      </div>
    </div>
  );
}
```

### Backend LaTeX Compilation:

```typescript
// app/api/latex/compile/route.ts - NEW API ROUTE

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  const { source } = await req.json();
  
  // Save to temp file
  const tempFile = `/tmp/${uuid()}.tex`;
  await writeFile(tempFile, source);
  
  // Compile with pdflatex (in Docker container)
  try {
    await execAsync(`pdflatex -output-directory=/tmp ${tempFile}`);
    
    // Read generated PDF
    const pdfPath = tempFile.replace('.tex', '.pdf');
    const pdfBuffer = await readFile(pdfPath);
    
    // Upload to storage
    const pdfUrl = await uploadToStorage(pdfBuffer);
    
    return Response.json({ pdfUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 🔄 COMPLETE DATA FLOW COMPARISON

### Current Flow (Unchanged):
```
User → TipTap → HTML → Convex → Auto-save
                          ↓
                    Export → PDF API
```

### With TOON (Internal Only):
```
User → TipTap → HTML → Convex → Auto-save
                          ↓
                    AI Agent Request
                          ↓
                    FormatAgent.toTOON()  ← NEW
                          ↓
                    LLM API (cheaper)
                          ↓
                    FormatAgent.fromTOON()  ← NEW
                          ↓
                    Show suggestion to user
```

### With LaTeX Mode (Optional):
```
User selects "LaTeX Mode" → CodeMirror → LaTeX → Convex → Auto-save
                                      ↓
                                Compile API → PDF
                                      ↓
                                Show in preview panel
```

---

## 📊 BREAKING CHANGE ANALYSIS

### TOON Impact:
| Component | Change | Breaking? |
|-----------|--------|-----------|
| **User Interface** | None | ✅ No |
| **Editor** | None | ✅ No |
| **Database Schema** | None | ✅ No |
| **API Contracts** | Internal only | ✅ No |
| **AI Integration** | Format conversion | ✅ No |

### LaTeX Impact:
| Component | Change | Breaking? |
|-----------|--------|-----------|
| **Default Editor** | None (TipTap remains) | ✅ No |
| **Rich Text Mode** | Unchanged | ✅ No |
| **New LaTeX Mode** | Optional addition | ✅ No |
| **Database Schema** | Add `latexContent` field | ⚠️ Migration needed |
| **Export** | New PDF method | ✅ No (existing still works) |

---

## 🛡️ SAFETY MEASURES

### 1. TOON Safety:
```typescript
// TOON is internal only - never user-facing

// WRONG (don't do this):
// Show TOON to user
// <div>{toonString}</div>

// RIGHT (what we do):
// Convert back before showing
const userContent = FormatAgent.fromTOON(aiResponse);
<div>{userContent}</div>
```

### 2. LaTeX Safety:
```typescript
// LaTeX is opt-in, not default

// Project creation:
const defaultProject = {
  type: 'book',
  editorMode: 'richtext',  // Default, not latex
  // ...
};

// User must explicitly switch:
function switchToLaTeXMode() {
  showWarning("LaTeX mode is for advanced users. Continue?");
  // Convert HTML → LaTeX (one-way, with warning)
}
```

### 3. Migration Safety:
```typescript
// Database migration for LaTeX support
// Convex schema update:

// BEFORE:
projects: {
  content: v.string(),  // HTML/TipTap JSON
}

// AFTER:
projects: {
  content: v.string(),           // HTML (unchanged)
  contentFormat: v.string(),     // 'html' | 'latex' | 'markdown'
  latexContent: v.optional(v.string()),  // Only for LaTeX mode
}

// Migration: All existing projects keep working
// (contentFormat defaults to 'html')
```

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: TOON (Week 1) - Zero Risk
```
✅ Add FormatAgent service
✅ Convert AI prompts to TOON internally
✅ Add bottom bar indicator (optional)
✅ No UI changes
✅ No database changes
```

### Phase 2: LaTeX Mode (Week 2-3) - Low Risk
```
✅ Add editor mode selector (settings)
✅ Create LaTeXEditor component
✅ Add compile API endpoint
✅ Add live PDF preview
✅ Database migration (add optional field)
```

### Phase 3: Integration (Week 4) - Polish
```
✅ Test both modes side-by-side
✅ Ensure smooth switching
✅ Add mode-specific features
✅ Documentation
```

---

## ✅ FINAL ANSWER

### TOON: ✅ ZERO BREAKING CHANGES
- Internal optimization only
- Users never see TOON
- No UI changes
- No database changes
- Just cheaper AI calls

### LaTeX: ✅ MINIMAL RISK
- Optional mode (not default)
- Rich text remains unchanged
- One optional database field
- Users opt-in explicitly

### Current Implementation: ✅ FULLY PRESERVED
- TipTap editor: Unchanged
- HTML storage: Unchanged
- Auto-save: Unchanged
- Export: Enhanced, not replaced

---

## 💡 BOTTOM LINE

**TOON** = Internal cost savings (invisible to users)  
**LaTeX** = Optional power-user feature (doesn't affect default users)  
**Current UI** = 100% preserved

**Neither breaks anything.**

---

**Integration plan saved to:** `TOON_LATEX_NON_BREAKING_INTEGRATION.md`
