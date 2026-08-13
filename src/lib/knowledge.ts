import mammoth from "mammoth";
import OpenAI from "openai";
import { PDFParse } from "pdf-parse";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const CHUNK_SIZE = 1_200;
const CHUNK_OVERLAP = 180;
const EMBEDDING_DIMENSIONS = 1_536;
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

export type KnowledgeSource = {
  documentId: string;
  title: string;
  content: string;
  score: number;
};

function openai() {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? new OpenAI({ apiKey }) : null;
}

export function canManageKnowledge(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

export async function extractKnowledgeText(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File must be 10 MB or smaller");
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      return (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return (await mammoth.extractRawText({ buffer })).value;
  }
  if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(name)) {
    return buffer.toString("utf8");
  }
  throw new Error("Supported formats are PDF, DOCX, TXT, Markdown, and CSV");
}

export function cleanKnowledgeText(content: string) {
  return content.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function chunkKnowledgeText(content: string) {
  const text = cleanKnowledgeText(content);
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(cursor + CHUNK_SIZE, text.length);
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf("\n", end), text.lastIndexOf(". ", end));
      if (boundary > cursor + CHUNK_SIZE / 2) end = boundary + 1;
    }
    const chunk = text.slice(cursor, end).trim();
    if (chunk) chunks.push(chunk);
    cursor = end >= text.length ? text.length : Math.max(end - CHUNK_OVERLAP, cursor + 1);
  }
  return chunks;
}

function vectorLiteral(embedding: number[]) {
  if (embedding.length !== EMBEDDING_DIMENSIONS || embedding.some((value) => !Number.isFinite(value))) {
    throw new Error("Invalid embedding returned by provider");
  }
  return `[${embedding.join(",")}]`;
}

async function createEmbeddings(inputs: string[]) {
  const client = openai();
  if (!client) throw new Error("OPENAI_API_KEY is required to index knowledge documents");
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: inputs,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  return response.data.map((item) => item.embedding);
}

export async function ingestKnowledgeDocument(documentId: string, tenantId: string) {
  await prisma.knowledgeDocument.updateMany({
    where: { id: documentId, tenantId },
    data: { status: "processing", errorMessage: null },
  });
  try {
    const document = await prisma.knowledgeDocument.findFirst({ where: { id: documentId, tenantId } });
    if (!document) throw new Error("Knowledge document not found");
    const chunks = chunkKnowledgeText(document.content);
    if (!chunks.length) throw new Error("No readable text was found in this document");

    const embeddings: number[][] = [];
    for (let start = 0; start < chunks.length; start += 50) {
      embeddings.push(...(await createEmbeddings(chunks.slice(start, start + 50))));
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM "KnowledgeChunk" WHERE "documentId" = ${document.id}`;
      for (const [index, content] of chunks.entries()) {
        await tx.$executeRaw(
          Prisma.sql`INSERT INTO "KnowledgeChunk" ("id", "tenantId", "documentId", "content", "tokenCount", "metadata", "embedding")
            VALUES (${crypto.randomUUID()}, ${tenantId}, ${document.id}, ${content}, ${Math.ceil(content.length / 4)}, ${JSON.stringify({ index })}::jsonb, ${vectorLiteral(embeddings[index])}::vector)`,
        );
      }
    });

    await prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { status: "ready", errorMessage: null, embeddingModel: EMBEDDING_MODEL },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Knowledge indexing failed";
    await prisma.knowledgeDocument.updateMany({
      where: { id: documentId, tenantId },
      data: { status: "failed", errorMessage: message.slice(0, 500) },
    });
    throw error;
  }
}

export async function retrieveKnowledge(params: { tenantId: string; query: string; limit?: number }) {
  const client = openai();
  if (!client || !params.query.trim()) return [] as KnowledgeSource[];
  const [embedding] = await createEmbeddings([params.query]);
  const rows = await prisma.$queryRaw<KnowledgeSource[]>(
    Prisma.sql`SELECT chunk."documentId", document."title", chunk."content",
      1 - (chunk."embedding" <=> ${vectorLiteral(embedding)}::vector) AS "score"
      FROM "KnowledgeChunk" AS chunk
      JOIN "KnowledgeDocument" AS document ON document."id" = chunk."documentId"
      WHERE chunk."tenantId" = ${params.tenantId} AND document."status" = 'ready'
      ORDER BY chunk."embedding" <=> ${vectorLiteral(embedding)}::vector
      LIMIT ${Math.min(Math.max(params.limit || 5, 1), 8)}`,
  );
  return rows.filter((row) => row.score >= 0.25);
}
