"use client";
import { useActionState } from "react";
import { applyCoupon } from "@/actions/cart";
export function CouponForm() {
  const [s, action, pending] = useActionState(applyCoupon, undefined);
  return (
    <form action={action} className="border-t border-line pt-3">
      <label className="lbl" htmlFor="code">Promo code</label>
      <div className="flex gap-2"><input id="code" name="code" className="field uppercase" placeholder="WELCOME10" autoComplete="off" /><button className="btn btn-ghost btn-sm" disabled={pending}>Apply</button></div>
      {s?.error && <p role="alert" className="mt-1 text-sm text-bad">{s.error}</p>}{s?.ok && <p className="mt-1 text-sm text-ok">{s.ok}</p>}
    </form>
  );
}
