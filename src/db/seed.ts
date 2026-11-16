import { db, t, sqlite } from "./index";
import bcrypt from "bcryptjs";
const hashPassword = (p: string) => bcrypt.hash(p, 12);
import { addDays, today } from "../lib/format";
import { rentalDays, unitPrice, totals } from "../lib/pricing";
import { eq } from "drizzle-orm";

const cats = [{"slug": "backdrops-arches", "name": "Backdrops & arches", "blurb": "Flower walls, arches and shimmer panels that make the photo."}, {"slug": "lighting-neon", "name": "Lighting & neon", "blurb": "Neon signs, marquee letters and fairy lights for after dark."}, {"slug": "tables-seating", "name": "Tables & seating", "blurb": "Chairs, covers and tables dressed for the guest list."}, {"slug": "tableware-centrepieces", "name": "Tableware & centrepieces", "blurb": "Chargers, candelabras and florals for every table."}, {"slug": "party-extras", "name": "Party extras", "blurb": "Sweet carts, red carpets and finishing touches."}];
const P = (c: string, name: string, brand: string, daily: number, weekly: number | null, deposit: number, stock: number, summary: string, specs: string[][], featured = false) =>
  ({ c, name, brand, daily, weekly, deposit, stock, summary, specs, featured });
const prods = [
  P("backdrops-arches", "Pink & White Rose Flower Wall 8x8 ft", "Deshdom Decor", 65, 260, 100, 3, "Lush artificial rose wall in blush, white and pink. The photo backdrop everyone queues for.", [["Size", "8 × 8 ft (4 panels)"], ["Style", "Blush, white, pink roses"], ["Setup", "Free-standing frame included"]], true),
  P("backdrops-arches", "Gold Hexagon Arch Backdrop Set", "Deshdom Decor", 45, 180, 80, 3, "Three gold hexagon frames that stand alone or hold drapes, flowers and balloons.", [["Pieces", "3 hexagon frames"], ["Height", "Up to 7 ft"], ["Finish", "Brushed gold metal"]], true),
  P("backdrops-arches", "Round Circle Arch Trio with Drapes", "Deshdom Decor", 40, 160, 70, 4, "Three white circle arches with chiffon drapes. Soft, modern and easy to style.", [["Pieces", "3 circles + drapes"], ["Colours", "White frame, ivory chiffon"]]),
  P("backdrops-arches", "Rose Gold Sequin Shimmer Wall", "Deshdom Decor", 55, 220, 90, 3, "Sparkling rose gold sequin panels that catch every light. Ideal for dessert tables and selfies.", [["Size", "8 × 8 ft"], ["Panels", "12 sequin tiles + frame"]], true),
  P("backdrops-arches", "Greenery Hedge Wall Panels (set of 10)", "Deshdom Decor", 50, 200, 80, 3, "Ten realistic boxwood hedge panels to build a garden wall or neon sign backdrop.", [["Panels", "10 × 50 cm"], ["Covers", "Approx 2.5 m²"]]),
  P("lighting-neon", "Mr & Mrs Neon Sign (Warm White)", "Deshdom Decor", 40, 160, 60, 3, "Statement LED neon sign that glows warm white. Dimmable, plug-in, wall or table mount.", [["Width", "80 cm"], ["Power", "Plug-in, dimmable"]], true),
  P("lighting-neon", "Light-up Marquee Letters LOVE (4 ft)", "Deshdom Decor", 60, 240, 100, 2, "Giant 4 ft marquee letters with warm bulbs. Spell LOVE and stand them anywhere.", [["Height", "4 ft each"], ["Letters", "L-O-V-E"], ["Power", "Mains"]], true),
  P("lighting-neon", "Fairy Light Curtain Backdrop 3 x 3 m", "Deshdom Decor", 25, 100, 40, 5, "Warm-white twinkling curtain that turns any wall into a glittering backdrop.", [["Size", "3 × 3 m"], ["LEDs", "300 warm white"]]),
  P("lighting-neon", "Colour Uplighters (set of 8)", "Deshdom Decor", 60, 240, 120, 3, "Eight battery LED uplighters in any colour. Wash walls and marquees in pink, purple or gold.", [["Lights", "8 wireless"], ["Battery", "Up to 12 hours"], ["Control", "Remote"]]),
  P("tables-seating", "Gold Chiavari Chairs (set of 10)", "Deshdom Decor", 60, 240, 100, 4, "Classic gold chiavari chairs with ivory cushions. Elegant for weddings and banquets.", [["Qty", "10 chairs"], ["Finish", "Gold, ivory pad"]], true),
  P("tables-seating", "Chair Covers & Satin Sashes (set of 20)", "Deshdom Decor", 40, 160, 60, 6, "White stretch covers with satin sashes in your colour. Dress 20 chairs in minutes.", [["Qty", "20 sets"], ["Sash colours", "Blush, gold, royal blue, emerald, red"]]),
  P("tables-seating", "Round Table 5 ft with Floor-length Linen", "Deshdom Decor", 18, 72, 30, 12, "Seats 8–10 guests. Comes with a floor-length tablecloth in your choice of colour.", [["Diameter", "5 ft"], ["Seats", "8–10"], ["Linen", "Floor-length"]]),
  P("tables-seating", "Velvet Throne Sofa with Gold Frame", "Deshdom Decor", 55, 220, 120, 2, "Statement sofa in blush velvet with gold legs. The couple's seat or a photo prop.", [["Seats", "2–3"], ["Colour", "Blush velvet"]]),
  P("tableware-centrepieces", "Gold Charger Plates (set of 20)", "Deshdom Decor", 20, 80, 40, 5, "Beaded gold chargers that lift every place setting.", [["Qty", "20"], ["Diameter", "33 cm"]]),
  P("tableware-centrepieces", "Crystal Candelabra Centrepieces (set of 5)", "Deshdom Decor", 45, 180, 80, 3, "Five tall acrylic crystal candelabras for dramatic, sparkling tables.", [["Qty", "5"], ["Height", "75 cm"]], true),
  P("tableware-centrepieces", "Tall Floral Centrepiece Stands (set of 6)", "Deshdom Decor", 50, 200, 90, 3, "Six tall trumpet stands with artificial floral arrangements in pink and white.", [["Qty", "6"], ["Height", "80 cm"]]),
  P("tableware-centrepieces", "Tiered Cake & Dessert Stand Set", "Deshdom Decor", 25, 100, 40, 4, "Three-tier gold stand plus cake plate and cupcake tower.", [["Pieces", "3 stands"], ["Holds", "Up to 60 cupcakes"]]),
  P("party-extras", "Candy Cart & Sweet Table Set", "Deshdom Decor", 35, 140, 60, 3, "Pastel sweet cart with glass jars, scoops and bags. Fill it and watch it vanish.", [["Jars", "12 glass jars"], ["Includes", "Scoops, tongs, bags"]]),
  P("party-extras", "Red Carpet & Stanchion Set", "Deshdom Decor", 40, 160, 70, 3, "6 m red carpet with four gold stanchions and velvet ropes. Welcome guests like stars.", [["Carpet", "6 m × 1.2 m"], ["Stanchions", "4 gold"]], true),
  P("party-extras", "Pink Prosecco Wall Display Board", "Deshdom Decor", 40, 160, 60, 3, "Pink board with 48 holders for glasses, drinks or doughnuts. Pure party.", [["Holders", "48"], ["Size", "4 × 6 ft"]]),
];

async function main() {
  if (process.argv.includes("--if-empty") && (sqlite.prepare("SELECT COUNT(*) n FROM products").get() as { n: number }).n > 0) { console.log("DB already seeded, skipping"); return; }
  sqlite.exec("DELETE FROM booking_items; DELETE FROM bookings; DELETE FROM reviews; DELETE FROM wishlist; DELETE FROM products; DELETE FROM categories; DELETE FROM coupons; DELETE FROM audit_logs;");
  const cid: Record<string, string> = {};
  cats.forEach((c, i) => { cid[c.slug] = db.insert(t.categories).values({ ...c, sort: i }).returning().get().id; });
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const rows = prods.map((p) => db.insert(t.products).values({
    slug: slug(p.name), name: p.name, brand: p.brand, categoryId: cid[p.c], summary: p.summary,
    description: p.summary + " Every piece is cleaned, checked and packed before it leaves us, and comes with a condition checklist so returns are painless.",
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
  const rv: [number, number, string][] = [[0, 5, "Looked stunning and the collection took two minutes. Will hire again."], [1, 5, "Exactly as pictured. Saved us buying decor we'd use once."], [4, 4, "Great quality and everyone asked where it was from."], [7, 5, "Set up in minutes. Our party looked amazing."]];
  for (const [pi, rating, body] of rv) db.insert(t.reviews).values({ productId: rows[pi].id, userId: people[1 + (pi % 5)].id, rating, body }).run();
  console.log(`Seeded ${rows.length} products. Admin: ${adminEmail} / (ADMIN_PASSWORD). Demo customer: demo@deshdom.test / DemoPass2026`);
}
main();
