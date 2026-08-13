import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: Request) { const slug = new URL(req.url).searchParams.get("tenant") || ""; const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { name: true, slug: true, settings: true } }); if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 }); return NextResponse.json({ tenant: { name: tenant.name, slug: tenant.slug, settings: tenant.settings } }); }
