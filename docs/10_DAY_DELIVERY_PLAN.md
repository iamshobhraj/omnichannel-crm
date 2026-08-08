# Omnichannel CRM — 10-Day Client Delivery Plan  
## Development · Deployment · Reliability

**Client:** Turkish single-tenant launch  
**Stack:** Next.js + NestJS + PostgreSQL 16 + pgvector + Redis 7 + BullMQ + Docker Compose  
**Host:** 1× EU VPS (4 vCPU / 8 GB / 80 GB) · Cloudflare · GitHub Actions  
**Goal:** Working production system for this client: inbox + CRM + AI + WhatsApp path + cost visibility + reliable deploy  

**Assumption:** Client checklist items (domain, VPS, OpenAI, Resend, brand, users, FAQ) are ready or parallel on Day 0–2. AiSensy may land mid-sprint; Google Ads can be light at end.

---

## Success criteria (Day 10)

| Area | Done when |
|------|-----------|
| **Product** | Agents can log in, see web (+ WA if ready) inbox, manage contacts/leads, get follow-up alerts, use AI FAQ/qualify, see daily cost basics |
| **Deploy** | `app.` + `api.` live on VPS via Docker Compose; CI can deploy; staging or clear prod with backups |
| **Reliability** | Health checks, daily DB backup + restore tested once, Sentry (or equivalent), uptime monitor, secrets in env only, webhook dedupe |

**Explicitly not Day 10:** Multi-tenant SaaS, IG/FB, ERP, visual workflow designer, AWS, perfect Ads invoice import.

---

## Team shape (recommended)

| Role | Focus |
|------|--------|
| Full-stack A | NestJS API, DB, jobs, integrations |
| Full-stack B | Next.js dashboard, inbox UI, widget |
| Shared / lead | Deploy, reliability, client UAT, docs |

If solo / smaller team: compress scope per “MVP cut” notes each day.

---

## Day 0 — Kickoff & access (before Day 1 morning)

- Confirm timezone `Europe/Istanbul`, TR+EN, pipeline stages  
- Vault: OpenAI, Resend, VPS SSH, Cloudflare, AiSensy (if ready)  
- Repo structure: `apps/web`, `apps/api`, `docker-compose.yml`, `.env.example`  
- Freeze scope to this 10-day plan  

---

## Day 1 — Foundations & data model

**Build**
- Monorepo / repo bootstrap (NestJS + Next.js + shared types)  
- Postgres schema v1 with `tenant_id` / `workspace_id` (one tenant row)  
- Core tables: `tenants`, `users`, `roles`, `contacts`, `leads`, `pipelines`, `pipeline_stages`, `tasks`, `audit_logs`  
- Auth: login, JWT/session, Owner / Admin / Agent roles  
- Seed: one workspace, demo users, default pipeline  

**Deploy / reliability**
- Docker Compose locally: `api`, `web`, `postgres`, `redis`  
- VPS provisioned; SSH + firewall (22/80/443 only as needed)  
- Cloudflare DNS stubs for `app.` / `api.`  

**Exit:** Login works locally; migrations run; one tenant seeded.

---

## Day 2 — Contacts, leads, pipeline UI

**Build**
- Contacts CRUD + identities (email/phone)  
- Leads CRUD: stage, owner, score, tags, `next_followup_at`, `expected_value` / `won_amount`  
- Dashboard list views: contacts, leads by stage (kanban or table)  
- Basic audit on lead stage changes  

**Deploy / reliability**
- Staging compose on VPS (or single env with `NODE_ENV`)  
- `.env` on server only; no secrets in git  
- `GET /health` → `{ status, db, redis }`  

**Exit:** Sales can create contact → lead → move stages locally/staging.

---

## Day 3 — Unified inbox (website) + realtime

**Build**
- Conversations + messages models  
- NestJS WebSocket/SSE for live inbox  
- Agent reply UI; assign conversation to agent  
- Website chat widget (embed script) → create contact + conversation  
- Notification bell (in-app) for new messages  

**Deploy / reliability**
- Reverse proxy (Caddy/Nginx) + Let’s Encrypt via Cloudflare  
- Rate-limit widget + auth endpoints  
- Request logging (method, path, status, duration)  

**Exit:** Visitor chats on widget → agent sees/replies in inbox in realtime.

---

## Day 4 — Tasks, follow-ups, alerts

**Build**
- Tasks linked to lead/contact  
- BullMQ job: scan overdue / due-today follow-ups  
- Email alerts via Resend (overdue, unassigned, SLA no-reply)  
- Dashboard widgets: overdue, due today, open conversations  

**Deploy / reliability**
- Worker process in Compose (`api` + `worker`)  
- Job failure retries + dead-letter log table or Redis visibility  
- UptimeRobot (or similar) on `/health` every 5 min  

**Exit:** Overdue follow-up creates task + email; dashboard shows alerts.

---

## Day 5 — AI FAQ + qualification + handoff

**Build**
- Knowledge upload (PDF/text) → chunk + embed (`pgvector`)  
- AI FAQ reply in conversation (mini model, spend-aware)  
- Qualification flow: controlled questions → update lead score/stage  
- Human handoff rule (keyword / score / “speak to human”)  
- `usage_events` for every AI call (tokens + estimated cost)  

**Deploy / reliability**
- OpenAI hard monthly cap confirmed with client  
- Timeouts + fallback message if AI fails  
- Guardrails: no unapproved pricing; log prompt metadata without dumping secrets  

**Exit:** Bot answers FAQ from KB; qualifies; hands off to agent cleanly.

---

## Day 6 — WhatsApp via AiSensy (or stub adapter)

**Build**
- `integration_connections` + WhatsApp channel adapter interface  
- AiSensy webhook: verify signature, dedupe `external_message_id`  
- Inbound → same inbox as web; outbound reply via AiSensy send API  
- Consent flag for marketing templates  
- If AiSensy not ready: complete adapter + mock/sandbox + document wire steps  

**Deploy / reliability**
- Webhook URL on `api.` with HTTPS only  
- Idempotent message ingest  
- Alert on webhook error rate (Sentry or log + email)  

**Exit:** WA messages appear in unified inbox (live or verified with mock + checklist).

---

## Day 7 — Google Ads attribution (light) + cost MVP

**Build**
- Capture `gclid` + UTM on widget/landing → contact/lead `source`  
- `ad_attributions` fields: campaign, medium, source, landing URL  
- Cost modules MVP:  
  - Rate card (OpenAI $/1K, WA approx, fixed VPS $/day, optional ads spend manual)  
  - Daily aggregate job → `cost_daily_aggregates`  
  - Dashboard: today’s cost, cost/lead by source, simple margin (won − cost)  
- Budget soft alerts at 70%/90% (email + in-app)  

**Deploy / reliability**
- Sentry on API + web  
- Daily cron: cost rollup + backup script dry-run  

**Exit:** Lead from ads-tagged chat shows source; manager sees daily cost / CPL / margin basics.

---

## Day 8 — Hardening, security, KVKK hooks

**Build**
- Role permissions audit (Agent can’t change budgets/rate cards)  
- Encrypt integration tokens at rest  
- Export/delete contact hooks (basic KVKK support)  
- Automation basics: auto-assign, tag on qualify, SLA remind (minimal rules + run log)  
- TR/EN strings for primary screens  

**Deploy / reliability**
- Automated **daily Postgres backup** to disk (7-day retention)  
- **One restore test** documented  
- Disk alert if >80% full  
- Firewall + fail2ban or equivalent SSH hardening  

**Exit:** Security checklist signed off; backup restore proven once.

---

## Day 9 — Production deploy + CI/CD + UAT

**Build / polish**
- Seed real client tenant, users, pipeline, KB from client pack  
- Widget install on client staging site (or test page)  
- Bug bash: inbox, AI, WA (if live), costs, mobile width  

**Deploy / reliability**
- GitHub Actions: lint → test → build → deploy over SSH (`docker compose pull/up`)  
- Production env separate from any staging DB  
- Runbooks: restart services, rotate keys, restore DB  
- Client UAT script (20–30 clicks)  

**Exit:** Production URLs stable; CI deploys; client walks through UAT script.

---

## Day 10 — Launch readiness + handoff

**Build**
- Fix P0/P1 UAT bugs only  
- Admin docs: users, rate card, budgets, how costs work  
- Optional: Google conversion ping stub if Ads API not fully ready  

**Deploy / reliability**
- Final health + uptime + Sentry verified  
- Monitoring dashboard links shared with client  
- Go-live checklist signed  
- 7-day hypercare plan (who responds, severity, response times)  

**Exit:** Client accepts MVP launch; hypercare starts.

---

## Reliability checklist (must be green by Day 10)

| Control | Target |
|---------|--------|
| `/health` (db + redis) | Public, monitored |
| Uptime monitor | Alert to engineering chat/email |
| Sentry (or error tracker) | API + web |
| Daily DB backup | 7-day local retention |
| Restore drill | Done once, written steps |
| Secrets | Vault + server env only |
| Webhook dedupe | `external_message_id` unique |
| OpenAI spend cap | Client billing limit set |
| Docker Compose restart policies | `unless-stopped` |
| Logs | Rotated; no secrets in logs |

---

## Scope cuts if blocked (keep Day 10 shippable)

| If blocked… | Ship instead |
|-------------|--------------|
| AiSensy delayed | Web inbox + WA adapter stub + wire guide |
| Google Ads API delayed | UTM/gclid capture + manual campaign label + cost rate card |
| Heavy KB | 1 FAQ doc + manual Q&A seed |
| Fancy kanban | Table + stage dropdown |
| Full margin finance | Daily cost + CPL + won − cost only |

---

## Client dependencies (critical path)

| Needed by | Item |
|-----------|------|
| Day 1 | VPS, domain/DNS, GitHub |
| Day 2 | Branding, user list |
| Day 4 | Resend DNS verified |
| Day 5 | OpenAI key + cap; FAQ pack |
| Day 6 | AiSensy account + number + API credentials |
| Day 7 | Landing/UTM agreement; deal value process |
| Day 9 | Widget install access; UAT attendees |

---

## Daily standup format (15 min)

1. Yesterday shipped  
2. Today plan  
3. Blockers (client access / AiSensy / DNS)  
4. Reliability risk (backup, errors, disk)  

---

## Demo agenda for client (end of Day 10)

1. Widget → inbox → reply (5 min)  
2. Lead pipeline + follow-up alert (5 min)  
3. AI FAQ + handoff (5 min)  
4. WhatsApp (live or recorded) (5 min)  
5. Cost / CPL / margin dashboard (5 min)  
6. How we deploy + monitor + backup (5 min)  

---

## Mapping to full requirements pack

| Requirements doc module | Days |
|-------------------------|------|
| Workspace, users, roles | 1–2 |
| Contacts + lead pipeline | 2, 4 |
| Unified inbox + widget | 3 |
| Follow-up alerts | 4 |
| AI FAQ + qualification | 5 |
| AiSensy WhatsApp | 6 |
| Google Ads attribution | 7 |
| Cost & margin | 7–8 |
| Deploy + CI + reliability | 1–2, 8–10 |

Full multi-week phases in `TECH_STACK_AND_SERVER_REQUIREMENTS.md` §9 are **compressed** into this 10-day MVP; post-launch backlog = IG/FB, richer Ads, multi-tenant, ERP.

---

**Document owner:** Delivery / engineering  
**Related:** [README.md](./README.md) · [CLIENT_SETUP_CHECKLIST.md](./CLIENT_SETUP_CHECKLIST.md) · [TECH_STACK_AND_SERVER_REQUIREMENTS.md](./TECH_STACK_AND_SERVER_REQUIREMENTS.md)
