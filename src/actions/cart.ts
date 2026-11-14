"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { readCart, writeCart } from "@/lib/cart";
import { isIsoDate, today, addDays } from "@/lib/format";
import type { FormState } from "./auth";

export async function setDates(fd: FormData) {
  const start = fd.get("start"), end = fd.get("end");
  if (!isIsoDate(start) || !isIsoDate(end) || start < today() || end < start || end > addDays(start, 120)) return;
  const c = await readCart();
  await writeCart({ ...c, start, end });
  revalidatePath("/", "layout");
}

export async function addToCart(fd: FormData): Promise<FormState> {
  const id = String(fd.get("productId") ?? "");
  const qty = Math.min(20, Math.max(1, parseInt(String(fd.get("qty") ?? "1"), 10) || 1));
  const start = fd.get("start"), end = fd.get("end");
  const p = db.select().from(t.products).where(eq(t.products.id, id)).get();
  if (!p || !p.active) return { error: "This item is no longer available." };
  const c = await readCart();
  if (isIsoDate(start) && isIsoDate(end) && start >= today() && end >= start && end <= addDays(start, 120)) { c.start = start; c.end = end; }
  const ex = c.items.find((i) => i.id === id);
  if (ex) ex.qty = Math.min(20, ex.qty + qty); else c.items.push({ id, qty });
  await writeCart(c);
  revalidatePath("/", "layout");
  return { ok: "Added to your kit list" };
}

export async function updateQty(fd: FormData) {
  const id = String(fd.get("productId")), qty = parseInt(String(fd.get("qty")), 10);
  const c = await readCart();
  c.items = c.items.flatMap((i) => (i.id !== id ? [i] : qty > 0 ? [{ id, qty: Math.min(20, qty) }] : []));
  await writeCart(c);
  revalidatePath("/", "layout");
}

export async function removeItem(fd: FormData) {
  const id = String(fd.get("productId"));
  const c = await readCart();
  c.items = c.items.filter((i) => i.id !== id);
  await writeCart(c);
  revalidatePath("/", "layout");
}

export async function applyCoupon(_: FormState, fd: FormData): Promise<FormState> {
  const code = String(fd.get("code") ?? "").trim().toUpperCase().slice(0, 32);
  if (!code) { (await cookies()).delete("kt_coupon"); revalidatePath("/cart"); return { ok: "Code removed" }; }
  const cp = db.select().from(t.coupons).where(eq(t.coupons.code, code)).get();
  if (!cp || !cp.active || (cp.maxUses != null && cp.uses >= cp.maxUses)) return { error: "That code isn't valid." };
  (await cookies()).set("kt_coupon", code, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  revalidatePath("/cart");
  return { ok: `${cp.percentOff}% off applied` };
}

export async function goCheckout() { redirect("/checkout"); }

export async function searchDates(fd: FormData) {
  await setDates(fd);
  redirect("/browse");
}
