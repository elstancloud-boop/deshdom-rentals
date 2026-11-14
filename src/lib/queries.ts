import "server-only";
import { sqlite } from "@/db";
import type { CardProduct } from "@/components/ProductCard";
import { availableQty } from "./availability";

type Row = { id: string; slug: string; name: string; brand: string; summary: string; dailyCents: number; imageUrl: string | null; catSlug: string; catName: string; rating: number | null; reviews: number; stock: number };

export function listProducts(o: { cat?: string; q?: string; sort?: string; featured?: boolean; start?: string | null; end?: string | null; onlyAvailable?: boolean; limit?: number; includeInactive?: boolean }): CardProduct[] {
  const where: string[] = o.includeInactive ? ["1=1"] : ["p.active = 1"], args: unknown[] = [];
  if (o.cat) { where.push("c.slug = ?"); args.push(o.cat); }
  if (o.featured) where.push("p.featured = 1");
  if (o.q) { where.push("(p.name LIKE ? ESCAPE '\\' OR p.brand LIKE ? ESCAPE '\\' OR p.summary LIKE ? ESCAPE '\\')"); const l = `%${o.q.replace(/[\\%_]/g, (m) => "\\" + m)}%`; args.push(l, l, l); }
  const order = { price_asc: "p.daily_cents ASC", price_desc: "p.daily_cents DESC", rating: "rating DESC NULLS LAST", new: "p.created_at DESC" }[o.sort ?? ""] ?? "p.featured DESC, p.name ASC";
  const rows = sqlite.prepare(`
    SELECT p.id, p.slug, p.name, p.brand, p.summary, p.daily_cents AS dailyCents, p.image_url AS imageUrl, c.slug AS catSlug, c.name AS catName, p.stock,
      (SELECT AVG(rating) FROM reviews r WHERE r.product_id = p.id) AS rating, (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS reviews
    FROM products p JOIN categories c ON c.id = p.category_id WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ?`).all(...args, o.limit ?? 100) as Row[];
  const out = rows.map((r) => ({ ...r, left: o.start && o.end ? availableQty(r, o.start, o.end) : null }));
  return (o.onlyAvailable ? out.filter((r) => r.left !== 0) : out);
}

export const categories = () => sqlite.prepare("SELECT slug, name, blurb, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.active=1) AS n FROM categories c ORDER BY sort").all() as { slug: string; name: string; blurb: string; n: number }[];
