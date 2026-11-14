"use client";
import { useActionState, useState } from "react";
import { placeBooking } from "@/actions/booking";
import { money } from "@/lib/format";

export function CheckoutForm({ base, delivery, free, tax, mode }: { base: number; delivery: number; free: number; tax: number; mode: "stripe" | "demo" }) {
  const [s, action, pending] = useActionState(placeBooking, undefined);
  const [f, setF] = useState<"pickup" | "delivery">(s?.values?.fulfilment === "delivery" ? "delivery" : "pickup");
  const fee = f === "delivery" && base < free ? delivery : 0;
  return (
    <form action={action} className="card space-y-6 p-6 sm:p-8">
      <fieldset><legend className="font-display text-xl font-semibold">How will you get it?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {([["pickup", "Pick up", "Free · collect from Wigan"], ["delivery", "Deliver to me", base >= free ? "Free over " + money(free) : money(delivery) + " flat fee"]] as const).map(([v, h, p]) => (
            <label key={v} className={`cursor-pointer rounded-2xl border-2 p-4 transition ${f === v ? "border-volt bg-volt/5" : "border-line"}`}>
              <input type="radio" name="fulfilment" value={v} checked={f === v} onChange={() => setF(v)} className="sr-only" /><div className="font-semibold">{h}</div><div className="text-sm text-mute">{p}</div>
            </label>))}
        </div></fieldset>
      {f === "delivery" && <div><label className="lbl" htmlFor="address">Delivery address</label><textarea id="address" name="address" defaultValue={s?.values?.address} rows={2} className="field" required maxLength={300} /></div>}
      <div><label className="lbl" htmlFor="notes">Notes for us (optional)</label><textarea id="notes" name="notes" defaultValue={s?.values?.notes} rows={2} maxLength={500} className="field" /></div>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="terms" required className="mt-1" /><span>I agree to the rental terms: I will return the gear on time and in the condition received, and understand damage or late return may be deducted from my deposit.</span></label>
      {s?.error && <p role="alert" className="rounded-lg bg-[#fbdcd8] px-3 py-2 text-sm text-bad">{s.error}</p>}
      <button className="btn btn-volt w-full !py-4 text-base" disabled={pending}>{pending ? "Reserving…" : mode === "stripe" ? "Continue to secure payment" : "Confirm booking (demo payment)"}</button>
      {fee > 0 && <p className="text-center text-xs text-mute">Delivery adds {money(fee + Math.round(fee * tax))} including tax to the total shown.</p>}
      <p className="text-center text-xs text-mute">{mode === "stripe" ? "Payments are processed by Stripe. Card details never touch our servers." : "Demo mode: no real payment is taken."}</p>
    </form>
  );
}
