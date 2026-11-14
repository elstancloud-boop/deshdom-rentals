import Link from "next/link";
import { money } from "@/lib/format";
import { Visual } from "./Visual";
import { Tilt } from "./Tilt";

export type CardProduct = { id: string; slug: string; name: string; brand: string; summary: string; dailyCents: number; imageUrl: string | null; catSlug: string; catName: string; rating?: number | null; reviews?: number; left?: number | null };

export function ProductCard({ p, i = 0 }: { p: CardProduct; i?: number }) {
  return (
    <Tilt>
      <Link href={`/p/${p.slug}`} className="tag rise group block" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <Visual cat={p.catSlug} src={p.imageUrl} alt={p.name} className="h-full w-full transition duration-700 ease-out group-hover:scale-110" />
          <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ink/80 to-transparent px-4 pb-3 pt-8 text-sm font-semibold text-white transition duration-300 group-hover:translate-y-0">Check dates →</span>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow">{p.brand || p.catName}</span>
            {p.left === 0 ? <span className="chip chip-bad">Booked</span> : p.left != null && p.left <= 2 ? <span className="chip chip-warn">{p.left} left</span> : null}
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold leading-tight tracking-tight">{p.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-mute">{p.summary}</p>
          <div className="mt-4 flex items-end justify-between">
            <div><span className="rate">{money(p.dailyCents)}</span><span className="mono ml-1.5 text-xs text-mute">/ day</span></div>
            {p.rating ? <span className="mono text-xs text-ink-2">★ {p.rating.toFixed(1)} <span className="text-mute">({p.reviews})</span></span> : null}
          </div>
          <div className="barcode mt-4" aria-hidden />
        </div>
      </Link>
    </Tilt>
  );
}
