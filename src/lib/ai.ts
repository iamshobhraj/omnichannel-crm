import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { prisma } from "./prisma";
import { retrieveKnowledge, type KnowledgeSource } from "./knowledge";
import { getChatClient } from "./llm";

export type AiReplyResult = {
  reply: string;
  handoff: boolean;
  qualification?: Record<string, string>;
  scoreDelta?: number;
  usedModel: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  sources?: KnowledgeSource[];
};

export async function generateBotReply(params: {
  tenantId: string;
  contactName: string;
  channelType: string;
  history: { role: "user" | "assistant"; content: string }[];
  locale: "tr" | "en";
}): Promise<AiReplyResult> {
  const startedAt = Date.now();
  const lastUserMessage = params.history.filter((message) => message.role === "user").at(-1)?.content || "";
  let sources: KnowledgeSource[] = [];
  try {
    sources = await retrieveKnowledge({ tenantId: params.tenantId, query: lastUserMessage });
  } catch (error) {
    console.error("Knowledge retrieval failed", error);
  }
  const kb = sources
    .map((source, index) => `[${index + 1}] ${source.title}\n${source.content}`)
    .join("\n\n");

  const system =
    params.locale === "tr"
      ? `Sen bir Türkçe satış asistanısın (Omnichannel CRM). FAQ bilgisini kullan.
Yalnızca KB'de desteklenen ürün gerçeklerini söyle; KB yeterli değilse insan desteğine yönlendir.
Kesin fiyat/sözleşme uydurma. Nitelendirme için şehir, ihtiyaç, zaman çizelgesi sor.
İnsan istediğinde veya karmaşık fiyatta handoff=true yap.
JSON dön: {"reply":"...","handoff":false,"qualification":{"city":"","need":"","timeline":""},"scoreDelta":0}`
      : `You are a sales assistant for an Omnichannel CRM. Use the FAQ knowledge.
Only state product facts supported by the KB; hand off if the KB is insufficient.
Never invent pricing/contracts. Qualify with city, need, timeline.
If user asks for human or pricing is complex, set handoff=true.
Return JSON: {"reply":"...","handoff":false,"qualification":{"city":"","need":"","timeline":""},"scoreDelta":0}`;

  const configuredClient = getChatClient();
  if (!configuredClient) {
    return { ...ruleBasedFallback(params, kb), sources, latencyMs: Date.now() - startedAt };
  }

  try {
    const request: ChatCompletionCreateParamsNonStreaming & {
      chat_template_kwargs?: { enable_thinking: boolean };
      reasoning_budget?: number;
    } = {
      model: configuredClient.config.model,
      temperature: 0.2,
      max_tokens: 800,
      messages: [
        { role: "system", content: `${system}\n\nKB:\n${kb.slice(0, 6000)}` },
        {
          role: "user",
          content: `Contact: ${params.contactName}\nChannel: ${params.channelType}`,
        },
        ...params.history.slice(-8),
      ],
    };
    // Nemotron exposes optional reasoning controls through NVIDIA's
    // OpenAI-compatible extension fields. A CRM reply needs the requested JSON
    // in the final content channel, not a long reasoning trace.
    if (configuredClient.config.provider === "nvidia") {
      Object.assign(request, {
        chat_template_kwargs: { enable_thinking: false },
        reasoning_budget: 0,
      });
    }
    const completion = await configuredClient.client.chat.completions.create(request);
    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = parseReply(raw);
    return {
      reply: parsed.reply || (params.locale === "tr" ? "Size nasıl yardımcı olabilirim?" : "How can I help?"),
      handoff: Boolean(parsed.handoff),
      qualification: parsed.qualification,
      scoreDelta: Number(parsed.scoreDelta || 0),
      usedModel: completion.model || configuredClient.config.model,
      tokensIn: completion.usage?.prompt_tokens,
      tokensOut: completion.usage?.completion_tokens,
      latencyMs: Date.now() - startedAt,
      sources,
    };
  } catch (err) {
    console.error("LLM completion failed; using rule fallback", err);
    return { ...ruleBasedFallback(params, kb), sources, latencyMs: Date.now() - startedAt };
  }
}

function parseReply(raw: string): Partial<AiReplyResult> {
  const withoutFence = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const json = withoutFence.match(/\{[\s\S]*\}/)?.[0] || "{}";
  try {
    return JSON.parse(json) as Partial<AiReplyResult>;
  } catch {
    return { reply: raw.trim() };
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
