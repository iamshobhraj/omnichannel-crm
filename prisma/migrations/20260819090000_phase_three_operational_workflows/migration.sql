ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "automationPausedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT, "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3),
  "leadId" TEXT, "contactId" TEXT, "conversationId" TEXT, "ownerUserId" TEXT,
  "reminderAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CalendarEvent_tenantId_startsAt_idx" ON "CalendarEvent"("tenantId", "startsAt");
CREATE INDEX IF NOT EXISTS "CalendarEvent_tenantId_reminderAt_idx" ON "CalendarEvent"("tenantId", "reminderAt");
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "WhatsappTemplate" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "providerTemplateId" TEXT, "name" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'tr', "category" TEXT NOT NULL DEFAULT 'marketing', "status" TEXT NOT NULL DEFAULT 'draft',
  "body" TEXT NOT NULL, "variables" JSONB NOT NULL DEFAULT '[]', "buttons" JSONB NOT NULL DEFAULT '[]', "ownerUserId" TEXT,
  "rejectionReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WhatsappTemplate_pkey" PRIMARY KEY ("id"), CONSTRAINT "WhatsappTemplate_tenantId_name_language_key" UNIQUE ("tenantId", "name", "language")
);
CREATE INDEX IF NOT EXISTS "WhatsappTemplate_tenantId_status_idx" ON "WhatsappTemplate"("tenantId", "status");
ALTER TABLE "WhatsappTemplate" ADD CONSTRAINT "WhatsappTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "name" TEXT NOT NULL, "templateId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft', "scheduledAt" TIMESTAMP(3), "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "createdById" TEXT,
  "audience" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Campaign_tenantId_status_scheduledAt_idx" ON "Campaign"("tenantId", "status", "scheduledAt");
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WhatsappTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "CampaignRecipient" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "campaignId" TEXT NOT NULL, "contactId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued', "externalMessageId" TEXT, "error" TEXT, "sentAt" TIMESTAMP(3), "deliveredAt" TIMESTAMP(3),
  "readAt" TIMESTAMP(3), "clickedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CampaignRecipient_campaignId_contactId_key" UNIQUE ("campaignId", "contactId")
);
CREATE INDEX IF NOT EXISTS "CampaignRecipient_tenantId_status_idx" ON "CampaignRecipient"("tenantId", "status");
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
