/**
 * Pure-SVG sparkline. No chart library, no client component (server-renderable).
 *
 *   <Sparkline points={[2, 3, 1, 4]} />
 *
 *  - Less than 2 points → a flat dotted placeholder.
 *  - Uses the accent gradient stroke.
 */
export function Sparkline({
  points,
  height = 28,
  width = 80,
  className,
}: {
  points: number[];
  height?: number;
  width?: number;
  className?: string;
}) {
  if (points.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className={className}
        aria-hidden="true"
      >
        <line
          x1={0}
          x2={width}
          y1={height / 2}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 3"
          className="text-foreground-muted opacity-40"
        />
      </svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const linePath = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPath =
    `M0,${height} ` +
    coords.map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${width},${height} Z`;

  // Shared defs across all sparklines on the page. The gradient is
  // theme-aware (uses CSS vars) so reusing the same ID is intentional.
  const gradId = "sparkline-grad";
  const areaGradId = "sparkline-grad-area";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="hsl(var(--accent-from))" />
          <stop offset="100%" stopColor="hsl(var(--accent-to))" />
        </linearGradient>
        <linearGradient id={areaGradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--accent-from))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--accent-to))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${areaGradId})`} />
      <polyline
        points={linePath}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
