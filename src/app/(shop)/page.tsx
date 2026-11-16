import Link from "next/link";
import { HeroPicker } from "@/components/HeroPicker";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { Tilt } from "@/components/Tilt";
import { listProducts, categories } from "@/lib/queries";
import { readCart } from "@/lib/cart";
import { today, money } from "@/lib/format";

const marquee = ["Weddings · Birthdays · Baby showers · Corporate", "Deposits refunded on return", "Cleaned and checked every time", "Collect in Wigan or get it delivered", "Weekly rates on everything"];

export default async function Home() {
  const cart = await readCart();
  const all = listProducts({});
  const featured = all.filter((p) => ["pink-white-rose-flower-wall-8x8-ft","mr-mrs-neon-sign-warm-white","gold-chiavari-chairs-set-of-10","crystal-candelabra-centrepieces-set-of-5"].includes(p.slug));
  const cats = categories().map((c) => ({ ...c, img: all.find((p) => p.catSlug === c.slug && p.imageUrl)?.imageUrl ?? null }));
  const example = all.find((p) => p.slug === "gold-hexagon-arch-backdrop-set");
  const screen = all.find((p) => p.slug === "colour-uplighters-set-of-8");
  const lights = all.find((p) => p.slug === "light-up-marquee-letters-love-4-ft");
  return (
    <>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pt-16">
        <div className="rise">
          <div className="eyebrow">Rent by the day · Wigan &amp; Greater Manchester</div>
          <h1 className="display mt-4 text-[clamp(3.4rem,9vw,7.5rem)] font-bold">Style it.<br /><span className="text-volt">Love it.</span></h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">Flower walls, neon signs, arches, chairs and tableware for weddings, birthdays and every party. Pick your date, see what is free, and pay once. Deposit refunded on return.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/browse" className="btn btn-primary shine">Browse all decor</Link><Link href="#how" className="btn btn-ghost">How it works</Link></div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
            <div><dt className="eyebrow">Items</dt><dd className="display text-4xl font-bold"><CountUp to={all.length} /></dd></div>
            <div><dt className="eyebrow">Collections</dt><dd className="display text-4xl font-bold"><CountUp to={cats.length} /></dd></div>
            <div><dt className="eyebrow">Cancel free</dt><dd className="display text-4xl font-bold"><CountUp to={48} suffix="h" /></dd></div>
          </dl>
        </div>
        <div className="rise" style={{ animationDelay: "120ms" }}><HeroPicker today={today()} start={cart.start} end={cart.end} /></div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/hero.jpg" alt="A colourful event hall with flower wall, balloons, neon heart and gold chairs" className="h-[360px] w-full object-cover sm:h-[460px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 max-w-sm text-white"><div className="display text-3xl font-bold sm:text-4xl">Every colour. Every theme.</div><p className="mt-2 text-sm text-white/80">Cleaned and checked before every event.</p></div>
            {example && <Link href={`/p/${example.slug}`} className="float-a absolute right-4 top-4 hidden rounded-2xl bg-white p-3 shadow-xl sm:block" style={{ "--r": "-2deg" } as React.CSSProperties}><div className="eyebrow">Popular</div><div className="font-display font-semibold">{example.name}</div><span className="rate">{money(example.dailyCents)} / day</span></Link>}
            {lights && <Link href={`/p/${lights.slug}`} className="float-b absolute bottom-6 right-6 hidden rounded-2xl bg-white p-3 shadow-xl md:block" style={{ "--r": "2deg" } as React.CSSProperties}><div className="eyebrow">For weddings</div><div className="font-display font-semibold">Marquee LOVE</div><span className="rate">{money(lights.dailyCents)} / day</span></Link>}
          </div>
        </Reveal>
      </section>

      <div className="mt-12 overflow-hidden border-y border-ink bg-tag py-3" aria-hidden>
        <div className="ticker flex w-max gap-12 whitespace-nowrap mono text-sm font-bold uppercase">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => <span key={i}>{m} <span className="ml-12">✺</span></span>)}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Reveal><div className="flex items-end justify-between"><h2 className="display text-4xl font-bold sm:text-5xl">Collections</h2><Link href="/browse" className="text-sm font-semibold text-volt">View everything →</Link></div></Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {cats.map((c, i) => (
            <Reveal key={c.slug} delay={i * 70}>
              <Link href={`/browse?cat=${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[22px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.img && <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" loading="lazy" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white"><div className="font-display text-xl font-semibold leading-tight">{c.name}</div><div className="mono mt-1 flex items-center gap-2 text-xs text-white/70">{c.n} items <span className="translate-x-0 transition group-hover:translate-x-1">→</span></div></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal><h2 className="display text-4xl font-bold sm:text-5xl">Most hired</h2></Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div>
      </section>

      {screen && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] bg-ink text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screen.imageUrl!} alt="Venue lit with colourful uplighters" className="absolute inset-0 h-full w-full object-cover opacity-50" loading="lazy" />
              <div className="relative max-w-xl p-8 sm:p-14"><div className="eyebrow !text-tag">Mood lighting</div><h2 className="display mt-3 text-4xl font-bold sm:text-6xl">Light up the room.</h2><p className="mt-4 text-white/80">Colour uplighters, neon and fairy lights to set the mood. Set up in minutes, hand back after.</p><Link href="/browse?cat=lighting-neon" className="btn btn-volt mt-6">See lighting</Link></div>
            </div>
          </Reveal>
        </section>
      )}

      <section id="how" className="mx-auto mt-24 max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <Reveal>
          <div className="rounded-[32px] border border-white bg-white/80 backdrop-blur p-8 sm:p-14">
            <h2 className="display text-4xl font-bold sm:text-5xl">Four steps. No paperwork.</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[["Pick dates", "Availability is checked live against every other booking."], ["Reserve and pay", "One payment covers the rental and a refundable deposit."], ["Collect or get it delivered", "Collect in Wigan, or choose doorstep delivery."], ["Return it", "We inspect it and release your deposit."]].map(([h, p], i) => (
                <li key={h} className="group border-t-2 border-ink pt-4 transition hover:border-volt"><span className="mono text-xs text-volt">STEP {i + 1}</span><h3 className="mt-2 font-display text-xl font-semibold">{h}</h3><p className="mt-2 text-sm text-mute">{p}</p></li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {example && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="grid items-center gap-8 rounded-[32px] bg-volt p-8 text-white sm:p-12 lg:grid-cols-2">
              <div><div className="eyebrow !text-white/70">Rent, don&apos;t buy</div><h2 className="display mt-3 text-4xl font-bold sm:text-5xl">A three-day hire costs {money(example.dailyCents * 3)}.</h2><p className="mt-4 max-w-md text-white/85">That is the {example.name} at {money(example.dailyCents)} a day. Style your event, hand it back, and skip the storage and the big spend.</p><Link href={`/p/${example.slug}`} className="btn mt-6 bg-white text-volt hover:bg-tag hover:text-ink shine">Check dates for this set</Link></div>
              <Tilt className="mx-auto w-full max-w-sm"><div className="tag rotate-2 text-ink"><div className="aspect-[4/3] overflow-hidden"><img src={example.imageUrl!} alt={example.name} className="h-full w-full object-cover" loading="lazy" /></div><div className="flex items-center justify-between p-4"><span className="font-display font-semibold">{example.name}</span><span className="rate">{money(example.dailyCents)}</span></div></div></Tilt>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
