# UI/UX Changes for Writing Studio Enhancement

**Date:** February 25, 2026  
**Current UI:** Replit-inspired workspace layout  
**New Features:** Swarm Agents + TOON + All 3 Use Cases

---

## 🎨 CURRENT UI ANALYSIS

### Existing Layout (Replit-inspired):
```
┌─────────────────────────────────────────────────────────┐
│  Header (Project Title, Actions)                        │
├──────────┬──────────────────────────────┬───────────────┤
│          │                              │               │
│  LEFT    │       MAIN EDITOR            │    RIGHT      │
│  SIDEBAR │       (TipTap)               │    PANEL      │
│  (Files/ │                              │    (AI/       │
│  Chapters)│                              │    Context)   │
│          │                              │               │
├──────────┴──────────────────────────────┴───────────────┤
│  Bottom Bar (Status, Word Count)                        │
└─────────────────────────────────────────────────────────┘
```

### Current Components:
- ✅ **WritingCanvas.jsx** - TipTap editor with bubble menu
- ✅ **WriteView.jsx** - 3-panel layout (sidebar, editor, AI panel)
- ✅ **AssignmentWriteView.jsx** - Assignment-specific UI
- ✅ **ResearchPaperWriteView.jsx** - Research-specific UI
- ✅ **OutlineView.jsx** - Document structure
- ✅ **PublishView.jsx** - Publishing workflow

---

## 🚀 NEW UI/UX REQUIREMENTS

### 1. SWARM AGENT INTERFACE

#### New Component: AgentPanel
```jsx
// components/writing-studio/agents/AgentPanel.jsx

interface AgentPanelProps {
  activeAgents: Agent[];
  agentStatus: 'idle' | 'working' | 'completed';
  onAgentAction: (agent: Agent, action: string) => void;
}

// UI Design:
┌─────────────────────────┐
│ 🤖 AI Agents            │
├─────────────────────────┤
│                         │
│ 📝 Writing Agent        │
│    Status: Working...   │
│    [Progress Bar]       │
│                         │
│ 📚 Citation Agent       │
│    Status: Idle         │
│    [Find Sources]       │
│                         │
│ ✓ Review Agent          │
│    3 issues found       │
│    [View Details]       │
│                         │
│ 🔄 Format Agent         │
│    TOON → JSON          │
│    Saved: 45% tokens    │
│                         │
└─────────────────────────┘
```

**Changes to Existing UI:**
- Replace simple "AI Suggestions" with **Agent Swarm Panel**
- Show real-time agent status
- Allow agent interaction (pause, configure, view logs)
- Display token savings from TOON

---

### 2. LIVE PDF PREVIEW (WebLaTex Feature)

#### New Component: LivePreviewPanel
```jsx
// components/writing-studio/preview/LivePreviewPanel.jsx

interface LivePreviewPanelProps {
  documentType: 'book' | 'research' | 'assignment';
  content: string;
  format: 'pdf' | 'epub' | 'print';
}

// UI Design:
┌──────────────────────────────────────┐
│ 👁️ Live Preview              [📖 🔲] │
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │    PDF Preview               │   │
│  │    (Auto-refresh)            │   │
│  │                              │   │
│  │    Page 1 of 12              │   │
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  [◀] Page 1/12 [▶]  [🔄 Refresh]    │
│                                      │
│  Format: [PDF ▼] [ePub] [Print]    │
│                                      │
└──────────────────────────────────────┘
```

**Changes to Existing UI:**
- Add **split-screen mode**: Editor | Preview
- Allow tab switching: Editor / Preview / Both
- Auto-refresh on content change (with debounce)
- Format switching (PDF for research, ePub for books)

---

### 3. TYPE-SPECIFIC WORKSPACES

#### A. Book Writing Workspace
```jsx
// New: BookWorkspace.jsx

// Layout:
┌─────────────────────────────────────────────────────────┐
│  📚 My Novel                    [Publish] [Share]       │
├──────────┬──────────────────────┬───────────────────────┤
│  📖      │                      │  🤖                   │
│  BOOK    │   EDITOR             │  AGENTS               │
│  OUTLINE │   (Chapter 3)        │  + Live Preview       │
│          │                      │                       │
│  Ch 1 ✓  │   The rain fell...   │  Writing: Active      │
│  Ch 2 ✓  │                      │  Plot: Suggest twist  │
│  Ch 3 ▶  │   [Cursor]           │  Characters: Develop  │
│  Ch 4    │                      │                       │
│  ...     │                      │  📊 Stats:            │
│          │                      │  12,450 / 80,000      │
│  [+ New] │                      │  15% complete         │
│          │                      │                       │
├──────────┴──────────────────────┴───────────────────────┤
│  📝 Word Count: 12,450 | Goal: 80,000 | Progress: 15%   │
└─────────────────────────────────────────────────────────┘

// New Book-Specific Features:
- Chapter reordering (drag-drop)
- Word count goals per chapter
- Progress visualization
- Character/location tracking panel
- Publishing platform selector (KDP, Ingram)
```

#### B. Research Paper Workspace
```jsx
// New: ResearchWorkspace.jsx

// Layout:
┌─────────────────────────────────────────────────────────┐
│  🎓 AI Ethics Study           [Submit to arXiv] [Cite]  │
├──────────┬──────────────────────┬───────────────────────┤
│  📄      │                      │  📚                   │
│  PAPER   │   EDITOR             │  CITATIONS            │
│  SECTIONS│   (Introduction)     │  + AI Agents          │
│          │                      │                       │
│  Abs ✓   │   Recent advances... │  [Search Papers]      │
│  Intro ▶ │   [Cursor]           │                       │
│  RelWork │                      │  Found: 5 sources     │
│  Method  │   [Citation needed]  │  1. Smith et al.      │
│  Results │   [📚 Suggest]       │  2. Chen & Brown      │
│  Concl   │                      │  3. ...               │
│          │                      │  [Add to Bibliography]│
│  Refs    │                      │                       │
│          │                      │  Style: [APA ▼]       │
├──────────┴──────────────────────┴───────────────────────┤
│  📊 Citations: 12 | References: 45 | Similarity: 8%     │
└─────────────────────────────────────────────────────────┘

// New Research-Specific Features:
- Citation manager panel
- Journal template selector
- Similarity score (plagiarism check)
- arXiv/journal submission buttons
- Reference formatter
```

#### C. Assignment Workspace
```jsx
// New: AssignmentWorkspace.jsx

// Layout:
┌─────────────────────────────────────────────────────────┐
│  📝 Essay: Climate Change    ⏰ Due: 2 days 3 hours     │
├──────────┬──────────────────────┬───────────────────────┤
│  📋      │                      │  ✅                   │
│  RUBRIC  │   EDITOR             │  CHECKLIST            │
│          │   (Body Paragraph 2) │  + AI Tutor           │
│  Thesis  │                      │                       │
│  ✓ Met   │   The evidence...    │  ☐ Thesis statement   │
│          │                      │  ✓ Evidence (3/3)     │
│  Evidence│   [Cursor]           │  ☐ Citations          │
│  ✓ 3/3   │                      │  ☐ Conclusion         │
│          │                      │  ☐ Grammar check      │
│  Citations│  [🤔 AI Help]       │                       │
│  ☐ 0/5   │   "Need help with    │  🎯 Grade Estimate:   │
│          │    citations?"       │  B+ (85%)             │
│  Concl   │                      │  [Improve to A]       │
│  ☐       │                      │                       │
├──────────┴──────────────────────┴───────────────────────┤
│  ⏰ Due in 2 days | Words: 1,250/1,500 | Grade: B+      │
└─────────────────────────────────────────────────────────┘

// New Assignment-Specific Features:
- Rubric checklist
- Deadline countdown
- Grade estimator
- AI tutor chat
- Plagiarism score
- Submission button
```

---

### 4. TOON FORMAT INDICATOR

#### New Component: FormatBadge
```jsx
// components/writing-studio/format/FormatBadge.jsx

// UI Design (subtle indicator):
┌─────────────────────────┐
│ Writing...          ⚡TOON│  ← Shows TOON is active
│                         │
│ Content here...         │
│                         │
└─────────────────────────┘

// On hover:
┌─────────────────────────┐
│ Writing...          ⚡TOON│
│ ┌─────────────────────┐ │
│ │ TOON Format Active  │ │
│ │ Token savings: 45%  │ │
│ │ 245 → 135 tokens    │ │
│ │                     │ │
│ │ [View in JSON]      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Changes:**
- Add subtle TOON indicator in status bar
- Show token savings on hover
- Allow switching between views (for debugging)

---

### 5. ENHANCED COLLABORATION UI

#### New Component: CollaborationPanel
```jsx
// components/writing-studio/collaboration/CollaborationPanel.jsx

// UI Design:
┌─────────────────────────┐
│ 👥 Collaborators        │
├─────────────────────────┤
│                         │
│ 🟢 Alice (Editor)       │
│    Editing: Chapter 3   │
│    [Cursor visible]     │
│                         │
│ 🟡 Bob (Reviewer)       │
│    Left comment         │
│    [View comment]       │
│                         │
│ ⭕ You (Owner)          │
│                         │
│ ─────────────────────   │
│                         │
│ 💬 Comments (3)         │
│                         │
│ "Great opening!" - Bob  │
│ [Reply] [Resolve]       │
│                         │
│ "Fix citation" - Alice  │
│ [Reply] [Resolve]       │
│                         │
└─────────────────────────┘
```

**Changes:**
- Add collaboration panel (right sidebar)
- Show live cursors
- Display comments inline
- Track changes visualization

---

## 📊 UI CHANGES SUMMARY

### New Components to Build:

| Component | Location | Purpose |
|-----------|----------|---------|
| **AgentPanel** | Right sidebar | Swarm agent control |
| **LivePreviewPanel** | Split view | PDF/ePub preview |
| **BookWorkspace** | Main view | Book-specific layout |
| **ResearchWorkspace** | Main view | Research-specific layout |
| **AssignmentWorkspace** | Main view | Assignment-specific layout |
| **FormatBadge** | Status bar | TOON indicator |
| **CollaborationPanel** | Right sidebar | Real-time collaboration |
| **CitationManager** | Right sidebar | Reference management |
| **ChapterManager** | Left sidebar | Book chapter organization |
| **RubricPanel** | Right sidebar | Assignment checklist |

### Modified Components:

| Component | Changes |
|-----------|---------|
| **WriteView.jsx** | Add agent panel, preview toggle |
| **WritingCanvas.jsx** | Add collaboration cursors |
| **WorkspaceHeader.jsx** | Add type selector, publish buttons |
| **BottomActionBar.jsx** | Add TOON badge, format switcher |

### Removed Components:
- None (backward compatible)

---

## 🎨 DESIGN SYSTEM UPDATES

### New Icons Needed:
- 🤖 Agent/Bot icon
- 📚 Book icon
- 🎓 Research/Academic icon
- 📝 Assignment icon
- ⚡ TOON format icon
- 👁️ Preview icon
- 👥 Collaboration icon
- 📊 Stats icon

### New Color Tokens:
```css
/* Agent status colors */
--agent-idle: #94a3b8;
--agent-working: #3b82f6;
--agent-completed: #22c55e;

/* TOON indicator */
--toon-active: #f59e0b;

/* Collaboration */
--collab-cursor-1: #ef4444;
--collab-cursor-2: #3b82f6;
--collab-cursor-3: #22c55e;
```

---

## 📱 RESPONSIVE CONSIDERATIONS

### Mobile (< 768px):
- Collapse sidebars into drawers
- Show one panel at a time (Editor OR Preview)
- Simplified agent status (badge only)

### Tablet (768px - 1024px):
- Collapsible sidebars
- Editor + one panel visible
- Touch-friendly agent controls

### Desktop (> 1024px):
- Full 3-panel layout
- Split-screen editor + preview
- Full agent panel

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Core UI (Week 1)
- [ ] Create AgentPanel component
- [ ] Add TOON FormatBadge
- [ ] Modify WriteView for agent integration

### Phase 2: Type-Specific Workspaces (Week 2)
- [ ] BookWorkspace layout
- [ ] ResearchWorkspace layout
- [ ] AssignmentWorkspace layout

### Phase 3: Preview & Collaboration (Week 3)
- [ ] LivePreviewPanel
- [ ] CollaborationPanel
- [ ] CitationManager

### Phase 4: Polish (Week 4)
- [ ] Responsive design
- [ ] Animations
- [ ] Testing

---

## 🎯 SUCCESS CRITERIA

- [ ] Users can see agent status in real-time
- [ ] Live preview updates within 2 seconds
- [ ] Workspace switches based on project type
- [ ] TOON savings visible to users
- [ ] Collaboration features intuitive
- [ ] Mobile experience acceptable

**Bottom line:** Transform from simple editor to intelligent, collaborative writing workspace.
