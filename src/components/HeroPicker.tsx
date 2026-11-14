"use client";
import { useState } from "react";
import { DateRange } from "./DateRange";
import { searchDates } from "@/actions/cart";
import { rentalDays } from "@/lib/pricing";
import { fmtShort } from "@/lib/format";

export function HeroPicker({ today, start, end }: { today: string; start: string | null; end: string | null }) {
  const [r, setR] = useState<[string | null, string | null]>([start, end]);
  const ready = r[0] && r[1];
  return (
    <form action={searchDates} className="tag !rounded-[28px] p-6 sm:p-7 shadow-[0_30px_60px_-30px_rgb(13_27_26/.4)]">
      <div className="flex items-start justify-between pl-7">
        <div><div className="eyebrow">Step 1</div><h2 className="font-display text-2xl font-semibold tracking-tight">When do you need it?</h2></div>
        <span className="rate !text-xs">LIVE STOCK</span>
      </div>
      <div className="mt-5"><DateRange today={today} start={start} end={end} compact onChange={(s, e) => setR([s, e])} /></div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-line pt-4">
        <div className="text-sm" aria-live="polite">
          {ready ? <><span className="font-semibold">{fmtShort(r[0]!)} → {fmtShort(r[1]!)}</span> <span className="text-mute">· {rentalDays(r[0]!, r[1]!)} day{rentalDays(r[0]!, r[1]!) > 1 ? "s" : ""}</span></> : <span className="text-mute">{r[0] ? "Now pick your return day" : "Pick pickup and return days"}</span>}
        </div>
        <button className="btn btn-volt" disabled={!ready}>See what&apos;s free</button>
      </div>
    </form>
  );
}
