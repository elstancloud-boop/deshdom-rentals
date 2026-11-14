import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => text("created_at").notNull().default(sql`(datetime('now'))`);

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["customer", "staff", "admin"] }).notNull().default("customer"),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: integer("locked_until"), // epoch ms
  createdAt: createdAt(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // sha256 of token, never the raw token
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
}, (t) => [index("sessions_user").on(t.userId)]);

export const categories = sqliteTable("categories", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  blurb: text("blurb").notNull().default(""),
  sort: integer("sort").notNull().default(0),
});

export const products = sqliteTable("products", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand").notNull().default(""),
  categoryId: text("category_id").notNull().references(() => categories.id),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  specs: text("specs").notNull().default("[]"), // JSON [[label,value],...]
  imageUrl: text("image_url"),
  dailyCents: integer("daily_cents").notNull(),
  weeklyCents: integer("weekly_cents"), // optional flat price per 7 days
  depositCents: integer("deposit_cents").notNull().default(0),
  stock: integer("stock").notNull().default(1),
  minDays: integer("min_days").notNull().default(1),
  maxDays: integer("max_days").notNull().default(30),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index("products_cat").on(t.categoryId)]);

export const bookings = sqliteTable("bookings", {
  id: id(),
  ref: text("ref").notNull().unique(), // human reference e.g. KT-4F7Q2A
  userId: text("user_id").notNull().references(() => users.id),
  startDate: text("start_date").notNull(), // YYYY-MM-DD inclusive
  endDate: text("end_date").notNull(),     // YYYY-MM-DD inclusive
  status: text("status", { enum: ["pending", "confirmed", "picked_up", "returned", "cancelled"] }).notNull().default("pending"),
  paymentStatus: text("payment_status", { enum: ["unpaid", "paid", "refunded"] }).notNull().default("unpaid"),
  fulfilment: text("fulfilment", { enum: ["pickup", "delivery"] }).notNull().default("pickup"),
  address: text("address"),
  notes: text("notes"),
  subtotalCents: integer("subtotal_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  deliveryCents: integer("delivery_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  depositCents: integer("deposit_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(), // everything charged now incl. deposit
  couponCode: text("coupon_code"),
  paymentRef: text("payment_ref"),
  createdAt: createdAt(),
}, (t) => [index("bookings_user").on(t.userId), index("bookings_dates").on(t.startDate, t.endDate)]);

export const bookingItems = sqliteTable("booking_items", {
  id: id(),
  bookingId: text("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  name: text("name").notNull(), // snapshot
  qty: integer("qty").notNull(),
  unitCents: integer("unit_cents").notNull(), // rental price per unit for the whole period
  depositCents: integer("deposit_cents").notNull(),
}, (t) => [index("items_booking").on(t.bookingId), index("items_product").on(t.productId)]);

export const reviews = sqliteTable("reviews", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  createdAt: createdAt(),
}, (t) => [uniqueIndex("reviews_one_per_user").on(t.productId, t.userId)]);

export const wishlist = sqliteTable("wishlist", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
}, (t) => [uniqueIndex("wishlist_pk").on(t.userId, t.productId)]);

export const coupons = sqliteTable("coupons", {
  code: text("code").primaryKey(),
  percentOff: integer("percent_off").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  actorId: text("actor_id"),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  target: text("target"),
  detail: text("detail"),
  createdAt: createdAt(),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});
