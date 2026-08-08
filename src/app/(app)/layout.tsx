import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ClientProviders } from "@/components/ClientProviders";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <ClientProviders userName={session.name}>{children}</ClientProviders>;
}
