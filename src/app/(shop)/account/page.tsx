import type { Metadata } from "next";
import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { db, t } from "@/db";
import { requireUser } from "@/lib/auth";
import { Status } from "@/components/Status";
import { ProductCard } from "@/components/ProductCard";
import { listProducts } from "@/lib/queries";
import { money, fmtShort } from "@/lib/format";

export const metadata: Metadata = { title: "My account" };

export default async function Account() {
  const user = await requireUser();
  const bookings = db.select().from(t.bookings).where(eq(t.bookings.userId, user.id)).orderBy(desc(t.bookings.createdAt)).all();
  const wl = new Set(db.select().from(t.wishlist).where(eq(t.wishlist.userId, user.id)).all().map((w) => w.productId));
  const saved = listProducts({}).filter((p) => wl.has(p.id));
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="eyebrow">Signed in as {user.email}</div>
      <h1 className="display mt-2 text-5xl font-bold">Hi {user.name.split(" ")[0]}</h1>
      <h2 className="mt-10 font-display text-2xl font-semibold">Your bookings</h2>
      {bookings.length ? (
        <>
        <ul className="mt-4 space-y-3 sm:hidden">{bookings.map((b) => <li key={b.id}><Link href={`/account/bookings/${b.ref}`} className="card block p-4 active:bg-white/60"><div className="flex items-center justify-between"><span className="mono font-semibold text-volt">{b.ref}</span><span className="font-semibold">{money(b.totalCents)}</span></div><div className="mt-1 text-sm text-ink-2">{fmtShort(b.startDate)} → {fmtShort(b.endDate)}</div><div className="mt-3 flex gap-2"><Status s={b.status} /><Status s={b.paymentStatus} /></div></Link></li>)}</ul>
        <div className="card mt-4 hidden overflow-x-auto sm:block"><table className="tbl"><thead><tr><th>Ref</th><th>Dates</th><th>Status</th><th>Payment</th><th className="text-right">Total</th></tr></thead>
          <tbody>{bookings.map((b) => <tr key={b.id}><td><Link href={`/account/bookings/${b.ref}`} className="mono font-semibold text-volt">{b.ref}</Link></td><td>{fmtShort(b.startDate)} → {fmtShort(b.endDate)}</td><td><Status s={b.status} /></td><td><Status s={b.paymentStatus} /></td><td className="text-right font-semibold">{money(b.totalCents)}</td></tr>)}</tbody></table></div>
        </>
      ) : <div className="card mt-4 p-10 text-center"><p className="text-mute">No bookings yet. Your first rental will show up here.</p><Link href="/browse" className="btn btn-volt mt-4">Find gear</Link></div>}
      {saved.length > 0 && <><h2 className="mt-12 font-display text-2xl font-semibold">Saved for later</h2><div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{saved.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div></>}
    </div>
  );
}
