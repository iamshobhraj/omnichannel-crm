"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/ClientProviders";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";

type CostCategory = { category: string; _sum?: { totalCost?: number | null } };
type CostsData = {
  warn?: string;
  todayCost?: number;
  monthCost?: number;
  costPerLead?: number;
  margin?: number;
  byCategory?: CostCategory[];
};

export default function CostsPage() {
  const { locale } = useLocale();
  const [data, setData] = useState<CostsData | null>(null);
  useEffect(() => {
    fetch("/api/costs")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">{t(locale, "costs")}</h1>
        <p className="text-sm text-slate-500">
          {locale === "tr"
            ? "Günlük maliyet, lead başı maliyet ve marj görünürlüğü"
            : "Daily cost, cost-per-lead and margin visibility"}
        </p>
      </div>
      {data?.warn && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {data.warn}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t(locale, "todayCost"), data?.todayCost],
          [locale === "tr" ? "Aylık" : "Month", data?.monthCost],
          [t(locale, "costPerLead"), data?.costPerLead],
          [t(locale, "margin"), data?.margin],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">{label as string}</div>
            <div className="mt-2 text-2xl font-black">{formatMoney(Number(value || 0))}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold">
          {locale === "tr" ? "Kategori kırılımı (bugün)" : "Category breakdown (today)"}
        </h2>
        <div className="mt-4 space-y-2">
          {(data?.byCategory || []).map((c) => (
            <div key={c.category} className="flex justify-between text-sm">
              <span className="capitalize">{c.category}</span>
              <span className="font-semibold">{formatMoney(c._sum?.totalCost || 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
