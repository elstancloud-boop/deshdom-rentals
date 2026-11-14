import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db, sqlite, t } from "@/db";
import { BookPanel } from "@/components/BookPanel";
import { ImageZoom } from "@/components/ImageZoom";
import { Visual } from "@/components/Visual";
import { ProductCard } from "@/components/ProductCard";
import { ReviewForm } from "@/components/ReviewForm";
import { dayMap } from "@/lib/availability";
import { readCart } from "@/lib/cart";
import { getUser } from "@/lib/auth";
import { listProducts } from "@/lib/queries";
import { toggleWishlist } from "@/actions/booking";
import { money, today, fmtDate } from "@/lib/format";

async function load(slug: string) {
  return db.select({ p: t.products, catSlug: t.categories.slug, catName: t.categories.name }).from(t.products).innerJoin(t.categories, eq(t.categories.id, t.products.categoryId)).where(and(eq(t.products.slug, slug), eq(t.products.active, true))).get();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = await load((await params).slug);
  return r ? { title: r.p.name, description: r.p.summary } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const { p } = r;
  const [cart, user] = await Promise.all([readCart(), getUser()]);
  const remaining = dayMap(p, today());
  const specs = JSON.parse(p.specs) as [string, string][];
  const reviews = db.select({ rating: t.reviews.rating, body: t.reviews.body, at: t.reviews.createdAt, name: t.users.name }).from(t.reviews).innerJoin(t.users, eq(t.users.id, t.reviews.userId)).where(eq(t.reviews.productId, p.id)).all();
  const avg = reviews.length ? reviews.reduce((s, x) => s + x.rating, 0) / reviews.length : null;
  const canReview = user ? !!sqlite.prepare(`SELECT 1 FROM bookings b JOIN booking_items i ON i.booking_id=b.id WHERE b.user_id=? AND i.product_id=? AND b.status='returned' LIMIT 1`).get(user.id, p.id) : false;
  const wished = user ? !!db.select().from(t.wishlist).where(and(eq(t.wishlist.userId, user.id), eq(t.wishlist.productId, p.id))).get() : false;
  const related = listProducts({ cat: r.catSlug, limit: 5 }).filter((x) => x.id !== p.id).slice(0, 4);
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, brand: p.brand, description: p.summary, offers: { "@type": "Offer", priceCurrency: "GBP", price: (p.dailyCents / 100).toFixed(2), availability: "https://schema.org/InStock" }, ...(avg ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}) };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <nav className="text-sm text-mute" aria-label="Breadcrumb"><Link href="/browse" className="hover:text-ink">Browse</Link> / <Link href={`/browse?cat=${r.catSlug}`} className="hover:text-ink">{r.catName}</Link> / <span className="text-ink">{p.name}</span></nav>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="tag !rounded-[28px]">{p.imageUrl ? <ImageZoom src={p.imageUrl} alt={p.name} /> : <div className="aspect-[4/3]"><Visual cat={r.catSlug} alt={p.name} className="h-full w-full" /></div>}</div>
          <div className="mt-8 flex items-start justify-between gap-4">
            <div><div className="eyebrow">{p.brand}</div><h1 className="display mt-2 text-4xl font-bold sm:text-5xl">{p.name}</h1>
              {avg && <div className="mono mt-3 text-sm">★ {avg.toFixed(1)} <span className="text-mute">· {reviews.length} review{reviews.length > 1 ? "s" : ""}</span></div>}</div>
            <form action={toggleWishlist}><input type="hidden" name="productId" value={p.id} /><button className="btn btn-ghost btn-sm" aria-pressed={wished}>{wished ? "♥ Saved" : "♡ Save"}</button></form>
          </div>
          <p className="mt-5 text-lg text-ink-2">{p.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3"><span className="rate text-lg">{money(p.dailyCents)} / day</span>{p.weeklyCents && <span className="chip chip-ok">{money(p.weeklyCents)} / week</span>}<span className="chip">{money(p.depositCents)} refundable deposit</span><span className="chip">{p.minDays}–{p.maxDays} days</span></div>
          {specs.length > 0 && <div className="card mt-8 overflow-hidden"><h2 className="border-b border-line px-5 py-3 font-display text-lg font-semibold">Specs</h2><dl>{specs.map(([k, v]) => <div key={k} className="grid grid-cols-3 border-b border-[#eef0ee] px-5 py-3 text-sm last:border-0"><dt className="text-mute">{k}</dt><dd className="col-span-2 font-medium">{v}</dd></div>)}</dl></div>}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start"><BookPanel p={p} today={today()} remaining={remaining} start={cart.start} end={cart.end} /></aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden"><div><span className="rate">{money(p.dailyCents)}</span><span className="mono ml-1.5 text-xs text-mute">/ day</span></div><a href="#book" className="btn btn-volt !py-2.5">Check dates</a></div>
      <section className="mt-16" aria-labelledby="rv"><h2 id="rv" className="display text-3xl font-bold">Reviews</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.length ? reviews.map((x, i) => <figure key={i} className="card p-5"><div className="mono text-sm">{"★".repeat(x.rating)}<span className="text-line">{"★".repeat(5 - x.rating)}</span></div><blockquote className="mt-2">{x.body}</blockquote><figcaption className="mt-3 text-sm text-mute">{x.name.split(" ")[0]} · {fmtDate(x.at.slice(0, 10))} · verified renter</figcaption></figure>) : <p className="text-mute">No reviews yet. Renters can review after returning this item.</p>}
        </div>
        {canReview && <div className="mt-6 max-w-lg"><ReviewForm productId={p.id} /></div>}
      </section>

      {related.length > 0 && <section className="mt-16"><h2 className="display text-3xl font-bold">Rented together</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((x, i) => <ProductCard key={x.id} p={x} i={i} />)}</div></section>}
    </div>
  );
}
