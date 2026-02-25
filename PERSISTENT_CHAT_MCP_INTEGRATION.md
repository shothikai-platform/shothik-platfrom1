# Persistent Chat Panel + MCP E-book Integration

**Date:** February 25, 2026  
**Status:** Complete  
**Design:** Replit-like persistent chat

---

## 🎯 WHAT WAS IMPLEMENTED

### 1. Persistent Chat Panel (Like Replit)

**Location:** Bottom of screen, always accessible

```
┌─────────────────────────────────────────────────────────────┐
│  Main Editor Area                                           │
│                                                             │
│  [Your writing here...]                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤  ← Resizable
│  ↕️ Resize Handle                                           │
├─────────────────────────────────────────────────────────────┤
│  💬 Writing Assistant                              [▼] [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👋 I'm your writing assistant. I can help you:            │
│     • Analyze your writing                                  │
│     • Suggest improvements                                  │
│     • Chat with EPUB/PDF files (via MCP)                   │
│                                                             │
│  U: What do you think of Chapter 3?                        │
│  AI: Chapter 3 has strong character development...         │
│                                                             │
│  [📎 manuscript.epub] [📎 research.pdf]                    │
│                                                             │
│  [+] [Type message...                ] [Send]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Always visible (like Replit Assistant)
- ✅ Resizable height (drag handle)
- ✅ Collapsible (chevron button)
- ✅ File attachments (EPUB/PDF)
- ✅ Chat history
- ✅ MCP-ready for E-book processing

---

### 2. MCP E-book Integration

**Based on:** https://github.com/onebirdrocks/ebook-mcp

**Supported Operations:**

| Tool | Description | Use Case |
|------|-------------|----------|
| `list_books` | List EPUB/PDF files | "Show my books" |
| `extract_metadata` | Get title, author, etc. | "Tell me about this book" |
| `extract_toc` | Get table of contents | "What's in this book?" |
| `extract_chapter` | Get specific chapter | "Show me Chapter 3" |
| `search_book` | Search within book | "Find sections about love" |
| `summarize_book` | Generate summary | "Summarize this book" |
| `extract_pages` | Get PDF pages | "Pages 10-20" |
| `convert_book` | Convert formats | "Convert to PDF" |

**Example Chat Interactions:**

```
User: What books do I have?
AI: [Uses list_books] You have 5 books:
   - novel.epub
   - research.pdf
   - ...

User: Tell me about novel.epub
AI: [Uses extract_metadata]
   Title: The Great Novel
   Author: Jane Doe
   Chapters: 12

User: What's in Chapter 3?
AI: [Uses extract_chapter]
   Chapter 3: The Conflict
   [Content...]

User: Find mentions of "protagonist"
AI: [Uses search_book]
   Found 15 mentions:
   - Page 12: "The protagonist woke up..."
   - Page 45: ...
```

---

### 3. UI Integration

**WriteViewEnhanced Changes:**

```tsx
// Added imports
import { PersistentChatPanel, ChatToggleButton } from '../chat/PersistentChatPanel';

// Chat is open by default
const [chatOpen, setChatOpen] = useState(true);

// In render:
<>
  {/* Main content */}
  
  {/* Persistent Chat - Always at bottom */}
  <PersistentChatPanel 
    isOpen={chatOpen}
    onToggle={() => setChatOpen(!chatOpen)}
  />
  
  {/* Toggle button when closed */}
  {!chatOpen && <ChatToggleButton onClick={() => setChatOpen(true)} />}
</>
```

---

## 📁 FILES CREATED

```
apps/web/
├── components/writing-studio/
│   ├── chat/
│   │   ├── PersistentChatPanel.tsx  # Main chat component
│   │   └── index.ts
│   └── workspace/
│       └── WriteViewEnhanced.tsx    # Updated with chat
│
└── lib/mcp/
│   └── EbookMCP.ts                  # MCP integration
│
└── lib/nobel-engine/                # (from previous)
    ├── FormatAgent.ts
    ├── NeuralCouplingEngine.ts
    ├── EnneagramEngine.ts
    ├── NobelImpactEngine.ts
    └── index.ts
```

---

## 🔧 MCP SERVER SETUP

### 1. Install Ebook-MCP Server

```bash
# Clone the repository
git clone https://github.com/onebirdrocks/ebook-mcp.git
cd ebook-mcp

# Install dependencies
npm install

# Start the server
npm start
# Server runs on http://localhost:3001
```

### 2. Configure Shothik

```typescript
// In your config
const MCP_SERVER_URL = 'http://localhost:3001';

// The client will connect to this URL
```

### 3. Environment Variables

```bash
# .env.local
MCP_SERVER_URL=http://localhost:3001
EBOOKS_DIRECTORY=~/Books
```

---

## 💬 CHAT FEATURES

### Message Types

| Type | Description |
|------|-------------|
| **System** | Welcome message, tips |
| **User** | Your questions/requests |
| **Assistant** | AI responses |

### File Attachments

```
User clicks [+] → Select EPUB/PDF
→ File appears as attachment chip
→ Sent with message to AI
→ AI uses MCP tools to analyze
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `Esc` | Close chat |

---

## 🎨 DESIGN PRINCIPLES

### Non-Breaking Changes
- ✅ Existing UI unchanged
- ✅ Chat is additive feature
- ✅ Can be collapsed/minimized
- ✅ Doesn't interfere with writing

### Replit-Inspired
- ✅ Persistent (always there)
- ✅ Resizable
- ✅ Clean, minimal design
- ✅ Keyboard-friendly

### MCP-Ready
- ✅ Tool definitions ready
- ✅ Client implementation
- ✅ LLM context builder
- ✅ Easy to connect

---

## 🚀 USAGE

### Basic Chat
```
1. Type message in chat input
2. Press Enter
3. AI responds with analysis
```

### With File Attachment
```
1. Click [+] button
2. Select EPUB or PDF
3. Type question about file
4. AI uses MCP to analyze
```

### Resize Panel
```
1. Drag handle (↕️) up/down
2. Panel resizes smoothly
3. Height persists (optional)
```

---

## 🔮 FUTURE ENHANCEMENTS

1. **Real MCP Connection**
   - Connect to actual Ebook-MCP server
   - Handle real file operations

2. **More File Types**
   - DOCX support
   - TXT support
   - Markdown support

3. **Smart Suggestions**
   - Context-aware prompts
   - Writing tips
   - Auto-complete

4. **Collaboration**
   - Multi-user chat
   - Comments on text
   - Shared annotations

---

## ✅ SUMMARY

**Implemented:**
- ✅ Persistent chat panel (Replit-style)
- ✅ Resizable height
- ✅ File attachments (EPUB/PDF)
- ✅ MCP integration structure
- ✅ Non-breaking UI changes

**Ready for:**
- 🔄 MCP server connection
- 🔄 Real file processing
- 🔄 AI integration

**Files:**
- `PersistentChatPanel.tsx` - Main component
- `EbookMCP.ts` - MCP integration
- `WriteViewEnhanced.tsx` - Updated view

---

**Chat panel is now persistent and MCP-ready!**
