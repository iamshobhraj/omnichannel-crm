import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();
    const tasks = await prisma.task.findMany({
      where: { tenantId: session.tenantId },
      include: {
        lead: { include: { contact: true } },
        assignee: { select: { name: true } },
      },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    });
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    await prisma.task.updateMany({
      where: { id: body.id, tenantId: session.tenantId },
      data: {
        status: body.status,
        completedAt: body.status === "done" ? new Date() : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
