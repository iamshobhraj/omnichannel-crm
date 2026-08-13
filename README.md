# OmniCRM — Omnichannel AI Lead Platform (Developer Demo)

Private repo for QRYX Tech / Turkish client omnichannel CRM demo.

LeadGen-class capabilities: unified inbox, web widget, WhatsApp (AiSensy), AI FAQ/qualify, CRM pipeline, follow-ups, ads attribution, daily cost/margin — with **Turkish + English** UI.

---

## Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Mustafi2703/omnichannel-crm)

Or follow [docs/RENDER_DEPLOY.md](./docs/RENDER_DEPLOY.md).

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

### Windows / shared local environment for worktrees

Use Node 22 (the version in [`.nvmrc`](./.nvmrc)). Run this once from each
worktree:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-local.ps1
```

The script keeps the canonical local settings in
`%LOCALAPPDATA%\OmniCRM\shared.env` and copies it into the current worktree as
the Git-ignored `.env`. Fill in `DATABASE_URL` and a long `JWT_SECRET` in the
shared file once; future worktrees can reuse it with the same command. Use
`-Force` only when you intentionally want to overwrite a worktree's `.env`.

### Checks

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs these checks for pull requests and pushes to `main`.

If an interrupted or corrupted install leaves npm retrying tarballs, cancel it,
then run `npm ci` again. The repository's ignored `.npm-cache` keeps this
project separate from the Windows user-level npm cache.

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
| [docs/IMPLEMENTATION_STATUS_AND_BACKLOG.md](./docs/IMPLEMENTATION_STATUS_AND_BACKLOG.md) | Current verified status and prioritized delivery backlog |
| [docs/WORK_TASK_LIST.md](./docs/WORK_TASK_LIST.md) | Active execution checklist for the delivery |

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
