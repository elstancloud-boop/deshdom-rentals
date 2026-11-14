import { NextResponse, type NextRequest } from "next/server";

// Per-request nonce CSP: only scripts we render may execute (no inline script injection).
export function proxy(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self'${dev ? " ws:" : ""}`,
    `frame-ancestors 'none'`,
    `form-action 'self' https://checkout.stripe.com`,
    `base-uri 'self'`,
    `object-src 'none'`,
    ...((process.env.APP_URL ?? "").startsWith("https://") ? [`upgrade-insecure-requests`] : []),
  ].join("; ");
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("Content-Security-Policy", csp);
  if (req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/account") || req.nextUrl.pathname === "/checkout") res.headers.set("Cache-Control", "no-store");
  return res;
}
export const config = { matcher: [{ source: "/((?!_next/static|_next/image|favicon.ico).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }] };
