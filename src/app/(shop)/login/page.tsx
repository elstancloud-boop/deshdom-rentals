import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getUser } from "@/lib/auth";
export const metadata: Metadata = { title: "Sign in" };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await getUser()) redirect(safe);
  return <div className="grid place-items-center px-4 py-16"><AuthForm mode="login" next={safe} /></div>;
}
