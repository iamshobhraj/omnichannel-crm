import { Worker } from "bullmq";
import { prisma } from "./lib/prisma";
import { notify } from "./lib/notifications";
import { runAutomations } from "./lib/automation";
import { enqueueAutomation } from "./lib/queue";

async function scan() {
  const now = new Date();
  const due = await prisma.task.findMany({ where: { status: "open", dueAt: { lte: now }, assigneeId: { not: null } }, select: { id: true, tenantId: true, title: true, assigneeId: true, contactId: true } });
  for (const task of due) { if (task.assigneeId) await notify({ tenantId: task.tenantId, userId: task.assigneeId, type: "task_due", title: "Follow-up due", body: task.title }); await runAutomations(task.tenantId, "task_overdue", { assigneeId: task.assigneeId || undefined, contactId: task.contactId || undefined }); }
  const stale = await prisma.conversation.findMany({ where: { status: "open", assigneeId: { not: null }, lastMessageAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, select: { tenantId: true, assigneeId: true, id: true, contactId: true } });
  for (const conversation of stale) if (conversation.assigneeId) {
    await notify({ tenantId: conversation.tenantId, userId: conversation.assigneeId, type: "sla_no_reply", title: "SLA reminder", body: `Conversation ${conversation.id} has no reply for 24 hours.` });
    await runAutomations(conversation.tenantId, "sla_no_reply", { conversationId: conversation.id, contactId: conversation.contactId, assigneeId: conversation.assigneeId });
  }
}

const connection = process.env.REDIS_URL ? { url: process.env.REDIS_URL } : undefined;
if (!connection) throw new Error("REDIS_URL is required for the worker");
new Worker("automation", async (job) => {
  if (job.name !== "sla_scan") throw new Error(`Unsupported automation job: ${job.name}`);
  await scan();
}, { connection });

function scheduleScan() {
  void enqueueAutomation("sla_scan", {}).catch((error) => console.error("Unable to enqueue SLA scan", error));
}
scheduleScan();
setInterval(scheduleScan, 5 * 60 * 1000);
