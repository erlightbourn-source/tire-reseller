// Contrast pass 2026-09-29 (L1090): the tread/rim were dark-on-dark and the wheel read as a
// blob at 36px. Silver rim + lighter tread keep the same mark legible at header size.
export default function Logo({ className = "h-9 w-9", spin = false, bare = false }) {
  const scale = bare ? 1.5 : 1;
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
        <circle r="15.5" fill="#0d0f13" />
        <circle r="15.5" fill="none" stroke="#000" strokeOpacity="0.4" strokeWidth="1.5" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const x1 = Math.cos(a) * 9.5;
          const y1 = Math.sin(a) * 9.5;
          const x2 = Math.cos(a) * 15;
          const y2 = Math.sin(a) * 15;
          return (
            <line
              key={i}
              x1={x1.toFixed(2)}
              y1={y1.toFixed(2)}
              x2={x2.toFixed(2)}
              y2={y2.toFixed(2)}
              stroke="#3d465a"
              strokeWidth="2.4"
            />
          );
        })}
        <circle r="8.5" fill="#c3cad6" />
        <circle r="8.5" fill="none" stroke="#e6eaf0" strokeWidth="1" />
        <circle r="3.4" fill="#0d0f13" />
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={(Math.cos(a) * 5.6).toFixed(2)}
              cy={(Math.sin(a) * 5.6).toFixed(2)}
              r="1.2"
              fill="#2f5ee8"
            />
          );
        })}
        </g>
      </g>
    </svg>
  );
}

