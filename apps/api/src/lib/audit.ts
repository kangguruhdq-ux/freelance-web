import prisma from "./prisma";

export interface CreateAuditLogParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Strip sensitive keys from metadata
function sanitizeMetadata(meta?: Record<string, any> | null): Record<string, any> | null {
  if (!meta) return null;
  const sanitized: Record<string, any> = { ...meta };
  const sensitiveKeys = ["password", "passwordHash", "token", "secret", "jwt", "authorization", "cardNumber"];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

export async function logAuditEvent(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: sanitizeMetadata(params.metadata) as any,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Non-blocking: log error without crashing main request
    console.error("Failed to write audit log:", error);
  }
}
