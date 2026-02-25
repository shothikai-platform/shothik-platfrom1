# Shothik AI — Publishing & Earning Platform Research

> Research Date: February 22, 2026
> Status: Strategic Planning Phase

---

## Executive Summary

Shothik AI can transform from a writing tool into a **full earning platform** by leveraging its UK-registered company to publish books on behalf of authors to Google Play Books (and eventually other stores). The UK company acts as the publisher of record, receives revenue from Google, takes a commission, and pays authors royalties. This creates a recurring revenue stream beyond subscriptions and positions Shothik as the first South/Southeast Asian AI-powered publishing platform.

---

## 1. Business Model

### How It Works

```
Author writes book in Writing Studio (Enterprise plan, $25/mo)
        ↓
Author submits for publishing (metadata, cover, manuscript, pricing)
        ↓
Shothik UK reviews & uploads to Google Play Books Partner Center
        ↓
Book goes live on Google Play Books (60+ countries, 12+ markets)
        ↓
Google pays Shothik UK 70% of list price monthly
        ↓
Shothik keeps 15% commission, pays 85% to author as royalty
        ↓
Author tracks earnings & withdraws via Stripe Connect / Wise
```

### Revenue Example

| Price Point | Google Pays (70%) | Shothik Keeps (15%) | Author Earns (85%) |
|-------------|-------------------|---------------------|---------------------|
| $4.99       | $3.49             | $0.52               | $2.97               |
| $9.99       | $6.99             | $1.05               | $5.94               |
| $14.99      | $10.49            | $1.57               | $8.92               |
| $19.99      | $13.99            | $2.10               | $11.89              |

### Revenue Streams

1. **Enterprise subscriptions** ($25/mo) — gate to publishing features
2. **Publishing commission** (15% of Google's payout per sale)
3. **ISBN allocation fee** (optional, pass-through cost)
4. **Premium services** (priority review, marketing placement, cover design AI)
5. **Print-on-demand margin** (future phase)

---

## 2. Google Play Books Integration

### Partner Center Details

- **URL**: https://play.google.com/books/publish/
- **Royalty Rate**: 70% of list price (best in industry for most price points)
- **No delivery fees** (unlike Amazon KDP which charges per MB)
- **No exclusivity** — authors can sell on Amazon, Apple, etc. simultaneously
- **60+ countries** supported for sales
- **Formats**: ePub and PDF (files under 2GB)
- **Review time**: Books published within 24 hours after approval
- **Payment**: Monthly on the 15th for prior month's sales via direct deposit

### Key Advantage Over Amazon KDP

| Factor | Google Play | Amazon KDP |
|--------|-------------|------------|
| Royalty (under $2.99) | 70% | 35% |
| Royalty ($2.99–$9.99) | 70% | 70% |
| Royalty (over $9.99) | 70% | 35% |
| Delivery fees | None | $0.06–$0.15 per MB |
| Exclusivity required | No | No (but KDP Select requires 90-day exclusivity) |
| Price restrictions | None | Must be $0.99–$200 |

### Important: No Aggregator API Available

Google does **NOT** offer a public REST API for programmatic book publishing. The Client Services Agreement for aggregators has been **closed since 2015** — no new applications accepted.

**Our approach**: Shothik UK registers as a single publisher on Google Play Books Partner Center. All author books are published under the Shothik UK publisher account, organized by collection codes per author/imprint. This is the same model used by traditional publishing houses.

### Publishing Methods Available

1. **Manual upload** via Partner Center web interface (MVP)
2. **Spreadsheet bulk upload** for multiple titles
3. **ONIX feed** for automated catalog management (Phase 2)
4. **Third-party aggregator** (PublishDrive API, $99/mo Pro plan) as fallback

---

## 3. Commission Structure Analysis

### Industry Comparison

| Platform | Commission Model | Author Net (on $9.99 book) |
|----------|-----------------|---------------------------|
| Amazon KDP (direct) | 0% (direct to author) | $6.50–$6.80 |
| Draft2Digital | 10% of list price | $5.99 |
| PublishDrive | 10% or flat monthly fee | $5.99–$6.99 |
| StreetLib | 15% | $5.94 |
| Smashwords/D2D | 10% distribution | $5.99 |
| **Shothik AI (recommended)** | **15%** | **$5.94** |

### Recommended: 15% Commission

- **Justification**: Shothik provides the writing tool (Writing Studio), AI assistance, formatting, and publishing — more value than pure aggregators
- **Competitive**: Same as StreetLib, only 5% more than Draft2Digital
- **Promotional flexibility**: Offer 10% for early adopters, high-volume authors, or annual Enterprise subscribers
- **Revenue potential**: At 1,000 books averaging $5/month in sales each = $750/month commission revenue

---

## 4. UK Company Legal Requirements

### Publishing as a UK Company

Shothik is already registered in London, UK. Key requirements:

#### ISBN Registration

- **Agency**: Nielsen BookData (official UK ISBN agency)
- **Minimum purchase**: 10 ISBNs (~£149)
- **One ISBN per format**: Paperback, hardcover, and ebook each need separate ISBNs
- **Processing time**: 10 working days (3-day fast-track available)
- **URL**: https://www.nielsenisbnstore.com
- **Note**: ISBNs will be registered under Shothik's UK company name

#### Legal Deposit (Mandatory)

- **British Library**: Must send 1 copy within 1 month of publication (free)
- **Address**: Legal Deposit Office, British Library, Boston Spa, Wetherby, West Yorkshire LS23 7BY
- **5 additional libraries** can request copies (National Library of Scotland, Wales, Bodleian, Cambridge, Trinity College Dublin)
- **Applies to**: Both print and ebooks

#### VAT on Ebooks

- **Rate**: 0% (zero-rated since May 1, 2020)
- **Threshold**: Revenue still counts toward £90,000 VAT registration threshold
- **Audiobooks**: 20% standard rate (excluded from zero-rating)
- **Records**: Must maintain digital records for at least 6 years
- **EU sales**: Must handle EU VAT separately (or use platform handling)

#### Copyright

- **Automatic** in the UK — no registration needed
- **Governed by**: Copyright, Designs and Patents Act 1988
- **Important**: Author retains copyright; Shothik gets a publishing license

### Author-Publisher Agreement (Must Draft)

Essential terms to include:

1. **Rights granted**: Non-exclusive publishing license (author can publish elsewhere)
2. **Territory**: Worldwide digital distribution
3. **Commission**: 15% of net receipts from stores
4. **Payment terms**: Monthly, 30-day lag, minimum threshold
5. **Content responsibility**: Author warrants original work, no plagiarism
6. **Takedown rights**: Either party can request removal with notice
7. **Indemnification**: Author indemnifies against copyright claims
8. **Term**: Renewable annually, 30-day termination notice

---

## 5. Payment Infrastructure

### Stripe Connect (Primary — Already in Stack)

Stripe Connect is the ideal solution for marketplace royalty payouts:

- **Model**: Destination Charges (platform collects, splits to authors)
- **Author onboarding**: Express accounts (simplified KYC)
- **Split payments**: Automatic at transaction time
- **Payout schedule**: Configurable (daily, weekly, monthly)
- **Countries**: 46+ countries for connected accounts
- **Currencies**: 135+ currencies supported

#### Pricing (UK)

- 1.5% + 20p per UK/EU card transaction
- 2.9% + 20p for international cards
- £2 per active connected account/month
- No setup fees or monthly minimums

#### Implementation

```
Book Sale on Google Play
        ↓
Google pays Shothik UK monthly (bank transfer)
        ↓
Shothik calculates royalties per author
        ↓
Stripe Connect transfers to author's connected account
        ↓
Author receives payout (GBP, USD, or local currency)
```

### Wise Business (Fallback for Unsupported Countries)

- **Bangladesh**: Stripe Connect may have limited payout support — use Wise for BDT transfers
- **India**: Stripe Connect works, but Wise offers better FX rates for INR
- **Multi-currency**: Supports GBP, USD, EUR, BDT, INR, and 50+ currencies

### bKash (Bangladesh — Receive Only)

- **Can receive** international remittances (via Remitly, Ria, WorldRemit)
- **Cannot send** money out of Bangladesh
- **Use case**: Final mile for Bangladeshi authors (Wise → bKash)
- **Government incentive**: 2.5% bonus on received remittances

### Payment Flow for South Asian Authors

```
Google Play → Shothik UK Bank (GBP)
        ↓
Royalty Calculation Engine
        ↓
├─ Stripe Connect supported country → Direct payout
├─ India → Stripe Connect (INR) or Wise
├─ Bangladesh → Wise → Author's bank or bKash
└─ Other → Wise international transfer
```

### Minimum Payout Thresholds (Recommended)

| Method | Minimum | Frequency |
|--------|---------|-----------|
| Stripe Connect | $25 | Monthly |
| Wise Transfer | $50 | Monthly |
| bKash (via Wise) | $10 | Monthly |

---

## 6. Royalty System Architecture

### Database Schema (Core Entities)

```sql
-- Authors (extends existing user table)
authors
├── author_id (PK)
├── user_id (FK → users)
├── pen_name
├── bio
├── stripe_connect_account_id
├── wise_recipient_id
├── payout_method (stripe | wise | bkash)
├── tax_country
├── tax_id
├── kyc_status (pending | verified | rejected)
├── created_at
└── updated_at

-- Books
books
├── book_id (PK)
├── author_id (FK → authors)
├── title
├── subtitle
├── description
├── isbn
├── cover_url
├── manuscript_url
├── format (epub | pdf)
├── language
├── category
├── keywords (JSON array)
├── list_price_usd
├── status (draft | submitted | in_review | published | rejected | unpublished)
├── google_play_id
├── published_at
├── created_at
└── updated_at

-- Sales Transactions (imported from Google reports)
sales
├── sale_id (PK)
├── book_id (FK → books)
├── sale_date
├── quantity
├── list_price
├── currency
├── google_revenue (70% of list price)
├── country_code
├── store (google_play | apple_books | amazon — future)
├── report_period
├── imported_at
└── created_at

-- Royalty Ledger
royalties
├── royalty_id (PK)
├── author_id (FK → authors)
├── book_id (FK → books)
├── sale_id (FK → sales)
├── period_start
├── period_end
├── gross_revenue (google_revenue)
├── commission_rate (0.15)
├── commission_amount
├── net_royalty (what author earns)
├── currency
├── fx_rate (to author's payout currency)
├── status (accrued | approved | paid | disputed)
└── created_at

-- Payouts
payouts
├── payout_id (PK)
├── author_id (FK → authors)
├── amount
├── currency
├── payout_method (stripe | wise | bkash)
├── stripe_transfer_id
├── wise_transfer_id
├── status (pending | processing | completed | failed)
├── period_start
├── period_end
├── statement_url (PDF)
├── initiated_at
├── completed_at
└── created_at

-- Publishing Queue
publishing_queue
├── queue_id (PK)
├── book_id (FK → books)
├── submitted_by (FK → users)
├── reviewer_id (FK → admin users)
├── status (pending | reviewing | approved | rejected | uploaded)
├── review_notes
├── rejection_reason
├── submitted_at
├── reviewed_at
├── uploaded_at
└── created_at
```

### Royalty Calculation Formula

```
For each sale:

  google_revenue = list_price × 0.70
  commission = google_revenue × 0.15
  author_royalty = google_revenue - commission
  
  // With FX conversion:
  author_payout = author_royalty × fx_rate_to_local_currency
  
  // With reserve for returns (first 60 days):
  available_balance = total_accrued - reserve_holdback (10%)
```

### Monthly Royalty Cycle

```
Day 1-5:   Google sales report for previous month available
Day 5-10:  Import sales data, run royalty calculations
Day 10-12: Internal review and approval
Day 15:    Google pays Shothik UK bank account
Day 16-20: Initiate author payouts via Stripe Connect / Wise
Day 20-25: Authors receive funds
Day 25:    Generate and send monthly statements (PDF)
```

---

## 7. Frontend Components Needed

### New Components to Build

#### 1. Author Dashboard (`/dashboard/earnings`)

- **Earnings overview**: Total earned, this month, pending, available for withdrawal
- **Sales chart**: Line/bar chart showing sales over time
- **Book performance table**: Sales per book, revenue per book
- **Recent transactions**: List of recent sales with details
- **Payout history**: List of past payouts with status and amounts

#### 2. Book Submission Flow (Enhanced PublishView)

- **Step 1**: Manuscript upload (ePub/PDF, drag-and-drop)
- **Step 2**: Metadata form (title, subtitle, description, category, keywords)
- **Step 3**: Cover upload (with dimension/resolution validation)
- **Step 4**: Pricing (with royalty calculator showing projected earnings)
- **Step 5**: Agreement acceptance (terms and conditions checkbox)
- **Step 6**: Review & submit (summary of all details)

#### 3. Royalty Calculator Widget

- Input: List price
- Output: Google's share, Shothik's commission, author's royalty
- Visual breakdown (pie chart or bar)
- Multi-currency toggle (USD, GBP, BDT, INR)

#### 4. Payout Settings Page

- Stripe Connect account linking (OAuth flow)
- Wise recipient setup
- bKash number registration
- Minimum payout threshold setting
- Tax information form
- KYC document upload

#### 5. Author Statements

- Monthly PDF statements with sales breakdown
- Downloadable from dashboard
- Email notification when new statement available

#### 6. Publishing Status Tracker

- Visual pipeline: Draft → Submitted → In Review → Published
- Status updates with timestamps
- Reviewer notes/feedback display
- Rejection reason and resubmission flow

---

## 8. Implementation Phases

### Phase 1 — MVP (4-6 weeks)

**Goal**: Author can submit a book and track its publishing status

**Frontend**:
- [ ] Enhanced PublishView with multi-step submission flow
- [ ] Royalty calculator widget
- [ ] Author agreement acceptance UI
- [ ] Publishing status tracker
- [ ] Basic earnings dashboard (mock data initially, backend-ready)

**Backend** (Backend Team):
- [ ] Author profile extension (pen name, bio, payout details)
- [ ] Book submission API (metadata + file upload)
- [ ] Publishing queue with admin review interface
- [ ] Google Play Books Partner Center manual upload workflow
- [ ] ISBN assignment from pool

**Business**:
- [ ] Purchase initial batch of ISBNs from Nielsen UK (10 minimum)
- [ ] Set up Google Play Books Partner Center account for UK company
- [ ] Draft author-publisher agreement (legal review)
- [ ] Set up UK bank account for Google payments (if not already done)

### Phase 2 — Royalties & Payouts (4-6 weeks)

**Goal**: Authors earn money and can withdraw

**Frontend**:
- [ ] Full earnings dashboard with charts and tables
- [ ] Payout settings page (Stripe Connect onboarding)
- [ ] Monthly statements viewer
- [ ] Withdrawal request flow

**Backend**:
- [ ] Sales data import from Google Partner Center reports (CSV)
- [ ] Royalty calculation engine
- [ ] Stripe Connect integration for author payouts
- [ ] Wise integration for unsupported Stripe countries
- [ ] Monthly statement PDF generation
- [ ] Payout scheduling and processing

**Business**:
- [ ] Set up Stripe Connect platform account
- [ ] Set up Wise Business account
- [ ] Establish monthly royalty processing workflow

### Phase 3 — Automation & Scale (6-8 weeks)

**Goal**: Automated pipeline, multi-store distribution

**Backend**:
- [ ] ONIX feed automation for Google Play
- [ ] PublishDrive API integration for multi-store distribution
- [ ] Automated sales report ingestion
- [ ] Author KYC verification flow
- [ ] Tax form collection and reporting

**Frontend**:
- [ ] Multi-store distribution selection (Google Play, Apple Books, Amazon)
- [ ] Advanced analytics (by country, by store, trends)
- [ ] Author public profile pages
- [ ] Marketing tools (promo codes, price scheduling)

**Business**:
- [ ] Apply for PublishDrive Pro plan ($99/mo) for API access
- [ ] Register with Apple Books, Amazon KDP as additional channels
- [ ] Scale ISBN purchases
- [ ] Legal deposit automation

### Phase 4 — Full Earning Platform (Ongoing)

- Print-on-demand integration (via IngramSpark)
- Audiobook support (auto-narration via Google's beta program)
- Author community features (leaderboards, forums)
- Advance payment program (for top authors)
- Translation services (leveraging Shothik's Bengali AI)
- Book marketing AI agent
- Reader analytics and engagement tracking

---

## 9. Competitive Positioning

### Why Authors Choose Shothik Over Alternatives

| Feature | Shothik AI | Amazon KDP | Draft2Digital | PublishDrive |
|---------|------------|------------|---------------|--------------|
| AI Writing Tools | Built-in | None | None | None |
| STEM-Safe Paraphrasing | Yes | No | No | No |
| Citation Manager | Yes | No | No | No |
| AI Cover Generation | Planned | No | No | No |
| Publishing + Writing | All-in-one | Separate | Separate | Separate |
| Commission | 15% | 0% (direct) | 10% | 10% or flat |
| South Asian Focus | Yes | Limited | No | No |
| Bengali Language | Yes | No | No | No |
| Local Payment (bKash) | Yes | No | No | No |

### Target Market

- **40M+ university students** in South/Southeast Asia
- **Academic authors** publishing research, textbooks, study guides
- **Bengali-speaking writers** (250M+ speakers globally)
- **First-time authors** who need an all-in-one solution
- **STEM researchers** publishing technical books with LaTeX/code

### Unique Value Proposition

> "Write, format, and publish your book — all in one place. Earn royalties from 60+ countries. The only publishing platform built for South Asian academics and STEM researchers."

---

## 10. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Google changes Partner Center terms | High | Low | Diversify to multiple stores early |
| Low initial sales volume | Medium | High | Focus on subscription revenue; publishing is added value |
| Payment compliance issues | High | Medium | Use Stripe Connect (handles KYC/compliance); legal review |
| Content quality/copyright issues | High | Medium | Mandatory review process; author indemnification clause |
| ISBN costs scaling | Low | Medium | Bulk purchase discounts; pass cost to authors optionally |
| FX rate fluctuations | Medium | High | Price in USD; convert at payout time; show rates transparently |

---

## 11. Key Resources & Links

### Google Play Books
- Partner Center: https://play.google.com/books/publish/
- Revenue Split FAQ: https://support.google.com/books/partner/answer/9331459
- Publisher Policies: https://support.google.com/books/partner/answer/166501
- Adding a Book: https://support.google.com/books/partner/answer/3289675

### UK Publishing
- Nielsen ISBN Store: https://www.nielsenisbnstore.com
- British Library Legal Deposit: legal-deposit-books@bl.uk
- HMRC VAT on E-publications: https://www.gov.uk/guidance/zero-rate-of-vat-for-electronic-publications

### Payment Infrastructure
- Stripe Connect: https://docs.stripe.com/connect
- Stripe Split Payments: https://docs.stripe.com/connect/separate-charges-and-transfers
- Wise Business: https://wise.com/business/

### Industry References
- Draft2Digital: https://draft2digital.com
- PublishDrive: https://publishdrive.com
- Reedsy Self-Publishing Guide: https://reedsy.com/blog/best-self-publishing-companies/
- Book Royalties Guide: https://scribemedia.com/book-royalties/

---

## 12. Financial Projections (Year 1)

### Conservative Scenario

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Enterprise subscribers | 50 | 150 | 500 |
| Books published | 20 | 80 | 300 |
| Avg monthly sales/book | $5 | $8 | $12 |
| Total monthly book sales | $100 | $640 | $3,600 |
| Google pays (70%) | $70 | $448 | $2,520 |
| Shothik commission (15%) | $10.50 | $67.20 | $378 |
| Enterprise sub revenue | $1,250 | $3,750 | $12,500 |
| **Total monthly revenue** | **$1,260** | **$3,817** | **$12,878** |

### Optimistic Scenario (Viral in Bangladesh/India)

| Metric | Month 6 | Month 12 |
|--------|---------|----------|
| Enterprise subscribers | 500 | 2,000 |
| Books published | 300 | 1,500 |
| Avg monthly sales/book | $15 | $20 |
| Shothik commission | $472 | $3,150 |
| Enterprise sub revenue | $12,500 | $50,000 |
| **Total monthly revenue** | **$12,972** | **$53,150** |

---

*This document serves as the strategic foundation for Shothik AI's transformation into a publishing and earning platform. All findings are based on research conducted in February 2026.*
