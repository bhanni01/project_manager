import { prisma } from "@pt/db";

export interface AuditEventInput {
  action: string;
  actorUserId: string | null;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
}

/**
 * Append a row to AuditEvent. Best-effort: errors are logged and swallowed
 * so that an audit failure never breaks the user-facing action.
 */
export async function writeAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        targetType: input.targetType,
        targetId: input.targetId,
        beforeJson: input.before === undefined ? undefined : (input.before as object),
        afterJson: input.after === undefined ? undefined : (input.after as object),
      },
    });
  } catch (err) {
    console.error("[audit] failed to write event", input.action, err);
  }
}
