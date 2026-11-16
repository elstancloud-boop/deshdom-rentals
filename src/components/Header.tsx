import Link from "next/link";
import { getUser } from "@/lib/auth";
import { readCart } from "@/lib/cart";
import { logout } from "@/actions/auth";
import { SITE } from "@/lib/site";
import { categories } from "@/lib/queries";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-volt"><span className="h-2.5 w-2.5 rounded-full bg-tag" /></span>
      <span className={`display text-2xl font-bold ${light ? "text-white" : "text-ink"}`}>deshdom</span>
    </span>
  );
}

export async function Header() {
  const [user, cart] = await Promise.all([getUser(), readCart()]);
  const n = cart.items.reduce((s, i) => s + i.qty, 0);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" aria-label="Deshdom Rentals home"><Logo /></Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Main">
          <Link href="/browse" className="hover:text-volt">Browse all</Link>
          {categories().map((c) => <Link key={c.slug} href={`/browse?cat=${c.slug}`} className="hover:text-volt">{c.name.split(" &")[0]}</Link>)}
        </nav>
        <form action="/browse" className="ml-auto hidden flex-1 max-w-xs lg:block" role="search">
          <input name="q" placeholder="Search decor" aria-label="Search decor" className="field !rounded-full !py-2 text-sm" />
        </form>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {user ? (
            <>
              {user.role !== "customer" && <Link href="/admin" className="btn btn-ghost btn-sm hidden sm:inline-flex">Admin</Link>}
              <Link href="/account" className="hidden text-sm font-medium hover:text-volt sm:block">{user.name.split(" ")[0]}</Link>
              <form action={logout} className="hidden sm:block"><button className="btn btn-sm text-mute hover:text-ink">Sign out</button></form>
              <details className="relative sm:hidden">
                <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-line bg-white text-sm font-bold [&::-webkit-details-marker]:hidden" aria-label="Account menu">{user.name.slice(0, 1).toUpperCase()}</summary>
                <div className="absolute right-0 top-12 w-48 rounded-2xl border border-line bg-white p-2 shadow-xl">
                  <div className="truncate px-3 py-2 text-xs text-mute">{user.email}</div>
                  <Link href="/account" className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-bg">My bookings</Link>
                  {user.role !== "customer" && <Link href="/admin" className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-bg">Admin panel</Link>}
                  <form action={logout}><button className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-bad hover:bg-bg">Sign out</button></form>
                </div>
              </details>
            </>
          ) : (
            <><Link href="/login" className="whitespace-nowrap text-sm font-medium hover:text-volt">Sign in</Link><Link href="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">Create account</Link></>
          )}
          <Link href="/cart" className="btn btn-volt btn-sm" aria-label={`Kit list, ${n} items`}>Kit list <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-bold text-volt">{n}</span></Link>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-4 pb-2 text-sm font-medium md:hidden" aria-label="Shelves">
        {[["/browse", "All"], ...categories().map((c) => [`/browse?cat=${c.slug}`, c.name.split(" &")[0]])].map(([h, l]) => <Link key={h} href={h} className="chip !px-4 !py-2 whitespace-nowrap">{l}</Link>)}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2"><Logo light /><p className="mt-4 max-w-sm text-sm text-white/70">{SITE.tagline} Every piece is cleaned, checked and ready to style your day.</p>
          <ul className="mt-5 flex flex-wrap gap-2 text-sm">{SITE.socials.map((s) => <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer" className="chip !bg-white/10 !text-white hover:!bg-white/20">{s.label}</a></li>)}</ul></div>
        <div className="text-sm"><div className="eyebrow !text-white/50">Contact</div>
          <address className="mt-3 space-y-1 not-italic text-white/80">{SITE.address.map((l) => <div key={l}>{l}</div>)}<div className="pt-2"><a href={`tel:${SITE.phoneTel}`} className="font-semibold text-white">{SITE.phoneDisplay}</a></div><div><a href={SITE.whatsappChat} target="_blank" rel="noopener noreferrer" className="underline">Message on WhatsApp</a></div></address></div>
        <div className="text-sm"><div className="eyebrow !text-white/50">Shop</div><ul className="mt-3 space-y-2 text-white/80"><li><Link href="/browse">All decor</Link></li>{categories().slice(0, 3).map((c) => <li key={c.slug}><Link href={`/browse?cat=${c.slug}`}>{c.name}</Link></li>)}<li><Link href="/account">My bookings</Link></li></ul></div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">© {new Date().getFullYear()} {SITE.legalName}, trading as {SITE.name}. Free cancellation up to 48 hours before pickup. Deposits are refunded on return.</div>
    </footer>
  );
}
