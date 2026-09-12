# Graph Report - omnichannel-crm  (2026-08-21)

## Corpus Check
- 96 files · ~39,011 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 624 nodes · 1137 edges · 36 communities (29 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `080bc92d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- fromApiError
- useLocale
- Omnichannel CRM + AI Lead Platform
- devDependencies
- conversations/[id]/route.ts
- Omnichannel CRM + AI Lead Platform
- dependencies
- compilerOptions
- auth/route.ts
- Omnichannel CRM — 10-Day Client Delivery Plan
- knowledge.ts
- Implementation Status and Delivery Backlog
- OmniCRM — Omnichannel AI Lead Platform (Developer Demo)
- Phase 0 Delivery Decisions
- OmniCRM Work Task List
- Client Setup Checklist
- AiSensy WhatsApp Integration Guide
- Omnichannel CRM — Execution Plan (Demo Build)
- Operations Runbook
- Client Requirements Pack
- Deploy OmniCRM on Render
- eslint.config.mjs
- automations/page.tsx
- app/layout.tsx
- postcss.config.mjs
- seed.ts
- LoginPage
- AGENTS.md
- next.config.ts
- backup-postgres.sh

## God Nodes (most connected - your core abstractions)
1. `fromApiError()` - 72 edges
2. `requireSession()` - 49 edges
3. `prisma` - 43 edges
4. `requireRole()` - 39 edges
5. `audit()` - 32 edges
6. `Omnichannel CRM + AI Lead Platform` - 22 edges
7. `Omnichannel CRM — 10-Day Client Delivery Plan` - 21 edges
8. `useLocale()` - 19 edges
9. `t()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `DELETE()` --calls--> `requireRole()`  [EXTRACTED]
  src/app/api/knowledge/[id]/route.ts → src/lib/auth.ts
- `AppLayout()` --calls--> `getSession()`  [EXTRACTED]
  src/app/(app)/layout.tsx → src/lib/auth.ts
- `GET()` --calls--> `fromApiError()`  [EXTRACTED]
  src/app/api/admin/worker/route.ts → src/lib/api.ts
- `GET()` --calls--> `requireRole()`  [EXTRACTED]
  src/app/api/admin/worker/route.ts → src/lib/auth.ts
- `POST()` --calls--> `fromApiError()`  [EXTRACTED]
  src/app/api/admin/worker/route.ts → src/lib/api.ts

## Import Cycles
- None detected.

## Communities (36 total, 7 thin omitted)

### Community 0 - "fromApiError"
Cohesion: 0.06
Nodes (79): GET(), POST(), schema, GET(), input, POST(), GET(), inputSchema (+71 more)

### Community 1 - "useLocale"
Cohesion: 0.08
Nodes (34): ContactRow, ContactsPage(), CostCategory, CostsData, CostsPage(), Dash, DashboardPage(), EventRow (+26 more)

### Community 2 - "Omnichannel CRM + AI Lead Platform"
Cohesion: 0.04
Nodes (48): 10. AI integration (how it must be done), 11. Security & KVKK (implementation requirements), 12. Frontend implementation notes, 13. Deployment architecture, 14. Reliability requirements (non-negotiable for launch), 15. Coding standards for this codebase, 16. Seed data (required for dev), 17. Definition of done (per feature) (+40 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-next, @eslint/eslintrc, devDependencies, eslint, eslint-config-next, @eslint/eslintrc, postcss (+38 more)

### Community 4 - "conversations/[id]/route.ts"
Cohesion: 0.10
Nodes (35): Ctx, PATCH(), POST(), GET(), POST(), POST(), AiReplyResult, generateBotReply() (+27 more)

### Community 5 - "Omnichannel CRM + AI Lead Platform"
Cohesion: 0.04
Nodes (46): 10. This week — client action list, 11. Decision summary, 1.1 Single tenant now → multi-tenant later, 1. Executive summary, 2. Compatible tech stack (locked for MVP + launch), 3.1 Recommended server (buy this), 3.2 How RAM is used on the recommended 8 GB box, 3.3 Storage breakdown (80 GB launch disk) (+38 more)

### Community 6 - "dependencies"
Cohesion: 0.04
Nodes (45): bcryptjs, bullmq, clsx, date-fns, dotenv, ioredis, jose, lucide-react (+37 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx (+18 more)

### Community 8 - "auth/route.ts"
Cohesion: 0.14
Nodes (16): GET(), POST(), DELETE(), GET(), POST(), AppLayout(), Home(), ClientProviders() (+8 more)

### Community 9 - "Omnichannel CRM — 10-Day Client Delivery Plan"
Cohesion: 0.10
Nodes (21): Client dependencies (critical path), Daily standup format (15 min), Day 0 — Kickoff & access (before Day 1 morning), Day 10 — Launch readiness + handoff, Day 1 — Foundations & data model, Day 2 — Contacts, leads, pipeline UI, Day 3 — Unified inbox (website) + realtime, Day 4 — Tasks, follow-ups, alerts (+13 more)

### Community 10 - "knowledge.ts"
Cohesion: 0.21
Nodes (16): Context, DELETE(), PATCH(), runtime, GET(), POST(), runtime, canManageKnowledge() (+8 more)

### Community 11 - "Implementation Status and Delivery Backlog"
Cohesion: 0.14
Nodes (14): Client inputs required before launch, Current state, Definition of done, Explicitly out of scope for this launch, Implementation Status and Delivery Backlog, P0 — Knowledge base / RAG (client-requested), P0 — Security and correctness, P1 — Integrations and economics (+6 more)

### Community 12 - "OmniCRM — Omnichannel AI Lead Platform (Developer Demo)"
Cohesion: 0.15
Nodes (13): Checks, Demo logins, Demo walkthrough for developers, Deploy to Render, Docs (read these), Env vars, NVIDIA test configuration, OmniCRM — Omnichannel AI Lead Platform (Developer Demo) (+5 more)

### Community 13 - "Phase 0 Delivery Decisions"
Cohesion: 0.20
Nodes (6): Client data still required, Confirmed delivery order, Confirmed launch scope, Phase 0 Delivery Decisions, Provisional acceptance criteria, Phase 3 Regression Script

### Community 14 - "OmniCRM Work Task List"
Cohesion: 0.20
Nodes (10): Deferred reference-workflow enhancements, OmniCRM Work Task List, Phase 0 — Delivery baseline, Phase 1 — Knowledge base and RAG (client priority), Phase 2 — API security and CRM correctness, Phase 3 — Inbox, widget, and automations, Phase 4 — AiSensy, Ads, and costs, Phase 5 — Production readiness (+2 more)

### Community 16 - "Client Setup Checklist"
Cohesion: 0.22
Nodes (9): Checklist — please complete, Client Setup Checklist, Compatible technology (locked), Estimated monthly tech cost (one company), Kısa Türkçe özet (yönetim), Product you will receive (modules), Scope reminder, Server to order (clear compute) (+1 more)

### Community 17 - "AiSensy WhatsApp Integration Guide"
Cohesion: 0.25
Nodes (8): AiSensy WhatsApp Integration Guide, Architecture, Demo mode (no keys), Go-live checklist (client + eng), Local webhook test, Payload shapes supported, Production notes, Security

### Community 18 - "Omnichannel CRM — Execution Plan (Demo Build)"
Cohesion: 0.33
Nodes (6): Architecture (quick deploy), Deploy, Goal, LeadGen-class feature set (parity target), Omnichannel CRM — Execution Plan (Demo Build), Stack

### Community 19 - "Operations Runbook"
Cohesion: 0.33
Nodes (5): Backup and restore drill, Before UAT, Deploy, Incident restart, Operations Runbook

### Community 20 - "Client Requirements Pack"
Cohesion: 0.33
Nodes (6): Client Requirements Pack, Documents in this pack, Omnichannel CRM + AI Lead Platform, One-page summary for management, Product modules (included), What you need to set up (client side)

### Community 21 - "Deploy OmniCRM on Render"
Cohesion: 0.40
Nodes (5): Blueprint (recommended), Deploy OmniCRM on Render, Free tier notes, Manual setup, Post-deploy checklist

### Community 22 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

### Community 23 - "automations/page.tsx"
Cohesion: 0.40
Nodes (3): Rule, Run, WorkerStatus

## Knowledge Gaps
- **299 isolated node(s):** `__filename`, `__dirname`, `compat`, `eslintConfig`, `nextConfig` (+294 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Omnichannel CRM + AI Lead Platform` connect `Omnichannel CRM + AI Lead Platform` to `README.md`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `Omnichannel CRM + AI Lead Platform` connect `Omnichannel CRM + AI Lead Platform` to `README.md`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `prisma` connect `fromApiError` to `auth/route.ts`, `knowledge.ts`, `conversations/[id]/route.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `compat` to the rest of the system?**
  _299 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `fromApiError` be split into smaller, more focused modules?**
  _Cohesion score 0.059928582518242506 - nodes in this community are weakly interconnected._
- **Should `useLocale` be split into smaller, more focused modules?**
  _Cohesion score 0.08020050125313283 - nodes in this community are weakly interconnected._
- **Should `Omnichannel CRM + AI Lead Platform` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._