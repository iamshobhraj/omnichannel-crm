import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { generateBotReply, logAiUsage } from "@/lib/ai";
import { sendAisensyText, logWhatsappUsage } from "@/lib/aisensy";
import { z } from "zod";
import { fromApiError, idSchema } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const id = idSchema.parse((await ctx.params).id);
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
  } catch (error) {
    return fromApiError(error);
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const id = idSchema.parse((await ctx.params).id);
    const body = z.object({ text: z.string().trim().min(1).max(10_000), asBot: z.boolean().optional(), triggerAi: z.boolean().optional() }).parse(await req.json());
    const text = body.text;
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
      aiMeta = {
        model: ai.usedModel,
        handoff: ai.handoff,
        latencyMs: ai.latencyMs,
        sources: (ai.sources || []).map((source) => ({
          documentId: source.documentId,
          title: source.title,
          score: source.score,
        })),
      };
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
  } catch (error) {
    return fromApiError(error);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const id = idSchema.parse((await ctx.params).id);
    const body = z.object({ aiMode: z.enum(["auto", "suggest", "off"]).optional(), status: z.enum(["open", "pending", "closed"]).optional(), assigneeId: z.string().min(1).max(64).nullable().optional(), handoff: z.boolean().optional() }).parse(await req.json());
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
  } catch (error) {
    return fromApiError(error);
  }
}
