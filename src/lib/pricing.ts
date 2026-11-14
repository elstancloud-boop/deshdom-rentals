import { addDays } from "./format";

// VAT/tax rate as a fraction. 0 until you confirm whether Deshdom Ventures Ltd is VAT registered (then set TAX_RATE=0.2).
export const TAX_RATE = Number(process.env.NEXT_PUBLIC_TAX_RATE ?? 0);
export const DELIVERY_CENTS = 2500;
export const FREE_DELIVERY_OVER = 30000;

/** Inclusive day count. 2026-05-01 → 2026-05-01 is 1 day. */
export function rentalDays(start: string, end: string) {
  const ms = Date.parse(end + "T00:00:00Z") - Date.parse(start + "T00:00:00Z");
  return Math.round(ms / 86_400_000) + 1;
}

/** Price for ONE unit for the whole period. Weekly rate applies per full 7 days; never costs more than daily × days. */
export function unitPrice(p: { dailyCents: number; weeklyCents: number | null }, days: number) {
  const daily = p.dailyCents * days;
  if (!p.weeklyCents || days < 7) return daily;
  const weeks = Math.floor(days / 7);
  return Math.min(daily, weeks * p.weeklyCents + (days % 7) * p.dailyCents);
}

export type Line = { productId: string; name: string; qty: number; unitCents: number; depositCents: number };

export function totals(lines: Line[], opts: { percentOff?: number; delivery?: boolean }) {
  const subtotal = lines.reduce((s, l) => s + l.unitCents * l.qty, 0);
  const deposit = lines.reduce((s, l) => s + l.depositCents * l.qty, 0);
  const discount = Math.round((subtotal * (opts.percentOff ?? 0)) / 100);
  const delivery = opts.delivery && subtotal - discount < FREE_DELIVERY_OVER ? DELIVERY_CENTS : 0;
  const tax = Math.round((subtotal - discount + delivery) * TAX_RATE);
  const total = subtotal - discount + delivery + tax + deposit;
  return { subtotal, discount, delivery, tax, deposit, total, due: total - deposit };
}
export { addDays };
