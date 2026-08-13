-- PostgreSQL 16+ with pgvector is required for semantic knowledge retrieval.
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "KnowledgeDocument"
  ADD COLUMN IF NOT EXISTS "sourceFilename" TEXT,
  ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "errorMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "embeddingModel" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tokenCount" INTEGER NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "embedding" vector(1536) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "KnowledgeChunk_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "KnowledgeChunk_tenantId_documentId_idx"
  ON "KnowledgeChunk"("tenantId", "documentId");

CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embedding_hnsw_idx"
  ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops);
