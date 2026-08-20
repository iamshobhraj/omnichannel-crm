import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChatConfiguration } from "@/lib/llm";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const llm = getChatConfiguration();
    return NextResponse.json({
      status: "ok",
      db: "up",
      geminiConfigured: false,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      llmConfigured: Boolean(llm),
      llmProvider: llm?.provider || null,
      llmModel: llm?.model || null,
      aisensyConfigured: Boolean(process.env.AISENSY_API_KEY),
      version: process.env.npm_package_version || "1.0.0",
    });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
