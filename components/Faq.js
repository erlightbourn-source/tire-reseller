// Accessible FAQ built on native <details>/<summary> so it works without JS
// and is keyboard-navigable. Pass an array of { q, a } items.

export default function Faq({ items, className = "" }) {
  return (
    <div className={`divide-y divide-white/5 ${className}`}>
      {items.map((it, i) => (
        <details key={i} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-100 marker:hidden">
            <span>{it.q}</span>
            <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 fill-slate-400 transition group-open:rotate-180" aria-hidden="true">
              <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
