export default function Logo({ className = "h-9 w-9", spin = false, bare = false }) {
  const scale = bare ? 1.4 : 1; // tire r=16.5 → 23.1 of the 24 half-box, no edge clip
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ttRim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4d84ff" />
          <stop offset="1" stopColor="#3d74ff" />
        </linearGradient>
      </defs>
      {!bare && <rect width="48" height="48" rx="12" fill="url(#ttRim)" />}
      <g transform={`translate(24 24) scale(${scale})`}>
        <g
          className={spin ? "animate-spinslow" : ""}
          style={spin ? { transformBox: "fill-box", transformOrigin: "center" } : undefined}
        >
        {/* Dark tread ring + silver rim: reads as a tire down to favicon size (the old all-dark wheel blurred into a blob at 28-36px). */}
        <circle r="16.5" fill="#0b0d11" />
        {Array.from({ length: 18 }).map((_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={(Math.cos(a) * 12.6).toFixed(2)}
              y1={(Math.sin(a) * 12.6).toFixed(2)}
              x2={(Math.cos(a) * 16.5).toFixed(2)}
              y2={(Math.sin(a) * 16.5).toFixed(2)}
              stroke="#4a5468"
              strokeWidth="2.1"
            />
          );
        })}
        <circle r="12.4" fill="#0b0d11" />
        <circle r="9.4" fill="#c3cddf" />
        <circle r="9.4" fill="none" stroke="#e8eef8" strokeWidth="0.8" />
        <circle r="6.6" fill="#8d99b0" />
        <circle r="3.1" fill="#0b0d11" />
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={(Math.cos(a) * 4.9).toFixed(2)}
              cy={(Math.sin(a) * 4.9).toFixed(2)}
              r="1.05"
              fill="#0b0d11"
            />
          );
        })}
        </g>
      </g>
    </svg>
  );
}

