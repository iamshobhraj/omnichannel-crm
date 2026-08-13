"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/components/ClientProviders";
import { t } from "@/lib/i18n";
import { formatDate, cn } from "@/lib/utils";

type Convo = {
  id: string;
  channelType: string;
  status: string;
  aiMode: string;
  lastMessageAt: string;
  contact: { displayName: string; phone?: string | null };
  messages: { bodyText: string }[];
};

type Thread = {
  id: string;
  channelType: string;
  aiMode: string;
  contact: { displayName: string };
  messages: {
    id: string;
    direction: string;
    senderType: string;
    bodyText: string;
    createdAt: string;
  }[];
};

export default function InboxPage() {
  const { locale } = useLocale();
  const [list, setList] = useState<Convo[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");

  const loadList = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setList(data.conversations || []);
    setActive((current) => current || data.conversations?.[0]?.id || null);
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    const data = await res.json();
    setThread(data.conversation);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (active) loadThread(active);
  }, [active, loadThread]);

  async function send(asBot = false) {
    if (!active || !text.trim()) return;
    await fetch(`/api/conversations/${active}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, asBot, triggerAi: asBot }),
    });
    setText("");
    await loadThread(active);
    await loadList();
  }

  async function handoff() {
    if (!active) return;
    await fetch(`/api/conversations/${active}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handoff: true }),
    });
    await loadThread(active);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">{t(locale, "inbox")}</h1>
      <div className="grid h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[320px_1fr]">
        <div className="overflow-y-auto border-r border-slate-100">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                "w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50",
                active === c.id && "bg-blue-50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">{c.contact.displayName}</div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                  {c.channelType}
                </span>
              </div>
              <div className="mt-1 truncate text-xs text-slate-500">
                {c.messages[0]?.bodyText || "—"}
              </div>
            </button>
          ))}
        </div>
        <div className="flex flex-col">
          {thread ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <div className="font-bold">{thread.contact.displayName}</div>
                  <div className="text-xs text-slate-500">
                    {thread.channelType} · AI: {thread.aiMode}
                  </div>
                </div>
                <button
                  onClick={handoff}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                >
                  {t(locale, "handoff")}
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                      m.direction === "inbound"
                        ? "bg-slate-100 text-slate-800"
                        : "ml-auto bg-blue-600 text-white",
                    )}
                  >
                    <div className="mb-1 text-[10px] opacity-70">{m.senderType}</div>
                    {m.bodyText}
                    <div className="mt-1 text-[10px] opacity-60">{formatDate(m.createdAt, locale === "tr" ? "tr-TR" : "en-US")}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-slate-100 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(false)}
                  placeholder={locale === "tr" ? "Mesaj yazın…" : "Type a message…"}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <button
                  onClick={() => send(false)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                >
                  {t(locale, "send")}
                </button>
                <button
                  onClick={() => send(true)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
                >
                  AI
                </button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-slate-400">
              {t(locale, "noData")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
