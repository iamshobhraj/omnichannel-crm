"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/ClientProviders";
import { t } from "@/lib/i18n";

type ContactRow = {
  id: string;
  displayName: string;
  companyName?: string | null;
  source: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  _count?: { leads: number; conversations: number };
};

export default function ContactsPage() {
  const { locale } = useLocale();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{t(locale, "contacts")}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {contacts.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold">{c.displayName}</div>
                <div className="text-sm text-slate-500">{c.companyName || "—"}</div>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">
                {c.source}
              </span>
            </div>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <div>{c.email || "—"}</div>
              <div>{c.phone || "—"}</div>
              <div>{c.city || "—"}</div>
              <div className="text-xs text-slate-400">
                Leads: {c._count?.leads || 0} · Conv: {c._count?.conversations || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
