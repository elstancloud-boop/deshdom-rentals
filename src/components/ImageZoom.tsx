"use client";
import { useEffect, useState } from "react";

export function ImageZoom({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden" aria-label={`Enlarge photo of ${alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">Click to enlarge</span>
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[100] grid place-items-center bg-ink/90 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="lightbox max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl" />
          <button className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold" aria-label="Close" autoFocus>×</button>
        </div>
      )}
    </>
  );
}
