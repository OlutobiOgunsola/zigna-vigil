# TECHNICAL PATTERN — VIGIL / AI ASSISTANT (Cross-Product)

> ## APPLICABILITY NOTICE — READ BEFORE USING THIS FILE
>
> **This is the VIGIL technical pattern file.** It is the contracted
> architecture + behavior authority for the **Zigna Vigil AI assistant** — the
> cross-product intelligence layer that operates across all Zigna products:
>
> - `zigna-vigil`
>
> It is **NOT** for individual product repos (`zignalyft-api`, `zignastay-api`,
> `zignalyft-dashboard`, `zigna-web`, etc.). Each of those has its own technical
> pattern file.
>
> **If you picked this file up while working on an API, DASHBOARD, or WEB task:
> DITCH IT.** This repo is the **AI assistant layer** — it consumes product APIs,
> it does not implement product features. For API work read
> `TECHNICAL_PATTERN-API.md`; for dashboard UI read
> `TECHNICAL_PATTERN-DASHBOARD.md`; for marketing site read
> `TECHNICAL_PATTERN-WEB.md`.

---

## 1. What this file is for

**Zigna Vigil** is the AI assistant that operates across all Zigna products.
It is the intelligent overlay — the layer that receives a user message, analyses
it with an AI provider, determines which tool to call, validates the user has
access to that tool, executes it, and returns a unified response.

Vigil is NOT a product. It has **no database, no ORM models, no user table**.
It is a **pure orchestration/intelligence service** that:
- Authenticates users (same pattern as ZignaLyft/ZignaStay).
- Scopes requests to a business entity (`x-gym-id` or `x-hotel-id`).
- Analyses incoming messages via an external AI provider.
- Routes intent to registered tools after validating user access.
- Returns unified, contextual responses.
- Tracks AI usage per business entity on a monthly basis.

## 2. Tech stack

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

### Why CommonJS (not TypeScript)

Both sister APIs (`zignalyft-api`, `zignastay-api`) are pure JavaScript with
CommonJS modules. Vigil matches this convention. No `tsconfig.json`, no
compilation step, no `require`/`import` mismatches. `require()` / `module.exports`
everywhere.

## 3. Architecture

### 3.0 The cardinal rule: API-only integration

**Vigil knows NOTHING about product internals — no database schemas, no ORM
models, no internal service classes.** Every interaction with a Zigna product
happens through that product's **published API surface.** This is non-negotiable.

| ❌ Vigil MUST NOT | ✅ Vigil MUST |
| ------------------ | -------------- |
| Import `zignalyft-api/src/models/User` | Call `GET /api/member/:id` |
| Query ZignaLyft's MySQL database | Use ZignaLyft's API to fetch data |
| Import ZignaStay's Sequelize models | Call ZignaStay's REST API |
| Share a database connection with any product | Use HTTP clients with auth tokens |
| Access product `.env` files or configs | Use its own `.env` with API endpoint URLs |
| Import any `@zigna/*` internal packages | Define tool input/output schemas locally |

**If Vigil needs data a product doesn't expose via API:** Open an issue with
the product team requesting the endpoint. Do NOT work around it by reaching
into their codebase.

### 3.1 Request lifecycle

```
HTTP Request
  → helmet / cors / cookieParser / json body parser
  → morgan (request logging)
  → requestId middleware (X-Request-Id or crypto.randomUUID)
  → response middleware (res.ok, res.created, etc.)
  → [Route middleware chain]:
       authMiddleware         → session OR JWT → req.userId, req.isSuperAdmin
       businessEntityContext  → x-gym-id / x-hotel-id → req.activeBusinessId, req.activeBusinessType
       rateLimiter            → per-business-entity rate limit
       requireToolAccess      → validate user has access to the resolved tool
  → Controller (thin: extract from req, call service, return via res helper)
  → Service (AI provider call, tool execution, business logic)
  → Response via res.ok({ message, data })
  → OR error → next(error) → global error handler → typed response envelope
```

### 3.2 Middleware stack (matches sister APIs)

Vigil's middleware follows the **exact same pattern** as `zignalyft-api` and
`zignastay-api`:

```
auth.middleware.js          → session (Redis) OR Bearer JWT → req.userId, req.isSuperAdmin
businessEntity.middleware.js → x-gym-id OR x-hotel-id header → req.activeBusinessId, req.activeBusinessType
requireToolAccess.middleware.js → checks user's role against tool's required permissions
rateLimiter.middleware.js    → express-rate-limit keyed by business entity
```

**Auth middleware** is identical to the sister APIs:
```js
// Dual-mode: session (dashboard) OR JWT (mobile/API)
if (req.session && req.session.userId) {
  req.userId = req.session.userId;
  req.isSuperAdmin = req.session.isSuperAdmin;
  return next();
}
const authHeader = req.headers.authorization;
if (authHeader && authHeader.startsWith('Bearer ')) {
  const decoded = verifyToken(authHeader.split(' ')[1]);
  req.userId = decoded.userId;
  req.isSuperAdmin = decoded.isSuperAdmin;
  return next();
}
throw new UnauthorizedError('Not authenticated');
```

**Business entity context** combines both product patterns:
```js
// Reads x-gym-id OR x-hotel-id (at least one required)
const gymId = req.headers['x-gym-id'];
const hotelId = req.headers['x-hotel-id'];
if (!gymId && !hotelId) {
  throw new ForbiddenError('No business context. Provide an X-Gym-Id or X-Hotel-Id header.');
}
// Resolves membership, sets req.activeBusinessId + req.activeBusinessType
```

### 3.3 Tool registry and authorization

Vigil's core abstraction is the **tool**. A tool is a discrete action Vigil can
take on behalf of a user (e.g. "get member list", "create booking", "check room
availability"). Tools are registered at startup and invoked by the AI after
request analysis.

**Tool definition:**
```js
// src/tools/registry.js
const tools = {
  'zignalyft.members.list': {
    name: 'List gym members',
    description: 'Fetch the list of members for the active gym',
    businessType: 'gym',
    requiredPermissions: ['zignalyft:members:view_all', 'zignalyft:members:view_assigned'],
    handler: require('./zignalyft/members.list'),
  },
  'zignastay.bookings.create': {
    name: 'Create a booking',
    description: 'Create a new booking for the active hotel',
    businessType: 'hotel',
    requiredPermissions: ['zignastay:bookings:create'],
    handler: require('./zignastay/bookings.create'),
  },
};
```

**Authorization gate** (`requireToolAccess` middleware):
- After the AI resolves which tool to call, this middleware checks:
  1. Does the tool exist?
  2. Is the tool's `businessType` compatible with the request's `activeBusinessType`?
  3. Does the user's role grant any of the tool's `requiredPermissions`?
- `super_admin` bypasses all permission checks (matching sister APIs).
- If unauthorized, returns 403 — the tool is never executed.

### 3.4 AI provider integration

The AI provider is configurable via env var and abstracted behind a uniform
interface. Vigil sends the user's message + available tools to the provider,
and the provider returns which tool to call (if any) and with what arguments.

```js
// src/services/aiProvider.service.js
module.exports = {
  async analyse({ message, tools, context }) {
    // Calls the configured AI_PROVIDER
    // Returns: { tool: 'zignalyft.members.list', args: {...}, response: '...' }
    // Or: { tool: null, response: 'Here is what I found...' } (no tool needed)
  },
};
```

**Provider config (from `.env`):**
```
AI_PROVIDER=opencode          # opencode | openai | anthropic | local
AI_API_KEY=your-api-key       # provider API key
AI_MODEL=qwen3.7-plus         # model name
AI_BASE_URL=                  # optional override (for local/proxy)
```

### 3.5 MVC structure

Matches `zignalyft-api` and `zignastay-api` exactly:

```
src/
├── index.js                          # Express server entry point
├── config/
│   ├── environment.js                # Env var loader + defaults
│   └── permissions.js                # PERMISSIONS constants + ROLE_PERMISSIONS map
├── controllers/
│   ├── conversation/
│   │   ├── conversation.controller.js
│   │   └── index.js                  # Registry
│   └── health/
│       ├── health.controller.js
│       └── index.js
├── errors/
│   └── index.js                      # BaseError hierarchy (identical to sister APIs)
├── lib/
│   └── literature/
│       └── errors.literature.js      # Centralized error message constants
├── middleware/
│   ├── auth.middleware.js            # Session OR JWT (identical to sister APIs)
│   ├── businessEntity.middleware.js  # x-gym-id / x-hotel-id resolution
│   ├── logger.middleware.js          # Audit log on response finish
│   ├── requestId.middleware.js       # X-Request-Id generation
│   ├── requireToolAccess.middleware.js # Tool authorization gate
│   ├── response.middleware.js        # res.ok/res.created/res.notFound/etc.
│   └── rateLimiter.middleware.js     # Per-business-entity rate limiting
├── routes/
│   ├── index.js                      # Master router (mounts sub-routers + error handler)
│   ├── conversation.routes.js
│   └── health.routes.js
├── services/
│   ├── aiProvider.service.js         # AI provider abstraction
│   ├── conversation.service.js       # Request analysis + tool execution orchestration
│   ├── toolAuthorization.service.js  # Role → permission resolution for tools
│   └── usage.service.js              # Monthly usage tracking (per business entity)
└── tools/
    ├── registry.js                   # Tool registry (all tools registered here)
    ├── zignalyft/                    # ZignaLyft-specific tools
    │   ├── members.list.js
    │   └── members.create.js
    └── zignastay/                    # ZignaStay-specific tools
        ├── bookings.list.js
        └── bookings.create.js
```

**No `models/` directory.** Vigil has no database. No Sequelize, no migrations,
no seeders. If product data is needed, it comes from product APIs via tools.

### 3.6 Error handling (identical to sister APIs)

**Custom error classes** (`src/errors/index.js`):
```
BaseError (500)
├── ValidationError (400)
├── ClientError (400)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── NotFoundError (404)
├── UnprocessableError (422)
├── ApiRateLimitError (429)
```

**Error response envelope:**
```json
{
  "request_id": "uuid",
  "status": false,
  "error": true,
  "responseCode": 403,
  "message": "You do not have permission to access this tool."
}
```

**Success response envelope:**
```json
{
  "request_id": "uuid",
  "status": true,
  "message": "Tool executed successfully",
  "data": { ... }
}
```

### 3.7 Rate limiting

Rate limiting is keyed by **business entity** — not by IP or user. This means
a gym with 50 staff members shares one rate limit bucket, preventing any single
entity from exhausting AI provider quota.

```js
// Per business entity: 60 requests/minute
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => `${req.activeBusinessType}:${req.activeBusinessId}`,
  handler: (req, res) => {
    res.status(429).json({
      request_id: req.request_id,
      status: false,
      error: true,
      responseCode: 429,
      message: 'Rate limit exceeded for this business entity. Try again in a minute.',
    });
  },
});
```

### 3.8 AI usage tracking

Vigil tracks every AI interaction on a monthly basis per business entity.
Usage is recorded by posting to the product API after each interaction, and
stored in `vigil_usage` tables in each product's database.

**Usage record:**
```json
{
  "business_id": 1,
  "business_type": "gym",
  "user_id": 42,
  "month": "2026-08",
  "tool_name": "zignalyft.members.list",
  "ai_provider": "opencode",
  "ai_model": "qwen3.7-plus",
  "input_tokens": 850,
  "output_tokens": 220,
  "tool_executed": true,
  "duration_ms": 1200,
  "created_at": "2026-08-17T10:30:00Z"
}
```

**Product API contract** (products must implement):
```
POST /api/vigil/usage    — record a usage event
GET  /api/vigil/usage    — query usage (super_admin only, supports ?month=YYYY-MM)
```

The `vigil_usage` table schema is in `docs/vigil_usage.schema.sql` — product
teams add this to their own database.

## 4. Code conventions

- **CommonJS** — `require()` / `module.exports`. No ESM, no `import`/`export`.
- **No trailing semicolons** (matching sister APIs).
- **Single quotes**, 2-space indent, 100 char print width, ES5 trailing commas.
- **snake_case** for DB-style identifiers (headers, JSON keys).
- **camelCase** for JS variables and function names.
- **Controllers** are thin — extract from `req`, call one service, return via
  `res` helper. Always `try/catch` with `next(error)`.
- **Services** own all business logic, validation (Joi), and external API calls.
- **No models directory** — Vigil has no database.
- **Error messages** live in `src/lib/literature/errors.literature.js`, never
  inline in service/controller code.

## 5. Commands

```bash
npm run dev          # nodemon src/index.js --watch src
npm run start        # node src/index.js
npm run lint         # eslint src/
npm run format       # prettier --write src/
npm test             # echo "No test suite configured yet"
```

## 6. Environment variables

```bash
# Server
PORT=3100
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:7002

# Auth (same as sister APIs)
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
REDIS_URL=redis://localhost:6379

# AI Provider
AI_PROVIDER=opencode
AI_API_KEY=your-api-key
AI_MODEL=qwen3.7-plus
AI_BASE_URL=

# Product API URLs (for tool execution)
ZIGNALYFT_API_URL=http://localhost:7001/api
ZIGNASTAY_API_URL=http://localhost:7003/api

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

## 7. When this file is NOT the authority

If you are building product-specific features, you are in the wrong repo.
Switch to:

- `TECHNICAL_PATTERN-API.md` (zignalyft-api, zignastay-api)
- `TECHNICAL_PATTERN-DASHBOARD.md` (zignalyft-dashboard, zignastay-dashboard)
- `TECHNICAL_PATTERN-WEB.md` (zigna-web)

Vigil only touches product APIs — it never implements product logic.
