"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/ClientProviders";
import { t } from "@/lib/i18n";

type KnowledgeDoc = { id: string; title: string; content: string };

export default function KnowledgePage() {
  const { locale } = useLocale();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((d) => setDocs(d.docs || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">{t(locale, "knowledge")}</h1>
        <p className="text-sm text-slate-500">
          {locale === "tr"
            ? "AI FAQ / nitelendirme bilgi bankası (OpenAI yoksa kural tabanlı yedek çalışır)"
            : "AI FAQ / qualification knowledge base (rule fallback if OpenAI missing)"}
        </p>
      </div>
      {docs.map((d) => (
        <article key={d.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">{d.title}</h2>
          <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{d.content}</pre>
        </article>
      ))}
    </div>
  );
}
