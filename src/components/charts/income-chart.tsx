"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { month: "Jan", income: 85000, expenses: -20000 },
  { month: "Feb", income: 72000, expenses: -15000 },
  { month: "Mar", income: 95000, expenses: -25000 },
  { month: "Apr", income: 130000, expenses: -40000 },
  { month: "May", income: 110000, expenses: -30000 },
  { month: "Jun", income: 88000, expenses: -18000 },
  { month: "Jul", income: 65000, expenses: -22000 },
  { month: "Aug", income: 78000, expenses: -12000 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === "income");
    return (
      <div className="glass-dark rounded-xl px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
          <span className="text-[13px] font-semibold">Income</span>
        </div>
        <p className="mt-1 text-[20px] font-bold">
          AED {((income?.value ?? 0) / 1000).toFixed(0)}K
        </p>
        <p className="text-[11px] text-white/60">This week</p>
      </div>
    );
  }
  return null;
}

export function IncomeChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid
          strokeDasharray="none"
          stroke="var(--border-subtle)"
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--text-meta)", fontSize: 12 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--text-meta)", fontSize: 11 }}
          tickFormatter={(v) => {
            if (v === 0) return "0";
            return `${v / 1000}k`;
          }}
          dx={-4}
          domain={[-50000, 150000]}
        />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Bar dataKey="income" radius={[3, 3, 0, 0]} maxBarSize={18}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-income-${index}`}
              fill={index === 3 ? "#EF4444" : "#22C55E"}
              opacity={index === 3 ? 1 : 0.85}
            />
          ))}
        </Bar>
        <Bar dataKey="expenses" radius={[0, 0, 3, 3]} maxBarSize={18}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-expense-${index}`}
              fill={index === 3 ? "#EF4444" : "#22C55E"}
              opacity={0.3}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
