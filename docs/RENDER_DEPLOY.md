# Deploy OmniCRM on Render

## Blueprint (recommended)

1. Push this repo to GitHub (private).  
2. Open the one-click deploy link (or Render Dashboard → **New** → **Blueprint** → select this repo):

   ```
   https://render.com/deploy?repo=https://github.com/Mustafi2703/omnichannel-crm
   ```

   Or use the button in the root README.
3. Render creates:
   - PostgreSQL database (free plan expires after 30 days)
   - Web service (`omnichannel-crm`)
4. On first boot the start command runs `prisma db push` + seed (idempotent — will not wipe data on later restarts).
5. Open `https://<service>.onrender.com`  
6. Login: `owner@demo.com` / `Demo1234!`

> Free web services have **no Shell**. Schema + seed run from `startCommand` in `render.yaml`.

## Manual setup

1. **New PostgreSQL** (Render) → copy Internal Database URL  
2. **New Web Service**
   - Runtime: Node
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npx prisma db push && npm run db:seed && npm start`
   - Env:
     - `DATABASE_URL` = Postgres URL
     - `JWT_SECRET` = long random string
     - `OPENAI_API_KEY` = optional
     - `AISENSY_*` = optional
3. Health check path: `/api/health`

## Free tier notes

- Render free web services **spin down** when idle (~1 min cold start).  
- Free Postgres expires after **30 days** (upgrade or recreate).  
- For client demos, wake the URL once before the call.  
- Upgrade to paid if you need always-on.

## Post-deploy checklist

- [ ] `/api/health` returns `db: up`  
- [ ] Login works  
- [ ] Widget demo creates a lead  
- [ ] Inbox shows seeded conversations  
- [ ] Costs page shows categories  
- [ ] (Optional) AiSensy webhook pointed at `/api/webhooks/aisensy`
