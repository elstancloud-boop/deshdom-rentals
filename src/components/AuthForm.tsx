"use client";
import { useActionState } from "react";
import Link from "next/link";
import { login, register } from "@/actions/auth";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [s, action, pending] = useActionState(mode === "login" ? login : register, undefined);
  const reg = mode === "register";
  return (
    <form action={action} className="card w-full max-w-md space-y-4 p-8" noValidate>
      <input type="hidden" name="next" value={next} />
      <h1 className="display text-4xl font-bold">{reg ? "Create account" : "Welcome back"}</h1>
      <p className="text-sm text-mute">{reg ? "Book in under a minute and track every rental." : "Sign in to manage your bookings."}</p>
      {reg && <div><label className="lbl" htmlFor="name">Full name</label><input id="name" name="name" defaultValue={s?.values?.name} autoComplete="name" required className="field" /></div>}
      <div><label className="lbl" htmlFor="email">Email</label><input id="email" name="email" defaultValue={s?.values?.email} type="email" autoComplete="email" required className="field" /></div>
      {reg && <div><label className="lbl" htmlFor="phone">Phone (optional)</label><input id="phone" name="phone" defaultValue={s?.values?.phone} type="tel" autoComplete="tel" className="field" /></div>}
      <div><label className="lbl" htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={reg ? "new-password" : "current-password"} required minLength={reg ? 10 : undefined} className="field" />
        {reg && <p className="mt-1 text-xs text-mute">At least 10 characters with a letter and a number.</p>}</div>
      {s?.error && <p role="alert" className="rounded-lg bg-[#fbdcd8] px-3 py-2 text-sm text-bad">{s.error}</p>}
      <button className="btn btn-volt w-full" disabled={pending}>{pending ? "One moment…" : reg ? "Create account" : "Sign in"}</button>
      <p className="text-center text-sm text-mute">{reg ? <>Have an account? <Link className="font-semibold text-volt" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></> : <>New here? <Link className="font-semibold text-volt" href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link></>}</p>
    </form>
  );
}
