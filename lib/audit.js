import "server-only";
import { prisma } from "@/lib/db";

// Record a security-relevant event. Fire-and-forget: never let logging failures
// break the user action.
export async function logAudit(action, { userId = null, ip = null, meta = null } = {}) {
  try {
    await prisma.auditLog.create({
      data: { action, userId, ip, meta: meta ? JSON.stringify(meta).slice(0, 1000) : null },
    });
  } catch {
    /* ignore */
  }
}
