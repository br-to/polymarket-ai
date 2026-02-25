"use client";

interface PricePoint {
  t: number;
  p: number;
}

interface PriceChartProps {
  data: PricePoint[];
  height?: number;
}

export function PriceChart({ data, height = 200 }: PriceChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-8 text-center">
        価格履歴データがありません
      </div>
    );
  }

  const prices = data.map((d) => d.p);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 0.01;

  const width = 600;
  const padding = { top: 20, right: 10, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y =
      padding.top + chartHeight - ((d.p - minPrice) / range) * chartHeight;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${padding.left + chartWidth},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;

  const latestPrice = prices[prices.length - 1];
  const firstPrice = prices[0];
  const change = latestPrice - firstPrice;
  const isUp = change >= 0;

  // Y-axis labels
  const yLabels = [minPrice, minPrice + range / 2, maxPrice].map((v) => ({
    value: `${(v * 100).toFixed(0)}%`,
    y:
      padding.top + chartHeight - ((v - minPrice) / range) * chartHeight,
  }));

  // X-axis labels
  const firstDate = new Date(data[0].t * 1000);
  const lastDate = new Date(data[data.length - 1].t * 1000);
  const formatDate = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {(latestPrice * 100).toFixed(1)}%
        </span>
        <span
          className={`text-sm font-medium ${isUp ? "text-green-600" : "text-red-600"}`}
        >
          {isUp ? "+" : ""}
          {(change * 100).toFixed(1)}%
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={isUp ? "#22c55e" : "#ef4444"}
              stopOpacity="0.2"
            />
            <stop
              offset="100%"
              stopColor={isUp ? "#22c55e" : "#ef4444"}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={label.y}
              x2={padding.left + chartWidth}
              y2={label.y}
              stroke="#e5e7eb"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 8}
              y={label.y + 4}
              textAnchor="end"
              className="text-xs fill-gray-400"
              fontSize="11"
            >
              {label.value}
            </text>
          </g>
        ))}
        {/* Area */}
        <path d={areaPath} fill="url(#areaGradient)" />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={isUp ? "#22c55e" : "#ef4444"}
          strokeWidth="2"
        />
        {/* X-axis */}
        <text
          x={padding.left}
          y={height - 5}
          className="text-xs fill-gray-400"
          fontSize="11"
        >
          {formatDate(firstDate)}
        </text>
        <text
          x={padding.left + chartWidth}
          y={height - 5}
          textAnchor="end"
          className="text-xs fill-gray-400"
          fontSize="11"
        >
          {formatDate(lastDate)}
        </text>
      </svg>
    </div>
  );
}
