# Omnichannel CRM + AI Lead Platform  
## Client Requirements Pack

**Prepared for:** Turkish client (single-company deployment)  
**Document date:** July 2026  
**Status:** Ready to share — for infrastructure setup & project kickoff  

---

### Documents in this pack

| # | File | Purpose |
|---|------|---------|
| 1 | **[TECH_STACK_AND_SERVER_REQUIREMENTS.md](./TECH_STACK_AND_SERVER_REQUIREMENTS.md)** | Full requirements: product scope, tech stack, server CPU/RAM/storage, integrations, cost modules, security |
| 2 | **[CLIENT_SETUP_CHECKLIST.md](./CLIENT_SETUP_CHECKLIST.md)** | Short action checklist — what the client must create/buy this week |
| 3 | **[10_DAY_DELIVERY_PLAN.md](./10_DAY_DELIVERY_PLAN.md)** | 10-day build plan: development, deployment, reliability, UAT & launch |
| 4 | **[DEVELOPER_SYSTEM_DESIGN.md](./DEVELOPER_SYSTEM_DESIGN.md)** | **Share with developers** — how to build the system (architecture, schema, modules, APIs, AI, deploy) |
| 5 | **[AISENSY_INTEGRATION.md](./AISENSY_INTEGRATION.md)** | WhatsApp / AiSensy webhook + send integration steps |
| 6 | **[RENDER_DEPLOY.md](./RENDER_DEPLOY.md)** | Deploy demo to Render |
| 7 | **[DEMO_BUILD_PLAN.md](./DEMO_BUILD_PLAN.md)** | Demo feature parity / build plan |

---

### One-page summary for management

| Item | Decision |
|------|----------|
| **Who uses it** | Your company only (single tenant). Multi-company SaaS later if needed. |
| **What it does** | Unified inbox (web + WhatsApp) → AI qualify → CRM leads → follow-ups → Google Ads tracking → **daily cost & margin visibility** |
| **Server to buy** | **4 vCPU · 8 GB RAM · 80 GB SSD** (EU VPS: Hetzner or DigitalOcean). Ubuntu 22.04/24.04. |
| **MVP minimum** | 2 vCPU · 4 GB · 40 GB (pilot only) |
| **Tech stack** | Next.js + NestJS + PostgreSQL + Redis + OpenAI + AiSensy + Google Ads |
| **Not needed now** | AWS, raw Meta Cloud API DIY, multi-tenant SaaS platform |
| **Est. monthly tech cost** | **~$70–180** (server + AI + WhatsApp platform plan). Meta message fees + Google ad spend are separate. |

---

### What you need to set up (client side)

1. Domain + Cloudflare  
2. VPS (specs above)  
3. OpenAI account with monthly spend cap  
4. Resend (email)  
5. AiSensy account + WhatsApp number  
6. Google Ads account (for lead source / conversions)  
7. Brand assets, user list, product FAQ/brochures  

Details and checkboxes: **CLIENT_SETUP_CHECKLIST.md**

---

### Product modules (included)

1. Workspace, users, roles  
2. Unified inbox  
3. Contact CRM  
4. Lead pipeline + follow-up alerts  
5. AI FAQ + lead qualification  
6. WhatsApp via AiSensy  
7. Google Ads attribution  
8. **Cost management — daily visibility, cost per lead, margin analysis**  

---

**Next step after review:** Kickoff call → client creates accounts from the checklist → we provision the app on the VPS.

*This pack is independently designed software (LeadGen-class capabilities). It does not copy LeadGen.io branding, UI, or proprietary code.*
