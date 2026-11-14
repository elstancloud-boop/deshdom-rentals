import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, t } from "@/db";
import { requireStaff } from "@/lib/auth";
import { ProductForm } from "@/components/ProductForm";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const cats = db.select().from(t.categories).orderBy(t.categories.sort).all();
  const p = id === "new" ? null : db.select().from(t.products).where(eq(t.products.id, id)).get();
  if (id !== "new" && !p) notFound();
  return <div className="max-w-3xl space-y-6"><h1 className="display text-5xl font-bold">{p ? "Edit item" : "New item"}</h1><ProductForm p={p ?? null} cats={cats.map((c) => ({ id: c.id, name: c.name }))} /></div>;
}
