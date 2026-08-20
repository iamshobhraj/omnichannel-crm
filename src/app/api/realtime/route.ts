import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireSession();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) { const tick = async () => { const [open, unread] = await Promise.all([prisma.conversation.count({ where: { tenantId: session.tenantId, status: "open" } }), prisma.notification.count({ where: { tenantId: session.tenantId, OR: [{ userId: session.id }, { userId: null }], readAt: null } })]); controller.enqueue(encoder.encode(`event: summary\ndata: ${JSON.stringify({ open, unread })}\n\n`)); }; void tick(); const timer = setInterval(() => void tick(), 15000); return () => clearInterval(timer); } });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
