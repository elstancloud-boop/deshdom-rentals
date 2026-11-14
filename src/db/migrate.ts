// Idempotent bootstrap. Mirrors schema.ts. For Postgres, swap the driver and use drizzle-kit.
export const DDL = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer', failed_logins INTEGER NOT NULL DEFAULT 0, locked_until INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, user_agent TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, blurb TEXT NOT NULL DEFAULT '', sort INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, brand TEXT NOT NULL DEFAULT '', category_id TEXT NOT NULL REFERENCES categories(id), summary TEXT NOT NULL, description TEXT NOT NULL, specs TEXT NOT NULL DEFAULT '[]', image_url TEXT, daily_cents INTEGER NOT NULL, weekly_cents INTEGER, deposit_cents INTEGER NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 1, min_days INTEGER NOT NULL DEFAULT 1, max_days INTEGER NOT NULL DEFAULT 30, active INTEGER NOT NULL DEFAULT 1, featured INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS products_cat ON products(category_id);
CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, ref TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL REFERENCES users(id), start_date TEXT NOT NULL, end_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payment_status TEXT NOT NULL DEFAULT 'unpaid', fulfilment TEXT NOT NULL DEFAULT 'pickup', address TEXT, notes TEXT, subtotal_cents INTEGER NOT NULL, discount_cents INTEGER NOT NULL DEFAULT 0, delivery_cents INTEGER NOT NULL DEFAULT 0, tax_cents INTEGER NOT NULL DEFAULT 0, deposit_cents INTEGER NOT NULL DEFAULT 0, total_cents INTEGER NOT NULL, coupon_code TEXT, payment_ref TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_dates ON bookings(start_date, end_date);
CREATE TABLE IF NOT EXISTS booking_items (id TEXT PRIMARY KEY, booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES products(id), name TEXT NOT NULL, qty INTEGER NOT NULL, unit_cents INTEGER NOT NULL, deposit_cents INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS items_booking ON booking_items(booking_id);
CREATE INDEX IF NOT EXISTS items_product ON booking_items(product_id);
CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id), rating INTEGER NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_user ON reviews(product_id, user_id);
CREATE TABLE IF NOT EXISTS wishlist (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE);
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_pk ON wishlist(user_id, product_id);
CREATE TABLE IF NOT EXISTS coupons (code TEXT PRIMARY KEY, percent_off INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, max_uses INTEGER, uses INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, actor_id TEXT, actor_email TEXT, action TEXT NOT NULL, target TEXT, detail TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
`;
