import "server-only";
import { cookies } from "next/headers";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db, t } from "@/db";
import { isIsoDate, today } from "./format";
import { rentalDays, unitPrice, type Line } from "./pricing";
import { availableQty } from "./availability";

const schema = z.object({
  start: z.string().refine(isIsoDate).nullable(),
  end: z.string().refine(isIsoDate).nullable(),
  items: z.array(z.object({ id: z.string().max(64), qty: z.number().int().min(1).max(20) })).max(30),
});
export type CartState = z.infer<typeof schema>;
const empty = (): CartState => ({ start: null, end: null, items: [] }); // fresh object every time: callers mutate it

export async function readCart(): Promise<CartState> {
  try {
    const raw = (await cookies()).get("kt_cart")?.value;
    if (!raw) return empty();
    return schema.parse(JSON.parse(raw));
  } catch { return empty(); }
}
export async function writeCart(c: CartState) {
  (await cookies()).set("kt_cart", JSON.stringify(c), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export type PricedCart = {
  start: string | null; end: string | null; days: number;
  lines: (Line & { slug: string; catSlug: string; imageUrl: string | null; available: number; ok: boolean; problem?: string })[];
  valid: boolean; count: number;
};

/** The ONLY place prices are computed from a cart. Client-supplied numbers are never trusted. */
export async function priceCart(c?: CartState): Promise<PricedCart> {
  const cart = c ?? (await readCart());
  const ids = cart.items.map((i) => i.id);
  const prods = ids.length ? db.select().from(t.products).where(inArray(t.products.id, ids)).all() : [];
  const cats = new Map(db.select().from(t.categories).all().map((c) => [c.id, c.slug]));
  const days = cart.start && cart.end ? rentalDays(cart.start, cart.end) : 0;
  const datesOk = !!(cart.start && cart.end && days >= 1 && cart.start >= today());
  const lines = cart.items.flatMap((i) => {
    const p = prods.find((x) => x.id === i.id);
    if (!p || !p.active) return [];
    let problem: string | undefined;
    let available = p.stock;
    if (!datesOk) problem = "Pick your dates";
    else {
      available = availableQty(p, cart.start!, cart.end!);
      if (days < p.minDays) problem = `Minimum ${p.minDays} day${p.minDays > 1 ? "s" : ""}`;
      else if (days > p.maxDays) problem = `Maximum ${p.maxDays} days`;
      else if (available < i.qty) problem = available === 0 ? "Not available on these dates" : `Only ${available} left on these dates`;
    }
    return [{ productId: p.id, name: p.name, slug: p.slug, catSlug: cats.get(p.categoryId) ?? "", imageUrl: p.imageUrl, qty: i.qty, unitCents: datesOk ? unitPrice(p, days) : p.dailyCents, depositCents: p.depositCents, available, ok: !problem, problem }];
  });
  return { start: cart.start, end: cart.end, days, lines, valid: datesOk && lines.length > 0 && lines.every((l) => l.ok), count: lines.reduce((s, l) => s + l.qty, 0) };
}
