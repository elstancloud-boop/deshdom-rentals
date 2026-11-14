import "server-only";
import { headers } from "next/headers";
import { sqlite } from "@/db";

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

/** Fixed-window limiter backed by the DB (works across processes). Returns true if allowed. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const tx = sqlite.transaction(() => {
    const row = sqlite.prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?").get(key) as { count: number; reset_at: number } | undefined;
    if (!row || row.reset_at < now) {
      sqlite.prepare("INSERT INTO rate_limits(key,count,reset_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=1, reset_at=excluded.reset_at").run(key, 1, now + windowMs);
      return true;
    }
    if (row.count >= limit) return false;
    sqlite.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
    return true;
  });
  if (Math.random() < 0.02) sqlite.prepare("DELETE FROM rate_limits WHERE reset_at < ?").run(now);
  return tx();
}

/** For route handlers (Server Actions already enforce same-origin in Next). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(req.url).origin;
}

export const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, "").trim();
