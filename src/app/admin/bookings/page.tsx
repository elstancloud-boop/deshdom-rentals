import Link from "next/link";
import { sqlite } from "@/db";
import { requireStaff } from "@/lib/auth";
import { setBookingStatus } from "@/actions/admin";
import { Status } from "@/components/Status";
import { money, fmtShort, cls } from "@/lib/format";

export const dynamic = "force-dynamic";
const next: Record<string, [string, string][]> = { pending: [["confirmed", "Confirm"], ["cancelled", "Cancel"]], confirmed: [["picked_up", "Mark picked up"], ["cancelled", "Cancel"]], picked_up: [["returned", "Mark returned"]], returned: [], cancelled: [] };

export default async function Bookings({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireStaff();
  const { status, q } = await searchParams;
  const where: string[] = ["1=1"], args: unknown[] = [];
  if (status && next[status]) { where.push("b.status = ?"); args.push(status); }
  if (q) { where.push("(b.ref LIKE ? OR u.email LIKE ? OR u.name LIKE ?)"); const l = `%${q.slice(0, 40)}%`; args.push(l, l, l); }
  const rows = sqlite.prepare(`SELECT b.id, b.ref, b.start_date s, b.end_date e, b.status, b.payment_status ps, b.total_cents total, b.fulfilment f, u.name, u.email,
    (SELECT GROUP_CONCAT(i.qty || '× ' || i.name, ', ') FROM booking_items i WHERE i.booking_id=b.id) items
    FROM bookings b JOIN users u ON u.id=b.user_id WHERE ${where.join(" AND ")} ORDER BY b.created_at DESC LIMIT 200`).all(...args) as { id: string; ref: string; s: string; e: string; status: string; ps: string; total: number; f: string; name: string; email: string; items: string }[];
  return (
    <div className="space-y-6">
      <h1 className="display text-5xl font-bold">Bookings</h1>
      <div className="flex flex-wrap items-center gap-2">
        {[["", "All"], ["pending", "Pending"], ["confirmed", "Confirmed"], ["picked_up", "Out"], ["returned", "Returned"], ["cancelled", "Cancelled"]].map(([v, l]) => <Link key={v} href={`/admin/bookings${v ? `?status=${v}` : ""}`} className={cls("chip !px-4 !py-2", (status ?? "") === v && "!bg-ink !text-white")}>{l}</Link>)}
        <form className="ml-auto"><input name="q" defaultValue={q} placeholder="Search ref, name, email" className="field !rounded-full !py-2 text-sm" aria-label="Search bookings" /></form>
      </div>
      <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>Ref</th><th>Customer</th><th>Items</th><th>Dates</th><th>Status</th><th className="text-right">Total</th><th>Actions</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}>
          <td className="mono font-semibold">{r.ref}</td><td>{r.name}<div className="text-xs text-mute">{r.email}</div></td><td className="max-w-[220px] text-xs">{r.items}<div className="text-mute">{r.f === "delivery" ? "Delivery" : "Pickup"}</div></td>
          <td className="whitespace-nowrap">{fmtShort(r.s)} → {fmtShort(r.e)}</td><td><div className="flex flex-col items-start gap-1"><Status s={r.status} /><Status s={r.ps} /></div></td><td className="text-right font-semibold">{money(r.total)}</td>
          <td><div className="flex flex-wrap gap-1.5">{next[r.status].map(([to, l]) => <form key={to} action={setBookingStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="to" value={to} /><button className={cls("btn btn-sm", to === "cancelled" ? "btn-ghost" : "btn-primary")}>{l}</button></form>)}</div></td></tr>)}
          {!rows.length && <tr><td colSpan={7} className="py-12 text-center text-mute">No bookings match.</td></tr>}</tbody></table></div>
    </div>
  );
}
