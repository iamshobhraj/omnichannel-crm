import OpenAI from "openai";
import { prisma } from "./prisma";

export type AiReplyResult = {
  reply: string;
  handoff: boolean;
  qualification?: Record<string, string>;
  scoreDelta?: number;
  usedModel: string;
  tokensIn?: number;
  tokensOut?: number;
};

function client() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export async function generateBotReply(params: {
  tenantId: string;
  contactName: string;
  channelType: string;
  history: { role: "user" | "assistant"; content: string }[];
  locale: "tr" | "en";
}): Promise<AiReplyResult> {
  const docs = await prisma.knowledgeDocument.findMany({
    where: { tenantId: params.tenantId, status: "ready" },
    take: 3,
  });
  const kb = docs.map((d) => `# ${d.title}\n${d.content}`).join("\n\n");

  const system =
    params.locale === "tr"
      ? `Sen bir Türkçe satış asistanısın (Omnichannel CRM). FAQ bilgisini kullan.
Kesin fiyat/sözleşme uydurma. Nitelendirme için şehir, ihtiyaç, zaman çizelgesi sor.
İnsan istediğinde veya karmaşık fiyatta handoff=true yap.
JSON dön: {"reply":"...","handoff":false,"qualification":{"city":"","need":"","timeline":""},"scoreDelta":0}`
      : `You are a sales assistant for an Omnichannel CRM. Use the FAQ knowledge.
Never invent pricing/contracts. Qualify with city, need, timeline.
If user asks for human or pricing is complex, set handoff=true.
Return JSON: {"reply":"...","handoff":false,"qualification":{"city":"","need":"","timeline":""},"scoreDelta":0}`;

  const openai = client();
  if (!openai) {
    return ruleBasedFallback(params, kb);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${system}\n\nKB:\n${kb.slice(0, 6000)}` },
        {
          role: "user",
          content: `Contact: ${params.contactName}\nChannel: ${params.channelType}`,
        },
        ...params.history.slice(-8),
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw) as AiReplyResult;
    return {
      reply: parsed.reply || (params.locale === "tr" ? "Size nasıl yardımcı olabilirim?" : "How can I help?"),
      handoff: Boolean(parsed.handoff),
      qualification: parsed.qualification,
      scoreDelta: Number(parsed.scoreDelta || 0),
      usedModel: completion.model,
      tokensIn: completion.usage?.prompt_tokens,
      tokensOut: completion.usage?.completion_tokens,
    };
  } catch (err) {
    console.error("OpenAI failed, fallback", err);
    return ruleBasedFallback(params, kb);
  }
}

function ruleBasedFallback(
  params: { locale: "tr" | "en"; history: { role: string; content: string }[] },
  kb: string,
): AiReplyResult {
  const last = params.history.filter((m) => m.role === "user").at(-1)?.content?.toLowerCase() || "";
  const wantsHuman = /insan|agent|temsilci|human|sales|fiyat|price|teklif/.test(last);
  if (wantsHuman) {
    return {
      reply:
        params.locale === "tr"
          ? "Sizi bir satış uzmanına bağlıyorum. Kısa süre içinde dönüş yapacağız."
          : "Connecting you to a sales specialist shortly.",
      handoff: true,
      scoreDelta: 10,
      usedModel: "rule-fallback",
    };
  }
  const faqHit = kb.toLowerCase().includes("demo") && /demo|görüşme|meeting/.test(last);
  return {
    reply: faqHit
      ? params.locale === "tr"
        ? "Ücretsiz 30 dakikalık keşif görüşmesi planlayabiliriz. Şehriniz ve ekip büyüklüğünüz nedir?"
        : "We can book a free 30-min discovery call. What’s your city and team size?"
      : params.locale === "tr"
        ? "Merhaba! WhatsApp/web üzerinden lead yönetimi ve AI nitelendirme sunuyoruz. İhtiyacınızı kısaca yazar mısınız?"
        : "Hi! We offer WhatsApp/web lead management with AI qualification. What do you need help with?",
    handoff: false,
    scoreDelta: 5,
    usedModel: "rule-fallback",
    qualification: {},
  };
}

export async function logAiUsage(params: {
  tenantId: string;
  leadId?: string;
  tokensIn?: number;
  tokensOut?: number;
  model: string;
}) {
  const card = await prisma.rateCard.findUnique({ where: { tenantId: params.tenantId } });
  const inCost = ((params.tokensIn || 500) / 1000) * (card?.openaiPer1kIn ?? 0.15);
  const outCost = ((params.tokensOut || 200) / 1000) * (card?.openaiPer1kOut ?? 0.6);
  const total = Number((inCost + outCost).toFixed(4));
  await prisma.usageEvent.create({
    data: {
      tenantId: params.tenantId,
      category: "ai",
      eventType: "completion",
      quantity: 1,
      unitCost: total,
      totalCost: total,
      leadId: params.leadId,
      meta: { model: params.model, tokensIn: params.tokensIn, tokensOut: params.tokensOut },
    },
  });
}
