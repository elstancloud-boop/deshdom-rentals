"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { DateRange } from "./DateRange";
import { addToCart } from "@/actions/cart";
import { rentalDays, unitPrice } from "@/lib/pricing";
import { money, fmtShort } from "@/lib/format";

type P = { id: string; dailyCents: number; weeklyCents: number | null; depositCents: number; stock: number; minDays: number; maxDays: number };

export function BookPanel({ p, today, remaining, start, end }: { p: P; today: string; remaining: Record<string, number>; start: string | null; end: string | null }) {
  const [r, setR] = useState<[string | null, string | null]>([start, end]);
  const [qty, setQty] = useState(1);
  const [state, action, pending] = useActionState(async (_: unknown, fd: FormData) => addToCart(fd), undefined);
  const days = r[0] && r[1] ? rentalDays(r[0], r[1]) : 0;
  let max = p.stock;
  if (days) for (let d = new Date(r[0] + "T00:00:00Z"); d.toISOString().slice(0, 10) <= r[1]!; d.setUTCDate(d.getUTCDate() + 1)) max = Math.min(max, remaining[d.toISOString().slice(0, 10)] ?? p.stock);
  const bad = days ? (days < p.minDays ? `Minimum rental is ${p.minDays} day${p.minDays > 1 ? "s" : ""}` : days > p.maxDays ? `Maximum rental is ${p.maxDays} days` : max < 1 ? "Not available on these dates" : null) : null;
  const unit = days ? unitPrice(p, days) : 0;
  return (
    <form id="book" action={action} className="tag !rounded-[24px] p-6 scroll-mt-24">
      <input type="hidden" name="productId" value={p.id} />
      <div className="pl-7 eyebrow">Check dates</div>
      <div className="mt-3"><DateRange today={today} start={start} end={end} remaining={remaining} compact onChange={(s, e) => { setR([s, e]); setQty(1); }} /></div>
      <div className="mt-2 flex items-center gap-4 text-xs text-mute"><span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-warn" /> last unit</span><span className="line-through">booked out</span></div>
      <div className="mt-5 flex items-center justify-between border-t border-dashed border-line pt-4">
        <label htmlFor="qty" className="lbl !mb-0">Quantity</label>
        <div className="flex items-center gap-2">
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-line" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer">−</button>
          <input id="qty" name="qty" value={qty} readOnly className="w-8 bg-transparent text-center font-semibold" />
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full border border-line" onClick={() => setQty((q) => Math.min(Math.max(1, max), q + 1))} aria-label="More">+</button>
        </div>
      </div>
      <dl className="mt-4 space-y-1.5 text-sm" aria-live="polite">
        {days ? (<>
          <div className="flex justify-between"><dt className="text-mute">{fmtShort(r[0]!)} → {fmtShort(r[1]!)} · {days} day{days > 1 ? "s" : ""}</dt><dd className="font-semibold">{money(unit * qty)}</dd></div>
          {p.weeklyCents && days >= 7 && unit < p.dailyCents * days && <div className="flex justify-between text-ok"><dt>Weekly rate saves</dt><dd>−{money((p.dailyCents * days - unit) * qty)}</dd></div>}
          <div className="flex justify-between"><dt className="text-mute">Refundable deposit</dt><dd>{money(p.depositCents * qty)}</dd></div>
        </>) : <div className="text-mute">Choose pickup and return days to see your price.</div>}
      </dl>
      {bad && <p role="alert" className="mt-3 rounded-lg bg-[#fbdcd8] px-3 py-2 text-sm text-bad">{bad}</p>}
      {state?.error && <p role="alert" className="mt-3 rounded-lg bg-[#fbdcd8] px-3 py-2 text-sm text-bad">{state.error}</p>}
      <button className="btn btn-volt mt-4 w-full" disabled={pending || !days || !!bad}>{pending ? "Adding…" : "Add to kit list"}</button>
      {state?.ok && <p className="mt-3 text-center text-sm font-medium text-ok">{state.ok}. <Link href="/cart" className="underline">View kit list</Link></p>}
      {state?.ok && <div role="status" className="toast fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-ink p-4 pr-5 text-white shadow-2xl"><span className="grid h-9 w-9 place-items-center rounded-full bg-ok text-lg">✓</span><div><div className="font-semibold">Added to your kit list</div><Link href="/cart" className="text-sm text-tag underline">Go to kit list →</Link></div></div>}
    </form>
  );
}
