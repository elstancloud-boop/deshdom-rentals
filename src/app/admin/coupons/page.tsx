import { db, t } from "@/db";
import { requireStaff } from "@/lib/auth";
import { toggleCoupon } from "@/actions/admin";
import { CouponAdminForm } from "@/components/CouponAdminForm";

export const dynamic = "force-dynamic";
export default async function Coupons() {
  const me = await requireStaff();
  const rows = db.select().from(t.coupons).all();
  return (
    <div className="max-w-3xl space-y-6"><h1 className="display text-5xl font-bold">Coupons</h1>
      {me.role === "admin" ? <CouponAdminForm /> : <p className="text-mute">Only admins can create coupons.</p>}
      <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map((c) => <tr key={c.code}><td className="mono font-semibold">{c.code}</td><td>{c.percentOff}%</td><td>{c.uses}{c.maxUses ? ` / ${c.maxUses}` : ""}</td><td>{c.active ? <span className="chip chip-ok">Active</span> : <span className="chip">Off</span>}</td><td>{me.role === "admin" && <form action={toggleCoupon}><input type="hidden" name="code" value={c.code} /><button className="btn btn-ghost btn-sm">{c.active ? "Turn off" : "Turn on"}</button></form>}</td></tr>)}</tbody></table></div></div>
  );
}
