import { db, t, sqlite } from "./index";
import bcrypt from "bcryptjs";
const hashPassword = (p: string) => bcrypt.hash(p, 12);
import { addDays, today } from "../lib/format";
import { rentalDays, unitPrice, totals } from "../lib/pricing";
import { eq } from "drizzle-orm";

const cats = [
  { slug: "camera-video", name: "Camera & video", blurb: "Bodies, lenses, gimbals and lights for shoots of any size." },
  { slug: "audio-dj", name: "Audio & DJ", blurb: "PA, decks and mics that make rooms sound right." },
  { slug: "outdoor", name: "Outdoor & camping", blurb: "Tents, packs and kit for the weekend you keep postponing." },
  { slug: "events", name: "Events & party", blurb: "Projectors, lighting and furniture, set up for one night." },
  { slug: "tools", name: "Tools & workshop", blurb: "Pro-grade tools for the job, without owning them." },
];
const P = (c: string, name: string, brand: string, daily: number, weekly: number | null, deposit: number, stock: number, summary: string, specs: string[][], featured = false) =>
  ({ c, name, brand, daily, weekly, deposit, stock, summary, specs, featured });
const prods = [
  P("camera-video", "Sony A7 IV Mirrorless Body", "Sony", 85, 380, 600, 3, "33MP full-frame hybrid shooter with 4K60 and reliable autofocus.", [["Sensor", "33MP full-frame BSI"], ["Video", "4K 60p 10-bit"], ["Battery", "2 × NP-FZ100 included"], ["Card slots", "CFexpress A / SD"]], true),
  P("camera-video", "Canon RF 24-70mm f/2.8L", "Canon", 45, 200, 350, 2, "The workhorse standard zoom for weddings, events and interviews.", [["Mount", "Canon RF"], ["Aperture", "f/2.8 constant"], ["Weight", "900 g"]]),
  P("camera-video", "DJI RS 4 Pro Gimbal", "DJI", 55, 240, 400, 2, "Stabilised handheld rig for smooth cinema moves.", [["Payload", "4.5 kg"], ["Battery", "Up to 12 h"], ["Includes", "Case, handle, 2 batteries"]], true),
  P("camera-video", "Aputure 300x LED Light Kit", "Aputure", 60, 260, 300, 2, "Bi-colour 300W light with softbox, stand and hard case.", [["Output", "300W bi-colour"], ["Control", "App + DMX"]]),
  P("audio-dj", "Pioneer DJ Controller DDJ-FLX10", "Pioneer DJ", 70, 300, 350, 2, "4-channel controller that works with Rekordbox and Serato.", [["Channels", "4"], ["Software", "Rekordbox / Serato"]], true),
  P("audio-dj", "JBL EON ONE Pro PA System", "JBL", 80, 340, 400, 3, "All-in-one battery PA for 150 guests. Sounds big, packs small.", [["Coverage", "Up to 150 people"], ["Battery", "6 h"], ["Mixer", "7-channel built-in"]]),
  P("audio-dj", "Shure SM58 Wireless Mic Set", "Shure", 30, 120, 150, 6, "Two handheld wireless mics with a receiver. Vocals, speeches, karaoke.", [["Mics", "2 handheld"], ["Range", "Up to 60 m"]]),
  P("outdoor", "4-Person Backpacking Tent", "MSR", 35, 150, 200, 4, "Freestanding, 3-season, packs to 3 kg. Sets up in under five minutes.", [["Sleeps", "4"], ["Weight", "3.1 kg"], ["Seasons", "3"]], true),
  P("outdoor", "65L Trekking Pack", "Osprey", 20, 85, 100, 5, "Adjustable back panel with rain cover. Fits most torsos.", [["Volume", "65 L"], ["Frame", "Anti-gravity suspension"]]),
  P("outdoor", "Roof-Top Cargo Box 450L", "Thule", 25, 110, 150, 3, "Aerodynamic, lockable, fits most roof bars.", [["Volume", "450 L"], ["Lock", "Dual-side opening"]]),
  P("outdoor", "Kayak (Tandem, Inflatable)", "Sea Eagle", 50, 220, 250, 3, "Two-person inflatable with paddles, pump and PFDs.", [["Capacity", "2 adults"], ["Length", "3.9 m"], ["Includes", "Paddles, pump, PFDs"]]),
  P("events", "Full HD Projector 5000 lm", "Epson", 65, 280, 300, 3, "Bright enough for daytime. HDMI and wireless casting.", [["Brightness", "5000 lumens"], ["Resolution", "1920 × 1080"]]),
  P("events", "120″ Tripod Projection Screen", "Elite", 25, 100, 100, 3, "Fast-fold screen for backyards, offices and halls.", [["Size", "120″ 16:9"], ["Setup", "Under 2 min"]]),
  P("events", "Folding Banquet Table (6 ft) × 4", "Lifetime", 28, 120, 80, 8, "Set of four sturdy folding tables. Seats 6–8 each.", [["Length", "1.8 m"], ["Qty per rental", "4 tables per unit"]]),
  P("events", "Party String Light Pack (100 m)", "Brightown", 18, 70, 50, 6, "Warm-white outdoor string lights with 8 modes.", [["Length", "100 m"], ["Rating", "IP65"]]),
  P("tools", "Bosch Rotary Hammer SDS-Plus", "Bosch", 40, 160, 150, 3, "Cordless, for concrete and masonry. Two batteries, charger, bits.", [["Voltage", "18V"], ["Energy", "3.4 J"]]),
  P("tools", "Pressure Washer 3000 PSI", "Karcher", 45, 180, 120, 3, "Brings decks and driveways back. Hose and four nozzles.", [["Pressure", "3000 PSI"], ["Flow", "2.4 GPM"]]),
  P("tools", "Tile Wet Saw 10″", "DeWalt", 50, 210, 200, 2, "Clean cuts through porcelain and stone. Stand included.", [["Blade", "10 in"], ["Rip", "24 in"]]),
];

async function main() {
  if (process.argv.includes("--if-empty") && (sqlite.prepare("SELECT COUNT(*) n FROM products").get() as { n: number }).n > 0) { console.log("DB already seeded, skipping"); return; }
  sqlite.exec("DELETE FROM booking_items; DELETE FROM bookings; DELETE FROM reviews; DELETE FROM wishlist; DELETE FROM products; DELETE FROM categories; DELETE FROM coupons; DELETE FROM audit_logs;");
  const cid: Record<string, string> = {};
  cats.forEach((c, i) => { cid[c.slug] = db.insert(t.categories).values({ ...c, sort: i }).returning().get().id; });
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const rows = prods.map((p) => db.insert(t.products).values({
    slug: slug(p.name), name: p.name, brand: p.brand, categoryId: cid[p.c], summary: p.summary,
    description: p.summary + " Every item is cleaned, tested and photographed before it leaves us, and comes with a condition checklist so returns are painless.",
    specs: JSON.stringify(p.specs), imageUrl: `/img/${slug(p.name)}.jpg`, dailyCents: p.daily * 100, weeklyCents: p.weekly ? p.weekly * 100 : null, depositCents: p.deposit * 100, stock: p.stock, featured: p.featured,
  }).returning().get());

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@deshdom.test").toLowerCase();
  const adminPw = process.env.ADMIN_PASSWORD ?? "ChangeMe!2026-Admin";
  const ensure = async (email: string, name: string, pw: string, role: "admin" | "customer" | "staff") => {
    const ex = db.select().from(t.users).where(eq(t.users.email, email)).get();
    if (ex) return ex;
    return db.insert(t.users).values({ email, name, passwordHash: await hashPassword(pw), role }).returning().get();
  };
  await ensure(adminEmail, "Store Admin", adminPw, "admin");
  const demo = await ensure("demo@deshdom.test", "Demo Customer", "DemoPass2026", "customer");
  const names = ["Ada Okafor", "Liam Chen", "Sofia Reyes", "Noah Bello", "Mia Fischer"];
  const people = [demo];
  for (const [i, n] of names.entries()) people.push(await ensure(`${n.split(" ")[0].toLowerCase()}@example.com`, n, "SeedPass2026x" + i, "customer"));

  db.insert(t.coupons).values([{ code: "WELCOME10", percentOff: 10 }, { code: "WEEKEND15", percentOff: 15, maxUses: 100 }]).run();

  // Demo bookings (past + future) so the dashboard has real data
    for (let i = 0; i < 24; i++) {
    const p = rows[(i * 5) % rows.length];
    const user = people[i % people.length];
    const offset = i < 10 ? -40 + i * 3 : -3 + (i - 10) * 4;
    const start = addDays(today(), offset), end = addDays(start, 1 + (i % 4));
    const endsBefore = end < today(), startsAfter = start > today();
    const status = endsBefore ? (i % 9 === 0 ? "cancelled" : "returned") : startsAfter ? (i % 7 === 0 ? "pending" : "confirmed") : "picked_up";
    const days = rentalDays(start, end), unit = unitPrice(p, days);
    const tot = totals([{ productId: p.id, name: p.name, qty: 1, unitCents: unit, depositCents: p.depositCents }], { percentOff: 0, delivery: i % 3 === 0 });
    const b = db.insert(t.bookings).values({
      ref: "KT-" + (100000 + i * 7919).toString(16).toUpperCase().slice(0, 6), userId: user.id, startDate: start, endDate: end, status,
      paymentStatus: status === "cancelled" ? "refunded" : status === "pending" ? "unpaid" : "paid", fulfilment: i % 3 === 0 ? "delivery" : "pickup", address: i % 3 === 0 ? "12 Harbour Road" : null,
      subtotalCents: tot.subtotal, deliveryCents: tot.delivery, taxCents: tot.tax, depositCents: tot.deposit, totalCents: tot.total,
      createdAt: new Date(Date.now() + (offset - 2) * 86400000).toISOString().replace("T", " ").slice(0, 19),
    }).returning().get();
    db.insert(t.bookingItems).values({ bookingId: b.id, productId: p.id, name: p.name, qty: 1, unitCents: unit, depositCents: p.depositCents }).run();
  }
  const rv: [number, number, string][] = [[0, 5, "Spotless condition and the pickup took two minutes. Will rent again."], [1, 5, "Exactly as described. Saved me from buying gear I'd use once."], [4, 4, "Great quality. Battery was a little low at pickup, otherwise perfect."], [7, 5, "Set up in minutes. Our weekend away was easy."]];
  for (const [pi, rating, body] of rv) db.insert(t.reviews).values({ productId: rows[pi].id, userId: people[1 + (pi % 5)].id, rating, body }).run();
  console.log(`Seeded ${rows.length} products. Admin: ${adminEmail} / (ADMIN_PASSWORD). Demo customer: demo@deshdom.test / DemoPass2026`);
}
main();
