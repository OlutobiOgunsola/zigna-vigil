# AGENT.md — Zigna Vigil (Cross-Product AI Assistant)

This file tells any agent (or human) everything needed to work on Vigil — the
AI assistant that operates **across all Zigna products**. Read it fully before
touching code. **The `todo.md` workflow at the bottom is mandatory — read it
and follow it.**

---

## 0. TOKEN EFFICIENCY (MANDATORY)

Be ruthlessly efficient with tokens. Print only critical waypoint output —
never echo tool calls, greps, file reads, or obvious progress. Rules:

- Run searches/batches in parallel; don't narrate them.
- Don't print command results back to the user (they already see them).
- Reply tersely: confirmations ≤1 line, summaries concise, no recap of what
  was just shown.
- Batch related edits; avoid tiny sequential tool calls.
- Skip the diff/verbosity unless the user explicitly asks for it.

---

## 0.5 TECHNICAL PATTERN FILE — READ FIRST (MANDATORY)

**Before writing or editing ANY code in this repo, read
`TECHNICAL_PATTERN-VIGIL.md`** (it sits next to this file). It is the
contracted authority for Vigil: the cross-product AI assistant's architecture,
integration patterns, and behavioral contracts.

**Annotation / ditching rule:** the pattern variants in the Zigna family are
deliberately distinct:

- `TECHNICAL_PATTERN-API.md` — API/backend only.
- `TECHNICAL_PATTERN-DASHBOARD.md` — dashboard/frontend only.
- `TECHNICAL_PATTERN-WEB.md` — marketing site only.
- `TECHNICAL_PATTERN-VIGIL.md` — **AI assistant / cross-product layer (this file)**.

**If you are working in an API, DASHBOARD, or WEB task and see this file (or the
VIGIL pattern) referenced: DITCH IT** and read the file that matches the repo
you are actually in. Vigil is a cross-cutting concern — it touches every product
but lives in its own repo. Do not confuse its patterns with product-specific
code.

---

## 1. What this repo is

**Zigna Vigil** is the AI assistant layer that spans all Zigna products. It is
NOT a product itself — it is a **pure orchestration/intelligence module** that
helps users navigate, understand, and get value from every Zigna product
(ZignaLyft, ZignaStay, ZignaWeb, and future verticals).

**The cardinal rule: Vigil knows nothing about product internals.** It has zero
access to product databases, ORM models, internal services, or private
implementation details. It interacts with every product **exclusively through
their published APIs and tools.** If a product doesn't expose an API endpoint
for something, Vigil cannot do it — the product team must expose that API
first.

Vigil's responsibilities:
- **Context awareness** — knows what product the user is in, what they were
  doing, and what they need next — all via product API responses.
- **Cross-product intelligence** — can reference data/insights from one product
  to help in another, but only data the product's API explicitly returns
  (e.g. "Your ZignaLyft check-ins are up 12% this week — want to send a push
  notification to inactive members?").
- **Guided workflows** — walks users through complex multi-step tasks across
  products by calling each product's API in sequence (e.g. onboarding a new
  gym that also needs ZignaStay integration).
- **Proactive suggestions** — surfaces relevant actions before the user asks,
  based on polling or webhook data from product APIs (e.g. "ZignaStay has 3
  pending bookings that conflict with your ZignaLyft class schedule").
- **Unified help** — single entry point for support across all Zigna products.

## 2. Position in the Zigna ecosystem

```
┌─────────────────────────────────────────────────────┐
│                    ZIGNA (parent)                    │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ZignaLyft │ │ZignaStay │ │zigna-web │ │Future  │ │
│  │ (fitness)│ │ (stays)  │ │ (brand)  │ │        │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬───┘ │
│       │             │            │             │     │
│       └──────┬──────┴────────────┴──────┬─────┘     │
│              │                          │           │
│         ┌────▼────────────────────────▼────┐       │
│         │          ZIGNA VIGIL              │       │
│         │    (AI assistant layer)           │       │
│         └──────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

Vigil sits **below the products** (as a shared service) but **above the raw
data** (APIs, databases). It consumes product APIs and exposes a unified
assistant interface.

## 3. Tech stack

| Concern       | Choice                                                        |
| ------------- | ------------------------------------------------------------- |
| Runtime       | Node.js (CommonJS)                                            |
| Framework     | Express 5                                                     |
| Validation    | Joi                                                           |
| Auth          | JWT + sessions (same as ZignaLyft/ZignaStay)                   |
| AI Provider   | Configurable via `AI_PROVIDER` env var (OpenAI / OpenCode / Anthropic / local) |
| Rate Limiting | `express-rate-limit` (per business entity)                    |
| Logging       | Winston + Morgan                                              |
| Security      | Helmet, CORS, cookie-parser                                   |
| Dependencies  | **None** — no Sequelize, no database driver, no ORM           |

## 4. Commands

```bash
npm run dev          # nodemon src/index.js --watch src
npm run start        # node src/index.js
npm run lint         # eslint src/
npm run format       # prettier --write src/
npm test             # echo "No test suite configured yet"
```

## 5. Code conventions

- **TypeScript strict mode.** No `any` types unless absolutely unavoidable
  (and documented why).
- **No trailing semicolons** (matching sibling repos).
- **Functional + composable:** small pure functions, dependency injection for
  product clients, no singletons (testable by design).
- **Error boundaries:** every product integration has its own error handler —
  a failure in ZignaLyft must not crash ZignaStay assistance.
- **Logging:** structured JSON logs with `correlationId` for tracing requests
  across products.
- **File naming:** `kebab-case` for files, `PascalCase` for types/classes,
  `camelCase` for functions/variables.

## 6. Directory structure

```
zigna-vigil/
├── AGENT.md
├── TECHNICAL_PATTERN-VIGIL.md
├── todo.md
├── package.json
├── src/
│   ├── index.js                     # Express server entry point
│   ├── config/
│   │   ├── environment.js           # Env var loader + defaults
│   │   └── permissions.js           # PERMISSIONS + ROLE_PERMISSIONS
│   ├── controllers/
│   │   ├── conversation/            # POST /api/conversation
│   │   └── health/                  # GET /api/health
│   ├── errors/index.js              # BaseError hierarchy
│   ├── lib/literature/
│   │   └── errors.literature.js     # Centralized error messages
│   ├── middleware/
│   │   ├── auth.middleware.js        # Session OR JWT
│   │   ├── businessEntity.middleware.js  # x-gym-id / x-hotel-id
│   │   ├── requireToolAccess.middleware.js # RBAC gate
│   │   ├── rateLimiter.middleware.js     # Per-business-entity
│   │   ├── response.middleware.js    # res.ok/created/etc.
│   │   ├── requestId.middleware.js   # X-Request-Id
│   │   └── logger.middleware.js      # Audit logging
│   ├── routes/
│   │   ├── index.js                  # Master router
│   │   ├── conversation.routes.js
│   │   └── health.routes.js
│   ├── services/
│   │   ├── aiProvider.service.js     # OpenAI / OpenCode / Anthropic / local
│   │   ├── conversation.service.js   # AI analysis + tool execution
│   │   ├── toolAuthorization.service.js
│   │   └── usage.service.js          # Monthly usage tracking
│   ├── tools/
│   │   ├── registry.js               # All tools registered here
│   │   ├── zignalyft/                # ZignaLyft-specific tools
│   │   └── zignastay/                # ZignaStay-specific tools
│   └── utils/
│       └── logging.js
├── docs/
│   └── vigil_usage.schema.sql        # DB schema for product teams
└── .env.example
```

## 7. Gotchas / rules

- **Vigil is NOT a product.** It does not have its own UI (except the dev CLI
  and the embedded widget). Users interact with Vigil *through* the products.
- **API-only integration (HARD RULE).** Vigil NEVER imports product code,
  accesses product databases, reads product ORM models, or reaches into any
  product's internal implementation. Every interaction with a product happens
  through its published HTTP API, CLI tool, or webhook.
- **Cross-product data access requires user consent.** Vigil must never surface
  data from one product to another without explicit permission.
- **Fail gracefully.** If one product's API is down, Vigil must still work for
  the others. No cascading failures.
- **No hallucinated data.** Vigil must never fabricate metrics, user data, or
  product status. If it doesn't know, it says so.
- **Context boundaries.** Each conversation has a context window — Vigil should
  not carry stale context from a previous session without the user re-establishing
  it.
- **Product-specific code belongs in product repos.** Vigil only contains the
  integration layer and the AI logic — not product features.
- **No shared dependencies.** Vigil's `package.json` must NOT import any
  product-internal packages (e.g. `@zigna/zignalyft-models`). If data shapes
  are needed, define them locally in `src/integrations/types.ts` based on the
  product's API documentation.

---

## 8. TODO.md workflow (MANDATORY)

`todo.md` is the shared task ledger for this repo. Every agent MUST follow this flow:

1. **READ `todo.md` FIRST** before starting any work in this repo.
2. **If `todo.md` contains INCOMPLETE todos from a previous task, do NOT wipe, rewrite, or
   overwrite them — STOP and ask the user how to proceed.** The user decides whether to resume,
   abandon, or override the previous task. Never silently discard another agent's unfinished work.
3. **Only WIPE `todo.md` clean when there are NO incomplete todos** (every listed task is
   completed, or the file is empty). Only then write your new task's todos into it, broken into
   small, discrete, completable slices.
4. **Never delete or rewrite completed items.** If the user tells you to continue an in-progress
   task, ADD your todos on top of the current ones and continue from exactly where the last agent
   stopped — keep the existing history intact.
5. **Only overwrite previous agents' todos if the USER explicitly asks you to.** Never assume
   permission to wipe someone else's unfinished work.
6. **UPDATE `todo.md` immediately whenever a slice of the task is fully done** — check it off
   and add short notes on what changed, what remains, and any gotchas the next agent needs.
   Do this at every meaningful milestone, not just at the end.
7. Before finishing a session (or handing off), make sure `todo.md` accurately reflects reality:
   what is done, what is in progress, what is blocked, and what the next agent should do first.
8. Treat `todo.md` as ground truth for handoff. If the last task is unfinished, its context
   carries forward through this file — never assume a task was completed unless `todo.md` says so.

## Task Planning

- Before writing code, add a `## Task Plan` section to `todo.md` containing a full breakdown of how you will tackle the task: the slices/steps, exactly what you'll change in each file, and how each step is verified. Treat this plan as the contract for the work and update it as you progress.
- Do not move a slice into `## In Progress` until its plan is written and the previous slice (if any) is verified complete.
- A slice is not done until it compiles, passes lint, and any defined tests pass.

## Completion Summaries

- Upon completion of each slice, print a concise summary of what was done (files changed, behavior, and how it was verified) in your response before finishing the turn. Do not bury it in code comments or commit messages — surface it in plain text so the user and the next agent see it.
- The summary should cover: what changed, what was built/verified, and what remains.
- **The summary MUST include a "## How to test" section** with a concrete verification process:
  - The exact commands to run (build, test, lint).
  - What behavior to observe or verify.
  - Any environment variables or dependencies needed.
  - A cleanup/restore step so running the test does not leave stray state behind.
- Treat this test process as the exit condition for the slice: the slice is only "done" once the user can follow the steps and verify the behavior themselves.
