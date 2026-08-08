import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();
    const contacts = await prisma.contact.findMany({
      where: { tenantId: session.tenantId },
      include: { _count: { select: { leads: true, conversations: true } }, owner: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ contacts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
