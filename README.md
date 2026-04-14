# InterviewPrepApp

AI-powered interview preparation platform — practice with real questions via real-time voice interaction, solve coding challenges with live code execution, get adaptive difficulty scaling, and receive instant AI-generated feedback.

**[Live Demo](https://interview-prep-app-six-red.vercel.app)** &nbsp;|&nbsp; [GitHub](https://github.com/ahmad4376/InterviewPrepApp)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Subscription Tiers](#subscription-tiers)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [For Developers](#for-developers)

---

## Overview

InterviewPrepApp is a full-stack AI interview simulator built with Next.js. It combines two interview modes under one platform:

- **Voice Interviews** — real-time bidirectional voice conversation powered by Deepgram and GPT-4o. Candidates speak their answers; the AI interviewer listens, evaluates, and adapts the next question based on response quality.
- **Coding Interviews** — LeetCode-style coding challenges with a Monaco editor, multi-language execution (JavaScript, Python, C++), visible test cases, and hidden test case grading.

The platform supports both **individual practice** and **mass interview campaigns** (interviewers share a link or send email invites to candidates, then review all results from a single dashboard). A Stripe-backed subscription model controls access: Free, Pro ($9/mo), and Business ($49/mo).

---

## Features

### Voice Interview Engine

- Real-time bidirectional voice interaction via Deepgram WebSocket streaming
- Speech-to-text using Deepgram Nova-3
- Text-to-speech with selectable voices (Asteria, Orion, Luna, Arcas)
- Natural conversational flow powered by GPT-4o function calling
- Resume upload (PDF/DOCX) parsed by AI to personalize interview questions

### Adaptive Difficulty

- Questions scale from level 1 (basic) to level 5 (expert)
- Response quality assessment (excellent / good / partial / poor) drives difficulty adjustment
- Topic-aware selection avoids repeating similar areas within recent questions
- Bell-curve difficulty distribution (10% / 20% / 35% / 25% / 10% across levels 1–5)

### Coding Interview Module

- LeetCode-style problem workspace with Monaco editor (VS Code engine)
- Multi-language support: JavaScript, Python, C++
- Code execution via self-hosted [Piston](https://github.com/engineer-man/piston) engine
- Run code against visible test cases with real output and execution time
- Submit to run hidden test cases with pass/fail summary
- Solution tab hidden during interview mode — only visible in practice mode
- Submission history per problem, persisted to MongoDB
- Resizable split-panel layout (problem description + editor + console)
- Code persistence across browser sessions per problem per language

### Intelligent Question Selection

- Extracts keywords from job descriptions to find relevant questions
- Matches against a MongoDB question bank with tag-based search and alias normalization
- Falls back to OpenAI generation when the question bank has insufficient coverage
- Optional custom question list: pick specific questions before starting

### AI-Generated Feedback

- Full transcript analysis after each interview
- Overall score (1–5) with summary assessment
- Category breakdowns: Technical Knowledge, Communication, Problem Solving, Depth of Understanding
- Per-question scoring with individual assessments
- Identified strengths and areas for improvement
- Downloadable PDF reports with cover page, executive summary, and detailed breakdown

### Mass Interview Campaigns

- Create a session and share a unique join link with candidates
- **Email invite dialog** — enter a list of emails and send branded invites via Resend (up to 50 per batch)
- Each candidate gets their own adaptive interview instance
- Dashboard view of all candidate results, scores, and transcripts
- Side-by-side candidate comparison and ranking
- Individual PDF report generation per candidate

### Analytics Dashboard

- Interview volume over time (daily/weekly/monthly charts)
- Score distribution across interviews
- Pipeline funnel: scheduled → in progress → completed
- Organization-level metrics for Business tier accounts

### Team & Organization Management

- Multiple team seats under a shared organization (via Clerk)
- Role-based access (admin / member)
- Custom branding and white-label support for Business accounts

### Profile Page

- Avatar management via Clerk (photo upload/change)
- Editable bio and job title stored in MongoDB
- Recent interview activity with scores

### Dashboard

- View all interviews with status tracking (Scheduled / In Progress / Completed)
- Search and filter by title, company, or status
- Sort by date or name
- Server-side pagination with Redis caching per page
- Edit interview details before starting
- Delete interviews with confirmation

### Performance & Security

- **Redis caching** (Upstash) on all cacheable routes — subscription data, problem lists, interview lists, analytics, org branding — with automatic cache invalidation on mutations
- **localStorage seeding** — dashboard and subscription data render instantly on revisits from a 1-minute client-side cache, eliminating the loading spinner on repeat visits
- **AES-256-GCM field encryption** — transcripts, resume data, and candidate emails are encrypted at rest in MongoDB

---

## Subscription Tiers

| Feature                          | Free       | Pro ($9/mo) | Business ($49/mo) |
| -------------------------------- | ---------- | ----------- | ----------------- |
| Voice interviews                 | 3 / month  | Unlimited   | Unlimited         |
| Coding problems                  | 10 / month | Unlimited   | Unlimited         |
| Detailed feedback & scoring      | Basic      | Full        | Full              |
| PDF reports                      |            | Yes         | Yes               |
| Resume parsing                   |            | Yes         | Yes               |
| Mass interviews (shareable link) |            |             | Yes               |
| Email invite campaigns           |            |             | Yes               |
| Team seats & role management     |            |             | Yes               |
| Candidate comparison & ranking   |            |             | Yes               |
| Analytics dashboard              |            |             | Yes               |
| Custom branding / white-label    |            |             | Yes               |

Billing is powered by Stripe. Users manage plans, view usage, and access the Stripe customer portal from the **Billing** page.

---

## Tech Stack

| Layer          | Technology                                                                     |
| -------------- | ------------------------------------------------------------------------------ |
| Framework      | Next.js 15 (App Router), React 19, TypeScript                                  |
| Voice AI       | Deepgram SDK v4 (Nova-3 STT, Aura TTS, Voice Agent API)                        |
| LLM            | OpenAI GPT-4o (interview logic, question generation, feedback, resume parsing) |
| Code Editor    | Monaco Editor (`@monaco-editor/react`)                                         |
| Code Execution | Piston (self-hosted, Docker)                                                   |
| Database       | MongoDB Atlas + Mongoose 9                                                     |
| Caching        | Upstash Redis (`@upstash/redis`) — server-side + localStorage client cache     |
| Encryption     | AES-256-GCM field-level encryption (Node.js `crypto`)                          |
| Authentication | Clerk (sign-up/sign-in, organizations, session management, middleware)         |
| Payments       | Stripe (subscriptions, usage limits, customer portal, webhooks)                |
| Email          | Resend (mass interview email invitations)                                      |
| Styling        | Tailwind CSS 3, Radix UI primitives, Framer Motion                             |
| PDF Generation | PDFKit (server-side streaming)                                                 |
| Charts         | Recharts                                                                       |
| Deployment     | Docker → GHCR → Google Kubernetes Engine (GKE), CI via GitHub Actions          |

---

## Architecture

```
app/
├── (dashboard)/                        # Protected routes (requires auth)
│   ├── create-interview/               # Interview creation flow
│   │   ├── page.tsx                    # Step 1: job title, company, description
│   │   ├── pick-questions/             # Step 2: optional custom question selection
│   │   └── custom-questions/           # Step 3: add custom questions
│   ├── dashboard/                      # Main dashboard with interview list
│   │   └── analytics/                  # Analytics charts (Business tier)
│   ├── interview/[id]/                 # Live voice interview session
│   ├── feedback/[id]/                  # Post-interview feedback display
│   ├── interviews/[id]/
│   │   ├── candidates/                 # Mass interview candidate list + email invite
│   │   │   └── [sessionId]/feedback/  # Per-candidate feedback
│   │   └── compare/                    # Side-by-side candidate comparison
│   ├── coding-results/[id]/           # Coding interview results
│   ├── billing/                        # Subscription plans + usage meter
│   ├── profile/                        # User profile (avatar, bio, job title, history)
│   └── team/                           # Team management + branding
│
├── (coding)/                           # Coding interview routes
│   └── coding-interview/[slug]/        # Coding workspace (Monaco + console)
│       ├── _components/                # Editor, panels, toolbar
│       └── _lib/                       # Types, templates, hooks
│
├── (admin)/                            # Internal admin panel
│   └── admin/
│       ├── page.tsx                    # Admin overview
│       ├── users/                      # User management
│       ├── organizations/              # Organization management
│       └── metrics/                    # Platform-wide metrics
│
├── api/                                # Next.js Route Handlers
│   ├── authenticate/                   # Deepgram token endpoint
│   ├── interviews/                     # Interview CRUD + join + reports + email invite
│   ├── candidate-sessions/             # Candidate session management + reports
│   ├── coding-interviews/              # Coding interview management
│   ├── leetcode/                       # Problem fetch + code execution (via Piston)
│   ├── submissions/                    # Submission history
│   ├── billing/                        # Stripe checkout + portal
│   ├── user/                           # User profile + interview summary
│   ├── organizations/                  # Org branding + analytics
│   ├── webhooks/
│   │   ├── stripe/                     # Stripe subscription webhook handler
│   │   └── clerk/                      # Clerk user sync webhook handler
│   └── health/                         # Health check endpoint
│
├── components/                         # React components
│   ├── App.js                          # Core voice interaction component
│   ├── InviteByEmailDialog.tsx         # Mass interview email invite dialog
│   ├── analytics/                      # VolumeChart, ScoreChart, PipelineChart
│   ├── subscription/                   # UpgradePrompt, UsageMeter, TierBadge
│   ├── ui/                             # Shared UI primitives (card, button, etc.)
│   ├── landing/                        # Landing page sections
│   │   └── Logo.tsx                    # App logo (public/logo.png with fallback)
│   ├── FeedbackDisplay.tsx             # Feedback visualization
│   ├── InterviewTranscript.tsx         # Transcript viewer
│   └── EditInterviewModal.tsx          # Interview edit form
│
├── context/                            # React context providers
│   ├── VoiceBotContextProvider.tsx     # Voice bot state (reducer-based)
│   ├── DeepgramContextProvider.js      # Deepgram SDK connection
│   └── MicrophoneContextProvider.js   # Browser microphone access
│
├── hooks/
│   └── useSubscription.ts              # Subscription data with localStorage seeding
│
├── lib/                                # Server-side utilities
│   ├── auth.ts                         # Clerk auth helper
│   ├── mongodb.ts                      # MongoDB connection singleton
│   ├── redis.ts                        # Upstash Redis singleton + withCache<T>() helper
│   ├── encryption.ts                   # AES-256-GCM field encrypt/decrypt
│   ├── openai.ts                       # OpenAI: question generation + feedback
│   ├── questionSelection.ts            # Question bank querying + keyword extraction
│   ├── scoring.ts                      # Candidate ranking + topic matching
│   ├── sampling.ts                     # Adaptive question selection algorithm
│   ├── resumeParser.ts                 # PDF/DOCX → structured resume data (via AI)
│   ├── constants.ts                    # Interview configs + voice definitions
│   ├── subscription/                   # Tier definitions + usage gating
│   └── types.ts                        # Shared TypeScript interfaces
│
├── models/                             # Mongoose schemas
│   ├── Interview.ts                    # Interview document
│   ├── CandidateSession.ts             # Mass interview candidate session
│   ├── Question.ts                     # Question bank entry
│   ├── LeetcodeQuestion.ts             # Coding problem
│   ├── Submission.ts                   # Code submission record
│   ├── Organization.ts                 # Org branding + settings
│   └── User.ts                         # User + subscription + profile fields
│
├── utils/                              # Client-side utilities
│   ├── deepgramUtils.ts                # WebSocket config builders
│   └── audioUtils.js                   # Audio processing helpers
│
├── join/[token]/session/[sessionId]/  # Public route for mass interview candidates
├── sign-in/                            # Clerk sign-in page (themed)
├── sign-up/                            # Clerk sign-up page (themed)
├── page.tsx                            # Landing page (ISR, revalidate 1h)
└── layout.tsx                          # Root layout (ClerkProvider with dark theme)

scripts/
├── data/                               # Question bank JSON data
├── seed-questions.ts                   # DB seed script
└── sync-clerk-users.ts                 # Backfill Clerk users → MongoDB

piston/                                 # Piston self-hosted code execution
├── docker-compose.yml                  # Run on your VPS
└── install-runtimes.sh                 # Install JS / Python / C++ runtimes

k8s/                                    # Kubernetes manifests (GKE deployment)
├── deployment.yaml
├── service.yaml
├── namespace.yaml
└── secrets.template.yaml               # Template for all required secrets

middleware.ts                           # Clerk route protection
Dockerfile                              # Production container (standalone output)
```

### Database Models

**Interview** — Stores interview configuration, adaptive state, transcript (AES-256-GCM encrypted), and AI feedback. Supports individual and mass interview modes via `isMassInterview` and `shareToken` fields.

**CandidateSession** — Tracks each candidate's progress in a mass interview. Contains its own copy of the adaptive state, transcript (encrypted), feedback, and `candidateEmail` (encrypted).

**Question** — Question bank entries with `question_text`, `answer_text`, `tags`, `difficulty_score` (1–5), and `rank_value` for relevance ordering.

**LeetcodeQuestion** — Coding problem with description, examples, test cases (visible + hidden), starter templates per language, driver code, and difficulty bucket (easy / medium / hard).

**Submission** — Records each code submission: user, problem, language, code, pass/fail, and hidden test case summary.

**User** — Clerk user reference with subscription tier (`free` / `pro` / `business`), usage counters, Stripe customer/subscription IDs, and profile fields (`bio`, `jobTitle`, `resumeData`).

**Organization** — Clerk org reference with custom branding (`logoUrl`, `primaryColor`, `secondaryColor`, `companyName`).

---

## How It Works

### End-to-End Voice Interview Flow

1. **Sign up / Sign in** via Clerk. Authenticated users are redirected to the dashboard.

2. **Create an interview** — provide a position title, company name, and job description. Optionally upload a resume (PDF or DOCX): the server extracts text and uses GPT-4o-mini to parse it into structured data (skills, experience, projects, education), which is injected into the AI interviewer's system prompt for personalized questions. The server also extracts keywords from the description, queries the MongoDB question bank for relevant matches, and falls back to OpenAI generation if fewer than 3 relevant questions are found.

3. **Start the interview** — a Deepgram WebSocket connection is established for real-time voice. The AI interviewer ("Alex") greets the candidate and begins asking questions via GPT-4o function calling. After each answer, the LLM assesses response quality and suggests topics, which feeds into the adaptive selection algorithm to pick the next question.

4. **Adaptive selection** — the scoring engine ranks remaining questions by topic relevance (matching LLM-suggested topics against question tags) and difficulty fit. A diversity penalty discourages repeating recent topics.

5. **Interview ends** — when all target questions are asked, the agent wraps up. The full transcript is sent to OpenAI for structured feedback generation (overall score, category breakdowns, per-question assessments, strengths, improvements).

6. **View feedback** — the results page shows scores, charts, and detailed breakdowns. Users can download a PDF report.

### End-to-End Coding Interview Flow

1. A coding interview is created with a set of problems (fetched from the LeetcodeQuestion collection).
2. The candidate works in the Monaco editor, choosing JavaScript, Python, or C++.
3. **Run** executes visible test cases via the self-hosted Piston engine and shows output, execution time, and errors in the console panel.
4. **Submit** runs both visible and hidden test cases. Pass/fail counts for hidden tests are shown separately. Solutions are hidden during interview mode and stripped from the API response.
5. Submission history is persisted per user and problem and shown in the Submissions tab.

### Caching Layer

All cacheable routes use a `withCache<T>(key, ttlSeconds, fn)` helper backed by Upstash Redis. On a cache miss the function runs and the result is stored; on a hit the stored value is returned without hitting MongoDB. Mutations call `redis.del(key)` to invalidate immediately.

| Route / Data              | Cache key                               | TTL    |
| ------------------------- | --------------------------------------- | ------ |
| Subscription data         | `sub:<clerkId>`                         | 60s    |
| Interview list (per page) | `interviews:<scope>:page:<n>:limit:<n>` | 30s    |
| Coding problem list       | `problems:list:...`                     | 1 hour |
| Coding problem detail     | `problem:<id>`                          | 7 days |
| Submission status map     | `submissions:statusmap:<userId>`        | 60s    |
| Submission history        | `submissions:history:<userId>:<id>`     | 30s    |
| Admin metrics             | `admin:metrics`                         | 5 min  |
| Organization branding     | `org:<orgId>:branding`                  | 5 min  |
| Analytics (4 routes)      | `org:<orgId>:analytics:*`               | 5 min  |

The landing page uses Next.js `export const revalidate = 3600` for edge-level ISR caching.

### API Endpoints

| Method   | Endpoint                                     | Description                                                    |
| -------- | -------------------------------------------- | -------------------------------------------------------------- |
| `POST`   | `/api/interviews`                            | Create a new interview (generates questions + sampling plan)   |
| `GET`    | `/api/interviews`                            | List interviews (server-side paginated, Redis cached)          |
| `GET`    | `/api/interviews/[id]`                       | Get interview details                                          |
| `PATCH`  | `/api/interviews/[id]`                       | Update interview (status, fields, feedback)                    |
| `DELETE` | `/api/interviews/[id]`                       | Delete an interview                                            |
| `GET`    | `/api/interviews/[id]/report`                | Download PDF report                                            |
| `GET`    | `/api/interviews/[id]/candidates`            | List candidates for a mass interview                           |
| `POST`   | `/api/interviews/[id]/invite`                | Send email invites to a list of candidate emails (Resend)      |
| `GET`    | `/api/interviews/join/[token]`               | Check join status for a mass interview                         |
| `POST`   | `/api/interviews/join/[token]`               | Create a candidate session                                     |
| `GET`    | `/api/candidate-sessions/[sessionId]`        | Get candidate session details                                  |
| `PATCH`  | `/api/candidate-sessions/[sessionId]`        | Update candidate session                                       |
| `GET`    | `/api/candidate-sessions/[sessionId]/report` | Download candidate PDF report                                  |
| `POST`   | `/api/authenticate`                          | Get a Deepgram access token for WebSocket                      |
| `GET`    | `/api/leetcode`                              | List coding problems (Redis cached, 1h)                        |
| `GET`    | `/api/leetcode/[id]`                         | Get a single coding problem (Redis cached, 7 days)             |
| `POST`   | `/api/leetcode/execute`                      | Execute code via Piston, save submission, bust caches          |
| `GET`    | `/api/submissions`                           | Get submission history / status map for the authenticated user |
| `GET`    | `/api/coding-interviews/[id]`                | Get coding interview details                                   |
| `GET`    | `/api/user/profile`                          | Get user profile (bio, jobTitle)                               |
| `PATCH`  | `/api/user/profile`                          | Update user profile                                            |
| `GET`    | `/api/user/interviews-summary`               | Last 5 completed interviews for profile page                   |
| `POST`   | `/api/billing/checkout`                      | Create a Stripe checkout session                               |
| `POST`   | `/api/billing/portal`                        | Open Stripe customer portal                                    |
| `GET`    | `/api/billing/subscription`                  | Get current subscription tier + usage (Redis cached, 60s)      |
| `POST`   | `/api/webhooks/stripe`                       | Handle Stripe subscription lifecycle events                    |
| `POST`   | `/api/webhooks/clerk`                        | Sync Clerk user create/update events to MongoDB                |
| `GET`    | `/api/health`                                | Health check (used by Kubernetes readiness probe)              |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) + [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) **(recommended)**
- Or: [Node.js v20+](https://nodejs.org/) installed locally (via [nvm](https://github.com/nvm-sh/nvm))
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or local MongoDB instance)

### External Service Accounts

You will need API keys from the following services:

| Service           | Purpose                                       | Sign Up                                                               |
| ----------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| **Deepgram**      | Voice AI (STT + TTS + Agent API)              | [console.deepgram.com](https://console.deepgram.com/signup?jump=keys) |
| **OpenAI**        | LLM for interview logic, feedback, resume     | [platform.openai.com](https://platform.openai.com/)                   |
| **Clerk**         | User authentication + organizations           | [clerk.com](https://clerk.com/)                                       |
| **MongoDB Atlas** | Database                                      | [mongodb.com/atlas](https://www.mongodb.com/atlas)                    |
| **Upstash**       | Redis caching                                 | [upstash.com](https://upstash.com/)                                   |
| **Resend**        | Email invitations for mass interviews         | [resend.com](https://resend.com/)                                     |
| **Stripe**        | Subscription billing (optional for local dev) | [stripe.com](https://stripe.com/)                                     |

### Option A: Dev Container (Recommended)

The fastest way to get started — provides a consistent Node 20 environment with all tools pre-configured.

```bash
# 1. Clone the repo
git clone https://github.com/ahmad4376/InterviewPrepApp.git
cd InterviewPrepApp

# 2. Create .env.local with your API keys (see Environment Variables below)

# 3. Open in VS Code → click "Reopen in Container" when prompted
#    (first time takes ~2 min to pull image and run npm install)

# 4. Start the app
npm run dev
```

### Option B: Local Setup

```bash
# Clone the repository
git clone https://github.com/ahmad4376/InterviewPrepApp.git
cd InterviewPrepApp

# Install dependencies
npm install

# Start the app
npm run dev
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Deepgram — requires "Member" role for key creation permissions
DEEPGRAM_API_KEY=your_deepgram_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# MongoDB
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/interview-prep

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...   # From Clerk Dashboard → Webhooks → signing secret

# Admin panel access (comma-separated Clerk user IDs)
ADMIN_USER_IDS=user_abc123,user_def456
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Upstash Redis (get from upstash.com → create database → REST API tab)
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Field-level encryption (generate with: npx tsx app/lib/generateEncryptionKey.ts)
ENCRYPTION_KEY=64_hex_chars

# Resend (email invites for mass interviews)
RESEND_API_KEY=re_...

# Piston — self-hosted code execution engine (see piston/ directory)
# Leave blank to use the public Piston instance (rate-limited)
PISTON_API_URL=http://your-vps-ip:2000

# Stripe (optional for local dev — billing features will be disabled without these)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL (used for Stripe portal return URL)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> `.env.local` is gitignored and never committed. Ask a team member for the shared dev keys.

### Generate an Encryption Key

```bash
npx tsx app/lib/generateEncryptionKey.ts
# Outputs: ENCRYPTION_KEY=<64 hex chars>
# Copy the value into .env.local
```

### Self-Host Piston (Code Execution Engine)

Piston runs on a separate VPS and handles sandboxed code execution for coding interviews.

```bash
# On your VPS — start Piston
cd piston/
docker compose up -d

# Install language runtimes (JavaScript, Python, C++)
./install-runtimes.sh

# Then set in your app environment:
# PISTON_API_URL=http://<your-vps-ip>:2000
```

Firewall port 2000 so only your app server can reach it.

### Stripe Webhook (Production)

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... secret → set as STRIPE_WEBHOOK_SECRET in .env.local
```

For production, register the endpoint in the Stripe Dashboard:

1. **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. URL: `https://your-domain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in your production environment

### Seed the Question Bank (Optional)

The app generates questions via OpenAI on the fly, but you can seed MongoDB with a pre-built question bank for better relevance:

```bash
npx tsx scripts/seed-questions.ts
```

### Add Your Logo

Drop your logo file at `public/logo.png`. It will automatically appear in the navbar, sidebar, and sign-in/sign-up pages. The app falls back to a Mic icon if the file is absent.

### Run the App

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## For Developers

### Project Conventions

- **Framework**: Next.js 15 App Router with a mix of server components and client components (`"use client"` directive)
- **Language**: TypeScript throughout, with a few legacy `.js` files in `context/` and `utils/`
- **Styling**: Tailwind CSS utility classes. Global styles in `app/globals.css`. Green accent color (`#3ecf8e`) for primary actions.
- **State management**: React Context + `useReducer` for voice bot state (`VoiceBotContextProvider` + `VoiceBotReducer`)
- **API routes**: Next.js Route Handlers in `app/api/`. All protected routes call `getAuthUserId()` from `app/lib/auth.ts`.
- **Database**: Mongoose models with a connection singleton in `app/lib/mongodb.ts`. Always call `await connectDB()` before queries.
- **Caching**: Wrap DB calls with `withCache(key, ttlSeconds, fn)` from `app/lib/redis.ts`. Call `getRedis().del(key)` on mutations.
- **Encryption**: Use `encryptField(plaintext)` / `decryptField(ciphertext)` from `app/lib/encryption.ts` for sensitive fields before writing to MongoDB.
- **Linting**: ESLint + Prettier with Husky pre-commit hooks and lint-staged. Run `npm run lint` to check.

### Key Architectural Patterns

**Adaptive Interview Algorithm** — lives in three files:

- `lib/scoring.ts` — ranks candidate questions by topic relevance and difficulty fit, applies diversity penalty
- `lib/sampling.ts` — builds the difficulty distribution plan, orchestrates `selectNextQuestion()`
- `lib/questionSelection.ts` — queries the question bank, extracts keywords, normalizes tags

The adaptive loop works client-side: Deepgram's agent calls `get_next_question` as a function call, the client intercepts it, runs `selectNextQuestion()` locally, and returns the next question text to the agent — avoiding a server round-trip per question.

**Function Calling** — the voice agent uses two client-side function definitions:

- `get_next_question` — receives LLM analysis of the last answer, returns the next question or `{ action: "end" }`
- `end_interview` — signals the client to close the session and generate feedback

**Resume Parsing Pipeline** — `lib/resumeParser.ts`:

1. Receives a Buffer + MIME type (PDF or DOCX)
2. Extracts raw text via `pdf-parse` or `mammoth`
3. Sends raw text to GPT-4o-mini with a structured JSON schema prompt
4. Returns a typed `ResumeData` object (name, skills, experience, education, projects, certifications)
5. `formatResumeForPrompt()` converts this into an LLM-friendly string injected into the interviewer's system prompt

**Subscription & Usage Gating** — `useSubscription()` hook fetches the user's tier and usage counters with a localStorage seed (instant on revisit) and a 2-minute stale window on window focus. The `UpgradePrompt` component is rendered in-place when a user exceeds their tier's limits. Usage counters are incremented server-side at the API layer before starting interviews or submitting code.

**PDF Report Generation** — uses PDFKit as a server-side streaming library. The Next.js config externalizes it via `serverComponentsExternalPackages` to avoid bundling issues.

**Field-Level Encryption** — `lib/encryption.ts` implements AES-256-GCM with a random 96-bit IV per encryption. Format stored in MongoDB: `<iv_hex><authTag_hex><ciphertext_hex>`. Decryption is backward-compatible: if the value doesn't match the format it is returned as-is.

### Running Locally

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build && npm start

# Production build (Docker)
docker build -t interview-prep-app .
docker run -p 3000:3000 --env-file .env.local interview-prep-app

# Lint check
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

### Environment Setup Notes

- **Deepgram API Key**: Must have `usage:write` permission. Select "Member" role when creating the key.
- **Clerk**: After creating a Clerk application, configure the sign-in/sign-up URLs in the Clerk dashboard to match the env vars above. Enable Organizations in the Clerk dashboard for team features. Set up a webhook pointing to `/api/webhooks/clerk` with events `user.created` and `user.updated`.
- **MongoDB**: The app connects via the `MONGO_URL` connection string. Ensure your IP is whitelisted in Atlas network access settings.
- **Upstash Redis**: Create a database at upstash.com, copy the REST URL and token. The app degrades gracefully if Redis is unavailable (falls through to MongoDB on every request).
- **Stripe**: For local development, use the Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
- **Piston**: See the `piston/` directory. The `PISTON_API_URL` env var points the app at your self-hosted instance. If unset, it defaults to `http://localhost:2000`.

### Backfill Existing Users to MongoDB

If you had users in Clerk before the MongoDB webhook was set up, run the backfill script:

```bash
npx tsx scripts/sync-clerk-users.ts
```

This paginates through all Clerk users and upserts them to MongoDB without touching subscription data.

### Route Protection

Authentication is handled by Clerk middleware in `middleware.ts`:

- **Public routes**: `/`, `/sign-in(.*)`, `/sign-up(.*)`
- **Everything else** (dashboard, API routes, interview pages) requires authentication
- The `/join/[token]` route requires authentication but is accessible to any Clerk user (not just the interview creator)

### Adding a New API Route

1. Create the route file under `app/api/your-route/route.ts`
2. Import and call `getAuthUserId()` at the top for authentication
3. Import and call `connectDB()` before any database operations
4. Wrap cacheable DB calls with `withCache(key, ttlSeconds, fn)`
5. Call `getRedis().del(key)` after any mutations that affect cached data
6. Return `NextResponse.json(...)` for all responses

### CI / CD Pipeline

On every push to `main`:

1. **CI job**: format check → lint → typecheck → build
2. **build-and-push job**: builds Docker image and pushes to GHCR (`ghcr.io/ahmad4376/interviewprepapp`)
3. **deploy job**: authenticates to GCP, creates/updates the K8s secret from GitHub Secrets, updates the GKE deployment with the new image, and waits for rollout

Pull requests run only the CI job (no push/deploy).

All required secrets are documented in `k8s/secrets.template.yaml` and must be added to **GitHub → Settings → Secrets and variables → Actions** before the deploy job will succeed.
