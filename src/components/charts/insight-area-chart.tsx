"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

const data = [
  { x: 0, value: 20 },
  { x: 1, value: 35 },
  { x: 2, value: 28 },
  { x: 3, value: 45 },
  { x: 4, value: 38 },
  { x: 5, value: 55 },
  { x: 6, value: 48 },
  { x: 7, value: 60 },
  { x: 8, value: 52 },
  { x: 9, value: 70 },
];

export function InsightAreaChart() {
  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F87171" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#F87171" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#F87171"
          strokeWidth={1.5}
          fill="url(#pinkGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
