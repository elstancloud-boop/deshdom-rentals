// Line-art product visuals by category (no external images needed; admins can set imageUrl to override).
const tints: Record<string, string> = { "backdrops-arches": "#ffd0e6", "lighting-neon": "#ffe9a8", "tables-seating": "#d6ccff", "tableware-centrepieces": "#c5f0e6", "party-extras": "#ffd9b8" };
const S = { fill: "none", stroke: "#0d1b1a", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Glyph({ cat }: { cat: string }) {
  switch (cat) {
    case "camera-video": return (<g {...S}><rect x="30" y="55" width="140" height="90" rx="14" /><circle cx="100" cy="100" r="30" /><circle cx="100" cy="100" r="14" /><path d="M65 55l10-16h50l10 16" /><circle cx="150" cy="72" r="4" fill="#0d1b1a" /></g>);
    case "audio-dj": return (<g {...S}><rect x="40" y="35" width="120" height="130" rx="14" /><circle cx="100" cy="80" r="14" /><circle cx="100" cy="130" r="30" /><circle cx="100" cy="130" r="10" /></g>);
    case "outdoor": return (<g {...S}><path d="M25 160L100 40l75 120z" /><path d="M100 40v120M72 160l28-50 28 50" /><path d="M10 160h180" /></g>);
    case "events": return (<g {...S}><rect x="25" y="60" width="150" height="70" rx="10" /><circle cx="70" cy="95" r="20" /><path d="M110 85h45M110 105h30" /><path d="M60 130v25M140 130v25M45 158h30M125 158h30" /></g>);
    default: return (<g {...S}><path d="M45 160l60-60" strokeWidth="14" /><path d="M95 60l45-25 25 25-25 45z" /><path d="M80 120l-12-12" /></g>);
  }
}

export function Visual({ cat, src, alt = "", className = "" }: { cat: string; src?: string | null; alt?: string; className?: string }) {
  if (src) return /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt={alt} className={`object-cover ${className}`} loading="lazy" />;
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={alt} className={className} preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="200" fill={tints[cat] ?? "#e6e9e7"} />
      <circle cx="165" cy="35" r="60" fill="#fff" opacity=".35" />
      <Glyph cat={cat} />
    </svg>
  );
}
