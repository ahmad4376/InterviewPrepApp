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

The platform supports both **individual practice** and **mass interview campaigns** (interviewers share a link with multiple candidates and review all results from a dashboard). A Stripe-backed subscription model controls access: Free, Pro ($9/mo), and Business ($49/mo).

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
- Run code against visible test cases with real output and execution time
- Submit to run hidden test cases with pass/fail summary
- Submission history per problem
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

### Dashboard

- View all interviews with status tracking (Scheduled / In Progress / Completed)
- Search and filter by title, company, or status
- Sort by date or name
- Edit interview details before starting
- Delete interviews with confirmation

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
| Database       | MongoDB Atlas + Mongoose 9                                                     |
| Authentication | Clerk (sign-up/sign-in, organizations, session management, middleware)         |
| Payments       | Stripe (subscriptions, usage limits, customer portal)                          |
| Styling        | Tailwind CSS 3, SASS, Radix UI primitives, Framer Motion                       |
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
│   │   ├── candidates/                 # Mass interview candidate list
│   │   │   └── [sessionId]/feedback/  # Per-candidate feedback
│   │   └── compare/                    # Side-by-side candidate comparison
│   ├── coding-results/[id]/           # Coding interview results
│   ├── billing/                        # Subscription plans + usage meter
│   ├── profile/                        # User profile settings
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
│   ├── interviews/                     # Interview CRUD + join + reports
│   ├── candidate-sessions/             # Candidate session management + reports
│   ├── coding-interviews/              # Coding interview management
│   ├── leetcode/                       # Problem fetch + code execution
│   ├── submissions/                    # Submission history
│   ├── billing/                        # Stripe checkout + portal + webhooks
│   └── health/                         # Health check endpoint
│
├── components/                         # React components
│   ├── App.js                          # Core voice interaction component
│   ├── analytics/                      # VolumeChart, ScoreChart, PipelineChart
│   ├── subscription/                   # UpgradePrompt, UsageMeter, TierBadge
│   ├── ui/                             # Shared UI primitives (card, button, etc.)
│   ├── landing/                        # Landing page sections
│   ├── FeedbackDisplay.tsx             # Feedback visualization
│   ├── InterviewTranscript.tsx         # Transcript viewer
│   └── EditInterviewModal.tsx          # Interview edit form
│
├── context/                            # React context providers
│   ├── VoiceBotContextProvider.tsx     # Voice bot state (reducer-based)
│   ├── DeepgramContextProvider.js      # Deepgram SDK connection
│   └── MicrophoneContextProvider.js   # Browser microphone access
│
├── lib/                                # Server-side utilities
│   ├── auth.ts                         # Clerk auth helper
│   ├── mongodb.ts                      # MongoDB connection singleton
│   ├── openai.ts                       # OpenAI: question generation + feedback
│   ├── questionSelection.ts            # Question bank querying + keyword extraction
│   ├── scoring.ts                      # Candidate ranking + topic matching
│   ├── sampling.ts                     # Adaptive question selection algorithm
│   ├── resumeParser.ts                 # PDF/DOCX → structured resume data (via AI)
│   ├── constants.ts                    # Interview configs + voice definitions
│   └── types.ts                        # Shared TypeScript interfaces
│
├── models/                             # Mongoose schemas
│   ├── Interview.ts                    # Interview document
│   ├── CandidateSession.ts             # Mass interview candidate session
│   ├── Question.ts                     # Question bank entry
│   ├── LeetcodeQuestion.ts             # Coding problem
│   ├── Submission.ts                   # Code submission record
│   └── User.ts                         # User + subscription tier
│
├── utils/                              # Client-side utilities
│   ├── deepgramUtils.ts                # WebSocket config builders
│   └── audioUtils.js                   # Audio processing helpers
│
├── join/[token]/session/[sessionId]/  # Public route for mass interview candidates
├── sign-in/                            # Clerk sign-in page
├── sign-up/                            # Clerk sign-up page
├── page.tsx                            # Landing page
└── layout.tsx                          # Root layout (ClerkProvider)

scripts/
├── data/                               # Question bank JSON data
└── seed-questions.ts                   # DB seed script

k8s/                                    # Kubernetes manifests (GKE deployment)
├── deployment.yaml
├── service.yaml
└── namespace.yaml

middleware.ts                           # Clerk route protection
Dockerfile                              # Production container (standalone output)
```

### Database Models

**Interview** — Stores interview configuration, adaptive state, transcript, and AI feedback. Supports individual and mass interview modes via `isMassInterview` and `shareToken` fields.

**CandidateSession** — Tracks each candidate's progress in a mass interview. Contains its own copy of the adaptive state, transcript, and feedback, independent from the parent interview template.

**Question** — Question bank entries with `question_text`, `answer_text`, `tags`, `difficulty_score` (1–5), and `rank_value` for relevance ordering.

**LeetcodeQuestion** — Coding problem with description, examples, test cases (visible + hidden), starter templates per language, and difficulty bucket (easy / medium / hard).

**Submission** — Records each code submission: user, problem, language, code, pass/fail, and hidden test case summary.

**User** — Clerk user reference with subscription tier (`free` / `pro` / `business`), usage counters, and Stripe customer/subscription IDs.

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
3. **Run** executes visible test cases and shows output, execution time, and errors in the console panel.
4. **Submit** runs both visible and hidden test cases. Pass/fail counts for hidden tests are shown separately.
5. Submission history is persisted per user and problem.

### API Endpoints

| Method   | Endpoint                                     | Description                                                  |
| -------- | -------------------------------------------- | ------------------------------------------------------------ |
| `POST`   | `/api/interviews`                            | Create a new interview (generates questions + sampling plan) |
| `GET`    | `/api/interviews`                            | List all interviews for the authenticated user               |
| `GET`    | `/api/interviews/[id]`                       | Get interview details                                        |
| `PATCH`  | `/api/interviews/[id]`                       | Update interview (status, fields, feedback)                  |
| `DELETE` | `/api/interviews/[id]`                       | Delete an interview                                          |
| `GET`    | `/api/interviews/[id]/report`                | Download PDF report                                          |
| `GET`    | `/api/interviews/[id]/candidates`            | List candidates for a mass interview                         |
| `GET`    | `/api/interviews/join/[token]`               | Check join status for a mass interview                       |
| `POST`   | `/api/interviews/join/[token]`               | Create a candidate session                                   |
| `GET`    | `/api/candidate-sessions/[sessionId]`        | Get candidate session details                                |
| `PATCH`  | `/api/candidate-sessions/[sessionId]`        | Update candidate session                                     |
| `GET`    | `/api/candidate-sessions/[sessionId]/report` | Download candidate PDF report                                |
| `POST`   | `/api/authenticate`                          | Get a Deepgram access token for WebSocket                    |
| `GET`    | `/api/leetcode`                              | List coding problems                                         |
| `GET`    | `/api/leetcode/[id]`                         | Get a single coding problem                                  |
| `POST`   | `/api/leetcode/execute`                      | Execute code against test cases                              |
| `GET`    | `/api/submissions`                           | Get submission history for the authenticated user            |
| `POST`   | `/api/submissions`                           | Save a code submission                                       |
| `GET`    | `/api/coding-interviews/[id]`                | Get coding interview details                                 |
| `POST`   | `/api/billing/checkout`                      | Create a Stripe checkout session                             |
| `POST`   | `/api/billing/portal`                        | Open Stripe customer portal                                  |
| `POST`   | `/api/billing/webhook`                       | Handle Stripe webhook events                                 |
| `GET`    | `/api/health`                                | Health check (used by Kubernetes readiness probe)            |

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
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe (optional for local dev — billing features will be disabled without these)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
```

> `.env.local` is gitignored and never committed. Ask a team member for the shared dev keys.

### Seed the Question Bank (Optional)

The app can generate questions via OpenAI on the fly, but for better relevance you can seed MongoDB with a pre-built question bank:

```bash
npx tsx scripts/seed-questions.ts
```

This imports questions from `scripts/data/combined_2.json` and assigns difficulty scores heuristically based on tags.

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

**Subscription & Usage Gating** — `useSubscription()` hook fetches the user's tier and usage counters. The `UpgradePrompt` component is rendered in-place when a user exceeds their tier's limits. Usage counters are incremented server-side at the API layer before starting interviews or submitting code.

**PDF Report Generation** — uses PDFKit as a server-side streaming library. The Next.js config externalizes it via `serverComponentsExternalPackages` to avoid bundling issues.

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

### Database Seeding

To populate or update the question bank:

```bash
npx tsx scripts/seed-questions.ts
```

The seed script reads from `scripts/data/combined_2.json` and assigns difficulty scores (1–5) based on tag heuristics. It uses upsert operations, so it is safe to run repeatedly.

### Environment Setup Notes

- **Deepgram API Key**: Must have `usage:write` permission. Select "Member" role when creating the key.
- **Clerk**: After creating a Clerk application, configure the sign-in/sign-up URLs in the Clerk dashboard to match the env vars above. Enable Organizations in the Clerk dashboard for team features.
- **MongoDB**: The app connects via the `MONGO_URL` connection string. Ensure your IP is whitelisted in Atlas network access settings.
- **Stripe**: For local development, use the Stripe CLI to forward webhooks: `stripe listen --forward-to localhost:3000/api/billing/webhook`. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

### Route Protection

Authentication is handled by Clerk middleware in `middleware.ts`:

- **Public routes**: `/`, `/sign-in(.*)`, `/sign-up(.*)`
- **Everything else** (dashboard, API routes, interview pages) requires authentication
- The `/join/[token]` route requires authentication but is accessible to any Clerk user (not just the interview creator)

### Adding a New API Route

1. Create the route file under `app/api/your-route/route.ts`
2. Import and call `getAuthUserId()` at the top for authentication
3. Import and call `connectDB()` before any database operations
4. Return `NextResponse.json(...)` for all responses

### Adding New Question Bank Topics

1. Add questions to `scripts/data/combined_2.json` following the existing schema:
   ```json
   {
     "question_id": "unique-id",
     "question_title": "Short title",
     "question_text": "The full question",
     "answer_text": "Expected answer",
     "tags": ["topic1", "topic2"],
     "rank_value": 0
   }
   ```
2. Run the seed script to import
3. Update tag alias maps in `lib/scoring.ts` if introducing new synonyms

### Extending the Adaptive Algorithm

- To change the difficulty distribution, modify `DIFFICULTY_WEIGHTS` in `lib/sampling.ts`
- To adjust how response quality maps to difficulty changes, modify `getTargetDifficulty()` in `lib/scoring.ts`
- To change topic matching behavior, update `tagsMatch()` and `TAG_ALIASES` in `lib/scoring.ts`

### CI / CD Pipeline

On every push to `main`:

1. **CI job**: format check → lint → typecheck → build
2. **build-and-push job**: builds Docker image and pushes to GHCR (`ghcr.io/ahmad4376/interviewprepapp`)
3. **deploy job**: authenticates to GCP, updates the GKE deployment with the new image, and waits for rollout

Pull requests run only the CI job (no push/deploy).
