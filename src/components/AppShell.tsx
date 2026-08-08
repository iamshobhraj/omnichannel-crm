"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Kanban,
  CheckSquare,
  Wallet,
  BookOpen,
  MessageSquare,
  LogOut,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t, type Locale } from "@/lib/i18n";

const nav = [
  { href: "/dashboard", key: "dashboard" as const, icon: LayoutDashboard },
  { href: "/inbox", key: "inbox" as const, icon: Inbox },
  { href: "/contacts", key: "contacts" as const, icon: Users },
  { href: "/leads", key: "leads" as const, icon: Kanban },
  { href: "/tasks", key: "tasks" as const, icon: CheckSquare },
  { href: "/costs", key: "costs" as const, icon: Wallet },
  { href: "/knowledge", key: "knowledge" as const, icon: BookOpen },
  { href: "/widget-demo", key: "widget" as const, icon: MessageSquare },
];

export function AppShell({
  children,
  locale,
  onLocale,
  userName,
}: {
  children: React.ReactNode;
  locale: Locale;
  onLocale: (l: Locale) => void;
  userName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-[#0f172a] text-slate-100 md:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="text-lg font-bold tracking-tight">{t(locale, "appName")}</div>
            <div className="mt-1 text-xs text-slate-400">{t(locale, "tagline")}</div>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(locale, item.key)}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-2 border-t border-white/10 p-4">
            <button
              onClick={() => onLocale(locale === "tr" ? "en" : "tr")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <Languages className="h-4 w-4" />
              {locale === "tr" ? "English" : "Türkçe"}
            </button>
            <div className="px-3 text-xs text-slate-500">{userName}</div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <LogOut className="h-4 w-4" />
              {t(locale, "logout")}
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="font-bold">{t(locale, "appName")}</div>
          </div>
          <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
