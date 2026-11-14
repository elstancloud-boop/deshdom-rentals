import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { Logo } from "@/components/Header";
import { logout } from "@/actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Deshdom Rentals admin" }, robots: { index: false, follow: false } };
const nav = [["/admin", "Overview"], ["/admin/bookings", "Bookings"], ["/admin/products", "Inventory"], ["/admin/customers", "Customers"], ["/admin/coupons", "Coupons"], ["/admin/audit", "Audit log"]];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaff();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-ink px-4 py-3 text-white lg:sticky lg:top-0 lg:h-screen lg:p-5">
        <div className="flex items-center justify-between"><Link href="/admin" aria-label="Admin home"><Logo light /></Link><div className="flex gap-4 text-sm lg:hidden"><Link href="/" className="text-white/70 underline">Store</Link><form action={logout}><button className="text-white/70 underline">Sign out</button></form></div></div>
        <div className="eyebrow mt-1 hidden !text-white/40 lg:block">Back office</div>
        <nav className="mt-3 flex gap-1 overflow-x-auto pb-1 lg:mt-6 lg:flex-col" aria-label="Admin">{nav.map(([h, l]) => <Link key={h} href={h} className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">{l}</Link>)}</nav>
        <div className="mt-6 hidden border-t border-white/10 pt-4 text-sm lg:absolute lg:block lg:bottom-5 lg:left-5 lg:right-5"><div className="truncate text-white/70">{me.email}</div><div className="mono text-xs uppercase text-tag">{me.role}</div>
          <div className="mt-3 flex gap-3"><Link href="/" className="text-white/70 underline">View store</Link><form action={logout}><button className="text-white/70 underline">Sign out</button></form></div></div>
      </aside>
      <div className="min-w-0 p-4 sm:p-8">{children}</div>
    </div>
  );
}
