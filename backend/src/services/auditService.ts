import type { AuthSession } from "./authService.js";

type AuditPayload = {
  action: string;
  actor?: AuthSession | null;
  target?: string;
  metadata?: Record<string, unknown>;
};

export function auditLog({ action, actor, target, metadata }: AuditPayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    actor: actor ? { id: actor.id, email: actor.email, role: actor.role } : null,
    target,
    metadata
  };

  console.log(JSON.stringify({ level: "info", type: "audit", ...entry }));
}
