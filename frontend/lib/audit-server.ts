import { createServiceClient } from "@/utils/supabase/service"

/**
 * Server-side audit log writer — uses service client directly, no HTTP.
 * Safe to call from NextAuth callbacks and server actions.
 * Never throws.
 */
export async function logAuditServer(
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  try {
    const supabase = createServiceClient()
    await supabase.from("audit_logs").insert({
      user_email:  userEmail,
      action,
      entity_type: entityType,
      entity_id:   entityId,
      metadata:    metadata ?? {},
    })
  } catch { /* non-fatal */ }
}
