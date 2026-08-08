# OmniCRM — Omnichannel AI Lead Platform (Developer Demo)

Private repo for QRYX Tech / Turkish client omnichannel CRM demo.

LeadGen-class capabilities: unified inbox, web widget, WhatsApp (AiSensy), AI FAQ/qualify, CRM pipeline, follow-ups, ads attribution, daily cost/margin — with **Turkish + English** UI.

---

## Quick start (local)

```bash
npm install
cp .env.example .env
# set DATABASE_URL to your Postgres
npm run db:setup
npm run dev
```

Open http://localhost:3000

### Demo logins

| Email | Password | Role |
|-------|----------|------|
| `owner@demo.com` | `Demo1234!` | Owner |
| `admin@demo.com` | `Demo1234!` | Admin |
| `agent@demo.com` | `Demo1234!` | Agent |

---

## What’s included

| Area | Status |
|------|--------|
| Login + roles | Ready |
| Dashboard KPIs + pipeline counts | Ready |
| Unified inbox (web / WhatsApp channels) | Ready |
| Contacts CRM | Ready |
| Leads pipeline (stage move, score, value, follow-up) | Ready |
| Tasks / overdue follow-ups | Ready |
| Cost dashboard (daily / CPL / margin) | Ready |
| Knowledge base for AI | Ready |
| Website chat widget demo | Ready |
| AI reply (OpenAI if key set, else rule fallback) | Ready |
| AiSensy webhook + send adapter | Ready (demo mode without keys) |
| TR / EN UI toggle | Ready |
| `/api/health` | Ready |

---

## Docs (read these)

| File | Purpose |
|------|---------|
| [docs/DEVELOPER_SYSTEM_DESIGN.md](./docs/DEVELOPER_SYSTEM_DESIGN.md) | Full system design for engineers |
| [docs/10_DAY_DELIVERY_PLAN.md](./docs/10_DAY_DELIVERY_PLAN.md) | 10-day client delivery plan |
| [docs/TECH_STACK_AND_SERVER_REQUIREMENTS.md](./docs/TECH_STACK_AND_SERVER_REQUIREMENTS.md) | Client infra / stack requirements |
| [docs/CLIENT_SETUP_CHECKLIST.md](./docs/CLIENT_SETUP_CHECKLIST.md) | Client account checklist |
| [docs/AISENSY_INTEGRATION.md](./docs/AISENSY_INTEGRATION.md) | WhatsApp / AiSensy steps |
| [docs/RENDER_DEPLOY.md](./docs/RENDER_DEPLOY.md) | Deploy to Render |
| [docs/DEMO_BUILD_PLAN.md](./docs/DEMO_BUILD_PLAN.md) | Demo build plan |

---

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **Prisma** + PostgreSQL
- **OpenAI** (optional) for AI replies
- **AiSensy** adapter for WhatsApp
- JWT httpOnly session auth

> Note: This demo uses a single Next.js app (API routes + UI) for fast Render deploy. Production long-term can split NestJS API as described in the system design doc without changing the domain model.

---

## Env vars

See `.env.example`.

Minimum: `DATABASE_URL`, `JWT_SECRET`  
Optional: `OPENAI_API_KEY`, `AISENSY_API_KEY`, `AISENSY_API_URL`, `AISENSY_WEBHOOK_SECRET`

---

## Useful scripts

```bash
npm run dev          # local app
npm run db:setup     # push schema + seed
npm run db:seed      # re-seed demo data
npm run build        # production build
```

---

## Demo walkthrough for developers

1. Login as `owner@demo.com`
2. **Dashboard** — pipeline + cost KPIs  
3. **Inbox** — open a thread, reply, try **AI** button / handoff  
4. **Leads** — change stages  
5. **Tasks** — complete overdue follow-up  
6. **Costs** — category spend / CPL / margin  
7. **Widget demo** — send a chat (creates contact + lead)  
8. **Language** — toggle TR ↔ EN in the sidebar  

AiSensy live test: see `docs/AISENSY_INTEGRATION.md`.
