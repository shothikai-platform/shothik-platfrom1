# Shothik Plagiarism Checker - Analysis Report

## Repository: shothikai/shothik-plagiarism

**Analysis Date:** February 15, 2026
**Language:** TypeScript
**Branch:** main-ts
**Repo Size:** 7,235 KB

---

## 1. Architecture Overview

The system uses an **MVC + Service Layer + LangGraph Multi-Agent** architecture built on Node.js/TypeScript.

### Core Components

| Component | Technology | Purpose |
|---|---|---|
| Multi-Agent Workflow | LangGraph | 7 specialized agents for plagiarism pipeline |
| AI Search | Gemini Grounding API | Web-based source discovery |
| Vector Store | ChromaDB | Local cache for previously analyzed content |
| Content Fetching | Axios + Cheerio | Web scraping and academic content extraction |
| PDF Processing | Node.js Engine | Extract text from uploaded PDFs |
| Authentication | JWT | API access control |
| Storage | Google Cloud Storage | File storage for uploads |
| Database | MongoDB | Data persistence |

### LangGraph Agents (7-Stage Pipeline)

1. **Initialize Agent** - Sets up analysis state and validates input
2. **Chunk Agent** - Splits text into analyzable segments (sentence/paragraph/words strategy)
3. **Search Agent** - Generates Quillbot-style multi-queries and searches via Gemini Grounding
4. **Fetch Agent** - Retrieves content from discovered source URLs (up to 20 per source)
5. **Analysis Agent** - Compares chunks against fetched content for similarity
6. **Route Agent** - Decides whether to process next chunk or terminate early (on high plagiarism)
7. **Report Agent** - Generates the final plagiarism report

---

## 2. Plagiarism Detection Methods

### Exact Match Detection
- Direct string comparison between input text chunks and fetched source content
- N-gram extraction for identifying copied phrases
- Named entity matching for proper nouns and specific terms

### Paraphrase Detection
- **Quillbot-style Multi-Query Generation:** For each text chunk, the system generates up to 8 variant search queries including:
  - N-grams (5-10 word phrases)
  - Named entities
  - Key phrases from sentences containing important words
  - Date/number extraction
  - Original chunk as fallback
- **Gemini Grounding API:** Searches the web for semantically similar content
- **Semantic Similarity:** Uses Gemini embeddings for vector-based similarity comparison

### Similarity Scoring
- **Threshold:** Default 0.5 (50%) for flagging
- **Categories:**
  - Acceptable (below threshold)
  - Needs Review (moderate similarity)
  - Requires Action (high similarity)
- **Early Termination:** If high plagiarism (>=90%) is detected early, remaining chunks can be skipped

---

## 3. Text Chunking Strategies

| Strategy | Description | Default |
|---|---|---|
| `sentence` | Splits by sentence boundaries | No |
| `paragraph` | Splits by paragraph breaks | No |
| `words` | Splits by word count (default: 300 words/chunk) | Yes (LangGraph) |

---

## 4. Vector Service ("The First Gate")

- Uses **ChromaDB** with Gemini embeddings
- Acts as a cache layer - checks previously analyzed content first
- **V1 Performance:** ~45 seconds per analysis
- **V2 Target:** <1 second for duplicate/cached content
- Stores document vectors with metadata for rapid retrieval

---

## 5. Content Fetching & Academic Support

### Academic Content Selectors
The ContentFetcher includes specialized CSS selectors for academic websites:
- `.article-body`
- `.abstract`
- `.full-text`

### Fetching Strategy
- Aggressive fetching: up to 20 URLs per source
- Content caching to avoid redundant requests
- Main content area detection for cleaner extraction

---

## 6. Credit System

| Analysis Type | Multiplier | Use Case |
|---|---|---|
| Basic | 0.5x | Quick scan |
| Full | 1.0x | Standard analysis |
| Deep | 1.5x | Thorough investigation |

Credits calculated as: `base_credits + (chars / 1000) * per_1000_rate * multiplier`
Minimum: 1 credit per analysis

---

## 7. API Endpoints

### Plagiarism Service
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/plagiarism/analyze` | Analyze text for plagiarism |
| GET | `/api/plagiarism/workflow/graph` | Get workflow visualization |
| GET | `/api/plagiarism/workflow/stats` | Get agent statistics |
| GET | `/api/plagiarism/workflow/compare` | Compare detection approaches |

### Vector Service
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/ingest` | Upload and vectorize a document |
| GET | `/api/v1/ingest` | List ingested vector data |
| PUT | `/api/v1/ingest/:id` | Update metadata |
| DELETE | `/api/v1/ingest` | Delete ingested data |
| POST | `/api/v1/search` | Search for similar text |

### Admin Endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/gcs/files` | List GCS files |
| POST | `/admin/gcs/files/public` | Make all GCS files public |
| DELETE | `/admin/gcs/files/:filename` | Delete GCS file |
| GET | `/admin/chroma/collections` | List Chroma collections |
| DELETE | `/admin/chroma/collections/:name` | Delete collection |

---

## 8. STEAM Readiness Assessment

### Current Capabilities for STEAM Users

| Capability | Status | Notes |
|---|---|---|
| Web source detection | Working | Via Gemini Grounding API |
| Paraphrase detection | Working | Multi-query + semantic similarity |
| Exact match detection | Working | N-gram and string matching |
| PDF upload support | Working | Node.js PDF engine |
| Academic content extraction | Partial | CSS selectors for .article-body, .abstract |
| Vector caching | Working | ChromaDB-based |
| Credit-based billing | Working | 3-tier analysis system |

### Gaps for Journal Publishing & Research Papers

| Gap | Impact | Priority | Details |
|---|---|---|---|
| No Academic DB Integration | Cannot search arXiv, PubMed, CORE, OpenAlex | HIGH | Planned for v2.0 but not started |
| No Citation-Aware Analysis | Properly cited content flagged as plagiarism | HIGH | Critical for academic integrity tools |
| No Bibliography Exclusion | Reference lists inflate plagiarism scores | HIGH | Common feature in Turnitin/iThenticate |
| No Formula/Equation Handling | STEM papers with LaTeX poorly analyzed | MEDIUM | Math formulas treated as regular text |
| No Code Block Detection | CS/Engineering papers show false positives | MEDIUM | Code snippets need separate handling |
| No Multi-Language Support | International journals not supported | MEDIUM | Only English content properly analyzed |
| No Discipline-Specific Thresholds | Same threshold for all fields | LOW | Arts vs Medical papers have different norms |

---

## 9. Security Audit Findings (QA Report Jan 2026)

**Overall Status: NOT Production Ready**

### Critical Failures
| Issue | Severity | Description |
|---|---|---|
| JWT Bypass | CRITICAL | Authentication can be bypassed; `jwt.decode` fallback allows unsigned tokens |
| Hardcoded Secrets | CRITICAL | Secret keys present in source code |
| Unprotected Vector API | CRITICAL | `/api/vector/*` routes have no authentication |
| CORS Misconfiguration | CRITICAL | Allows requests from any origin |
| Public Admin Access | CRITICAL | Admin endpoints exposed without protection |

### High Risk Issues
| Issue | Severity | Description |
|---|---|---|
| No Input Validation | HIGH | Missing zod/joi validation on POST endpoints |
| Memory Bomb Risk | HIGH | Multer uses memoryStorage; large PDFs can cause OOM |
| Unbounded Parallelism | HIGH | Search/fetch agents can exhaust API rate limits |

### Medium Risk Issues
| Issue | Severity | Description |
|---|---|---|
| Orphaned Records | MEDIUM | Database records not cleaned up properly |
| Unbounded Documents | MEDIUM | No limits on document sizes in MongoDB |
| Console.log Logging | MEDIUM | No structured logging framework |
| No Health Checks | MEDIUM | No dependency health monitoring |

---

## 10. V2.0 Roadmap (All Pending)

| Task | Category | Status |
|---|---|---|
| Design Architecture V2 | Architecture | Pending |
| Feature Spec V2 | Planning | Pending |
| Bug Mitigation | Quality | Pending |
| Technical Review | Quality | Pending |
| Provision Infrastructure | DevOps | Pending |
| PM Clarification | Planning | Pending |
| Academic DB Connectors (arXiv, PubMed, CORE, OpenAlex) | Feature | Pending |
| License Filter (CC-BY/CC-0) | Legal | Pending |
| Safe PDF Extraction | Feature | Pending |
| Background Academic Content Worker | Feature | Pending |
| Vector Service 2.0 (<1s response) | Performance | Pending |

---

## 11. Recommendations

### Immediate Priorities (Before Production)
1. **Fix JWT authentication** - Rewrite auth middleware to strictly reject invalid tokens
2. **Protect all routes** - Apply auth middleware to vector and admin APIs
3. **Fix CORS** - Restrict to specific allowed origins
4. **Add input validation** - Implement zod middleware on all POST endpoints
5. **Switch multer to disk storage** - Prevent memory exhaustion on large uploads

### For STEAM / Academic Users
6. **Add citation-aware analysis** - Detect and exclude properly cited content
7. **Implement bibliography exclusion** - Auto-detect reference sections
8. **Integrate academic databases** - arXiv, PubMed, CORE, OpenAlex APIs
9. **Add LaTeX/formula handling** - Parse and exclude mathematical expressions
10. **Add code block detection** - Identify and handle source code separately

### For Journal Publishing Standards
11. **Generate Turnitin-style reports** - Color-coded source matching with percentages
12. **Add discipline-specific thresholds** - Configurable per journal/field
13. **Support batch processing** - Multiple paper submissions at once
14. **Add reviewer dashboard** - For editorial teams to review results
15. **Implement audit trail** - Track all checks for compliance

---

## 12. Conclusion

The Shothik Plagiarism Checker has a strong foundation with its LangGraph multi-agent architecture and Gemini-powered detection. The Quillbot-style multi-query search is well-designed for catching paraphrased content. However, for serving STEAM users in journal publishing and research paper contexts, the system requires:

1. **Security hardening** before any production deployment
2. **Academic database integrations** for comprehensive source coverage
3. **Citation-aware analysis** to avoid false positives on properly cited content
4. **Discipline-specific features** (LaTeX, code blocks, bibliography exclusion)

The v2.0 roadmap addresses many of these gaps, but implementation has not yet begun. Once these improvements are in place, the tool can be a competitive alternative to established players like Turnitin and iThenticate for the STEM + Medical academic community.

---

## Related Documents

- **[Strategic Roadmap & Development Plan](../Development%20Plan/Strategic_Roadmap.md)** — 22-agent strategic panel discussion, competitive analysis vs QuillBot, revised multi-agent architecture (14 agents), phased development roadmap, go-to-market strategy, and pricing model.
- **Panel Verdict:** 13 Bullish / 6 Neutral / 3 Bearish — PROCEED WITH STRATEGIC PIVOTS
- **Key Pivot:** Focus on STEM + Medical (drop Arts), launch in South Asia first, fix security before any deployment, build citation-aware analysis as core differentiator.
