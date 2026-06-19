export default function Stars({ value = 0, size = "h-4 w-4" }) {
  const rounded = Math.round(value * 10) / 10;
  return (
    <span className="inline-flex items-center" role="img" aria-label={`${rounded} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" aria-hidden="true" className={`${size} ${n <= Math.round(value) ? "fill-accent-400" : "fill-white/15"}`}>
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z" />
        </svg>
      ))}
    </span>
  );
}
