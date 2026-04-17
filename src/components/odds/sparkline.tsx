"use client";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Tiny hand-rolled SVG sparkline. No library dependency, no layout
 * shift, renders cleanly in a table cell. Returns null if there aren't
 * enough points to draw a line.
 */
export function Sparkline({
  values,
  width = 40,
  height = 12,
  className,
}: SparklineProps) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => {
    const x = i * stepX;
    // Invert y so higher prices render upward.
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Price trend: if the last point is lower than the first, price has
  // shortened (odds dropped). Amber for dropping, green for drifting.
  const dropped = values[values.length - 1] < values[0];
  const stroke = dropped ? "#f59e0b" : "#00FF87";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points.join(" ")}
        opacity={0.85}
      />
    </svg>
  );
}
