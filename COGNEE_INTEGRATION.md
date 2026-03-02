# Cognee Memory Integration

**Status:** Implemented  
**Purpose:** Persistent, relational AI memory for Shothik agents

---

## What is Cognee?

Cognee is a knowledge engine that creates **persistent AI memory** using:
- **Vector search** - Semantic similarity
- **Graph database** - Relational connections
- **Self-improvement** - Learns what matters

Unlike simple vector search, Cognee remembers **relationships** and **context**.

---

## Implementation

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/memory` | POST | Add memory |
| `/api/memory` | GET | Search memory |
| `/api/memory` | PUT | Build knowledge graph |

### Database Schema

```typescript
memories: {
  userId: string,
  text: string,
  type: 'conversation' | 'research' | 'writing',
  metadata: any,
  cogneeId: string, // Reference to Cognee graph
  createdAt: number
}
```

### React Hook

```typescript
const { addMemory, searchMemory, cognify } = useCogneeMemory();

// Add memory
await addMemory("User prefers academic tone", "preference");

// Search with relationships
const results = await searchMemory("What does user prefer?");

// Build knowledge graph
await cognify();
```

---

## Use Cases in Shothik

### 1. Research Agent Memory
```typescript
// Remember research patterns
await addMemory(
  "User researched AI safety 5 times, prefers papers over blogs",
  "research_pattern"
);

// Later: "What should I research?"
// Cognee: "Based on your history, you might like..."
```

### 2. Writing Style Memory
```typescript
// Learn user's writing style
await addMemory("User writes short paragraphs, academic tone", "writing_style");

// AI suggestions adapt automatically
```

### 3. Cross-Project Insights
```typescript
// Connect related projects
Project A: "Climate change research"
Project B: "Renewable energy"

Cognee connection: "These topics are related via..."
```

---

## Setup

### 1. Install Cognee
```bash
pip install cognee
```

### 2. Environment Variables
```bash
COGNEE_API_URL=http://localhost:8000
COGNEE_API_KEY=your_key
```

### 3. Run Cognee Server
```bash
cognee-server start
```

---

## Benefits

| Feature | Benefit |
|---------|---------|
| Persistent Memory | Agents remember across sessions |
| Relational Recall | Connections between ideas |
| Self-Improving | Learns what matters to user |
| Weighted Memory | Important info prioritized |
| Auto-Pruning | Removes useless info |

---

## Next Steps

1. Deploy Cognee server
2. Connect to Research Agent
3. Enable memory in Writing Studio
4. Monitor memory usage

---

**Cognee memory is now integrated into Shothik!**
