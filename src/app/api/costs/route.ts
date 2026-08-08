import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const monthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

    const [byCategory, monthTotal, leadsToday, rateCard, budget, won] = await Promise.all([
      prisma.usageEvent.groupBy({
        by: ["category"],
        where: { tenantId: session.tenantId, occurredAt: { gte: startOfDay } },
        _sum: { totalCost: true },
      }),
      prisma.usageEvent.aggregate({
        where: { tenantId: session.tenantId, occurredAt: { gte: monthStart } },
        _sum: { totalCost: true },
      }),
      prisma.lead.count({
        where: { tenantId: session.tenantId, createdAt: { gte: startOfDay } },
      }),
      prisma.rateCard.findUnique({ where: { tenantId: session.tenantId } }),
      prisma.budgetPolicy.findUnique({ where: { tenantId: session.tenantId } }),
      prisma.lead.findMany({
        where: { tenantId: session.tenantId, stage: { isWon: true } },
        select: { wonAmount: true, attributedCost: true, source: true },
      }),
    ]);

    const todayCost = byCategory.reduce((s, c) => s + (c._sum.totalCost || 0), 0);
    const revenue = won.reduce((s, w) => s + (w.wonAmount || 0), 0);
    const cost = won.reduce((s, w) => s + (w.attributedCost || 0), 0);

    return NextResponse.json({
      todayCost,
      monthCost: monthTotal._sum.totalCost || 0,
      byCategory,
      costPerLead: leadsToday ? todayCost / leadsToday : todayCost,
      margin: revenue - cost,
      revenue,
      rateCard,
      budget,
      warn:
        budget && todayCost >= budget.dailyCap * (budget.warnAtPercent / 100)
          ? `Daily budget ${budget.warnAtPercent}% reached`
          : null,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
