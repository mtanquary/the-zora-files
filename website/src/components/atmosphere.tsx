/** Shared atmospheric and ornamental elements from the teaser design. */

/** Stars field: subtle pre-dawn sky dots */
export function Stars() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          radial-gradient(1px 1px at 8% 12%, rgba(200,212,224,0.9) 0%, transparent 100%),
          radial-gradient(1px 1px at 22% 7%, rgba(200,212,224,0.6) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 38% 18%, rgba(240,165,0,0.8) 0%, transparent 100%),
          radial-gradient(1px 1px at 55% 4%, rgba(200,212,224,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 72% 10%, rgba(200,212,224,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 90% 16%, rgba(200,212,224,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 14% 32%, rgba(200,212,224,0.3) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 48% 28%, rgba(200,212,224,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 82% 25%, rgba(200,212,224,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 4% 48%, rgba(200,212,224,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 95% 42%, rgba(200,212,224,0.6) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 33% 52%, rgba(240,165,0,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 65% 45%, rgba(200,212,224,0.3) 0%, transparent 100%)
        `,
      }}
    />
  );
}

/** Horizon glow: warm amber/orange gradient at the bottom */
export function HorizonGlow() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{
        height: 220,
        background:
          "linear-gradient(to top, rgba(232,82,10,0.18), rgba(240,165,0,0.07), transparent)",
      }}
    />
  );
}

/** Mountain silhouette SVG: desert ridge with saguaro cacti */
export function Mountains() {
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
      <svg
        viewBox="0 0 780 160"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
        style={{ width: "100%", maxHeight: 160, display: "block" }}
      >
        <path
          d="M0 160 L70 105 L130 125 L200 80 L280 100 L360 58 L440 82 L520 50 L600 72 L680 42 L740 65 L780 55 L780 160 Z"
          fill="#141820"
          opacity="0.55"
        />
        <path
          d="M0 160 L0 148 L60 155 L130 140 L200 152 L280 135 L360 148 L440 130 L520 145 L600 136 L680 148 L780 138 L780 160 Z"
          fill="#141820"
          opacity="0.85"
        />
        <path
          d="M0 160 L0 158 L90 162 L200 155 L320 160 L440 153 L560 159 L680 154 L780 158 L780 160 Z"
          fill="#0D0F14"
        />
        <g fill="#0D0F14">
          <rect x="65" y="134" width="3" height="18" />
          <path d="M63 144 Q60 141 60 137 L63 137 Z" />
          <path d="M68 141 Q71 138 71 134 L68 134 Z" />
          <rect x="290" y="128" width="4" height="22" />
          <path d="M288 140 Q284 137 284 132 L288 132 Z" />
          <path d="M294 136 Q298 133 298 128 L294 128 Z" />
          <rect x="510" y="130" width="3" height="20" />
          <path d="M508 141 Q505 138 505 133 L508 133 Z" />
          <rect x="680" y="133" width="4" height="18" />
          <path d="M678 143 Q675 140 675 135 L678 135 Z" />
          <path d="M684 140 Q687 137 687 133 L684 133 Z" />
        </g>
        <ellipse
          cx="390"
          cy="90"
          rx="180"
          ry="35"
          fill="rgba(240,165,0,0.05)"
        />
      </svg>
    </div>
  );
}

/** Sun icon: geometric dawn symbol */
export function SunIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className="opacity-85"
    >
      <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(240,165,0,0.25)" strokeWidth="0.5" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(240,165,0,0.15)" strokeWidth="0.5" />
      <g stroke="rgba(240,165,0,0.55)" strokeWidth="1" strokeLinecap="round">
        <line x1="32" y1="3" x2="32" y2="10" />
        <line x1="32" y1="54" x2="32" y2="61" />
        <line x1="3" y1="32" x2="10" y2="32" />
        <line x1="54" y1="32" x2="61" y2="32" />
        <line x1="10.2" y1="10.2" x2="15.3" y2="15.3" />
        <line x1="48.7" y1="48.7" x2="53.8" y2="53.8" />
        <line x1="53.8" y1="10.2" x2="48.7" y2="15.3" />
        <line x1="15.3" y1="48.7" x2="10.2" y2="53.8" />
      </g>
      <circle cx="32" cy="32" r="9" fill="rgba(240,165,0,0.12)" stroke="rgba(240,165,0,0.75)" strokeWidth="1" />
      <circle cx="32" cy="32" r="5" fill="rgba(240,165,0,0.35)" />
    </svg>
  );
}

/** Ornamental section divider with label */
export function Ornament({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-10">
      <div className="flex-1 ornament-rule" />
      <span className="font-display text-xs tracking-[0.22em] text-zora-amber uppercase whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 ornament-rule" />
    </div>
  );
}

/** Lore/quote block: amber left border */
export function Lore({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-pre-dawn-mid border-l-3 border-zora-amber rounded-r-sm px-6 py-4 my-6 italic text-mist-dim text-[1.05rem] leading-relaxed">
      {children}
    </div>
  );
}

/** Score section card: predawn-mid with colored title */
export function ScoreSection({
  title,
  color,
  children,
}: {
  title: string;
  color: "amber" | "teal" | "orange";
  children: React.ReactNode;
}) {
  const titleColors = {
    amber: "text-zora-amber",
    teal: "text-teal-light",
    orange: "text-sunrise-orange",
  };
  return (
    <div className="bg-pre-dawn-mid border border-rule rounded-md px-5 py-4 my-3">
      <div
        className={`font-display text-xs tracking-[0.15em] uppercase mb-3 pb-2 border-b border-rule ${titleColors[color]}`}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/** Score row: monospace key/value pair with dotted separator */
export function ScoreRow({
  label,
  value,
  color = "amber",
}: {
  label: string;
  value: string;
  color?: "amber" | "teal" | "orange";
}) {
  const valColors = {
    amber: "text-amber-light",
    teal: "text-teal-light",
    orange: "text-sunrise-orange",
  };
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-dotted border-dawn-mist/[0.07] last:border-b-0 font-mono text-xs">
      <span className="text-mist-dim">{label}</span>
      <span className={`font-bold ${valColors[color]}`}>{value}</span>
    </div>
  );
}
