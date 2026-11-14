import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireUser } from "@/lib/auth";
import { Status } from "@/components/Status";
import { cancelBooking } from "@/actions/booking";
import { SITE } from "@/lib/site";
import { money, fmtDate, addDays, today } from "@/lib/format";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { ref } = await params;
  const user = await requireUser(`/account/bookings/${ref}`);
  const b = db.select().from(t.bookings).where(and(eq(t.bookings.ref, ref), eq(t.bookings.userId, user.id))).get(); // can only ever load your own
  if (!b) notFound();
  const items = db.select().from(t.bookingItems).where(eq(t.bookingItems.bookingId, b.id)).all();
  const cancellable = ["pending", "confirmed"].includes(b.status) && (b.paymentStatus !== "paid" || b.startDate >= addDays(today(), 2));
  const { paid } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {paid && b.status !== "cancelled" && <div role="status" className="mb-6 rounded-2xl bg-[#d8f3e5] p-5 text-ok"><div className="font-display text-xl font-semibold">{b.paymentStatus === "paid" ? "You're booked." : "Payment is processing."}</div><div className="text-sm">{b.paymentStatus === "paid" ? "Your gear is reserved. See the details below." : "This page updates once the payment clears."}</div></div>}
      <Link href="/account" className="text-sm text-mute hover:text-ink">← All bookings</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="display text-5xl font-bold mono !tracking-tight">{b.ref}</h1><Status s={b.status} /><Status s={b.paymentStatus} /></div>
      <div className="card mt-8 divide-y divide-line">
        <div className="grid gap-4 p-6 sm:grid-cols-3"><div><div className="eyebrow">Pickup</div><div className="font-semibold">{fmtDate(b.startDate)}</div></div><div><div className="eyebrow">Return by</div><div className="font-semibold">{fmtDate(b.endDate)}</div></div><div><div className="eyebrow">{b.fulfilment === "delivery" ? "Delivery to" : "Collection"}</div><div className="font-semibold">{b.fulfilment === "delivery" ? b.address : SITE.address.slice(0, 3).join(", ")}</div></div></div>
        <ul className="space-y-2 p-6">{items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{money(i.unitCents * i.qty)}</span></li>)}</ul>
        <dl className="space-y-1.5 p-6 text-sm">
          <div className="flex justify-between"><dt className="text-mute">Subtotal</dt><dd>{money(b.subtotalCents)}</dd></div>
          {b.discountCents > 0 && <div className="flex justify-between text-ok"><dt>Code {b.couponCode}</dt><dd>−{money(b.discountCents)}</dd></div>}
          {b.deliveryCents > 0 && <div className="flex justify-between"><dt className="text-mute">Delivery</dt><dd>{money(b.deliveryCents)}</dd></div>}
          {b.taxCents > 0 && <div className="flex justify-between"><dt className="text-mute">VAT</dt><dd>{money(b.taxCents)}</dd></div>}
          <div className="flex justify-between"><dt className="text-mute">Refundable deposit</dt><dd>{money(b.depositCents)}</dd></div>
          <div className="flex justify-between border-t border-dashed border-line pt-3 text-lg font-bold"><dt>Total</dt><dd>{money(b.totalCents)}</dd></div>
        </dl>
      </div>
      {cancellable && <form action={cancelBooking} className="mt-6"><input type="hidden" name="ref" value={b.ref} /><button className="btn btn-ghost">Cancel booking</button><span className="ml-3 text-sm text-mute">{b.paymentStatus === "paid" ? "Full refund, free until 48 hours before pickup." : ""}</span></form>}
    </div>
  );
}
