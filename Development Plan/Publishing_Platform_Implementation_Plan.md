# Shothik AI — Publishing & Earning Platform
# Phase-by-Phase Implementation Plan

> Generated: February 22, 2026
> Based on: 30+ specialist research conversations
> Status: Strategic Implementation Blueprint

---

## Table of Contents

1. [Phase 1 — MVP: Submit & Track](#phase-1)
2. [Phase 2 — Royalties & Payouts](#phase-2)
3. [Phase 3 — Automation & Scale](#phase-3)
4. [Phase 4 — Full Earning Platform](#phase-4)
5. [Payout Architecture by Country](#payout-architecture)
6. [Content Review Pipeline](#content-review)
7. [Legal & Compliance Framework](#legal-compliance)
8. [Technical Specifications](#technical-specs)
9. [Risk Matrix & Mitigations](#risk-matrix)
10. [Financial Model](#financial-model)

---

<a name="phase-1"></a>
## Phase 1 — MVP: Submit & Track (4-6 Weeks)

**Goal**: Author can submit a book for publishing and track its status through to publication on Google Play Books.

### Week 1: Foundation

#### Database Schema & Migrations

```sql
-- 1. Author profiles (extends existing users)
CREATE TABLE author_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  pen_name        VARCHAR(200),
  bio             TEXT,
  profile_image   VARCHAR(500),
  payout_method   VARCHAR(20) DEFAULT 'pending',
  payout_account_id VARCHAR(200),
  tax_country     VARCHAR(3),
  tax_id          VARCHAR(100),
  kyc_status      VARCHAR(20) DEFAULT 'pending',
  agreement_version VARCHAR(10),
  agreement_accepted_at TIMESTAMPTZ,
  agreement_ip    VARCHAR(45),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. ISBN pool management
CREATE TABLE isbn_pool (
  isbn            VARCHAR(13) PRIMARY KEY,
  status          VARCHAR(20) DEFAULT 'available',
  assigned_book_id UUID,
  reserved_at     TIMESTAMPTZ,
  assigned_at     TIMESTAMPTZ,
  purchased_batch VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Books
CREATE TABLE books (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES author_profiles(id),
  title           VARCHAR(200) NOT NULL,
  subtitle        VARCHAR(300),
  description     TEXT,
  isbn            VARCHAR(13) REFERENCES isbn_pool(isbn),
  language        VARCHAR(10) DEFAULT 'en',
  category        VARCHAR(100),
  subcategory     VARCHAR(100),
  keywords        JSONB DEFAULT '[]',
  list_price_usd  DECIMAL(10,2),
  currency        VARCHAR(3) DEFAULT 'USD',
  cover_url       VARCHAR(500),
  manuscript_url  VARCHAR(500),
  manuscript_format VARCHAR(10),
  manuscript_size_bytes BIGINT,
  word_count      INTEGER,
  page_count      INTEGER,
  status          VARCHAR(20) DEFAULT 'draft',
  google_play_id  VARCHAR(100),
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_books_author ON books(author_id);
CREATE INDEX idx_books_status ON books(status);

-- 4. Book files (manuscript + cover versions)
CREATE TABLE book_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         UUID NOT NULL REFERENCES books(id),
  file_type       VARCHAR(20) NOT NULL,
  file_url        VARCHAR(500) NOT NULL,
  file_name       VARCHAR(300),
  file_size_bytes BIGINT,
  mime_type       VARCHAR(100),
  version         INTEGER DEFAULT 1,
  validation_status VARCHAR(20) DEFAULT 'pending',
  validation_errors JSONB,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Publishing queue
CREATE TABLE publishing_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         UUID NOT NULL REFERENCES books(id),
  submitted_by    UUID NOT NULL,
  reviewer_id     UUID,
  status          VARCHAR(20) DEFAULT 'pending',
  priority        INTEGER DEFAULT 0,
  automated_checks JSONB,
  review_checklist JSONB,
  review_notes    TEXT,
  rejection_reason TEXT,
  rejection_category VARCHAR(50),
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  review_started_at TIMESTAMPTZ,
  reviewed_at     TIMESTAMPTZ,
  uploaded_at     TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  legal_deposit_sent BOOLEAN DEFAULT FALSE,
  legal_deposit_date TIMESTAMPTZ
);

CREATE INDEX idx_queue_status ON publishing_queue(status);
CREATE INDEX idx_queue_submitted ON publishing_queue(submitted_at);
```

#### Backend API Endpoints (Week 1)

```
POST   /api/v1/author/profile          — Create/update author profile
GET    /api/v1/author/profile           — Get current author profile
POST   /api/v1/books                    — Create book draft
PUT    /api/v1/books/:id                — Update book metadata
GET    /api/v1/books/:id                — Get book details
GET    /api/v1/books                    — List author's books
DELETE /api/v1/books/:id                — Delete draft book
POST   /api/v1/books/:id/manuscript     — Upload manuscript file
POST   /api/v1/books/:id/cover          — Upload cover image
```

### Week 2: Submission Wizard UI

#### 6-Step Publishing Wizard

**Step 1 — Manuscript Upload**
- Drag-and-drop upload zone
- Accepted formats: ePub (.epub), PDF (.pdf)
- Max file size: 300MB (soft limit; Google allows 2GB)
- Client-side validation: file type, size
- Server-side validation: ePub structure (via epubchecker npm package)
- Progress bar during upload

**Step 2 — Metadata Form**
- Title (required, 3-200 characters)
- Subtitle (optional, max 300 characters)
- Description/Blurb (required, 50-4000 characters) with AI Assist button
- Language selector (English, Bengali, Hindi, Urdu, etc.)
- Primary Category (BISAC subject headings dropdown)
- Secondary Category (optional)
- Keywords (3-7 required, tag input)

**Step 3 — Cover Upload**
- Accepted formats: JPEG, PNG, TIFF
- Minimum dimensions: 1600 x 2400 px
- Aspect ratio: ~2:3 (portrait)
- Max file size: 50MB
- Real-time dimension/resolution validation

**Step 4 — Pricing & Royalty Calculator**
- List price input (USD, with currency toggle)
- Minimum price: $0.99
- Interactive royalty calculator showing 3-way split
- Monthly earnings projector

**Step 5 — Agreement Acceptance**
- Full publishing agreement (scrollable)
- Scroll-to-bottom required before checkbox enabled
- Type full name (lightweight digital signature)

**Step 6 — Review & Submit**
- Summary card showing all entered information
- "Submit for Review" button with confirmation modal

#### Component Architecture

```
src/components/tools/writing-studio/workspace/
├── PublishView.jsx              (updated — add wizard wrapper)
├── publish/
│   ├── PublishWizard.jsx        (step controller, shared state)
│   ├── ManuscriptUpload.jsx     (Step 1)
│   ├── MetadataForm.jsx         (Step 2)
│   ├── CoverUpload.jsx          (Step 3)
│   ├── PricingCalculator.jsx    (Step 4)
│   ├── AgreementAcceptance.jsx  (Step 5)
│   ├── ReviewSubmit.jsx         (Step 6)
│   ├── StatusTracker.jsx        (post-submission tracker)
│   └── AuthorDashboard.jsx      (my books + stats)
```

### Week 3: Review Pipeline & Admin

#### Automated Pre-Review Checks

| Check | Tool/Method | Pass Criteria |
|-------|-------------|---------------|
| ePub validation | epubchecker npm | 0 errors |
| File size | Server-side | < 300MB |
| Cover dimensions | sharp npm | Min 1600px height |
| Cover format | sharp npm | JPEG/PNG/TIFF |
| Metadata completeness | Custom | All required fields |
| Word count | Custom | Min 5,000 words |
| Language detection | franc npm | Matches declared |
| Plagiarism score | Shothik API | < 15% similarity |
| AI detection score | Shothik API | Informational |

#### Google Play Upload Workflow (Manual — MVP)

1. Admin approves book in Shothik dashboard
2. Admin assigns ISBN from pool (auto-suggested)
3. Admin downloads manuscript + cover files
4. Admin logs into Google Play Books Partner Center
5. Admin creates new book entry with all metadata
6. Admin submits for Google review
7. Admin copies Google Play Book ID back to Shothik
8. Admin marks as "uploaded" then "published"
9. System triggers legal deposit tracking

### Week 4: Status Tracker & Polish

#### Publishing Status Tracker UI

```
[Draft] → [Submitted] → [In Review] → [Approved] → [Publishing] → [Live]
                                           ↓
                                       [Rejected] → [Resubmit]
```

- Each stage shows timestamp and description
- Current stage highlighted with pulse animation
- Status polling: every 60 seconds
- Email + in-app notifications on status changes

### Phase 1 Business Prerequisites

- [ ] Purchase 10 ISBNs from Nielsen UK (~£149)
- [ ] Set up Google Play Books Partner Center account
- [ ] Draft Author-Publisher Agreement (legal review)
- [ ] Set up UK bank account for Google payments
- [ ] Create internal SOP for manual uploads
- [ ] Define content review guidelines

---

<a name="phase-2"></a>
## Phase 2 — Royalties & Payouts (4-6 Weeks)

**Goal**: Authors earn money from book sales and can withdraw earnings.

### Database Schema Extensions

```sql
-- 6. Sales transactions (imported from Google reports)
CREATE TABLE sales_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         UUID NOT NULL REFERENCES books(id),
  author_id       UUID NOT NULL REFERENCES author_profiles(id),
  store           VARCHAR(30) DEFAULT 'google_play',
  sale_date       DATE NOT NULL,
  quantity        INTEGER DEFAULT 1,
  list_price      DECIMAL(10,2),
  currency        VARCHAR(3),
  google_revenue  DECIMAL(10,2),
  country_code    VARCHAR(3),
  transaction_type VARCHAR(20) DEFAULT 'sale',
  report_period   VARCHAR(7),
  external_tx_id  VARCHAR(200),
  import_batch_id UUID,
  dedup_hash      VARCHAR(64),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dedup_hash)
);

-- 7. Royalty ledger
CREATE TABLE royalty_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES author_profiles(id),
  book_id         UUID REFERENCES books(id),
  sale_id         UUID REFERENCES sales_transactions(id),
  entry_type      VARCHAR(20) NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'USD',
  description     TEXT,
  period          VARCHAR(7),
  status          VARCHAR(20) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Payout requests & history
CREATE TABLE payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES author_profiles(id),
  amount          DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL,
  fx_rate         DECIMAL(12,6),
  fx_source       VARCHAR(50),
  payout_method   VARCHAR(20) NOT NULL,
  external_transfer_id VARCHAR(200),
  status          VARCHAR(20) DEFAULT 'requested',
  period_start    DATE,
  period_end      DATE,
  statement_url   VARCHAR(500),
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  approved_at     TIMESTAMPTZ,
  initiated_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failure_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Royalty Calculation Engine

> **Note**: Google Play Books typically pays publishers 70% of the list price for most pricing tiers and territories, but this rate may vary by region, pricing model, and special promotions. Always verify current rates in the Google Play Books Partner Center. ISBNs are optional for ebook distribution on Google Play but required if Shothik acts as publisher of record. The rates below are estimates — actual splits should be reconciled against Google's monthly sales reports.

```
Per sale (standard 70/30 split):
  google_revenue = list_price x 0.70
  commission = google_revenue x 0.15 (or 0.10 for promo tier)
  net_royalty = google_revenue - commission
  
Monthly:
  10% reserve holdback for 60 days (returns/chargebacks)
  Release reserves from 2 months ago
  
Available balance = sum of all ledger entries
```

### Earnings Dashboard Components

- Stats cards: Total Earned, This Month, Pending, Available
- Sales chart (Recharts): Line/bar, monthly, per-book, multi-currency toggle
- Book performance table
- Payout history with statement downloads

### Payout Settings

| Country | Primary Rail | Fallback | Min Payout |
|---------|-------------|----------|------------|
| Bangladesh | Payoneer → Bank/bKash | Wise (personal) | $20 |
| India | Stripe Connect Express | Payoneer | $25 |
| Pakistan | Payoneer → Bank | Wise | $50 |
| UK | Stripe Connect Express | Bank transfer | £20 |
| Other | Payoneer | Wise | $50 |

### Phase 2 Business Prerequisites

- [ ] Set up Stripe Connect platform account (UK)
- [ ] Set up Payoneer Enterprise 360 account
- [ ] Set up Wise Business account
- [ ] Define commission rates (15% standard, 10% promo)
- [ ] Legal review of payout terms

---

<a name="phase-3"></a>
## Phase 3 — Automation & Scale (6-8 Weeks)

**Goal**: Automate publishing pipeline and expand to multiple bookstores.

### ONIX 3.0 Feed Generation

- Generate ONIX XML from books database
- Full feed weekly, delta feed daily
- Validate against EDItEUR XSD schema
- Host on HTTPS with basic auth for Google ingestion
- ONIX 3.0 uses Product, DescriptiveDetail, CollateralDetail, PublishingDetail, ProductSupply sections

### PublishDrive API Integration

- $99/month Pro plan for API access
- Distribute to 400+ stores: Apple Books, Kobo, B&N, OverDrive
- Per-store pricing and territory settings
- Automated sales report pull

### Multi-Store Distribution UI

- Store selection checkboxes per book
- Per-store pricing overrides
- Per-store status tracking (pending/live/failed)
- Revenue aggregation across stores

### KYC Verification Flow

| Country | ID Required | Method |
|---------|-------------|--------|
| Bangladesh | NID or Passport | Manual review (MVP) |
| India | PAN + Aadhaar | Stripe Identity |
| Pakistan | CNIC or Passport | Manual review |
| UK | Passport or License | Stripe Identity |

### Legal Deposit Automation

- Track per-book British Library submission
- Generate submission package (file + metadata)
- Monitor ALDL requests from 5 additional libraries

### Author Public Profile Pages

- URL: shothik.ai/authors/{pen-name}
- Author photo, bio, book catalog, social links
- SEO: Schema.org structured data

---

<a name="phase-4"></a>
## Phase 4 — Full Earning Platform (12-18 Months)

### Quarter 1: Print-on-Demand & Audiobooks

#### IngramSpark POD
- No public API — web portal + spreadsheet bulk upload
- Separate print ISBN required
- Spine width calculator: (page_count x 0.0025) + 0.015 for perfect bound
- Cover template: CMYK PDF, 0.125" bleed all sides, 200+ PPI

#### Audiobooks
- Google Play auto-narration (beta, low cost)
- Premium AI TTS (ElevenLabs, Google Cloud TTS)
- 2400 x 2400 px cover (1:1 ratio)
- Separate ISBN required

### Quarter 2: Community & AI Marketing

- Author leaderboards, writing challenges, peer review
- AI blurb generator, keyword optimizer, ad copy generator
- Social media post generation for book launches

### Quarter 3: Direct Sales Storefront

- Shothik's own ebook store (75% author royalty vs 59.5% via Google)
- Stripe checkout, DRM-free downloads, read-in-browser
- Regional payments: Razorpay (India), bKash (Bangladesh)

### Quarter 4: Subscription & International

- "Shothik Unlimited" monthly reading subscription
- Per-page-read royalty model
- University partnerships and bulk licensing
- Market expansion: Bangladesh, India, Pakistan, Sri Lanka, Nepal

---

<a name="payout-architecture"></a>
## Payout Architecture by Country

### FX Conversion Strategy

```
Google pays Shothik UK in GBP
  → Shothik ledger records in USD (base currency)
  → GBP → USD conversion at daily mid-market rate
  → At payout time: USD → author's local currency
  → Record: fx_rate, fx_source, converted_amount
```

### Payoneer Integration (Bangladesh Primary)

```
1. Shothik signs up for Payoneer Enterprise 360
2. Integration:
   POST /register-payee     — Register author with bank/bKash
   POST /fund-transfer      — Initiate payout (USD → BDT automatic)
   GET  /payment-status     — Track completion
3. Author receives in bank account or bKash
4. bKash: instant, 7 Taka per 1,000 BDT fee
```

### Key Limitations

- Bangladesh: Stripe NOT supported; Wise BDT is personal-only
- India: Stripe Connect Express works for cross-border payouts only
- Payoneer: Supports bank + bKash in Bangladesh with Mass Payout API

---

<a name="content-review"></a>
## Content Review Pipeline

### Automated Gate (Before Human Review)

1. Technical: ePub/PDF valid, file size, cover dimensions, metadata complete
2. Content: Plagiarism < 15%, no prohibited keywords, AI detection (informational)
3. If all pass → Human review queue
4. If any fail → Auto-rejection with specific reasons

### Human Review (~15-20 min per book)

- Content follows Google Play policies
- No copyright infringement
- Cover is professional quality
- Description accurate and not misleading
- Academic citations proper (if STEM)
- Pricing reasonable

### Scaling

| Volume | Approach |
|--------|----------|
| 1-10/week | Founder reviews |
| 10-50/week | Part-time reviewer |
| 50-100/week | Full-time + automation |
| 100-500/week | Tiered: auto-pass trusted authors |
| 500+/week | Risk scoring, ML-assisted |

### Takedown Process

1. Immediately remove from all stores (within 24h)
2. Notify author with complaint copy
3. Author has 14 days for counter-notice
4. If no counter-notice: permanent removal
5. Full audit trail maintained

---

<a name="legal-compliance"></a>
## Legal & Compliance Framework

### Author-Publisher Agreement Key Terms

- Non-exclusive worldwide digital license
- 15% commission (85% to author)
- Monthly payouts with minimum threshold
- Author warranties: original work, no plagiarism
- 30-day termination notice either party
- ISBNs remain Shothik property
- Author indemnifies against content claims

### UK Company Obligations

| Obligation | Frequency |
|-----------|-----------|
| Legal deposit (British Library) | Per book, within 1 month |
| VAT returns | Quarterly |
| Corporation tax | Annual |
| Companies House filing | Annual |
| GDPR compliance | Ongoing |
| AML/KYC | Per author, before first payout |

---

<a name="technical-specs"></a>
## Technical Specifications

### File Requirements

| File | Format | Max Size | Min Dimensions |
|------|--------|----------|----------------|
| Manuscript | ePub 2/3, PDF | 300MB | N/A |
| Cover | JPEG, PNG, TIFF | 50MB | 1600 x 2400 px |
| Audiobook cover | JPEG, PNG | 50MB | 2400 x 2400 px |
| Print cover | PDF (CMYK) | 100MB | Trim + bleed |

### Third-Party Service Costs

| Service | Cost | Purpose |
|---------|------|---------|
| Nielsen ISBNs | £149 per 10 | ISBN allocation |
| PublishDrive Pro | $99/month | Multi-store API |
| Stripe Connect | £2/active account/month | Payouts |
| Payoneer Enterprise | Contact sales | Bangladesh payouts |
| Wise Business | Transfer fees only | Fallback |
| Google Play Partner | Free | Primary store |

---

<a name="risk-matrix"></a>
## Risk Matrix

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google suspends publisher account | Critical | Content review pipeline; diversify stores |
| Bangladesh payout failure | High | Multiple rails (Payoneer + Wise + manual) |
| Copyright infringement claim | High | Plagiarism checks; DMCA process |
| Low author adoption | Medium | University partnerships; incentives |
| FX rate losses | Medium | Convert at payout time; USD base ledger |
| AI-generated spam books | Medium | AI detection; quality review; rate limits |
| Review bottleneck at scale | Medium | Automation; trusted author fast-track |

---

<a name="financial-model"></a>
## Financial Model

### Year 1 Projections (Conservative)

| Month | Enterprise Subs | Books | Commission | Sub Revenue | Total |
|-------|----------------|-------|------------|-------------|-------|
| 3 | 50 | 20 | $10 | $1,250 | $1,260 |
| 6 | 150 | 80 | $67 | $3,750 | $3,817 |
| 9 | 300 | 180 | $189 | $7,500 | $7,689 |
| 12 | 500 | 300 | $378 | $12,500 | $12,878 |

### Break-Even Analysis

| Phase | Monthly Costs | Required Subs | Timeline |
|-------|--------------|---------------|----------|
| Phase 1 | $20 | 1 | Month 1 |
| Phase 2 | $570 | 23 | Month 2-3 |
| Phase 3 | $2,170 | 87 | Month 4-6 |
| Full | $4,000 | 160 | Month 6-9 |

### 3-Year Revenue Target

| Year | Subs | Books | Commission | Sub Revenue | Total |
|------|------|-------|------------|-------------|-------|
| 1 | 500 | 300 | $4,536 | $150,000 | $154,536 |
| 2 | 2,000 | 2,000 | $50,400 | $600,000 | $650,400 |
| 3 | 5,000 | 8,000 | $336,000 | $1,500,000 | $1,836,000 |

---

## Critical Path Summary

```
IMMEDIATE: ISBNs, Google Partner Center, Author Agreement, Phase 1 dev
MONTH 1-2: Publishing Wizard + Review Pipeline + Status Tracker
MONTH 2-4: Royalty Engine + Payoneer/Stripe + Earnings Dashboard
MONTH 4-6: ONIX automation + PublishDrive + Analytics
MONTH 7-18: POD + Audiobooks + Direct Store + Subscription
```
