// Centralized badge styling so cards, the detail page, and seller pages share
// one vocabulary. Reduces the badge clutter that came from ad-hoc class strings.

const TONES = {
  emerald: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30",
  amber: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30",
  sky: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-400/30",
  rose: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/30",
  slate: "bg-white/5 text-slate-300 ring-1 ring-inset ring-white/10",
  featured: "bg-accent-500 text-ink-950",
  pro: "bg-brand-500 text-ink-950",
  founding: "bg-gradient-to-r from-amber-300 to-brand-400 text-ink-950",
  sold: "bg-ink-900/90 text-white ring-1 ring-inset ring-white/10",
};

export default function Badge({ tone = "slate", className = "", children }) {
  return <span className={`badge ${TONES[tone] || TONES.slate} ${className}`}>{children}</span>;
}

// Founding-seller promo mark. Distinct from PRO so the launch cohort reads as
// special on the profile + listing detail.
export function FoundingBadge({ className = "" }) {
  return (
    <Badge tone="founding" className={className}>
      <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current" aria-hidden="true">
        <path d="M10 1l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.2l1-5.8L1.5 7.2l5.9-.9L10 1z" />
      </svg>
      Founding Seller
    </Badge>
  );
}

// Small inline "verified pro" mark used on seller cards.
export function ProBadge({ className = "" }) {
  return (
    <Badge tone="pro" className={className}>
      <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current" aria-hidden="true">
        <path d="M10 1l2.4 1.7 2.9-.2.9 2.8 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-.9 2.8-2.9-.2L10 19l-2.4-1.7-2.9.2-.9-2.8L1.4 13l.9-2.8L1.4 7.4l2.4-1.7.9-2.8 2.9.2L10 1zm-1 11.5l4.2-4.2-1.2-1.2L9 10.1 7.3 8.4 6 9.6l3 2.9z" />
      </svg>
      Verified Pro
    </Badge>
  );
}
