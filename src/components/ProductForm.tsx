"use client";
import { useActionState } from "react";
import Link from "next/link";
import { saveProduct } from "@/actions/admin";

type P = { id: string; name: string; brand: string; categoryId: string; summary: string; description: string; specs: string; imageUrl: string | null; dailyCents: number; weeklyCents: number | null; depositCents: number; stock: number; minDays: number; maxDays: number; active: boolean; featured: boolean };
const L = ({ id, children }: { id: string; children: React.ReactNode }) => <label className="lbl" htmlFor={id}>{children}</label>;

export function ProductForm({ p, cats }: { p: P | null; cats: { id: string; name: string }[] }) {
  const [s, action, pending] = useActionState(saveProduct, undefined);
  const v = s?.values ?? {};
  const specs0 = p ? (JSON.parse(p.specs) as [string, string][]).map(([k, v]) => `${k}: ${v}`).join("\n") : "";
  const specs = v.specs ?? specs0;
  const $ = (c: number | null | undefined) => (c == null ? "" : String(c / 100));
  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><L id="name">Name</L><input id="name" name="name" className="field" defaultValue={v.name ?? p?.name} required /></div>
        <div><L id="brand">Brand</L><input id="brand" name="brand" className="field" defaultValue={v.brand ?? p?.brand} /></div>
        <div><L id="categoryId">Shelf</L><select id="categoryId" name="categoryId" className="field" defaultValue={v.categoryId ?? p?.categoryId}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><L id="imageUrl">Image URL (optional)</L><input id="imageUrl" name="imageUrl" className="field" defaultValue={v.imageUrl ?? p?.imageUrl ?? ""} placeholder="https://…" /></div>
      </div>
      <div><L id="summary">One-line summary</L><input id="summary" name="summary" className="field" defaultValue={v.summary ?? p?.summary} required maxLength={200} /></div>
      <div><L id="description">Description</L><textarea id="description" name="description" rows={4} className="field" defaultValue={v.description ?? p?.description} required /></div>
      <div><L id="specs">Specs (one “Label: value” per line)</L><textarea id="specs" name="specs" rows={4} className="field mono text-sm" defaultValue={specs} /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><L id="daily">Day rate (£)</L><input id="daily" name="daily" type="number" step="0.01" min="0" className="field" defaultValue={v.daily ?? $(p?.dailyCents)} required /></div>
        <div><L id="weekly">Weekly rate (£, optional)</L><input id="weekly" name="weekly" type="number" step="0.01" min="0" className="field" defaultValue={v.weekly ?? $(p?.weeklyCents)} /></div>
        <div><L id="deposit">Deposit (£)</L><input id="deposit" name="deposit" type="number" step="0.01" min="0" className="field" defaultValue={v.deposit ?? ($(p?.depositCents) || "0")} required /></div>
        <div><L id="stock">Units in stock</L><input id="stock" name="stock" type="number" min="0" className="field" defaultValue={v.stock ?? p?.stock ?? 1} required /></div>
        <div><L id="minDays">Min days</L><input id="minDays" name="minDays" type="number" min="1" className="field" defaultValue={v.minDays ?? p?.minDays ?? 1} required /></div>
        <div><L id="maxDays">Max days</L><input id="maxDays" name="maxDays" type="number" min="1" className="field" defaultValue={v.maxDays ?? p?.maxDays ?? 30} required /></div>
      </div>
      <div className="flex gap-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={s?.values ? v.active === "on" : (p?.active ?? true)} /> Visible in store</label><label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={s?.values ? v.featured === "on" : (p?.featured ?? false)} /> Featured on home</label></div>
      {s?.error && <p role="alert" className="rounded-lg bg-[#fbdcd8] px-3 py-2 text-sm text-bad">{s.error}</p>}
      <div className="flex gap-3"><button className="btn btn-volt" disabled={pending}>{pending ? "Saving…" : "Save item"}</button><Link href="/admin/products" className="btn btn-ghost">Cancel</Link></div>
    </form>
  );
}
