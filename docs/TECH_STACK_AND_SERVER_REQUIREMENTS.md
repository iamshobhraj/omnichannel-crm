# Omnichannel CRM + AI Lead Platform  
## Tech Stack, Cloud & System Requirements  
### Client Requirements Document — MVP + Initial Launch

**Document type:** Client requirements & infrastructure brief (shareable)  
**Audience:** Client management, IT, sales ops  
**Product:** Independently designed omnichannel CRM (LeadGen-class capabilities — not a copy of LeadGen.io branding/UI/code)  
**Core value:** Turn WhatsApp / web / ads messages into structured leads with AI qualification, inbox, pipeline, follow-ups, and **built-in daily cost & margin visibility**  
**Deployment:** Single company (this client) first; multi-tenant expansion later  
**Date:** July 2026  
**Status:** Ready for client review  

**Related:** [README.md](./README.md) (pack overview) · [CLIENT_SETUP_CHECKLIST.md](./CLIENT_SETUP_CHECKLIST.md) (actions)
---

## 1. Executive summary

**Deployment model for now: single tenant = this Turkish client only.**  
One company, one workspace, their sales/support team. We are **not** launching a multi-company SaaS product yet.

We will build an omnichannel CRM for **this client** where:

- Website chat + WhatsApp (via BSP) land in **one inbox**
- AI answers FAQs and **qualifies leads** with controlled questions
- Qualified leads go to sales with **pipeline, tasks, and alerts**
- **Google Ads** clicks/forms can be attributed to leads (campaign → lead → won)
- Management gets **daily cost visibility** and **margin analysis** inside the product (AI, WhatsApp, ads, cost per lead)
- Data stays inside **one client workspace** (users, roles, teams inside that company)

### Key decisions (updated)

| Topic | Decision |
|--------|----------|
| **Tenancy (now)** | **Single tenant** — only this client’s company |
| **Tenancy (later)** | Architecture upgrades when adding **more tenants** — see §1.1 |
| **Compute (launch)** | **4 vCPU + 8 GB RAM + 80 GB SSD** on one EU VPS |
| **Compute (MVP min)** | **2 vCPU + 4 GB RAM + 40 GB SSD** for pilot only |
| **Hosting** | Hetzner / DigitalOcean — **not AWS** for MVP or early production |
| **AWS** | Only when load or many tenants truly require it |
| **WhatsApp / Meta** | **AiSensy BSP** (not raw Meta API first) |
| **Ads** | Google Ads attribution (light) |
| **Cost control (in product)** | Daily cost dashboard + cost/lead + margin analysis — see §5.1 |
| **Cost goal (infra)** | Monthly tech cost near LeadGen-class SaaS: **~$70–180 / mo** at launch (excl. Meta msgs + ad spend) |

**Fastest solid MVP:**  
Website chat + Contacts + Lead pipeline + Human inbox + Follow-up alerts + Basic AI + **AiSensy WhatsApp** + **Google Ads source tracking** + **daily cost & margin visibility** — for **this one client**.

Instagram / Facebook Messenger direct, advanced workflow designer, ERP sync, and **multi-tenant SaaS scale-out** come later.

### 1.1 Single tenant now → multi-tenant later

| Phase | Scope | Architecture approach |
|-------|--------|------------------------|
| **Now (MVP + launch)** | **1 tenant = this client** | One VPS, one database, one AiSensy/WhatsApp connection, one Google Ads account. Simpler auth, lower cost, faster delivery. |
| **Later (expansion)** | **2+ tenants** (other companies / white-label) | Upgrade: enforce `tenant_id` isolation everywhere, per-tenant channel credentials, per-tenant bots/KB, usage limits, RLS or schema separation, larger compute or split services. |

**What we put in the code now (so we can expand without a full rewrite):**

- Keep a `tenant_id` / `workspace_id` on core tables even while only **one** tenant row exists  
- Store AiSensy / Google Ads credentials in `integration_connections` keyed by tenant  
- Do **not** hardcode the client company name into business logic  

**What we defer until there are more tenants:**

- Self-serve tenant signup / onboarding  
- Per-tenant billing and plan limits  
- Strict Postgres RLS or separate DB per tenant  
- Platform super-admin for many companies  
- Horizontal scaling / AWS / Kubernetes  
- Shared infra cost split across companies  

**Trigger to redesign for many tenants:** a second company must use the product, or this client wants to resell it. Until then: optimize for **one working client system**.

```
NOW (single tenant)                    LATER (many tenants)
─────────────────                      ────────────────────
[ This client only ]                   [ Tenant A ] [ Tenant B ] [ Tenant C ]
        |                                     \         |         /
   1× VPS + 1× DB                              Shared app + stronger isolation
   1× WhatsApp (AiSensy)                       Per-tenant channels + limits
   1× Google Ads                               Per-tenant billing
```

---

## 2. Compatible tech stack (locked for MVP + launch)

All pieces below work together. Do **not** swap randomly (keeps cost low and support simple).

| Layer | Exact choice | Version / note |
|--------|--------------|----------------|
| **Language** | TypeScript | End-to-end |
| **Frontend** | Next.js + React + Tailwind | App Router |
| **Backend** | NestJS (Node.js 20 LTS) | REST + WebSocket/SSE |
| **Database** | PostgreSQL **16** + **pgvector** | Contacts, leads, messages, FAQ embeddings |
| **Cache / jobs** | Redis **7** + BullMQ | Sessions, AI jobs, reminders |
| **Runtime packaging** | Docker + Docker Compose | One VPS runs the full stack |
| **File storage** | Local disk on VPS (MVP) → Cloudflare R2 if files grow | Avoid extra bills early |
| **AI** | OpenAI API | Mini models for qualify/FAQ |
| **Email** | Resend | Alerts, invites |
| **WhatsApp** | AiSensy API (BSP) | Not raw Meta API first |
| **Ads** | Google Ads API + UTM/`gclid` | Lead source tracking |
| **DNS / TLS** | Cloudflare (free) | `app.` + `api.` |
| **Host** | **1× Hetzner or DigitalOcean VPS (EU)** | Not AWS for MVP/launch |
| **OS** | Ubuntu **22.04 or 24.04 LTS** | |
| **CI/CD** | GitHub Actions | Deploy to VPS |

### Architecture (single-tenant launch stack)

```
                    THIS CLIENT ONLY (1 tenant)
[Website widget]  [AiSensy WhatsApp]  [Google Ads / forms]
        |                 |                    |
        v                 v                    v
              NestJS API + workers (BullMQ)
                        |
         +--------------+--------------+
         v              v              v
   PostgreSQL+pgvector  Redis      Disk / R2
         |
   Next.js dashboard (WebSocket/SSE live inbox)

Later (many tenants): same app shape, plus tenant isolation,
per-tenant integrations, and larger/split infrastructure.
```

### Why AiSensy (not raw Meta)

Raw Meta Cloud API is slow to approve. **AiSensy** connects WhatsApp for us; our app uses their API/webhooks. Meta message fees still apply separately. Fallback BSPs (same adapter): Wati, 360dialog, Gupshup.

---

## 3. Clear compute requirements (CPU / RAM / storage)

Sized for **one client company (single tenant)** — not a multi-tenant SaaS fleet.

| Assumption | MVP | Initial launch |
|------------|-----|----------------|
| Tenants | **1 (this client)** | **1 (this client)** |
| Concurrent sales agents | 3–8 | 8–20 |
| Conversations / month | up to ~2,000 | up to ~8,000 |
| Messages / day (peak) | ~500–1,500 | ~2,000–5,000 |
| Knowledge docs | ~50–200 MB | ~500 MB–2 GB |
| Attachments | light | moderate |

When **more tenants** are added later, recompute (often: more RAM/CPU, separate Redis prefixes, optional DB split) — do not overbuy that capacity now.

### 3.1 Recommended server (buy this)

**One VPS runs the full compatible stack** (Next.js + NestJS + Postgres + Redis + workers). Simplest and cheapest.

| Spec | **MVP (minimum that works)** | **Initial launch (smooth / recommended)** | **Comfortable headroom** |
|------|------------------------------|-------------------------------------------|---------------------------|
| **vCPU (cores)** | **2** | **4** | **6–8** |
| **RAM** | **4 GB** | **8 GB** | **16 GB** |
| **SSD storage** | **40 GB** | **80 GB** | **160 GB** |
| **Network** | 1 Gbps shared OK | 1 Gbps | 1 Gbps |
| **OS** | Ubuntu 22.04/24.04 LTS | same | same |
| **Example Hetzner** | CX22 (2 vCPU / 4 GB) | CX32 (4 vCPU / 8 GB) | CX42 (8 vCPU / 16 GB) |
| **Example DigitalOcean** | Basic 2 vCPU / 4 GB | Basic 4 vCPU / 8 GB | CPU-Optimized / 8 GB+ |
| **Est. VPS price** | **~$6–12 / mo** | **~$15–30 / mo** | **~$40–60 / mo** |

**Recommendation for Turkish client launch:** start with **4 vCPU + 8 GB RAM + 80 GB SSD**.  
That runs the stack seamlessly for a normal sales team without AWS.

### 3.2 How RAM is used on the recommended 8 GB box

| Process | RAM reserve |
|---------|-------------|
| OS + Docker overhead | ~0.5–1 GB |
| PostgreSQL 16 (+ pgvector) | ~1.5–2.5 GB |
| Redis | ~256–512 MB |
| NestJS API | ~512 MB–1 GB |
| BullMQ workers | ~512 MB–1 GB |
| Next.js (frontend) | ~512 MB–1 GB |
| **Free buffer** | ~1–2 GB |

On a **4 GB MVP** box: same layout, tighter limits — fine for pilot (≤8 agents), not for heavy attachment/AI bursts.

### 3.3 Storage breakdown (80 GB launch disk)

| Use | Allocate |
|-----|----------|
| OS + Docker images | ~15 GB |
| PostgreSQL data | ~20–30 GB |
| Uploads / voice / images (local) | ~10–20 GB |
| Backups (local daily, 7-day) | ~15–20 GB |
| Logs + free space | rest |

When uploads exceed ~30 GB, move files to **Cloudflare R2** (cheap) instead of buying a huge disk.

### 3.4 Optional: split DB later (only if needed)

If Postgres grows heavy, add a **second** small VPS:

| Role | Spec |
|------|------|
| App + Redis + workers | 2–4 vCPU / 4–8 GB / 40 GB |
| PostgreSQL only | 2 vCPU / 4 GB / 80 GB SSD |

Not required for MVP or first launch.

### 3.5 What we do **not** need (avoids extra expense)

| Skip | Why |
|------|-----|
| AWS / ECS / RDS / ALB | Too expensive for this stage |
| Separate managed Redis + managed Postgres + big object store on day 1 | Triple billing; one VPS is enough |
| GPU server | AI runs on **OpenAI API**, not on our server |
| Kubernetes | Overkill |
| Multiple regions | One EU VPS is enough |

### 3.6 Monthly cost target (keep near LeadGen.io-class SaaS)

Aim for **software-running cost ≈ what you’d pay a mid WhatsApp CRM** (~**$50–120 / mo** tech), not a stack of tools.

| Item | Lean MVP | Launch |
|------|----------|--------|
| **1× VPS** (4–8 GB) | $6–15 | $15–30 |
| Domain + Cloudflare | $1–10 | $1–10 |
| OpenAI (hard cap) | **$30–50** | **$50–80** |
| AiSensy **cheapest plan that gives API** | $0–45 | $45–99 |
| Resend | $0 | $0–10 |
| **Tech total** | **~$40–120 / mo** | **~$70–180 / mo** |
| Meta WhatsApp messages | usage | usage |
| Google Ads **spend** | marketing budget | marketing budget |

Do **not** buy AiSensy Pro + AWS + Neon + Upstash + R2 + high OpenAI all at once — that duplicates cost. Our CRM is the product; AiSensy is only the WhatsApp pipe.

---

## 4. System requirements — what the client must set up

### Phase 0 — Required for MVP development (THIS WEEK)

| # | Item | Notes |
|---|------|--------|
| 1 | Domain | e.g. `app.client.com`, `api.client.com` |
| 2 | **VPS** | Hetzner/DO: prefer **4 vCPU / 8 GB / 80 GB** (launch). Min MVP: **2 vCPU / 4 GB / 40 GB** |
| 3 | Cloudflare | DNS + SSL |
| 4 | GitHub access | Repo / org |
| 5 | **OpenAI** org + billing | Hard monthly cap (start **$40–80**) |
| 6 | **Resend** | Transactional email; we supply SPF/DKIM records |
| 7 | Branding | Legal name, logo, timezone `Europe/Istanbul`, TR + EN |
| 8 | Users | Owner, admin, sales agents |
| 9 | Knowledge pack | FAQ, brochures, approved answers (PDF/DOC) |

### Phase 1 — Required for Initial Launch (before real traffic)

| # | Item | Notes |
|---|------|--------|
| 1 | Staging + production envs | Separate DBs |
| 2 | Backups | Daily Postgres backup + restore test |
| 3 | Sentry | Error monitoring |
| 4 | Widget install rights | On client websites |
| 5 | Pipeline stages agreed | New → Qualified → Demo → Proposal → Won/Lost |

### Phase 2 — WhatsApp via AiSensy (parallel with MVP build; wire when account ready)

**Prefer this over raw Meta Developer setup.**

| # | Item | Who |
|---|------|-----|
| 1 | **AiSensy account** (company billing) | Client |
| 2 | Business documents for WhatsApp / display name | Client |
| 3 | WhatsApp phone number (new or migrate) | Client |
| 4 | AiSensy API key / webhook secret shared via vault | Client → us |
| 5 | Prepaid WhatsApp credits in AiSensy (as required by plan) | Client |
| 6 | Approve message templates for follow-ups / alerts | Client + us |

We implement: AiSensy webhook → normalize message → contact/conversation → AI/automation → reply via AiSensy send API.

**Optional later:** migrate from AiSensy to direct Meta Cloud API or another BSP without rewriting the whole product (provider adapter).

### Phase 3 — Google Ads (MVP-light → launch)

| # | Item | Notes |
|---|------|--------|
| 1 | Google Ads account | Client marketing |
| 2 | Google Cloud project + Ads API access | For pulling campaigns / conversions (we guide) |
| 3 | Conversion action(s) | e.g. “Qualified lead”, “Demo booked”, “Won” |
| 4 | UTM + `gclid` on landing pages / forms | Capture into Contact/Lead `source` fields |
| 5 | Optional: Google Lead Form extensions | Webhook/form → our leads API |

**What we store:** campaign, ad group, keyword (if available), gclid, utm_source/medium/campaign, landing URL, cost per lead reports (basic).

**Google Ads media spend** is marketing budget — not part of server cost.

### Phase 4 — Later (not MVP)

| Item | When |
|------|------|
| Instagram / Facebook Messenger | After WhatsApp stable |
| Direct Meta Cloud API (bypass BSP) | Only if cost/control requires |
| Calendar (Google/Outlook) | Demo booking |
| Zoho / HubSpot / ERP | Won-lead sync |
| **Multi-tenant architecture upgrade** | When **2+ companies** need the product |
| AWS migration | High load **or** many tenants |
| Anthropic fallback | Optional LLM backup |

---

## 5. MVP feature scope (must ship)

Build order:

1. Auth, **single workspace for this client**, users, roles  
2. Contacts + lead pipeline (score, stage, owner, follow-up date)  
3. Website chat widget + unified inbox  
4. Agent replies + realtime notifications  
5. Tasks + follow-up alerts (dashboard + email)  
6. Basic automation (assign, tag, SLA remind)  
7. AI FAQ + lead qualification + human handoff  
8. **AiSensy WhatsApp** bidirectional in same inbox  
9. **Google Ads / UTM / gclid** attribution on contacts & leads  
10. **Cost management** — daily visibility, cost per lead, margin analysis (§5.1)  

### CRM / alert behaviors (included)

- Contact ≠ Lead  
- Pipeline stages + lead score + tags  
- SLA: no agent reply → notify  
- Follow-up task at `next_followup_at` → escalate if overdue  
- Automation execution log  
- Consent flags for WhatsApp marketing templates  
- Audit of important changes  
- Lead source: `website` | `whatsapp` | `google_ads` | `manual` | …

### 5.1 Cost management & margin analysis (in the product)

The system itself must give management **daily visibility** into operating cost and lead economics — not only chat and CRM. This avoids surprise bills and shows whether channels are profitable.

#### What managers see (daily / weekly / monthly)

| View | What it shows |
|------|----------------|
| **Daily cost dashboard** | Today’s spend vs yesterday / month-to-date |
| **Cost by category** | AI (OpenAI tokens), WhatsApp (messages / AiSensy), Google Ads, email, estimated server (optional fixed monthly) |
| **Cost per lead** | Total acquisition cost ÷ new leads (by day, source, campaign) |
| **Cost per qualified / won** | Same for qualified stage and Won deals |
| **Margin analysis** | Deal/expected value (or entered revenue) − attributed cost → **gross margin %** by source or product |
| **Budget & alerts** | Daily/monthly caps; warn at 70% / 90%; optional pause of non-essential AI or marketing templates when over budget |
| **Channel ROI** | Website vs WhatsApp vs Google Ads: leads, cost, conversion, margin |

#### Related modules (cost control suite)

| Module | Purpose |
|--------|---------|
| **Usage metering** | Log every billable event (AI call tokens, WA outbound template, ad click cost if available) |
| **Rate card config** | Admin sets unit costs (e.g. approx. WA message rate, OpenAI $/1K tokens, fixed VPS $/day) when live API billing is not available |
| **Lead cost attribution** | Roll up costs to contact/lead/campaign |
| **Margin & deal value** | Optional `expected_value` / `won_amount` on leads for margin math |
| **Budget policies** | Soft/hard limits + notify Owner/Admin |
| **Export** | CSV of daily cost for finance |

#### Data we store (for cost features)

`usage_events`, `cost_daily_aggregates`, `budget_policies`, `rate_cards`  
Plus on leads: `expected_value`, `won_amount`, `attributed_cost` (computed/cached)

#### MVP vs later for cost features

| In MVP / launch | Later |
|-----------------|--------|
| Daily dashboard (AI + WA + Ads + manual rate card) | Auto-import exact Meta/AiSensy invoices |
| Cost per lead by source | Agent-level cost efficiency |
| Simple margin (won value − cost) | Full P&L / multi-currency finance pack |
| Budget alerts (email + in-app) | Auto-throttle AI when over budget |

This keeps **proper cost management inside the CRM**, so the client does not need a separate spreadsheet to know if LeadGen-style ops are profitable day by day.

### Out of MVP

- Visual workflow designer  
- Full IG/FB inbox  
- Full multi-currency finance / ERP billing  
- ERP deep sync  
- AWS multi-region HA  
- **Multi-company / multi-tenant SaaS** (design later when expanding)  
- Exact automated invoice import from every vendor  

---

## 6. AI & API credits

### OpenAI (required)

| Item | Recommendation |
|------|----------------|
| Account | Client company org |
| Models | Mini models for classify/FAQ; stronger only when needed |
| Embeddings | `text-embedding-3-small` |
| Cap | Start **$40–80 / month** hard limit (raise only if volume needs it) |

### AiSensy + Meta (WhatsApp)

| Item | Notes |
|------|--------|
| AiSensy subscription | Per their Basic/Pro/etc. plan |
| Message credits | Prepaid in AiSensy; Meta per-message rates by country/category |
| Turkey recipients | Check AiSensy country rate card for TR |

### Google Ads

| Item | Notes |
|------|--------|
| API | Generally no separate “AI credit”; OAuth + developer token |
| Ad spend | Client marketing budget |

### Email

Resend free tier → paid as volume grows.

---

## 7. Security & Turkey notes

| Topic | Requirement |
|-------|-------------|
| Tenant model | **Single tenant now** (this client). Keep `tenant_id` on rows for future expansion; full multi-tenant isolation/RLS when 2+ companies |
| KVKK | Client = data controller; access control, audit, export/delete hooks; DPA recommended |
| Data region | Prefer **EU** VPS (Hetzner DE/FI) |
| Secrets | Encrypt BSP/Google tokens at rest |
| Webhooks | Verify signatures; dedupe `external_message_id` |
| AI guardrails | No unapproved pricing/contracts; human handoff rules |
| Backups | Daily DB + documented restore |

---

## 8. Accounts checklist (client)

### Start now

- [ ] **Hetzner or DigitalOcean VPS** — prefer **4 vCPU / 8 GB RAM / 80 GB SSD** (not AWS)  
- [ ] Cloudflare account — DNS for app domain  
- [ ] GitHub access  
- [ ] OpenAI org + API key — spend cap **$40–80**/mo  
- [ ] Resend  
- [ ] Branding + users + FAQ pack  

### For WhatsApp (AiSensy path)

- [ ] AiSensy company account  
- [ ] Phone number decision  
- [ ] Business verification docs as AiSensy requests  
- [ ] API key / webhook credentials in vault  
- [ ] Message credit top-up  

### For Google Ads

- [ ] Google Ads account access  
- [ ] Agree conversion events (Qualified / Demo / Won)  
- [ ] Landing pages with UTM + gclid  
- [ ] Google Cloud project for Ads API (we assist)  

### Explicitly NOT required for MVP/launch

- [ ] AWS account  
- [ ] Raw Meta Developer App + Cloud API DIY (unless BSP fails)  

Share secrets via **1Password / Bitwarden**, never chat.

---

## 9. Delivery timeline (indicative)

| Phase | Duration | Outcome |
|-------|----------|---------|
| **A. Foundations** | 2–3 weeks | Auth, **one workspace (this client)**, contacts, pipeline |
| **B. Inbox MVP** | 2–3 weeks | Website widget, inbox, agent reply, alerts |
| **C. AI** | ~2 weeks | KB, FAQ, qualification, handoff |
| **D. AiSensy WhatsApp** | 1–2 weeks after AiSensy ready | WA in unified inbox |
| **E. Google Ads + cost dashboard** | ~1–2 weeks | Source attribution + daily cost / margin views |
| **F. Scale features** | Later | IG/FB, AWS if needed, ERP, workflow UI |

**Critical path:** Create **cheap cloud + OpenAI** immediately. Start **AiSensy** signup in parallel (faster than DIY Meta). Google Ads can land near launch.

---

## 10. This week — client action list

1. Confirm brand, `Europe/Istanbul`, TR/EN.  
2. Create **Hetzner or DigitalOcean** VPS: **4 vCPU + 8 GB RAM + 80 GB SSD** (Ubuntu 22.04/24.04). Skip AWS.  
3. Domain + Cloudflare.  
4. OpenAI org, billing, **$40–80** cap, vault the key.  
5. Resend account.  
6. Users list + FAQ/brochure pack.  
7. Confirm MVP: **Web + Inbox + Leads + Alerts + AI + AiSensy WA + Google Ads + daily cost/margin**.  
8. Sign up **AiSensy**; decide WhatsApp number.  
9. Share Google Ads account with marketing owner for conversion setup.  
10. Agree how **deal / won values** will be entered (needed for margin analysis).

---

## 11. Decision summary

| Decision | Recommendation |
|----------|----------------|
| **Tenancy** | **1 tenant = this client** now; multi-tenant architecture **later** when expanding |
| **Compute (launch)** | **4 vCPU · 8 GB RAM · 80 GB SSD** (1 EU VPS) |
| **Compute (MVP min)** | **2 vCPU · 4 GB RAM · 40 GB SSD** |
| Cloud | Hetzner or DigitalOcean (EU) — not AWS |
| AWS | Only later if load **or many tenants** demand it |
| Stack | Next.js + NestJS + Postgres 16 + pgvector + Redis 7 + Docker + OpenAI |
| WhatsApp | AiSensy (BSP) — not raw Meta API first |
| Ads | Google Ads attribution + conversions |
| **Cost & margin (in app)** | Daily visibility + cost/lead + margin — built into the product |
| Monthly tech budget | ~**$70–180** at launch (excl. Meta msgs + ad spend) |

---

## Appendix A — Core data model (short)

Even for **one client**, we keep a single `tenants` / workspace row so adding companies later is an upgrade, not a rebuild.

`tenants` *(one row for now)*, `users`, `teams`, `channels`, `contacts`, `contact_identities`, `conversations`, `messages`, `leads`, `pipelines`, `pipeline_stages`, `tasks`, `notes`, `tags`, `bot_profiles`, `knowledge_documents`, `knowledge_chunks`, `automation_rules`, `automation_runs`, `notifications`, `integration_connections`, `ad_attributions`, `usage_events`, `cost_daily_aggregates`, `budget_policies`, `rate_cards`, `audit_logs`

```
Tenant (this client only, for now)
  → Contacts → Conversations → Messages
  → Leads → Pipeline Stages (+ expected_value / won_amount / attributed_cost)
  → Ad attribution (gclid / campaign)
  → Channel connections (AiSensy | website | google_ads)
  → Usage events → Daily cost aggregates → Margin views
```

**Later (many tenants):** same schema; enforce tenant filters on every query; per-tenant integrations, limits, and cost budgets.

## Appendix B — Example end-to-end flow (for stakeholders)

Google Ad → landing page (`gclid` + UTM) → website chat: “I need solar monitoring for a factory”  
→ Contact + Lead created (source=`google_ads`)  
→ AI qualifies (location, scale, demo vs survey) — **AI token cost logged**  
→ Score/tags → assign sales → dashboard + email alert  
→ Same contact continues on WhatsApp via AiSensy — **message cost logged**  
→ Follow-up task; stage → Demo → Won (`won_amount` entered)  
→ **Daily cost dashboard** shows Ads + AI + WhatsApp cost; **margin** = won value − attributed cost  
→ Conversion can be sent back to Google Ads  

---

**Document owner:** Delivery / engineering  
**Sharing:** This document, the checklist, and README are **ready to share with the client**.  
**Next step after approval:** Kickoff call → client completes the checklist → provision VPS → begin Phase A build  

Related: [README.md](./README.md) · [CLIENT_SETUP_CHECKLIST.md](./CLIENT_SETUP_CHECKLIST.md)
