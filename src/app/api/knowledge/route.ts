import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();
    const docs = await prisma.knowledgeDocument.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ docs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
