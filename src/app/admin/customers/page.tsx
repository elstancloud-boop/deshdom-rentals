import { sqlite } from "@/db";
import { requireStaff } from "@/lib/auth";
import { setRole } from "@/actions/admin";
import { money, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export default async function Customers() {
  const me = await requireStaff();
  const rows = sqlite.prepare("SELECT u.id, u.name, u.email, u.role, u.created_at, COUNT(b.id) n, COALESCE(SUM(CASE WHEN b.payment_status='paid' THEN b.total_cents - b.deposit_cents END),0) spent FROM users u LEFT JOIN bookings b ON b.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC").all() as { id: string; name: string; email: string; role: string; created_at: string; n: number; spent: number }[];
  return (
    <div className="space-y-6"><h1 className="display text-5xl font-bold">Customers</h1>
      <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th className="text-right">Bookings</th><th className="text-right">Spent</th><th>Role</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td className="font-semibold">{r.name}</td><td>{r.email}</td><td>{fmtDate(r.created_at.slice(0, 10))}</td><td className="text-right">{r.n}</td><td className="text-right">{money(r.spent)}</td>
          <td>{me.role === "admin" && r.id !== me.id ? <form action={setRole} className="flex gap-2"><input type="hidden" name="id" value={r.id} /><select name="role" defaultValue={r.role} className="field !w-auto !py-1.5 text-sm" aria-label={`Role for ${r.name}`}><option value="customer">customer</option><option value="staff">staff</option><option value="admin">admin</option></select><button className="btn btn-ghost btn-sm">Save</button></form> : <span className="chip">{r.role}</span>}</td></tr>)}</tbody></table></div></div>
  );
}
