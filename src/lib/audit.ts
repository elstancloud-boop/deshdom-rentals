import "server-only";
import { db, t } from "@/db";

export function audit(actor: { id: string; email: string } | null, action: string, target?: string, detail?: string) {
  db.insert(t.auditLogs).values({ actorId: actor?.id ?? null, actorEmail: actor?.email ?? null, action, target, detail }).run();
}
