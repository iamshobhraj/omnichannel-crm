ALTER TABLE "Message"
  ADD COLUMN IF NOT EXISTS "deliveryStatus" TEXT NOT NULL DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS "deliveryError" TEXT;

CREATE TABLE IF NOT EXISTS "Attachment" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "conversationId" TEXT NOT NULL, "messageId" TEXT,
  "filename" TEXT NOT NULL, "contentType" TEXT NOT NULL, "storageKey" TEXT NOT NULL, "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Attachment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Attachment_tenantId_conversationId_idx" ON "Attachment"("tenantId", "conversationId");

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "userId" TEXT, "type" TEXT NOT NULL, "title" TEXT NOT NULL, "body" TEXT, "readAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_tenantId_userId_readAt_idx" ON "Notification"("tenantId", "userId", "readAt");

CREATE TABLE IF NOT EXISTS "AutomationRule" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "name" TEXT NOT NULL, "trigger" TEXT NOT NULL, "action" TEXT NOT NULL, "config" JSONB NOT NULL DEFAULT '{}', "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id"), CONSTRAINT "AutomationRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AutomationRule_tenantId_trigger_isActive_idx" ON "AutomationRule"("tenantId", "trigger", "isActive");

CREATE TABLE IF NOT EXISTS "AutomationRun" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "ruleId" TEXT NOT NULL, "status" TEXT NOT NULL, "detail" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id"), CONSTRAINT "AutomationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AutomationRun_tenantId_createdAt_idx" ON "AutomationRun"("tenantId", "createdAt");
