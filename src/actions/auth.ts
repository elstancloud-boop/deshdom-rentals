"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { createSession, destroySession, hashPassword, verifyPassword, DUMMY_HASH } from "@/lib/auth";
import { clientIp, rateLimit, clean } from "@/lib/security";
import { audit } from "@/lib/audit";

export type FormState = { error?: string; ok?: string; values?: Record<string, string> } | undefined;
const keep = (fd: FormData) => ({ name: String(fd.get("name") ?? ""), email: String(fd.get("email") ?? ""), phone: String(fd.get("phone") ?? "") });

const pw = z.string().min(10, "Use at least 10 characters").max(128).refine((s) => /[a-zA-Z]/.test(s) && /\d/.test(s), "Include a letter and a number");
const registerSchema = z.object({ name: z.string().trim().min(2, "Enter your name").max(80), email: z.string().trim().toLowerCase().email("Enter a valid email").max(160), password: pw, phone: z.string().trim().max(30).optional() });
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(160), password: z.string().min(1).max(128) });

const safeNext = (n: FormDataEntryValue | null) => { const s = String(n ?? ""); return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/account"; };

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  if (!rateLimit(`reg:${await clientIp()}`, 5, 60 * 60 * 1000)) return { error: "Too many sign-ups from this network. Try again in an hour.", values: keep(fd) };
  const p = registerSchema.safeParse({ name: clean(String(fd.get("name") ?? "")), email: fd.get("email"), password: fd.get("password"), phone: fd.get("phone") || undefined });
  if (!p.success) return { error: p.error.issues[0].message, values: keep(fd) };
  if (db.select().from(t.users).where(eq(t.users.email, p.data.email)).get()) return { error: "An account with this email already exists. Try signing in.", values: keep(fd) };
  const u = db.insert(t.users).values({ ...p.data, passwordHash: await hashPassword(p.data.password) }).returning().get();
  audit({ id: u.id, email: u.email }, "user.register");
  await createSession(u.id, (await headers()).get("user-agent"));
  redirect(safeNext(fd.get("next")));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  const p = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!p.success) return { error: "Enter your email and password.", values: keep(fd) };
  if (!rateLimit(`login-ip:${ip}`, 20, 15 * 60 * 1000) || !rateLimit(`login-acct:${p.data.email}`, 8, 15 * 60 * 1000))
    return { error: "Too many attempts. Wait 15 minutes and try again.", values: keep(fd) };

  const u = db.select().from(t.users).where(eq(t.users.email, p.data.email)).get();
  const locked = u?.lockedUntil && u.lockedUntil > Date.now();
  const ok = await verifyPassword(p.data.password, u?.passwordHash ?? DUMMY_HASH); // constant work either way
  if (!u || !ok || locked) {
    if (u && !ok) {
      const n = u.failedLogins + 1;
      db.update(t.users).set({ failedLogins: n, lockedUntil: n >= 10 ? Date.now() + 30 * 60 * 1000 : u.lockedUntil }).where(eq(t.users.id, u.id)).run();
      audit({ id: u.id, email: u.email }, "auth.login_failed", undefined, ip);
    }
    return { error: locked ? "This account is temporarily locked. Try again later." : "Email or password is incorrect.", values: keep(fd) };
  }
  db.update(t.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(t.users.id, u.id)).run();
  await createSession(u.id, (await headers()).get("user-agent"));
  audit({ id: u.id, email: u.email }, "auth.login", undefined, ip);
  redirect(u.role !== "customer" && String(fd.get("next") ?? "").startsWith("/admin") ? "/admin" : safeNext(fd.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}
