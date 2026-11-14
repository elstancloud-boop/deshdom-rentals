import "server-only";
import { sqlite } from "@/db";
import { addDays, iso } from "./format";

const HOLD_MINUTES = 30;
// Statuses that consume stock. Unpaid pending bookings only hold stock for HOLD_MINUTES.
const BLOCKING = `(b.status IN ('confirmed','picked_up') OR (b.status='pending' AND (b.payment_status='paid' OR b.created_at > datetime('now','-${HOLD_MINUTES} minutes'))))`;

export function bookedQty(productId: string, start: string, end: string, excludeBookingId?: string) {
  const row = sqlite.prepare(`
    SELECT COALESCE(SUM(i.qty),0) AS n FROM booking_items i JOIN bookings b ON b.id = i.booking_id
    WHERE i.product_id = ? AND b.start_date <= ? AND b.end_date >= ? AND ${BLOCKING} AND (? IS NULL OR b.id != ?)`)
    .get(productId, end, start, excludeBookingId ?? null, excludeBookingId ?? null) as { n: number };
  return row.n;
}

export function availableQty(p: { id: string; stock: number }, start: string, end: string) {
  return Math.max(0, p.stock - bookedQty(p.id, start, end));
}

/** Per-day remaining units for the calendar (next `span` days). */
export function dayMap(p: { id: string; stock: number }, from: string, span = 120) {
  const to = addDays(from, span);
  const rows = sqlite.prepare(`
    SELECT i.qty, b.start_date AS s, b.end_date AS e FROM booking_items i JOIN bookings b ON b.id=i.booking_id
    WHERE i.product_id=? AND b.end_date >= ? AND b.start_date <= ? AND ${BLOCKING}`).all(p.id, from, to) as { qty: number; s: string; e: string }[];
  const out: Record<string, number> = {};
  for (let d = from; d <= to; d = addDays(d, 1)) {
    let used = 0;
    for (const r of rows) if (r.s <= d && r.e >= d) used += r.qty;
    out[d] = Math.max(0, p.stock - used);
  }
  return out;
}
export { iso };
