const map: Record<string, [string, string]> = {
  pending: ["Awaiting payment", "chip-warn"], confirmed: ["Confirmed", "chip-info"], picked_up: ["Out with you", "chip-info"], returned: ["Returned", "chip-ok"], cancelled: ["Cancelled", "chip-bad"],
  paid: ["Paid", "chip-ok"], unpaid: ["Unpaid", "chip-warn"], refunded: ["Refunded", ""],
};
export function Status({ s }: { s: string }) { const [l, c] = map[s] ?? [s, ""]; return <span className={`chip ${c}`}>{l}</span>; }
