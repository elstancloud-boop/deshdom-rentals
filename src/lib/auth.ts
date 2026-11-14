import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, and, gt } from "drizzle-orm";
import { db, t } from "@/db";

const COOKIE = "kt_session";
const TTL = 1000 * 60 * 60 * 24 * 14;
const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return s;
};
const hash = (token: string) => createHmac("sha256", secret()).update(token).digest("hex");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
// Compared against when the email is unknown so response time doesn't reveal which emails exist.
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);
export const verifyPassword = (pw: string, h: string) => bcrypt.compare(pw, h);

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  db.insert(t.sessions).values({ id: hash(token), userId, expiresAt: Date.now() + TTL, userAgent: userAgent?.slice(0, 200) }).run();
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL / 1000,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.delete(t.sessions).where(eq(t.sessions.id, hash(token))).run();
  jar.delete(COOKIE);
}

export type SessionUser = { id: string; email: string; name: string; role: "customer" | "staff" | "admin" };

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db.select({ id: t.users.id, email: t.users.email, name: t.users.name, role: t.users.role })
    .from(t.sessions).innerJoin(t.users, eq(t.users.id, t.sessions.userId))
    .where(and(eq(t.sessions.id, hash(token)), gt(t.sessions.expiresAt, Date.now()))).get();
  return row ?? null;
});

export async function requireUser(next = "/account") {
  const u = await getUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

/** Call at the top of EVERY admin page and EVERY admin action (defence in depth, not just layout). */
export async function requireStaff(adminOnly = false) {
  const u = await getUser();
  if (!u) redirect("/login?next=/admin");
  if (u.role === "customer" || (adminOnly && u.role !== "admin")) redirect("/");
  return u;
}

export function revokeAllSessions(userId: string) {
  db.delete(t.sessions).where(eq(t.sessions.userId, userId)).run();
}
