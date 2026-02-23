"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

const emptyData = [
  { week: "W1", sales: 0, forecast: 0 },
  { week: "W2", sales: 0, forecast: 0 },
  { week: "W3", sales: 0, forecast: 0 },
  { week: "W4", sales: 0, forecast: 0 },
  { week: "W5", sales: 0, forecast: 0 },
  { week: "W6", sales: 0, forecast: 0 },
  { week: "W7", sales: 0, forecast: 0 },
  { week: "W8", sales: 0, forecast: 0 },
];

interface ForecastBarChartProps {
  variant?: "green" | "mixed";
  data?: Array<{ week: string; sales: number; forecast: number }>;
}

export function ForecastBarChart({ variant = "green", data }: ForecastBarChartProps) {
  const chartData = data && data.length > 0 ? data : emptyData;
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={chartData} barGap={1}>
        <XAxis
          dataKey="week"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--text-meta)", fontSize: 11 }}
          dy={4}
        />
        <YAxis hide />
        <Bar dataKey="sales" radius={[2, 2, 0, 0]} maxBarSize={12}>
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill="#22C55E"
              opacity={index === chartData.length - 1 ? 1 : 0.65 + index * 0.04}
            />
          ))}
        </Bar>
        <Bar dataKey="forecast" radius={[2, 2, 0, 0]} maxBarSize={12}>
          {chartData.map((_, index) => (
            <Cell
              key={`cell-f-${index}`}
              fill="#22C55E"
              opacity={0.2}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
