# OmniCRM Work Task List

Use this checklist as the active delivery board. The detailed rationale and
scope are in [IMPLEMENTATION_STATUS_AND_BACKLOG.md](./IMPLEMENTATION_STATUS_AND_BACKLOG.md).

## Phase 0 — Delivery baseline

- [x] Repair clean npm install workflow and isolate local npm cache.
- [x] Add reusable local environment bootstrap for worktrees.
- [x] Add CI: install, lint, type-check, production build.
- [x] Upgrade Next.js to patched `15.5.21`.
- [x] Record implementation status and delivery backlog.
- [ ] Confirm client scope, acceptance criteria, pipeline stages, and priority
      order for the remaining work.
- [ ] Replace demo tenant branding, users, and credentials before staging/UAT.

## Phase 1 — Knowledge base and RAG (client priority)

- [ ] Confirm supported source formats and obtain the client FAQ/brochure pack.
- [ ] Provision PostgreSQL 16 with the `pgvector` extension.
- [ ] Add Prisma migration for knowledge document metadata and knowledge chunks.
- [ ] Build knowledge document CRUD API with tenant and role enforcement.
- [ ] Build knowledge management UI: list, upload/paste, status, retry,
      re-index, delete.
- [ ] Extract text from plain text, PDF, and DOCX sources.
- [ ] Implement chunking, token counting, embeddings, and vector indexing.
- [ ] Run background knowledge ingestion with retry/failure state.
- [ ] Retrieve top relevant chunks for each AI message.
- [ ] Add answer citations, low-confidence fallback, and human handoff.
- [ ] Log model, token counts, latency, and cost for AI requests.
- [ ] Add tests for ingestion, tenant isolation, and retrieval quality.

## Phase 2 — API security and CRM correctness

- [ ] Create shared Zod schemas and validate every mutation/webhook payload.
- [ ] Standardize API error responses and status codes.
- [ ] Enforce Owner/Admin/Agent permissions on all API routes.
- [ ] Add audit log schema/service for high-impact mutations.
- [ ] Add contact CRUD, detail, identity merge, and search/pagination.
- [ ] Add lead CRUD/detail: owner, tags, notes, lost reason, values,
      follow-up date, and stage rules.
- [ ] Add task CRUD, assignment, and relation to lead/contact/conversation.
- [ ] Add pipeline/stage administration for Owner/Admin.
- [ ] Add user administration and deactivate-user flow.
- [ ] Implement KVKK export and anonymize/delete flows.
- [ ] Encrypt integration credentials at rest.

## Phase 3 — Inbox, widget, and automations

- [ ] Add inbox filters, assignment, close/reopen, and conversation detail
      improvements.
- [ ] Add reliable outbound delivery states; prevent failed WhatsApp sends from
      appearing as sent.
- [ ] Add attachment/media model and storage policy.
- [ ] Build actual embeddable widget package with public tenant key, branding,
      visitor session, and configurable allowed domains.
- [ ] Rate limit and protect public widget, login, and webhook endpoints.
- [ ] Add dashboard realtime via WebSocket or SSE.
- [ ] Add in-app notifications and Resend email notifications.
- [ ] Add worker jobs for follow-up due/overdue and no-reply SLA scans.
- [ ] Add basic automation rules: assignment, qualification tag, SLA reminder,
      plus execution logs.

## Phase 4 — AiSensy, Ads, and costs

- [ ] Validate live AiSensy webhook signature, inbound payload, send payload,
      and delivery behavior against the client account.
- [ ] Support WhatsApp templates and consent enforcement for marketing messages.
- [ ] Add Google Ads attribution records and campaign/ad group/keyword fields.
- [ ] Capture and report UTM/gclid consistently across widget/forms/leads.
- [ ] Add Google Ads conversion actions or a documented conversion stub.
- [ ] Add Owner/Admin rate-card and budget settings.
- [ ] Add daily/hourly cost aggregation job.
- [ ] Report CPL by source/campaign and cost per qualified/won lead.
- [ ] Add 70%/90% daily/monthly budget alerts and optional AI soft-limit.

## Phase 5 — Production readiness

- [ ] Decide whether to retain the single Next.js architecture or implement the
      documented NestJS + Redis/BullMQ architecture; update docs to match.
- [ ] Add Docker Compose for app, Postgres, Redis, and workers.
- [ ] Provision EU VPS, Cloudflare DNS/TLS, reverse proxy, and client domains.
- [ ] Create separate staging and production environments/databases.
- [ ] Replace `prisma db push` deployment usage with reviewed Prisma migrations.
- [ ] Prevent demo seed data from initializing production.
- [ ] Add `/ready` for Postgres and Redis readiness.
- [ ] Add Sentry, structured request logging, and an external uptime monitor.
- [ ] Add daily database backups, seven-day retention, and restore-drill docs.
- [ ] Add disk-capacity alert and Compose restart policies.
- [ ] Add CI deployment: deploy, migrate, verify health, rollback/runbook.

## Phase 6 — UAT and handoff

- [ ] Load client-approved users, pipeline, brand, FAQs, rate card, and budget.
- [ ] Install widget on client staging site.
- [ ] Execute UAT: widget → inbox → reply → lead → follow-up → AI handoff →
      WhatsApp → cost dashboard.
- [ ] Fix P0/P1 UAT findings.
- [ ] Deliver admin guides, incident/restart/backup runbooks, and hypercare plan.

## Rules for every task

- [ ] Tenant-scoped and role-checked.
- [ ] Input validated and errors observable.
- [ ] Migration/API/UI included where applicable.
- [ ] Automated test or repeatable manual test documented.
- [ ] Billable work logs usage/cost.
- [ ] Docs updated if the feature has an operational impact.
