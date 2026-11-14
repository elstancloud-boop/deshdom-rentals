import Link from "next/link";
import { sqlite } from "@/db";
import { requireStaff } from "@/lib/auth";
import { Status } from "@/components/Status";
import { money, today, addDays, fmtShort } from "@/lib/format";

export const dynamic = "force-dynamic";
const one = <T,>(sql: string, ...a: unknown[]) => sqlite.prepare(sql).get(...a) as T;

export default async function Overview() {
  await requireStaff();
  const td = today();
  const rev = one<{ n: number }>("SELECT COALESCE(SUM(total_cents - deposit_cents),0) n FROM bookings WHERE payment_status='paid' AND created_at >= datetime('now','-30 days')").n;
  const bk = one<{ n: number }>("SELECT COUNT(*) n FROM bookings WHERE created_at >= datetime('now','-30 days') AND status != 'cancelled'").n;
  const out = one<{ n: number }>("SELECT COUNT(*) n FROM bookings WHERE status='picked_up'").n;
  const deposits = one<{ n: number }>("SELECT COALESCE(SUM(deposit_cents),0) n FROM bookings WHERE payment_status='paid' AND status IN ('confirmed','picked_up')").n;
  const util = one<{ u: number; s: number }>(`SELECT COALESCE((SELECT SUM(i.qty) FROM booking_items i JOIN bookings b ON b.id=i.booking_id WHERE b.status IN ('confirmed','picked_up') AND b.start_date<=? AND b.end_date>=?),0) u, (SELECT SUM(stock) FROM products WHERE active=1) s`, td, td);
  const series = Array.from({ length: 14 }, (_, i) => { const d = addDays(td, i - 13); return { d, v: one<{ n: number }>("SELECT COALESCE(SUM(total_cents - deposit_cents),0) n FROM bookings WHERE payment_status='paid' AND date(created_at)=?", d).n }; });
  const max = Math.max(1, ...series.map((s) => s.v));
  const pickups = sqlite.prepare("SELECT b.id, b.ref, b.start_date, b.status, u.name FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.status='confirmed' AND b.start_date BETWEEN ? AND ? ORDER BY b.start_date LIMIT 6").all(td, addDays(td, 7)) as { ref: string; start_date: string; status: string; name: string }[];
  const returns = sqlite.prepare("SELECT b.id, b.ref, b.end_date, b.status, u.name FROM bookings b JOIN users u ON u.id=b.user_id WHERE b.status='picked_up' ORDER BY b.end_date LIMIT 6").all() as { ref: string; end_date: string; status: string; name: string }[];
  const top = sqlite.prepare("SELECT i.name, SUM(i.qty) n, SUM(i.unit_cents*i.qty) rev FROM booking_items i JOIN bookings b ON b.id=i.booking_id WHERE b.status != 'cancelled' GROUP BY i.product_id ORDER BY rev DESC LIMIT 5").all() as { name: string; n: number; rev: number }[];
  const kpis: [string, string, string][] = [["Revenue, 30 days", money(rev), "excl. deposits"], ["Bookings, 30 days", String(bk), "excl. cancelled"], ["Out right now", String(out), "items with customers"], ["Deposits held", money(deposits), "refundable"], ["Utilisation today", `${util.s ? Math.round((util.u / util.s) * 100) : 0}%`, `${util.u} of ${util.s} units`]];
  return (
    <div className="space-y-8">
      <div><div className="eyebrow">Today · {fmtShort(td)}</div><h1 className="display mt-1 text-5xl font-bold">Overview</h1></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{kpis.map(([l, v, s]) => <div key={l} className="card p-5"><div className="eyebrow">{l}</div><div className="display mt-2 text-4xl font-bold">{v}</div><div className="mt-1 text-xs text-mute">{s}</div></div>)}</div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-6 xl:col-span-2"><h2 className="font-display text-lg font-semibold">Revenue, last 14 days</h2>
          <div className="mt-6 flex h-48 items-end gap-2" role="img" aria-label="Daily revenue bar chart">{series.map((s) => <div key={s.d} className="group relative flex h-full flex-1 items-end"><div className="w-full rounded-t-md bg-volt/80 transition group-hover:bg-volt" style={{ height: `${Math.max(2, (s.v / max) * 100)}%` }} /><div className="mono absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-0.5 text-xs text-white group-hover:block">{money(s.v)}</div></div>)}</div>
          <div className="mono mt-2 flex justify-between text-xs text-mute"><span>{fmtShort(series[0].d)}</span><span>{fmtShort(series[13].d)}</span></div></section>
        <section className="card p-6"><h2 className="font-display text-lg font-semibold">Top earners</h2><ul className="mt-4 space-y-3">{top.map((t) => <li key={t.name} className="flex justify-between text-sm"><span>{t.name}<span className="ml-2 text-mute">×{t.n}</span></span><span className="font-semibold">{money(t.rev)}</span></li>)}</ul></section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <List title="Pickups, next 7 days" empty="No pickups scheduled." rows={pickups.map((p) => ({ ref: p.ref, who: p.name, when: fmtShort(p.start_date), s: p.status }))} />
        <List title="Out now, due back" empty="Nothing is out." rows={returns.map((p) => ({ ref: p.ref, who: p.name, when: fmtShort(p.end_date), s: p.status }))} />
      </div>
    </div>
  );
}
function List({ title, rows, empty }: { title: string; empty: string; rows: { ref: string; who: string; when: string; s: string }[] }) {
  return <section className="card p-6"><h2 className="font-display text-lg font-semibold">{title}</h2>{rows.length ? <ul className="mt-3 divide-y divide-line">{rows.map((r) => <li key={r.ref} className="flex items-center justify-between py-3 text-sm"><div><Link href={`/admin/bookings?q=${r.ref}`} className="mono font-semibold text-volt">{r.ref}</Link><div className="text-mute">{r.who}</div></div><div className="flex items-center gap-3"><span>{r.when}</span><Status s={r.s} /></div></li>)}</ul> : <p className="mt-3 text-sm text-mute">{empty}</p>}</section>;
}
