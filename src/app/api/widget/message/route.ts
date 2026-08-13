import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateBotReply, logAiUsage } from "@/lib/ai";

export async function POST(req: Request) {
  const body = await req.json();
  const slug = String(body.tenantSlug || "demo-sirket");
  const text = String(body.text || "").trim();
  const visitorId = String(body.visitorId || `web-${Date.now()}`);
  const name = String(body.name || "Web Visitor");
  const locale = body.locale === "en" ? "en" : "tr";
  const utm = body.utm || {};

  if (!text) return NextResponse.json({ error: "Empty" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const identity = await prisma.contactIdentity.findUnique({
    where: {
      tenantId_type_value: { tenantId: tenant.id, type: "web_visitor_id", value: visitorId },
    },
    include: { contact: true },
  });

  let contact = identity?.contact;
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        displayName: name,
        source: utm.gclid || utm.utm_source === "google" ? "google_ads" : "website",
        utmSource: utm.utm_source,
        utmMedium: utm.utm_medium,
        utmCampaign: utm.utm_campaign,
        gclid: utm.gclid,
        landingUrl: utm.landing_url,
        identities: {
          create: { tenantId: tenant.id, type: "web_visitor_id", value: visitorId },
        },
      },
    });
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      tenantId: tenant.id,
      contactId: contact.id,
      channelType: "website",
      status: { in: ["open", "pending"] },
    },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        tenantId: tenant.id,
        contactId: contact.id,
        channelType: "website",
        aiMode: "auto",
      },
    });
  }

  await prisma.message.create({
    data: {
      tenantId: tenant.id,
      conversationId: conversation.id,
      direction: "inbound",
      senderType: "contact",
      bodyText: text,
    },
  });

  let reply =
    locale === "tr"
      ? "Mesajınız alındı. Kısa süre içinde dönüş yapacağız."
      : "Thanks — we received your message.";
  let handoff = false;
  let aiMeta: object | undefined;

  if (conversation.aiMode === "auto") {
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 12,
    });
    const ai = await generateBotReply({
      tenantId: tenant.id,
      contactName: contact.displayName,
      channelType: "website",
      locale,
      history: history.map((m) => ({
        role: m.direction === "inbound" ? "user" : "assistant",
        content: m.bodyText,
      })),
    });
    reply = ai.reply;
    handoff = ai.handoff;
    aiMeta = {
      model: ai.usedModel,
      latencyMs: ai.latencyMs,
      sources: (ai.sources || []).map((source) => ({
        documentId: source.documentId,
        title: source.title,
        score: source.score,
      })),
    };
    await logAiUsage({
      tenantId: tenant.id,
      tokensIn: ai.tokensIn,
      tokensOut: ai.tokensOut,
      model: ai.usedModel,
    });

    const newStage = await prisma.pipelineStage.findFirst({
      where: { tenantId: tenant.id, key: handoff ? "qualified" : "new" },
    });
    if (newStage) {
      const existing = await prisma.lead.findFirst({
        where: { tenantId: tenant.id, contactId: contact.id },
      });
      if (!existing) {
        await prisma.lead.create({
          data: {
            tenantId: tenant.id,
            contactId: contact.id,
            stageId: newStage.id,
            title: `${contact.displayName} — web`,
            source: contact.source,
            score: 30 + (ai.scoreDelta || 0),
            qualification: ai.qualification || {},
          },
        });
      }
    }

    if (handoff) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { aiMode: "off", handoffAt: new Date(), status: "pending" },
      });
    }
  }

  await prisma.message.create({
    data: {
      tenantId: tenant.id,
      conversationId: conversation.id,
      direction: "outbound",
      senderType: handoff ? "system" : "bot",
      bodyText: reply,
      aiMeta,
    },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({
    reply,
    handoff,
    visitorId,
    conversationId: conversation.id,
    sources: (aiMeta as { sources?: unknown } | undefined)?.sources || [],
  });
}
