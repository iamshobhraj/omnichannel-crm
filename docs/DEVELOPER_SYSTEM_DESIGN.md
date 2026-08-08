# Omnichannel CRM + AI Lead Platform  
## Developer System Design Guide

**Audience:** Engineers building and maintaining this product  
**Status:** Implementation spec — share with developers before coding  
**Related:** [README.md](./README.md) · [TECH_STACK_AND_SERVER_REQUIREMENTS.md](./TECH_STACK_AND_SERVER_REQUIREMENTS.md) · [10_DAY_DELIVERY_PLAN.md](./10_DAY_DELIVERY_PLAN.md) · [CLIENT_SETUP_CHECKLIST.md](./CLIENT_SETUP_CHECKLIST.md)

This document describes **how the system must be built**: architecture, modules, data model, APIs, integrations, AI patterns, jobs, cost metering, deployment, and reliability. Follow it unless a written decision changes it.

---

## 1. Product intent (for engineers)

Build a **single-tenant** omnichannel CRM for one Turkish client company:

1. Website chat + WhatsApp land in **one inbox**
2. AI answers FAQs and **qualifies leads** with controlled questions
3. Sales work **contacts, leads, pipeline, tasks, follow-ups**
4. **Google Ads / UTM / gclid** attribute lead source
5. Management sees **daily cost, cost per lead, margin** inside the app

**Not building now:** multi-company SaaS UI, IG/FB inbox, ERP, visual workflow builder, AWS/K8s.

**Future-proof rule:** every business row carries `tenant_id` (one tenant row at launch). Never hardcode the client company name in business logic. Integrations live in `integration_connections` keyed by tenant.

---

## 2. Locked tech stack

| Layer | Choice | Notes |
|--------|--------|--------|
| Language | TypeScript | End-to-end |
| Frontend | Next.js (App Router) + React + Tailwind | Dashboard + embeddable widget package |
| Backend | NestJS on Node.js 20 | REST + WebSocket (or SSE) |
| DB | PostgreSQL 16 + **pgvector** | Relational + FAQ embeddings |
| Cache / queues | Redis 7 + **BullMQ** | Sessions optional; jobs required |
| AI | OpenAI API | Mini models + `text-embedding-3-small` |
| WhatsApp | **AiSensy** BSP | Adapter pattern — not raw Meta first |
| Email | Resend | Invites + alerts |
| Ads | UTM/`gclid` capture + Google Ads light | Attribution on leads |
| Packaging | Docker Compose | One EU VPS |
| Edge | Cloudflare | DNS + SSL for `app.` + `api.` |
| CI/CD | GitHub Actions | Deploy over SSH to VPS |
| Monitoring | `/health` + Sentry + uptime checker | Required for launch |

Do not swap stack pieces casually. Compatibility and support cost depend on this set.

---

## 3. High-level architecture

```
                    THIS CLIENT (1 tenant)
[Website chat widget]  [AiSensy WhatsApp]  [Google Ads / forms]
         |                     |                    |
         v                     v                    v
              ┌────────────────────────────────┐
              │     NestJS API  (+ Worker)     │
              │  REST · WS/SSE · webhooks      │
              │  BullMQ processors             │
              └────────────┬───────────────────┘
         +-----------------+------------------+
         v                 v                  v
  PostgreSQL+pgvector    Redis 7         Local disk
  (data + embeddings)   (queues)      (uploads MVP)
         │
         v
  Next.js dashboard (agents / admins)
```

### Runtime processes (Compose services)

| Service | Responsibility |
|---------|----------------|
| `web` | Next.js dashboard |
| `api` | NestJS HTTP + WebSocket gateway |
| `worker` | BullMQ consumers (follow-ups, AI jobs, cost rollups, SLA) |
| `postgres` | PostgreSQL 16 + pgvector |
| `redis` | Redis 7 |
| `caddy` / `nginx` | TLS reverse proxy to `web` + `api` |

**Rule:** long-running / retryable work goes to **worker**, not the HTTP request thread (AI embeds, bulk rollups, reminder scans).

---

## 4. Recommended repository layout

```
omnichannel-crm/
├── apps/
│   ├── api/                 # NestJS
│   ├── web/                 # Next.js dashboard
│   └── widget/              # Embeddable chat widget (Vite/React or Next static)
├── packages/
│   ├── shared/              # Zod schemas, DTO types, enums, constants
│   └── config/              # eslint/tsconfig shared
├── deploy/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Caddyfile (or nginx.conf)
│   └── scripts/backup-db.sh · restore-db.sh · healthcheck.sh
├── docs/                    # This pack
├── .github/workflows/deploy.yml
└── .env.example
```

Monorepo preferred (pnpm/npm workspaces). If splitting repos, keep `shared` types duplicated carefully — prefer one repo for this client delivery.

---

## 5. Domain model & core concepts

### 5.1 Important distinctions

| Concept | Meaning |
|---------|---------|
| **Tenant / Workspace** | The client company. One row at launch. |
| **Contact** | Person/company identity (channel-agnostic). |
| **Lead** | Sales opportunity linked to a contact (pipeline, score, value). |
| **Conversation** | Thread in the inbox (web or WhatsApp). |
| **Message** | Single inbound/outbound unit inside a conversation. |
| **Channel** | `website` \| `whatsapp` \| `google_ads` \| `manual`. |
| **Task** | Follow-up / SLA / manual to-do. |
| **Usage event** | Billable/metered action (AI tokens, WA msg, etc.). |

**Contact ≠ Lead.** A contact can have zero or many leads over time. Inbox is about conversations; CRM pipeline is about leads.

### 5.2 Default pipeline stages (configurable)

`New → Qualified → Demo → Proposal → Won → Lost`

Seed these on tenant create. Do not hardcode stage names in business logic — use stage `key` / `id`.

### 5.3 Roles

| Role | Can |
|------|-----|
| **Owner** | Everything + billing/budgets/integrations |
| **Admin** | Users, KB, pipelines, rate cards, most settings |
| **Agent** | Inbox, contacts, leads, tasks assigned/available; **no** budget/rate-card edit |

Enforce on API with guards/policies, not only UI hiding.

---

## 6. Data model (tables developers must implement)

Every business table includes:

- `id` (UUID)
- `tenant_id` (FK → tenants)
- `created_at`, `updated_at`
- Soft delete optional (`deleted_at`) where useful for KVKK/audit

### 6.1 Identity & access

**`tenants`**  
`id`, `name`, `slug`, `timezone` (default `Europe/Istanbul`), `locale_default` (`tr`/`en`), `settings` JSONB

**`users`**  
`id`, `tenant_id`, `email`, `password_hash`, `name`, `role` (`owner`|`admin`|`agent`), `is_active`, `last_login_at`

**`teams`** (optional MVP)  
`id`, `tenant_id`, `name`

**`audit_logs`**  
`id`, `tenant_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `before` JSONB, `after` JSONB, `ip`

### 6.2 CRM

**`contacts`**  
`id`, `tenant_id`, `display_name`, `company_name`, `email`, `phone`, `city`, `country`,  
`source` (`website`|`whatsapp`|`google_ads`|`manual`|…),  
`consent_whatsapp_marketing` bool,  
`utm_source`, `utm_medium`, `utm_campaign`, `gclid`, `landing_url`,  
`owner_user_id` nullable, `metadata` JSONB

**`contact_identities`**  
`id`, `tenant_id`, `contact_id`, `type` (`email`|`phone`|`whatsapp_id`|`web_visitor_id`), `value`, **unique** `(tenant_id, type, value)`

Use identities to merge: same WhatsApp number + later web email → same contact when confidently matched.

**`pipelines`** / **`pipeline_stages`**  
Stages: `id`, `pipeline_id`, `key`, `name`, `position`, `is_won`, `is_lost`

**`leads`**  
`id`, `tenant_id`, `contact_id`, `pipeline_id`, `stage_id`, `title`,  
`status` derived from stage or explicit,  
`score` int, `owner_user_id`,  
`source`, campaign fields (denormalized or via attribution),  
`next_followup_at`, `expected_value`, `won_amount`, `attributed_cost`,  
`lost_reason` nullable, `tags` text[] or join table

**`notes`**, **`tags`**, **`lead_tags`** as needed.

**`tasks`**  
`id`, `tenant_id`, `type` (`follow_up`|`sla`|`manual`),  
`lead_id` / `contact_id` / `conversation_id` nullable,  
`assignee_user_id`, `due_at`, `completed_at`, `title`, `body`, `status`

### 6.3 Inbox

**`channels`**  
`id`, `tenant_id`, `type` (`website`|`whatsapp`), `name`, `config` JSONB, `is_active`

**`conversations`**  
`id`, `tenant_id`, `contact_id`, `channel_id`, `channel_type`,  
`external_thread_id` nullable,  
`status` (`open`|`pending`|`closed`),  
`assignee_user_id`, `last_message_at`, `ai_mode` (`auto`|`suggest`|`off`),  
`handoff_at` nullable

**`messages`**  
`id`, `tenant_id`, `conversation_id`,  
`direction` (`inbound`|`outbound`),  
`sender_type` (`contact`|`agent`|`bot`|`system`),  
`sender_user_id` nullable,  
`body_text`, `body_html` nullable, `attachments` JSONB,  
`external_message_id` **unique per tenant** (webhook dedupe),  
`delivery_status`, `ai_meta` JSONB (model, tokens),  
`created_at`

**Indexes:** `(tenant_id, conversation_id, created_at)`, unique `(tenant_id, external_message_id)` where not null.

### 6.4 AI / knowledge

**`bot_profiles`**  
`id`, `tenant_id`, `name`, `system_prompt`, `qualification_schema` JSONB, `handoff_rules` JSONB, `is_default`

**`knowledge_documents`**  
`id`, `tenant_id`, `title`, `source_filename`, `status` (`processing`|`ready`|`failed`)

**`knowledge_chunks`**  
`id`, `document_id`, `tenant_id`, `content`, `embedding` vector(…), `token_count`, `metadata` JSONB  
Index: ivfflat / hnsw on embedding (pgvector).

### 6.5 Automations & notifications

**`automation_rules`** — trigger + conditions + actions (MVP: few hardcoded rule types OK)  
**`automation_runs`** — execution log  
**`notifications`** — in-app; email sent via Resend with `email_message_id`

### 6.6 Integrations & ads

**`integration_connections`**  
`id`, `tenant_id`, `provider` (`aisensy`|`resend`|`openai`|`google_ads`),  
`credentials_encrypted`, `config` JSONB, `status`

**`ad_attributions`**  
`id`, `tenant_id`, `contact_id` / `lead_id`,  
`gclid`, `utm_*`, `campaign`, `ad_group`, `keyword`, `landing_url`, `raw` JSONB

### 6.7 Cost & margin

**`rate_cards`**  
Unit costs: OpenAI per 1K input/output tokens, WA message approx, email, VPS $/day, optional ads spend daily manual

**`usage_events`**  
`id`, `tenant_id`, `category` (`ai`|`whatsapp`|`email`|`ads`|`server`),  
`event_type`, `quantity`, `unit_cost`, `total_cost`,  
`lead_id` / `contact_id` / `conversation_id` / `message_id` nullable,  
`occurred_at`, `meta` JSONB

**`cost_daily_aggregates`**  
Per day + category (+ optional source): totals, lead counts, CPL

**`budget_policies`**  
Daily/monthly caps, warn at 70/90, soft vs hard

---

## 7. Module map (how to structure NestJS)

Implement as Nest modules with clear boundaries:

| Module | Owns |
|--------|------|
| `AuthModule` | Login, JWT/session, password hashing, guards |
| `TenantsModule` | Workspace bootstrap/settings |
| `UsersModule` | User CRUD, roles |
| `ContactsModule` | Contacts + identities + merge helpers |
| `LeadsModule` | Leads, stages, scoring hooks |
| `InboxModule` | Conversations, messages, assign, close |
| `RealtimeModule` | WS/SSE gateway to agents |
| `WidgetModule` | Public widget session + ingest endpoints |
| `ChannelsModule` | Channel config |
| `WhatsAppModule` | AiSensy webhook + send adapter |
| `AiModule` | FAQ RAG, qualification, handoff decisions |
| `KnowledgeModule` | Upload, chunk, embed, search |
| `TasksModule` | Tasks CRUD |
| `JobsModule` | BullMQ queues/processors |
| `NotificationsModule` | In-app + Resend |
| `AutomationsModule` | Rules + runs |
| `IntegrationsModule` | Encrypted connections |
| `AdsModule` | Attribution capture |
| `CostModule` | Usage events, aggregates, budgets, dashboards API |
| `HealthModule` | `/health`, `/ready` |
| `AuditModule` | Important mutations |

**Frontend app routes (Next.js) — suggested**

```
/login
/inbox                    # unified inbox
/inbox/[conversationId]
/contacts
/contacts/[id]
/leads
/leads/[id]
/tasks
/dashboard                # KPIs + overdue
/knowledge
/settings/users
/settings/pipeline
/settings/integrations
/settings/rate-cards
/settings/budgets
/costs                    # daily cost / CPL / margin
```

Widget is a separate build embedded via `<script>` on client sites.

---

## 8. End-to-end flows (build to these)

### 8.1 Website visitor → lead

```
Widget loads with public tenant key
  → POST /widget/session (creates/resolves web_visitor identity)
Visitor sends message
  → POST /widget/messages
  → upsert Contact + Conversation + Message(inbound)
  → enqueue AI_REPLY job (if ai_mode=auto)
AI job
  → retrieve KB chunks (pgvector)
  → OpenAI completion with system prompt + FAQ context + qualification state
  → Message(outbound, sender_type=bot) + usage_events(ai)
  → if qualified → create/update Lead, set score/stage, notify assignee
  → if handoff → ai_mode=off, notify agents (WS + optional email)
Agent replies in dashboard
  → POST /conversations/:id/messages
  → WS push to other agents; widget polls or WS for visitor
```

### 8.2 WhatsApp via AiSensy

```
AiSensy webhook POST /webhooks/aisensy
  → verify signature
  → dedupe on external_message_id
  → normalize to internal Message DTO
  → resolve contact_identities (whatsapp_id/phone)
  → same Conversation/AI/Lead path as web
Agent outbound
  → WhatsAppAdapter.send(to, text/template)
  → store Message(outbound) + usage_events(whatsapp)
```

**Adapter interface (required):**

```ts
interface WhatsAppProvider {
  verifyWebhook(headers, rawBody): boolean;
  parseInbound(payload): NormalizedInboundMessage[];
  sendText(params: { to: string; text: string; conversationExternalId?: string }): Promise<{ externalMessageId: string }>;
  sendTemplate?(params): Promise<{ externalMessageId: string }>;
}
```

AiSensy is the first implementation. Wati/360dialog/Meta can be added later without rewriting inbox.

### 8.3 Follow-up / SLA

```
Lead.next_followup_at set (manual or AI suggestion)
Worker cron every 1–5 min:
  → find due/overdue → ensure Task exists → notify assignee (in-app + Resend)
SLA: inbound message with no agent reply within N minutes
  → Task(type=sla) + notify
```

### 8.4 Cost rollup

```
Every billable action writes usage_events immediately
Nightly (or hourly) job:
  → aggregate into cost_daily_aggregates
  → recompute lead.attributed_cost (sum of linked usage)
  → check budget_policies → notifications if 70%/90%
```

### 8.5 Ads attribution

```
Landing/widget passes gclid + utm_* into session
On contact/lead create → store on contact + ad_attributions
Source becomes google_ads when gclid/utm_source indicates ads
MVP: no mandatory Google Ads API; capture params + manual rate card for spend
```

---

## 9. API design conventions

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <access_token>` (or httpOnly cookie session — pick one and stick to it)
- Always scope queries by `tenant_id` from the authenticated user (never trust client-sent tenant id)
- Validation: Zod or class-validator on all inputs
- Errors: `{ statusCode, code, message, details? }`
- Pagination: `?cursor=` or `page/limit` — be consistent
- Idempotency: webhooks + optional `Idempotency-Key` on outbound sends

### Essential endpoints (MVP)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current user |
| GET/POST | `/contacts` | List/create |
| GET/PATCH | `/contacts/:id` | Detail/update |
| GET/POST | `/leads` | List/create |
| PATCH | `/leads/:id` | Update stage/owner/value/follow-up |
| GET | `/conversations` | Inbox list (filters: open, channel, assignee) |
| GET | `/conversations/:id` | Thread + messages |
| POST | `/conversations/:id/messages` | Agent reply |
| POST | `/conversations/:id/assign` | Assign agent |
| POST | `/conversations/:id/handoff` | Force human mode |
| GET/POST | `/tasks` | Tasks |
| POST | `/knowledge/documents` | Upload |
| GET | `/dashboard/summary` | Counts, overdue, open convos |
| GET | `/costs/daily` | Cost dashboard |
| GET/PUT | `/settings/rate-cards` | Admin |
| GET/PUT | `/settings/budgets` | Owner/Admin |
| POST | `/widget/session` | Public |
| POST | `/widget/messages` | Public (rate-limited) |
| POST | `/webhooks/aisensy` | Public + signature |
| GET | `/health` | Public liveness |
| GET | `/ready` | DB+Redis readiness |

Realtime: `WS /ws` authenticated; events like `message.created`, `conversation.updated`, `notification.created`.

---

## 10. AI integration (how it must be done)

### Principles

1. **Server-side only** — API keys never in widget or Next.js public env  
2. **Meter everything** — every call → `usage_events`  
3. **Structured where possible** — qualification updates as JSON validated by schema  
4. **Handoff is a first-class outcome** — not only chat text  
5. **Fail soft** — timeout/rate limit → polite fallback + notify agent  
6. **Guardrails** — system prompt: no invented pricing/contracts; escalate instead  

### Two AI paths

| Path | Behavior |
|------|----------|
| **FAQ (RAG)** | Embed query → top-k chunks → answer with citations/meta; if low confidence → handoff |
| **Qualification** | State machine / schema: ask missing fields (city, need, budget band, timeline); update lead score/stage |

### Suggested job names (BullMQ)

- `ai.reply` — generate bot reply for a conversation  
- `knowledge.ingest` — chunk + embed document  
- `tasks.followups.scan`  
- `tasks.sla.scan`  
- `costs.aggregate.daily`  
- `notifications.email`

### Prompt packaging

Pass only needed contact/lead fields + last N messages + retrieved chunks. Do not dump entire DB. Store `ai_meta` on messages: `{ model, promptTokens, completionTokens, latencyMs }`.

---

## 11. Security & KVKK (implementation requirements)

| Requirement | Implementation |
|-------------|----------------|
| Tenant isolation | Every query filters `tenant_id` from auth context |
| Secrets | Encrypt `integration_connections.credentials` at rest (AES-GCM with key from env) |
| Webhooks | Signature verify + dedupe `external_message_id` |
| Passwords | bcrypt/argon2 |
| Roles | Guards on controllers |
| Audit | Log stage changes, integration edits, budget changes, user role changes |
| KVKK | Endpoints to export contact data + soft-delete/anonymize contact (Owner/Admin) |
| CORS | Allow `app.` origin; widget origins configurable per tenant |
| Rate limits | Widget + login + webhooks |
| PII in logs | Do not log full message bodies in production info logs by default |

Client is data controller; we provide access control, audit, export/delete hooks.

---

## 12. Frontend implementation notes

- Use React Query (or equivalent) for server state  
- Inbox: split list + thread; optimistic outbound messages with rollback  
- Realtime: invalidate/update cache on WS events  
- i18n: Turkish + English from day 1 for primary screens  
- Timezone display: `Europe/Istanbul`  
- Empty/loading/error states on all major views  
- Mobile-usable inbox and lead detail  

Widget:

- Lightweight, no OpenAI key  
- Config: public key, color, welcome text  
- Store visitor token in localStorage  
- Polling acceptable MVP if WS to widget is hard; dashboard must be realtime  

---

## 13. Deployment architecture

### Environments

| Env | Purpose |
|-----|---------|
| Local | Docker Compose all services |
| Production | Same Compose on client VPS (optional staging DB later) |

### Domains

- `app.client-domain.com` → `web`  
- `api.client-domain.com` → `api` (+ `/ws`, `/webhooks/*`)  

### Env vars (illustrative — document in `.env.example`)

```
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
ENCRYPTION_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
RESEND_FROM=
AISENSY_API_KEY=
AISENSY_WEBHOOK_SECRET=
PUBLIC_WEB_URL=
PUBLIC_API_URL=
SENTRY_DSN=
```

### CI/CD

GitHub Actions on `main`:

1. Lint + typecheck + tests  
2. Build Docker images (or build on server)  
3. SSH deploy: `docker compose pull && docker compose up -d`  
4. Run migrations  
5. Hit `/health` and fail deploy if unhealthy  

### Backups

- Daily `pg_dump` to disk (7-day retention)  
- Scripted restore documented and tested once before launch  
- Uploads on local disk MVP; migrate to R2 when large  

---

## 14. Reliability requirements (non-negotiable for launch)

| Control | Spec |
|---------|------|
| Liveness | `GET /health` |
| Readiness | `GET /ready` checks Postgres + Redis |
| Uptime | External monitor every 5 min on `/health` |
| Errors | Sentry on `api` + `web` |
| Restarts | Compose `restart: unless-stopped` |
| Workers | Separate from API; retry with backoff; log failures |
| Webhooks | Idempotent ingest |
| Disk | Alert if >80% |
| OpenAI | Client monthly spend cap set in OpenAI dashboard |

---

## 15. Coding standards for this codebase

1. TypeScript strict mode  
2. No business logic in React components beyond UI — call API  
3. All money/cost math in one `CostModule` service (don’t scatter)  
4. All WhatsApp I/O behind `WhatsAppProvider` interface  
5. Migrations only via official migration tool (Prisma/TypeORM/Drizzle — pick one and keep it)  
6. Feature flags via tenant `settings` JSON for risky toggles (AI auto-reply on/off)  
7. Write tests for: webhook dedupe, identity resolve, cost aggregation, auth guards  
8. README: local run, migrate, seed, widget test page  

---

## 16. Seed data (required for dev)

- 1 tenant (client name from config)  
- Users: owner, admin, 2 agents (known passwords in vault/dev only)  
- Default pipeline stages  
- 15–25 sample contacts/leads across stages  
- Sample knowledge FAQ doc  
- Rate card defaults  
- Budget policy sample  

---

## 17. Definition of done (per feature)

A feature is done only when:

1. API + DB migration + basic test or manual script  
2. UI wired (if user-facing)  
3. Tenant-scoped and role-checked  
4. Usage/cost logged if billable  
5. Errors observable (Sentry/logs)  
6. Documented in README or `/docs` if operational  

---

## 18. Out of scope (do not build in MVP)

- Multi-tenant signup / billing  
- Instagram / Facebook Messenger  
- Raw Meta Cloud API (unless AiSensy blocked)  
- Visual workflow designer  
- ERP / HubSpot deep sync  
- Kubernetes / AWS  
- Exact vendor invoice auto-import  

---

## 19. Suggested build order (aligns with 10-day plan)

1. Auth + tenant + users + schema  
2. Contacts + leads + pipeline UI  
3. Inbox + widget + realtime  
4. Tasks + follow-up/SLA jobs + email  
5. Knowledge + AI FAQ/qualify/handoff + usage events  
6. AiSensy adapter + webhook  
7. Ads attribution + cost dashboard + budgets  
8. Harden security, backups, CI, UAT  

Details: [10_DAY_DELIVERY_PLAN.md](./10_DAY_DELIVERY_PLAN.md)

---

## 20. Open decisions to confirm at kickoff

Record answers before Day 1 coding:

1. ORM: Prisma vs TypeORM vs Drizzle?  
2. Auth transport: Bearer JWT vs httpOnly cookie?  
3. Realtime: WebSocket vs SSE?  
4. Widget realtime vs polling for MVP?  
5. Exact pipeline stage names for this client?  
6. AI auto-reply default on or off for WhatsApp?  
7. Staging environment separate or single prod for first 10 days?  

---

**Document owner:** Tech lead / delivery  
**How to use:** Share this file with all developers as the system build contract. Product scope and infra sizing remain in [TECH_STACK_AND_SERVER_REQUIREMENTS.md](./TECH_STACK_AND_SERVER_REQUIREMENTS.md). Client setup actions remain in [CLIENT_SETUP_CHECKLIST.md](./CLIENT_SETUP_CHECKLIST.md).
