import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const leads = await prisma.lead.findMany({
      where: {
        tenantId: session.tenantId,
        OR: q
          ? [
              { title: { contains: q, mode: "insensitive" } },
              { contact: { displayName: { contains: q, mode: "insensitive" } } },
            ]
          : undefined,
      },
      include: {
        contact: true,
        stage: true,
        owner: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    const stages = await prisma.pipelineStage.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { position: "asc" },
    });
    return NextResponse.json({ leads, stages });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const id = String(body.id || "");
    const lead = await prisma.lead.updateMany({
      where: { id, tenantId: session.tenantId },
      data: {
        ...(body.stageId ? { stageId: body.stageId } : {}),
        ...(body.score !== undefined ? { score: Number(body.score) } : {}),
        ...(body.nextFollowupAt !== undefined
          ? { nextFollowupAt: body.nextFollowupAt ? new Date(body.nextFollowupAt) : null }
          : {}),
        ...(body.expectedValue !== undefined
          ? { expectedValue: Number(body.expectedValue) }
          : {}),
        ...(body.wonAmount !== undefined ? { wonAmount: Number(body.wonAmount) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
    });
    return NextResponse.json({ ok: true, count: lead.count });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
