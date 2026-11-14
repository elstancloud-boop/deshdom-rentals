"use client";
import { useActionState } from "react";
import { submitReview } from "@/actions/booking";

export function ReviewForm({ productId }: { productId: string }) {
  const [s, action, pending] = useActionState(submitReview, undefined);
  return (
    <form action={action} className="card space-y-3 p-5">
      <h3 className="font-display text-lg font-semibold">Rate your rental</h3>
      <input type="hidden" name="productId" value={productId} />
      <div><label className="lbl" htmlFor="rating">Rating</label><select id="rating" name="rating" className="field" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}</select></div>
      <div><label className="lbl" htmlFor="body">Your review</label><textarea id="body" name="body" rows={3} maxLength={1000} className="field" required /></div>
      {s?.error && <p role="alert" className="text-sm text-bad">{s.error}</p>}{s?.ok && <p className="text-sm text-ok">{s.ok}</p>}
      <button className="btn btn-primary" disabled={pending}>Post review</button>
    </form>
  );
}
