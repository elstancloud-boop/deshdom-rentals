"use client";
import { useMemo, useState } from "react";
import { cls } from "@/lib/format";

const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function DateRange({ today, start: s0, end: e0, remaining, onChange, compact }: {
  today: string; start?: string | null; end?: string | null; remaining?: Record<string, number>;
  onChange?: (s: string | null, e: string | null) => void; compact?: boolean;
}) {
  const [start, setStart] = useState<string | null>(s0 ?? null);
  const [end, setEnd] = useState<string | null>(e0 ?? null);
  const [hover, setHover] = useState<string | null>(null);
  const t0 = new Date(today + "T00:00:00Z");
  const [view, setView] = useState({ y: (s0 ? new Date(s0 + "T00:00:00Z") : t0).getUTCFullYear(), m: (s0 ? new Date(s0 + "T00:00:00Z") : t0).getUTCMonth() });
  const blocked = (d: string) => d < today || (remaining ? remaining[d] === 0 : false);

  const pick = (d: string) => {
    if (blocked(d)) return;
    let ns: string | null = start, ne: string | null = end;
    if (!start || (start && end) || d < start) { ns = d; ne = null; }
    else {
      // can't span a fully-booked day
      let ok = true;
      for (let c = new Date(start + "T00:00:00Z"); c.toISOString().slice(0, 10) <= d; c.setUTCDate(c.getUTCDate() + 1)) if (blocked(c.toISOString().slice(0, 10))) { ok = false; break; }
      if (!ok) { ns = d; ne = null; } else ne = d;
    }
    setStart(ns); setEnd(ne); onChange?.(ns, ne);
  };

  const months = useMemo(() => [0, 1].map((o) => { const m = view.m + o; return { y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }; }), [view]);
  const prevDisabled = view.y === t0.getUTCFullYear() && view.m <= t0.getUTCMonth();
  const shift = (n: number) => setView((v) => { const m = v.m + n; return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 }; });
  const hi = end ?? (start && hover && hover > start ? hover : null);

  return (
    <div>
      <input type="hidden" name="start" value={start ?? ""} /><input type="hidden" name="end" value={end ?? ""} />
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={prevDisabled} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-white disabled:opacity-30" aria-label="Previous month">←</button>
        <button type="button" onClick={() => shift(1)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-white" aria-label="Next month">→</button>
      </div>
      <div className={cls("grid gap-6", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        {months.slice(0, compact ? 1 : 2).map(({ y, m }) => {
          const first = new Date(Date.UTC(y, m, 1)).getUTCDay();
          const n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
          return (
            <div key={`${y}-${m}`}>
              <div className="mb-2 text-center font-display text-base font-semibold">{MONTHS[m]} {y}</div>
              <div className="grid grid-cols-7 text-center text-[11px] mono text-mute">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="py-1">{d}</div>)}</div>
              <div className="grid grid-cols-7" role="grid" aria-label={`${MONTHS[m]} ${y}`}>
                {Array.from({ length: first }, (_, i) => <div key={"e" + i} />)}
                {Array.from({ length: n }, (_, i) => {
                  const d = key(y, m, i + 1), off = blocked(d);
                  const isS = d === start, isE = d === end, inR = start && hi && d > start && d < hi;
                  const low = remaining && remaining[d] != null && remaining[d]! > 0 && remaining[d]! <= 1;
                  return (
                    <button key={d} type="button" role="gridcell" disabled={off} onClick={() => pick(d)} onMouseEnter={() => setHover(d)}
                      aria-pressed={isS || isE} aria-label={d + (off ? ", unavailable" : "")}
                      className={cls("relative my-0.5 h-10 text-sm transition-colors", off && "text-mute/40 line-through", !off && !isS && !isE && !inR && "rounded-full hover:bg-white", inR && "bg-volt/15 text-ink", (isS || isE) && "rounded-full bg-volt font-semibold text-white", isS && hi && "rounded-r-none", isE && "rounded-l-none")}>
                      {i + 1}
                      {low && !isS && !isE && <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-warn" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
