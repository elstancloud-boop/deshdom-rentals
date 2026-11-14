"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, t } from "@/db";
import { requireStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clean } from "@/lib/security";
import { refund } from "@/lib/payments";
import type { FormState } from "./auth";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const dollars = z.coerce.number().min(0).max(1_000_000).transform((n) => Math.round(n * 100));

const productSchema = z.object({
  name: z.string().min(2).max(120), brand: z.string().max(60), categoryId: z.string().min(1),
  summary: z.string().min(5).max(200), description: z.string().min(10).max(4000),
  specs: z.string().max(2000), imageUrl: z.string().max(500).refine((u) => !u || /^https:\/\//.test(u) || u.startsWith("/"), "Image must be an https:// URL or a /path").optional(),
  daily: dollars, weekly: z.string().optional(), deposit: dollars,
  stock: z.coerce.number().int().min(0).max(1000), minDays: z.coerce.number().int().min(1).max(365), maxDays: z.coerce.number().int().min(1).max(365),
});

const vals0 = (fd: FormData) => Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff();
  const id = String(fd.get("id") ?? "");
  const raw = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, typeof v === "string" ? clean(v) : v]));
  // specs: one "Label: value" per line
  const p = productSchema.safeParse(raw);
  if (!p.success) return { error: `${p.error.issues[0].path.join(".")}: ${p.error.issues[0].message}`, values: vals0(fd) };
  const d = p.data;
  if (d.maxDays < d.minDays) return { error: "Max days must be at least min days.", values: vals0(fd) };
  const specs = JSON.stringify(String(fd.get("specs") ?? "").split("\n").map((l) => l.split(":")).filter((a) => a.length >= 2).map((a) => [a[0].trim(), a.slice(1).join(":").trim()]));
  const weeklyCents = d.weekly ? Math.round(Number(d.weekly) * 100) : null;
  if (weeklyCents != null && (!Number.isFinite(weeklyCents) || weeklyCents < 0)) return { error: "Weekly price is invalid.", values: vals0(fd) };
  const vals = {
    name: d.name, brand: d.brand, categoryId: d.categoryId, summary: d.summary, description: d.description, specs, imageUrl: d.imageUrl || null,
    dailyCents: d.daily, weeklyCents, depositCents: d.deposit, stock: d.stock, minDays: d.minDays, maxDays: d.maxDays,
    featured: fd.get("featured") === "on", active: fd.get("active") === "on",
  };
  if (id) { db.update(t.products).set(vals).where(eq(t.products.id, id)).run(); audit(me, "product.update", d.name); }
  else {
    let slug = slugify(d.name), n = 1;
    while (db.select().from(t.products).where(eq(t.products.slug, slug)).get()) slug = `${slugify(d.name)}-${++n}`;
    db.insert(t.products).values({ ...vals, slug }).run(); audit(me, "product.create", d.name);
  }
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function setBookingStatus(fd: FormData) {
  const me = await requireStaff();
  const id = String(fd.get("id")), to = String(fd.get("to"));
  const b = db.select().from(t.bookings).where(eq(t.bookings.id, id)).get();
  if (!b) return;
  const allowed: Record<string, string[]> = { pending: ["confirmed", "cancelled"], confirmed: ["picked_up", "cancelled"], picked_up: ["returned"], returned: [], cancelled: [] };
  if (!allowed[b.status]?.includes(to)) return;
  const set: Partial<typeof b> = { status: to as typeof b.status };
  if (to === "cancelled" && b.paymentStatus === "paid") { if (b.paymentRef) await refund(b.paymentRef).catch(() => {}); set.paymentStatus = "refunded"; }
  db.update(t.bookings).set(set).where(eq(t.bookings.id, id)).run();
  audit(me, `booking.${to}`, b.ref);
  revalidatePath("/admin", "layout");
}

export async function saveCoupon(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireStaff(true);
  const p = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "Code: 3-20 letters/numbers"), pct: z.coerce.number().int().min(1).max(90), max: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  db.insert(t.coupons).values({ code: p.data.code, percentOff: p.data.pct, maxUses: p.data.max ? parseInt(p.data.max, 10) : null }).onConflictDoUpdate({ target: t.coupons.code, set: { percentOff: p.data.pct, active: true } }).run();
  audit(me, "coupon.save", p.data.code);
  revalidatePath("/admin/coupons");
  return { ok: "Coupon saved" };
}
export async function toggleCoupon(fd: FormData) {
  const me = await requireStaff(true);
  const code = String(fd.get("code"));
  const c = db.select().from(t.coupons).where(eq(t.coupons.code, code)).get();
  if (!c) return;
  db.update(t.coupons).set({ active: !c.active }).where(eq(t.coupons.code, code)).run();
  audit(me, "coupon.toggle", code);
  revalidatePath("/admin/coupons");
}

export async function setRole(fd: FormData) {
  const me = await requireStaff(true);
  const id = String(fd.get("id")), role = String(fd.get("role"));
  if (id === me.id || !["customer", "staff", "admin"].includes(role)) return; // can't demote yourself
  db.update(t.users).set({ role: role as "customer" | "staff" | "admin" }).where(eq(t.users.id, id)).run();
  db.delete(t.sessions).where(eq(t.sessions.userId, id)).run(); // force re-login with new privileges
  audit(me, "user.role", id, role);
  revalidatePath("/admin/customers");
}
