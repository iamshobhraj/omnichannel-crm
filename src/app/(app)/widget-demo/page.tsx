"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/ClientProviders";

export default function WidgetDemoPage() {
  const { locale } = useLocale();
  const visitorId = useMemo(() => {
    if (typeof window === "undefined") return "ssr";
    const key = "omni_visitor_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = `web-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, id);
    }
    return id;
  }, []);
  const [messages, setMessages] = useState<{ role: string; text: string; sources?: { title: string }[] }[]>([
    {
      role: "bot",
      text:
        locale === "tr"
          ? "Merhaba! Size nasıl yardımcı olabiliriz?"
          : "Hello! How can we help you today?",
    },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!text.trim() || busy) return;
    const userText = text.trim();
    setText("");
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setBusy(true);
    const res = await fetch("/api/widget/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: userText,
        visitorId,
        locale,
        name: locale === "tr" ? "Web Ziyaretçi" : "Web Visitor",
        utm: { utm_source: "widget-demo", utm_campaign: "dev-demo" },
      }),
    });
    const data = await res.json();
    setMessages((m) => [...m, { role: "bot", text: data.reply || "…", sources: data.sources || [] }]);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-black">
          {locale === "tr" ? "Web sohbet widget demosu" : "Web chat widget demo"}
        </h1>
        <p className="text-sm text-slate-500">
          {locale === "tr"
            ? "Bu akış kişi + sohbet + lead oluşturur ve AI yanıtlar."
            : "This flow creates contact + conversation + lead and AI replies."}
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="bg-slate-900 px-4 py-3 text-sm font-bold text-white">OmniCRM Chat</div>
        <div className="h-80 space-y-2 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user" ? "ml-auto bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.text}
              {m.sources && m.sources.length > 0 ? (
                <div className="mt-2 border-t border-slate-200 pt-1 text-[10px] text-slate-500">
                  {locale === "tr" ? "Kaynak: " : "Sources: "}
                  {m.sources.map((source) => source.title).join(", ")}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder={locale === "tr" ? "Mesaj…" : "Message…"}
          />
          <button
            onClick={send}
            disabled={busy}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "…" : locale === "tr" ? "Gönder" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
