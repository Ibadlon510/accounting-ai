"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { week: "W1", sales: 8500, forecast: 7200 },
  { week: "W2", sales: 12000, forecast: 9500 },
  { week: "W3", sales: 9800, forecast: 8800 },
  { week: "W4", sales: 15200, forecast: 11000 },
  { week: "W5", sales: 11500, forecast: 10200 },
  { week: "W6", sales: 18000, forecast: 13500 },
  { week: "W7", sales: 14200, forecast: 12000 },
  { week: "W8", sales: 16800, forecast: 14500 },
];

interface ForecastBarChartProps {
  variant?: "green" | "mixed";
}

export function ForecastBarChart({ variant = "green" }: ForecastBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barGap={1}>
        <XAxis
          dataKey="week"
          axisLine={false}
          tickLine={false}
          tick={false}
        />
        <YAxis hide />
        <Bar dataKey="sales" radius={[2, 2, 0, 0]} maxBarSize={12}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill="#22C55E"
              opacity={index === data.length - 1 ? 1 : 0.65 + index * 0.04}
            />
          ))}
        </Bar>
        <Bar dataKey="forecast" radius={[2, 2, 0, 0]} maxBarSize={12}>
          {data.map((_, index) => (
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
