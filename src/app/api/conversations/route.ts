import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const query = new URL(req.url).searchParams;
    const status = query.get("status"); const assigneeId = query.get("assigneeId"); const q = query.get("q") || "";
    const conversations = await prisma.conversation.findMany({
      where: { tenantId: session.tenantId, ...(status ? { status: status as "open" | "pending" | "closed" } : {}), ...(assigneeId ? { assigneeId } : {}), ...(q ? { contact: { displayName: { contains: q, mode: "insensitive" } } } : {}) },
      orderBy: { lastMessageAt: "desc" },
      include: {
        contact: true,
        assignee: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      take: 100,
    });
    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
