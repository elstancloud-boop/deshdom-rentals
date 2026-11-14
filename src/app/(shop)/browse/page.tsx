import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { listProducts, categories } from "@/lib/queries";
import { readCart } from "@/lib/cart";
import { fmtShort, cls } from "@/lib/format";

export const metadata: Metadata = { title: "Browse gear" };

export default async function Browse({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string; sort?: string; avail?: string }> }) {
  const sp = await searchParams;
  const cart = await readCart();
  const cats = categories();
  const q = sp.q?.slice(0, 60);
  const items = listProducts({ cat: sp.cat, q, sort: sp.sort, start: cart.start, end: cart.end, onlyAvailable: sp.avail === "1" });
  const href = (o: Record<string, string | undefined>) => { const p = new URLSearchParams(); const m = { cat: sp.cat, q, sort: sp.sort, avail: sp.avail, ...o }; for (const [k, v] of Object.entries(m)) if (v) p.set(k, v); const s = p.toString(); return "/browse" + (s ? "?" + s : ""); };
  const active = cats.find((c) => c.slug === sp.cat);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="eyebrow">{active ? "Shelf" : "Catalogue"}</div>
      <h1 className="display mt-2 text-5xl font-bold sm:text-6xl">{active?.name ?? (q ? `“${q}”` : "All gear")}</h1>
      {active && <p className="mt-3 max-w-xl text-ink-2">{active.blurb}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by shelf">
        <Link href={href({ cat: undefined })} className={cls("chip !px-4 !py-2 !text-sm", !sp.cat && "!bg-ink !text-white")}>All</Link>
        {cats.map((c) => <Link key={c.slug} href={href({ cat: c.slug })} className={cls("chip !px-4 !py-2 !text-sm", sp.cat === c.slug && "!bg-ink !text-white")}>{c.name}</Link>)}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {cart.start && cart.end ? (
          <div className="chip chip-info !text-sm">Showing stock for {fmtShort(cart.start)} → {fmtShort(cart.end)} · <Link href="/#top" className="underline">change</Link></div>
        ) : <Link href="/" className="chip chip-warn !text-sm">Pick dates to see live availability →</Link>}
        <form className="flex items-center gap-2 text-sm" action="/browse">
          {sp.cat && <input type="hidden" name="cat" value={sp.cat} />}{q && <input type="hidden" name="q" value={q} />}
          {cart.start && <label className="flex items-center gap-1.5"><input type="checkbox" name="avail" value="1" defaultChecked={sp.avail === "1"} /> Available only</label>}
          <select name="sort" defaultValue={sp.sort ?? ""} className="field !w-auto !py-2 text-sm" aria-label="Sort">
            <option value="">Featured</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Top rated</option><option value="new">Newest</option>
          </select>
          <button className="btn btn-ghost btn-sm">Apply</button>
        </form>
      </div>

      {items.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div>
      ) : (
        <div className="card mt-10 p-12 text-center"><h2 className="font-display text-2xl font-semibold">Nothing matches</h2><p className="mt-2 text-mute">Clear a filter or try different dates.</p><Link href="/browse" className="btn btn-primary mt-5">Reset filters</Link></div>
      )}
    </div>
  );
}
