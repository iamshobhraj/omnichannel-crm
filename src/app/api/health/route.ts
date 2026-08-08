import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "up",
      geminiConfigured: false,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      aisensyConfigured: Boolean(process.env.AISENSY_API_KEY),
      version: process.env.npm_package_version || "1.0.0",
    });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
