# Omnichannel CRM — Execution Plan (Demo Build)

## Goal
Ship a **demo-ready** LeadGen-class omnichannel CRM on **Render** for developer walkthrough:
professional UI, TR/EN, inbox, CRM pipeline, AI qualify (OpenAI optional), AiSensy webhook stub + integration guide, cost dashboard.

## LeadGen-class feature set (parity target)
| Feature | In demo |
|---------|---------|
| Unified inbox (web + WhatsApp channel) | Yes |
| Website chat widget | Yes |
| AI FAQ / qualify / human handoff | Yes (OpenAI if key; rule-based fallback) |
| Contacts ≠ Leads + pipeline | Yes |
| Follow-up tasks + overdue | Yes |
| Ads UTM/gclid attribution | Yes |
| Daily cost / CPL / margin | Yes |
| Roles Owner/Admin/Agent | Yes |
| Turkish + English UI | Yes |
| AiSensy bidirectional | Webhook + send adapter stub; live when credentials set |
| Deploy on Render | Web + Postgres |

## Architecture (quick deploy)
Single **Next.js** app (App Router) + **Prisma** + **PostgreSQL** on Render Blueprint.
- Faster than splitting Nest/Next for demo
- Same domain model as `DEVELOPER_SYSTEM_DESIGN.md`
- NestJS can be extracted later without schema rewrite

## Stack
- Next.js 15 + TypeScript + Tailwind
- Prisma + Postgres
- next-intl (tr/en)
- OpenAI SDK (optional env)
- JWT cookie auth
- Seeded demo tenant (TR)

## Deploy
`render.yaml` → PostgreSQL + Web Service · `npm run build` · migrate + seed on start
