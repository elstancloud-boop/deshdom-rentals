import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { priceCart } from "@/lib/cart";
import { totals, TAX_RATE } from "@/lib/pricing";
import { money, fmtDate } from "@/lib/format";
import { removeItem, updateQty } from "@/actions/cart";
import { CouponForm } from "@/components/CouponForm";
import { Visual } from "@/components/Visual";

export const metadata: Metadata = { title: "Your kit list" };

export default async function Cart() {
  const c = await priceCart();
  const code = (await cookies()).get("kt_coupon")?.value;
  const cp = code ? db.select().from(t.coupons).where(eq(t.coupons.code, code)).get() : undefined;
  const tot = totals(c.lines, { percentOff: cp?.active ? cp.percentOff : 0 });
  if (!c.lines.length) return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="display text-5xl font-bold">Your kit list is empty</h1><p className="mt-3 text-mute">Pick dates, add a few items, and they will wait here.</p><Link href="/browse" className="btn btn-volt mt-6">Browse gear</Link></div>
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="display text-5xl font-bold">Your kit list</h1>
      <p className="mt-2 text-ink-2">{c.start && c.end ? <>{fmtDate(c.start)} → {fmtDate(c.end)} · {c.days} day{c.days > 1 ? "s" : ""}</> : "No dates chosen yet"} · <Link className="font-semibold text-volt" href="/">Change dates</Link></p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <ul className="space-y-4">
          {c.lines.map((l) => (
            <li key={l.productId} className="card flex gap-4 p-4">
              <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl"><Visual cat={l.catSlug} src={l.imageUrl} className="h-full w-full" /></div>
              <div className="flex-1">
                <div className="flex justify-between gap-2"><Link href={`/p/${l.slug}`} className="font-display text-lg font-semibold">{l.name}</Link><span className="font-semibold">{money(l.unitCents * l.qty)}</span></div>
                <div className="mono text-xs text-mute">{money(l.depositCents * l.qty)} deposit</div>
                {l.problem && <p role="alert" className="mt-2 inline-block rounded-lg bg-[#fdeccc] px-2.5 py-1 text-sm text-warn">{l.problem}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <form action={updateQty} className="flex items-center gap-2"><input type="hidden" name="productId" value={l.productId} /><label className="sr-only" htmlFor={`q${l.productId}`}>Quantity</label><input id={`q${l.productId}`} name="qty" type="number" min={0} max={20} defaultValue={l.qty} className="field !w-16 !py-1.5" /><button className="btn btn-ghost btn-sm">Update</button></form>
                  <form action={removeItem}><input type="hidden" name="productId" value={l.productId} /><button className="text-sm text-mute underline hover:text-bad">Remove</button></form>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit space-y-3 p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold">Summary</h2>
          <Row k="Rental" v={money(tot.subtotal)} />
          {tot.discount > 0 && <Row k={`Code ${code}`} v={`−${money(tot.discount)}`} ok />}
          {TAX_RATE > 0 && <Row k={`VAT (${Math.round(TAX_RATE * 100)}%)`} v={money(tot.tax)} />}
          <Row k="Refundable deposit" v={money(tot.deposit)} />
          <div className="flex justify-between border-t border-dashed border-line pt-3 text-lg font-bold"><span>Due today</span><span>{money(tot.subtotal - tot.discount + tot.tax + tot.deposit)}</span></div>
          <p className="text-xs text-mute">Delivery fee, if chosen, is added at checkout. Deposit is released after return inspection.</p>
          <CouponForm />
          {c.valid ? <Link href="/checkout" className="btn btn-volt w-full">Continue to checkout</Link> : <button disabled className="btn btn-volt w-full">Fix the items above to continue</button>}
        </aside>
      </div>
    </div>
  );
}
const Row = ({ k, v, ok }: { k: string; v: string; ok?: boolean }) => <div className={`flex justify-between text-sm ${ok ? "text-ok" : ""}`}><span className={ok ? "" : "text-mute"}>{k}</span><span>{v}</span></div>;
