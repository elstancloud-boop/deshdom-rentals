import "server-only";
import Stripe from "stripe";
import { CURRENCY } from "./format";

/**
 * Payment provider boundary. Two adapters:
 *  - stripe: hosted Stripe Checkout (card data never touches this server → PCI SAQ-A)
 *  - demo:   no money moves; used when STRIPE_SECRET_KEY is unset so the store is fully testable
 */
export const paymentsMode = () => (process.env.STRIPE_SECRET_KEY ? "stripe" : "demo") as "stripe" | "demo";
export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!);
export const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

export async function createCheckout(b: { id: string; ref: string; email: string; totalCents: number }) {
  const s = stripe();
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: b.email,
    client_reference_id: b.id,
    metadata: { bookingId: b.id },
    payment_intent_data: { metadata: { bookingId: b.id } },
    line_items: [{ quantity: 1, price_data: { currency: CURRENCY.toLowerCase(), unit_amount: b.totalCents, product_data: { name: `Rental ${b.ref}` } } }],
    success_url: `${appUrl()}/account/bookings/${b.ref}?paid=1`,
    cancel_url: `${appUrl()}/account/bookings/${b.ref}`,
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
  });
  return session.url!;
}

export async function refund(paymentIntentId: string) {
  if (paymentsMode() === "stripe" && paymentIntentId.startsWith("pi_")) await stripe().refunds.create({ payment_intent: paymentIntentId });
}
