import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { stripe } from "@/lib/payments";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!process.env.STRIPE_SECRET_KEY || !secret || !sig) return new NextResponse("Not configured", { status: 400 });
  let event;
  try { event = stripe().webhooks.constructEvent(await req.text(), sig, secret); } // verifies signature on the RAW body
  catch { return new NextResponse("Bad signature", { status: 400 }); }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const id = s.metadata?.bookingId;
    if (id && s.payment_status === "paid") {
      const b = db.select().from(t.bookings).where(eq(t.bookings.id, id)).get();
      if (b && b.paymentStatus === "unpaid") { // idempotent: Stripe retries webhooks
        db.update(t.bookings).set({ paymentStatus: "paid", status: "confirmed", paymentRef: String(s.payment_intent) }).where(eq(t.bookings.id, id)).run();
        audit(null, "payment.received", b.ref);
      }
    }
  }
  return NextResponse.json({ received: true });
}
