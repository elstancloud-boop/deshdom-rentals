import Link from "next/link";
import { sqlite } from "@/db";
import { requireStaff } from "@/lib/auth";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";
export default async function Inventory() {
  await requireStaff();
  const rows = sqlite.prepare("SELECT p.id, p.name, p.brand, p.daily_cents d, p.deposit_cents dep, p.stock, p.active, p.featured, c.name cat, (SELECT COALESCE(SUM(i.qty),0) FROM booking_items i JOIN bookings b ON b.id=i.booking_id WHERE i.product_id=p.id AND b.status='picked_up') out FROM products p JOIN categories c ON c.id=p.category_id ORDER BY c.sort, p.name").all() as { id: string; name: string; brand: string; d: number; dep: number; stock: number; active: number; featured: number; cat: string; out: number }[];
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between"><h1 className="display text-5xl font-bold">Inventory</h1><Link href="/admin/products/new" className="btn btn-volt">Add item</Link></div>
      <div className="card overflow-x-auto"><table className="tbl"><thead><tr><th>Item</th><th>Shelf</th><th className="text-right">Day rate</th><th className="text-right">Deposit</th><th className="text-right">Units</th><th>Out</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td className="font-semibold">{r.name}<div className="text-xs font-normal text-mute">{r.brand}</div></td><td>{r.cat}</td><td className="text-right">{money(r.d)}</td><td className="text-right">{money(r.dep)}</td><td className="text-right">{r.stock}</td><td>{r.out}</td><td>{r.active ? <span className="chip chip-ok">Live</span> : <span className="chip">Hidden</span>} {r.featured ? <span className="chip chip-info">Featured</span> : null}</td><td><Link href={`/admin/products/${r.id}`} className="btn btn-ghost btn-sm">Edit</Link></td></tr>)}</tbody></table></div>
    </div>
  );
}
