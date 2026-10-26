import { G, Line, Path, Rect, Svg, Text as SvgText } from "@react-pdf/renderer";


type Point = { date: string; value: number };

export function PdfLineChart({
  points,
  width = 500,
  height = 160,
  color = "#2563eb",
}: {
  points: Point[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (points.length === 0) return null;
  const padding = { top: 12, right: 8, bottom: 28, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const coords = points.map((point, index) => {
    const x =
      padding.left +
      (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = padding.top + innerH - ((point.value - min) / span) * innerH;
    return { x, y, label: point.date.slice(5) };
  });

  const d = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      <Line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={height - padding.bottom}
        stroke="#d1d5db"
        strokeWidth={1}
      />
      <Line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        stroke="#d1d5db"
        strokeWidth={1}
      />
      <Path d={d} stroke={color} strokeWidth={2} fill="none" />
      <SvgText x={4} y={padding.top + 8} style={{ fontSize: 8, fill: "#6b7280" }}>
        {max.toFixed(1)}
      </SvgText>
      <SvgText x={4} y={height - padding.bottom} style={{ fontSize: 8, fill: "#6b7280" }}>
        {min.toFixed(1)}
      </SvgText>
      {coords.filter((_, index) => index === 0 || index === coords.length - 1).map((point) => (
        <SvgText
          key={point.label + point.x}
          x={point.x - 12}
          y={height - 8}
          style={{ fontSize: 8, fill: "#6b7280" }}
        >
          {point.label}
        </SvgText>
      ))}
    </Svg>
  );
}

export function PdfBarChart({
  items,
  width = 500,
  height = 140,
}: {
  items: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
}) {
  if (items.length === 0) return null;
  const padding = { top: 8, right: 8, bottom: 28, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...items.map((item) => item.value), 1);
  const gap = 8;
  const barW = Math.max(8, (innerW - gap * (items.length - 1)) / items.length);

  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />
      {items.map((item, index) => {
        const barH = (item.value / max) * innerH;
        const x = padding.left + index * (barW + gap);
        const y = padding.top + innerH - barH;
        return (
          <G key={item.label}>
            <Rect x={x} y={y} width={barW} height={barH} fill="#2563eb" />
            <SvgText
              x={x}
              y={height - 10}
              style={{ fontSize: 7, fill: "#6b7280" }}
            >
              {item.label.slice(5)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
