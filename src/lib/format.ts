export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "GBP";
const nf = new Intl.NumberFormat("en-GB", { style: "currency", currency: CURRENCY, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("en-GB", { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });
export const money = (cents: number) => (cents % 100 === 0 ? nf0 : nf).format(cents / 100);

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const isIsoDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
export const addDays = (s: string, n: number) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
export const today = () => iso(new Date());
export const fmtDate = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
export const fmtShort = (s: string) => new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
export const cls = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
