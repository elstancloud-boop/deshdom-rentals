import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/queries";
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return [{ url: base }, { url: `${base}/browse` }, ...listProducts({}).map((p) => ({ url: `${base}/p/${p.slug}` }))];
}
