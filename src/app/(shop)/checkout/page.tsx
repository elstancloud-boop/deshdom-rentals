import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { priceCart } from "@/lib/cart";
import { requireUser } from "@/lib/auth";
import { totals, DELIVERY_CENTS, FREE_DELIVERY_OVER, TAX_RATE } from "@/lib/pricing";
import { paymentsMode } from "@/lib/payments";
import { money, fmtDate } from "@/lib/format";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default async function Checkout() {
  await requireUser("/checkout");
  const c = await priceCart();
  if (!c.valid) redirect("/cart");
  const code = (await cookies()).get("kt_coupon")?.value;
  const cp = code ? db.select().from(t.coupons).where(eq(t.coupons.code, code)).get() : undefined;
  const tot = totals(c.lines, { percentOff: cp?.active ? cp.percentOff : 0 });
  const due = tot.subtotal - tot.discount + tot.tax + tot.deposit;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="display text-5xl font-bold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <CheckoutForm base={tot.subtotal - tot.discount} delivery={DELIVERY_CENTS} free={FREE_DELIVERY_OVER} tax={TAX_RATE} mode={paymentsMode()} />
        <aside className="card h-fit p-6 lg:sticky lg:top-24">
          <div className="eyebrow">Your rental</div>
          <div className="mt-1 font-semibold">{fmtDate(c.start!)} → {fmtDate(c.end!)}</div><div className="text-sm text-mute">{c.days} day{c.days > 1 ? "s" : ""}</div>
          <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">{c.lines.map((l) => <li key={l.productId} className="flex justify-between"><span>{l.qty} × {l.name}</span><span>{money(l.unitCents * l.qty)}</span></li>)}</ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            {tot.discount > 0 && <div className="flex justify-between text-ok"><dt>Code {code}</dt><dd>−{money(tot.discount)}</dd></div>}
            {tot.tax > 0 && <div className="flex justify-between"><dt className="text-mute">VAT</dt><dd>{money(tot.tax)}</dd></div>}
            <div className="flex justify-between"><dt className="text-mute">Refundable deposit</dt><dd>{money(tot.deposit)}</dd></div>
            <div className="flex justify-between border-t border-dashed border-line pt-3 text-lg font-bold"><dt>Total</dt><dd>{money(due)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
