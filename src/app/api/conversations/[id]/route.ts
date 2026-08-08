import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { generateBotReply, logAiUsage } from "@/lib/ai";
import { sendAisensyText, logWhatsappUsage } from "@/lib/aisensy";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const conversation = await prisma.conversation.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        contact: true,
        messages: { orderBy: { createdAt: "asc" } },
        assignee: { select: { id: true, name: true } },
      },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = await req.json();
    const text = String(body.text || "").trim();
    const asBot = Boolean(body.asBot);
    if (!text) return NextResponse.json({ error: "Empty" }, { status: 400 });

    const conversation = await prisma.conversation.findFirst({
      where: { id, tenantId: session.tenantId },
      include: { contact: true, messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let replyText = text;
    let senderType: "agent" | "bot" = "agent";
    let aiMeta = null as object | null;

    if (asBot || (conversation.aiMode === "auto" && body.triggerAi)) {
      const locale = (conversation.contact.city || "").match(/[İIıi]/) ? "tr" : "tr";
      const history = conversation.messages.map((m) => ({
        role: (m.direction === "inbound" ? "user" : "assistant") as "user" | "assistant",
        content: m.bodyText,
      }));
      const ai = await generateBotReply({
        tenantId: session.tenantId,
        contactName: conversation.contact.displayName,
        channelType: conversation.channelType,
        history: [...history, { role: "user", content: text }],
        locale,
      });
      replyText = ai.reply;
      senderType = "bot";
      aiMeta = { model: ai.usedModel, handoff: ai.handoff };
      await logAiUsage({
        tenantId: session.tenantId,
        tokensIn: ai.tokensIn,
        tokensOut: ai.tokensOut,
        model: ai.usedModel,
      });
      if (ai.handoff) {
        await prisma.conversation.update({
          where: { id },
          data: { aiMode: "off", handoffAt: new Date(), status: "pending" },
        });
      }
    }

    let externalMessageId: string | undefined;
    if (conversation.channelType === "whatsapp" && senderType === "agent") {
      const send = await sendAisensyText({
        to: conversation.contact.phone || "",
        text: replyText,
      });
      externalMessageId = send.externalMessageId;
      if (send.ok) await logWhatsappUsage(session.tenantId, 1);
    }

    const message = await prisma.message.create({
      data: {
        tenantId: session.tenantId,
        conversationId: id,
        direction: "outbound",
        senderType,
        senderUserId: senderType === "agent" ? session.id : null,
        bodyText: replyText,
        externalMessageId,
        aiMeta: aiMeta || undefined,
      },
    });
    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() },
    });
    return NextResponse.json({ message });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const body = await req.json();
    const conversation = await prisma.conversation.updateMany({
      where: { id, tenantId: session.tenantId },
      data: {
        ...(body.aiMode ? { aiMode: body.aiMode } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.assigneeId !== undefined ? { assigneeId: body.assigneeId } : {}),
        ...(body.handoff
          ? { aiMode: "off", handoffAt: new Date(), status: "pending" }
          : {}),
      },
    });
    return NextResponse.json({ ok: true, count: conversation.count });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
