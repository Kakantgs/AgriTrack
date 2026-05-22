export function auditLog({ action, actor, target, metadata }) {
    const entry = {
        timestamp: new Date().toISOString(),
        action,
        actor: actor ? { id: actor.id, email: actor.email, role: actor.role } : null,
        target,
        metadata
    };
    console.log(JSON.stringify({ level: "info", type: "audit", ...entry }));
}
