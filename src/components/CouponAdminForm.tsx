"use client";
import { useActionState } from "react";
import { saveCoupon } from "@/actions/admin";
export function CouponAdminForm() {
  const [s, action, pending] = useActionState(saveCoupon, undefined);
  return (
    <form action={action} className="card flex flex-wrap items-end gap-3 p-5">
      <div><label className="lbl" htmlFor="code">Code</label><input id="code" name="code" className="field uppercase" required /></div>
      <div><label className="lbl" htmlFor="pct">% off</label><input id="pct" name="pct" type="number" min={1} max={90} className="field !w-24" required /></div>
      <div><label className="lbl" htmlFor="max">Max uses</label><input id="max" name="max" type="number" min={1} className="field !w-28" /></div>
      <button className="btn btn-volt" disabled={pending}>Save coupon</button>
      {s?.error && <p role="alert" className="w-full text-sm text-bad">{s.error}</p>}{s?.ok && <p className="w-full text-sm text-ok">{s.ok}</p>}
    </form>
  );
}
