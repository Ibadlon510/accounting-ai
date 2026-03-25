"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const emptyData = [
  { name: "No data", value: 1, color: "#E8E8EA" },
];

interface ExpenseDonutProps {
  data?: Array<{ name: string; value: number; color: string }>;
  currency?: string;
}

export function ExpenseDonut({ data, currency = "AED" }: ExpenseDonutProps) {
  const chartData = data && data.length > 0 ? data : emptyData;
  const total = chartData.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px] shrink-0">
        {/* Use explicit height to avoid negative sizing issues in some container layouts */}
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${currency} ${Number(value).toLocaleString()}`, ""]}
              contentStyle={{
                background: "white",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {chartData[0]?.name === "No data" ? (
          <p className="text-[12px] text-text-meta">No expense data yet</p>
        ) : (
          chartData.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-text-secondary">{d.name}</span>
              </div>
              <span className="font-mono font-medium text-text-primary">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
