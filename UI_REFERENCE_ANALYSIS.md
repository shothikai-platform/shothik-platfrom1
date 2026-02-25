# UI Reference Analysis: Polished Writing Interface

**Reference:** HTML design provided by user  
**Analysis Date:** February 25, 2026  
**Goal:** Match this polished UI in Shothik

---

## 🎨 DESIGN BREAKDOWN

### 1. Header (Height: 56px)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📖 [Title Input]          Progress Bar          [Share] [Publish]│
│    "The Midnight Protocol"    ████████░░ 64%     👤 Profile     │
│    ☁️ Saved to cloud                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Book icon (Material Icons)
- Title input (editable, transparent bg)
- Cloud save status
- Progress bar (64% complete)
- Word count: 24,300 / 38,000
- Share button
- Publish button (primary, blue)
- User avatar

**Colors:**
- Primary: `#137fec` (blue)
- Background: Dark mode `#0a0f14`
- Panel: `#101922`

---

### 2. Left Sidebar (Width: 256px)

```
┌─────────────────────────┐
│ [Manuscript] [Format]   │ ← Tabs
├─────────────────────────┤
│ STRUCTURE          [+]  │
├─────────────────────────┤
│ ☰ 📁 Chapter 1: The...  │
│   ├─ 1.1 Introduction ✓ │ ← Active (blue bg)
│   └─ 1.2 The Encounter  │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ DAILY GOAL          │ │
│ │ 850 / 1000 words    │ │
│ │ ████████░░ 85%      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Elements:**
- Tabs: Manuscript / Format
- Section header with add button
- Drag handles (☰) for reordering
- Folder icons for chapters
- Nested sections with indentation
- Active state: Blue bg + left border
- Daily goal progress card

---

### 3. Center Editor (Flexible width)

```
┌─────────────────────────────────────────────────────────────┐
│ [B] [I]  |  [Quote] Citation  |  [Align]        [ROLLBACK] │ ← Toolbar
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1.1 Introduction                                           │
│                                                             │
│  The rain didn't just fall; it hammered against...          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✨ Draft Suggestion                    [APPLY][IGNORE]│   │
│  │ "You shouldn't have come back," a voice rasped...   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Elias didn't turn around. "We don't have the luxury..."   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📝 1,245 Words | ⚡ TOON 45% | 🧠 Neural: 92 | ⭐ Nobel: 8.4│ ← Status
│                                            [Tone: Noir]     │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Formatting toolbar (Bold, Italic, Quote, Citation)
- Rollback button (prominent, blue)
- Chapter title (H1)
- Body text (prose styling)
- **Inline AI suggestions** with Apply/Ignore buttons
- Status bar with metrics
- Tone indicator badge

**Key Feature:** AI suggestions appear INLINE in the text, not in a separate panel!

---

### 4. Right Panel (Width: 420px)

```
┌─────────────────────────────────────────────────────────┐
│ [Neuro][Nobel][Chars][AI🔥][Research][Plan][Critique]  │ ← Tabs
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ⏰ Rollback & Versions                              │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 2 min ago                              [✓] [✗]     │ │
│ │ "The rain didn't just fall..."                      │ │
│ │ [AI SUGGESTION]                                     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 15 min ago                    Applied               │ │
│ │ "Sarah looked tired..."                             │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ ✨ Writing Assistant (MCP)                    [ACTIVE]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🤖 I've analyzed the tension in Section 1.1...       │
│     [YES, DRAFT IT] [NOT NOW]                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 📎 [Type message...                      ] [Send]      │
└─────────────────────────────────────────────────────────┘
```

**Elements:**
- Horizontal scrollable tabs
- AI tab is active (blue underline)
- Rollback history with timestamps
- Version preview with actions
- AI assistant chat interface
- MCP status indicator
- Message input with attachment button

---

### 5. Floating Button

```
┌─────┐
│  ⛶  │ ← Fullscreen toggle (bottom right)
└─────┘
```

---

## 🎯 KEY DESIGN DECISIONS

### 1. Inline AI Suggestions (Not Panel)
**Current:** AI suggestions in right panel  
**Reference:** AI suggestions INLINE in text with Apply/Ignore

**Benefits:**
- Context is clear
- Immediate action
- Less eye movement

### 2. Rollback History in Right Panel
**Current:** Rollback is a popup  
**Reference:** Rollback is always visible in right panel

**Benefits:**
- Always accessible
- Visual history
- Easy comparison

### 3. Progress Bar in Header
**Current:** Bottom status bar only  
**Reference:** Large progress bar in header

**Benefits:**
- Always visible
- Motivating
- Professional look

### 4. Daily Goal Card
**Current:** Not implemented  
**Reference:** Daily goal with progress in left sidebar

**Benefits:**
- Gamification
- Habit building
- Visual progress

---

## 🛠️ IMPLEMENTATION PLAN

### Phase 1: Layout Structure
```tsx
// Main layout matching reference
<div className="h-screen flex flex-col">
  <Header /&gt;                    {/* 56px height */}
  <div className="flex-1 flex">
    <LeftSidebar /&gt;              {/* 256px width */}
    <CenterEditor /&gt;             {/* Flexible */}
    <RightPanel /&gt;               {/* 420px width */}
  </div>
</div>
```

### Phase 2: Header Component
- Title input with auto-save
- Progress bar with word count
- Action buttons (Share, Publish)
- User avatar

### Phase 3: Left Sidebar
- Tab navigation (Manuscript/Format)
- Draggable chapter list
- Section nesting
- Daily goal card

### Phase 4: Center Editor
- TipTap editor integration
- Formatting toolbar
- **Inline AI suggestions** (NEW)
- Status bar with metrics

### Phase 5: Right Panel
- Scrollable tabs
- Rollback history (always visible)
- AI chat interface
- MCP integration

### Phase 6: Polish
- Material Icons integration
- Dark mode colors (`#0a0f14`, `#101922`)
- Custom scrollbar styling
- Animations and transitions

---

## 🎨 COLOR PALETTE

```css
/* Primary */
--primary: #137fec;

/* Backgrounds */
--bg-dark: #0a0f14;
--panel-dark: #101922;
--bg-light: #f6f7f8;

/* Text */
--text-primary: #ffffff;
--text-secondary: #94a3b8;
--text-muted: #64748b;

/* Borders */
--border-dark: #1e293b;
--border-light: #e2e8f0;

/* Accents */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
```

---

## 📐 SIZING

| Element | Width | Height |
|---------|-------|--------|
| Header | 100% | 56px |
| Left Sidebar | 256px | 100% |
| Right Panel | 420px | 100% |
| Center Editor | Flexible | 100% |
| Toolbar | 100% | 48px |
| Status Bar | 100% | 40px |

---

## 🔤 TYPOGRAPHY

- **Font:** Inter (Google Fonts)
- **Weights:** 300, 400, 500, 600, 700
- **Sizes:**
  - Title: 24px
  - Chapter: 30px (bold)
  - Body: 18px (prose)
  - UI labels: 10px (uppercase, tracking-wide)
  - Buttons: 11px

---

## ✨ ANIMATIONS

| Interaction | Animation |
|-------------|-----------|
| Tab switch | Underline slide |
| Button hover | Background color fade |
| AI suggestion | Fade in + slide |
| Apply/Ignore | Scale + color change |
| Progress bar | Smooth width transition |
| Sidebar toggle | Width transition |

---

## 🎯 DIFFERENCES FROM CURRENT IMPLEMENTATION

| Feature | Current | Reference | Action |
|---------|---------|-----------|--------|
| AI suggestions | Right panel | Inline | **Change** |
| Rollback | Popup | Right panel | **Change** |
| Progress | Bottom only | Header + bottom | **Add header** |
| Daily goal | None | Left sidebar | **Add** |
| Tabs | Vertical | Horizontal scroll | **Change** |
| Icons | Lucide | Material Icons | **Consider** |
| Colors | Slate | Custom dark | **Update** |

---

## ✅ IMPLEMENTATION CHECKLIST

### Header
- [ ] Title input component
- [ ] Progress bar with animation
- [ ] Word count display
- [ ] Share/Publish buttons
- [ ] User avatar

### Left Sidebar
- [ ] Tab component (Manuscript/Format)
- [ ] Draggable chapter list
- [ ] Nested sections
- [ ] Daily goal card

### Center Editor
- [ ] TipTap integration
- [ ] Formatting toolbar
- [ ] **Inline AI suggestion component**
- [ ] Status bar

### Right Panel
- [ ] Horizontal scrollable tabs
- [ ] Rollback history list
- [ ] AI chat interface
- [ ] MCP status

### Polish
- [ ] Material Icons
- [ ] Custom scrollbar
- [ ] Dark mode colors
- [ ] Animations

---

**This is a beautiful, professional reference. Let's implement it!**
