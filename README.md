# Deshdom Rentals: online rental store

Rent gear by the day. Storefront, checkout, customer accounts and a back-office admin panel in one Next.js app.

## Run it

```bash
npm install
cp .env.example .env.local     # then set SESSION_SECRET (openssl rand -base64 48) and ADMIN_PASSWORD
npm run db:seed                # creates the DB, 18 products, demo bookings, admin + demo users
npm run dev                    # http://localhost:3000   (production: npm run build && npm start)
```

Seed logins: admin `admin@deshdom.test` / the `ADMIN_PASSWORD` in `.env.local` (set a strong one). Customer `demo@deshdom.test` / `DemoPass2026`.
**Change or delete both before going live.** Promo codes: `WELCOME10`, `WEEKEND15`.

## What's in it

**Storefront:** date-first home page, catalogue with live availability for your dates, search/sort/filter, product pages with a range calendar that greys out booked days and shows the live price (weekly rate applied automatically), kit list (cart), promo codes, checkout (pickup or delivery), customer account with booking history and self-service cancellation (free until 48 h before pickup), wishlist, verified-renter reviews, SEO metadata, JSON-LD, sitemap, robots.

**Admin (`/admin`, staff + admin roles):** overview (revenue, bookings, items out, deposits held, utilisation, 14-day chart, pickups and returns), booking workflow (confirm → picked up → returned / cancel with refund), inventory CRUD (rates, deposit, stock, min/max days, featured, hide), customers + role management (admin only), coupons (admin only), audit log (admin only).

## Architecture

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 App Router, React 19, TypeScript strict | Server Components for fast pages; Server Actions for mutations (built-in origin check) |
| Styling | Tailwind CSS 4 + a small design system in `globals.css` | One look across store and admin |
| Data | SQLite (better-sqlite3, WAL) via Drizzle ORM | Zero-ops, transactional. Schema in `src/db/schema.ts`; to move to Postgres, swap the driver and run drizzle-kit |
| Payments | Provider boundary in `src/lib/payments.ts`: Stripe Checkout, or demo mode if no key | Card data never touches your server |
| Validation | Zod on every input, server-side | Client checks are for UX only |

Key rules in code:
- **Prices are never trusted from the browser.** `priceCart()` recomputes everything from product IDs + dates on the server.
- **No double-booking.** Availability is re-checked inside a DB transaction when the booking is created. Unpaid bookings hold stock for 30 minutes.
- **Money is integer cents.** Dates are inclusive `YYYY-MM-DD` strings (no timezone drift).
- Booking snapshots (`booking_items`) store the name and price at time of booking, so later price edits don't rewrite history.

## Security

- Passwords: bcrypt (cost 12), 10+ chars with letter and number. Constant-time-ish login (dummy hash for unknown emails), generic error messages.
- Sessions: random 256-bit token in an `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookie. Only an HMAC of the token is stored, so a DB leak can't be replayed. 14-day expiry, revocable server-side, all sessions revoked on role change.
- Brute force: per-IP and per-account rate limits (DB-backed), account lock after 10 failures, rate limits on sign-up and booking.
- Authorisation: `requireStaff()` runs in the admin layout **and** at the top of every admin page and action. Customers can only load their own bookings (ownership in the SQL `WHERE`; verified: other users get 404). Admin-only: coupons, roles, audit log.
- CSRF: Server Actions check Origin; cookies are SameSite; webhook uses signature verification instead.
- Headers: nonce-based CSP with `strict-dynamic` (no inline script injection), HSTS, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy, COOP. `no-store` on account/admin/checkout.
- SQL injection: parameterised queries / Drizzle everywhere; LIKE wildcards escaped. XSS: React escaping; JSON-LD escaped; admin image URLs restricted to `https://` or `/path`.
- Open redirect: `next` parameters must be same-site paths.
- Stripe webhook: raw-body signature check, idempotent.
- Audit log of sign-ins, failures, bookings and every admin change.

## Tested

`tests/e2e.mjs` (Playwright, run against a running server) covers 25 checks: sign-up validation, session cookie flags, date search, cart, coupons, checkout validation, booking + payment, IDOR, role gates, open redirect, over-stock handling, admin workflow, product creation, audit log, verified-review gating, login rate-limit. All pass.
`npm run typecheck` and `npm run build` are clean.

## Before you go live (honest checklist)

1. **Stripe is wired but untested** (no keys were available). Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, point a webhook at `/api/stripe/webhook` (`checkout.session.completed`), and run one test-mode booking.
2. Set `APP_URL` to your https URL, a strong `SESSION_SECRET`, and replace seed users.
3. Deploy to a host with a **persistent disk** for SQLite (VPS, Fly.io volume, Render disk), with backups (`sqlite3 data/deshdom.db ".backup"`). On serverless, move to Postgres.
4. Behind a proxy/CDN, make sure it overwrites `X-Forwarded-For`, otherwise IP rate limits can be spoofed.
5. Not built yet: transactional emails (confirmation, reminders), password reset, image upload (admin pastes image URLs; products show line-art until then), partial damage/late-fee charges against the deposit, multi-currency/tax rules. Each slots into the existing structure.
