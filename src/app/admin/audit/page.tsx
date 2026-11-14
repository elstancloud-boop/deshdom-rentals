import { desc } from "drizzle-orm";
import { db, t } from "@/db";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function Audit() {
  await requireStaff(true);
  const rows = db.select().from(t.auditLogs).orderBy(desc(t.auditLogs.createdAt)).limit(300).all();
  return (
    <div className="space-y-6"><div><h1 className="display text-5xl font-bold">Audit log</h1><p className="mt-2 text-mute">Every sign-in, failed attempt, booking change and admin action. Admins only.</p></div>
      <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>When (UTC)</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td className="mono whitespace-nowrap text-xs">{r.createdAt}</td><td>{r.actorEmail ?? "system"}</td><td className="mono text-xs font-semibold">{r.action}</td><td>{r.target}</td><td className="text-mute">{r.detail}</td></tr>)}
          {!rows.length && <tr><td colSpan={5} className="py-10 text-center text-mute">Nothing logged yet.</td></tr>}</tbody></table></div></div>
  );
}
