/** Fire-and-forget audit log write. Never throws — failures are non-fatal. */
export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await fetch("/api/audit", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, entityType, entityId, metadata: metadata ?? {} }),
    })
  } catch { /* non-fatal */ }
}
