"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db, sqlite, t } from "@/db";
import { getUser, requireUser } from "@/lib/auth";
import { priceCart, readCart, writeCart } from "@/lib/cart";
import { totals } from "@/lib/pricing";
import { availableQty } from "@/lib/availability";
import { clean, rateLimit } from "@/lib/security";
import { audit } from "@/lib/audit";
import { createCheckout, paymentsMode, refund } from "@/lib/payments";
import { addDays, today } from "@/lib/format";
import type { FormState } from "./auth";

const schema = z.object({
  fulfilment: z.enum(["pickup", "delivery"]),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
  terms: z.literal("on", { message: "Accept the rental terms to continue" }),
});

const v0 = (fd: FormData) => ({ address: String(fd.get("address") ?? ""), notes: String(fd.get("notes") ?? ""), fulfilment: String(fd.get("fulfilment") ?? "pickup") });
export async function placeBooking(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login?next=/checkout");
  if (!rateLimit(`book:${user.id}`, 10, 10 * 60 * 1000)) return { error: "Too many attempts. Wait a few minutes.", values: v0(fd) };
  const p = schema.safeParse({ fulfilment: fd.get("fulfilment"), address: clean(String(fd.get("address") ?? "")), notes: clean(String(fd.get("notes") ?? "")), terms: fd.get("terms") });
  if (!p.success) return { error: p.error.issues[0].message, values: v0(fd) };
  if (p.data.fulfilment === "delivery" && (p.data.address?.length ?? 0) < 8) return { error: "Enter a delivery address.", values: v0(fd) };

  const cart = await readCart();
  const priced = await priceCart(cart);
  if (!priced.valid) return { error: "Something in your cart changed. Review it and try again.", values: v0(fd) };
  const code = (await cookies()).get("kt_coupon")?.value;
  const coupon = code ? db.select().from(t.coupons).where(eq(t.coupons.code, code)).get() : undefined;
  const pct = coupon?.active && (coupon.maxUses == null || coupon.uses < coupon.maxUses) ? coupon.percentOff : 0;
  const tot = totals(priced.lines, { percentOff: pct, delivery: p.data.fulfilment === "delivery" });
  const ref = "KT-" + randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  const bookingId = crypto.randomUUID();

  // Re-check stock and insert atomically so two people can't take the last unit.
  const create = sqlite.transaction(() => {
    for (const l of priced.lines) {
      const prod = db.select().from(t.products).where(eq(t.products.id, l.productId)).get()!;
      if (availableQty(prod, priced.start!, priced.end!) < l.qty) throw new Error(`${l.name} was just booked by someone else.`);
    }
    db.insert(t.bookings).values({
      id: bookingId, ref, userId: user.id, startDate: priced.start!, endDate: priced.end!, fulfilment: p.data.fulfilment,
      address: p.data.fulfilment === "delivery" ? p.data.address : null, notes: p.data.notes || null,
      subtotalCents: tot.subtotal, discountCents: tot.discount, deliveryCents: tot.delivery, taxCents: tot.tax, depositCents: tot.deposit, totalCents: tot.total,
      couponCode: pct ? code : null,
    }).run();
    for (const l of priced.lines) db.insert(t.bookingItems).values({ bookingId, productId: l.productId, name: l.name, qty: l.qty, unitCents: l.unitCents, depositCents: l.depositCents }).run();
    if (pct && coupon) db.update(t.coupons).set({ uses: coupon.uses + 1 }).where(eq(t.coupons.code, coupon.code)).run();
  });
  try { create(); } catch (e) { return { error: e instanceof Error ? e.message : "Could not place booking.", values: v0(fd) }; }

  audit(user, "booking.create", ref);
  await writeCart({ start: null, end: null, items: [] });
  (await cookies()).delete("kt_coupon");
  revalidatePath("/", "layout");

  if (paymentsMode() === "stripe") {
    let url: string;
    try { url = await createCheckout({ id: bookingId, ref, email: user.email, totalCents: tot.total }); }
    catch { redirect(`/account/bookings/${ref}`); }
    redirect(url);
  }
  // Demo mode: mark as paid + confirmed immediately.
  db.update(t.bookings).set({ paymentStatus: "paid", status: "confirmed", paymentRef: "demo_" + ref }).where(eq(t.bookings.id, bookingId)).run();
  redirect(`/account/bookings/${ref}?paid=1`);
}

export async function cancelBooking(fd: FormData) {
  const user = await requireUser();
  const ref = String(fd.get("ref"));
  const b = db.select().from(t.bookings).where(and(eq(t.bookings.ref, ref), eq(t.bookings.userId, user.id))).get(); // ownership enforced in query
  if (!b || !["pending", "confirmed"].includes(b.status)) return;
  if (b.startDate < addDays(today(), 2) && b.paymentStatus === "paid") return; // free cancellation until 48h before
  if (b.paymentStatus === "paid" && b.paymentRef) await refund(b.paymentRef).catch(() => {});
  db.update(t.bookings).set({ status: "cancelled", paymentStatus: b.paymentStatus === "paid" ? "refunded" : b.paymentStatus }).where(eq(t.bookings.id, b.id)).run();
  audit(user, "booking.cancel", ref);
  revalidatePath(`/account/bookings/${ref}`);
}

export async function toggleWishlist(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");
  const productId = String(fd.get("productId"));
  const ex = db.select().from(t.wishlist).where(and(eq(t.wishlist.userId, user.id), eq(t.wishlist.productId, productId))).get();
  if (ex) db.delete(t.wishlist).where(and(eq(t.wishlist.userId, user.id), eq(t.wishlist.productId, productId))).run();
  else if (db.select().from(t.products).where(eq(t.products.id, productId)).get()) db.insert(t.wishlist).values({ userId: user.id, productId }).run();
  revalidatePath("/", "layout");
}

export async function submitReview(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const productId = String(fd.get("productId"));
  const rating = parseInt(String(fd.get("rating")), 10);
  const body = clean(String(fd.get("body") ?? "")).slice(0, 1000);
  if (!(rating >= 1 && rating <= 5) || body.length < 5) return { error: "Choose a rating and write a few words." };
  // Only verified renters (returned booking containing this product) can review.
  const ok = sqlite.prepare(`SELECT 1 FROM bookings b JOIN booking_items i ON i.booking_id=b.id WHERE b.user_id=? AND i.product_id=? AND b.status='returned' LIMIT 1`).get(user.id, productId);
  if (!ok) return { error: "Only customers who have returned this item can review it." };
  db.insert(t.reviews).values({ productId, userId: user.id, rating, body }).onConflictDoUpdate({ target: [t.reviews.productId, t.reviews.userId], set: { rating, body } }).run();
  revalidatePath("/", "layout");
  return { ok: "Thanks for the review" };
}
