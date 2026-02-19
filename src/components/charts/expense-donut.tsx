"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Office Supplies", value: 12500, color: "#3B82F6" },
  { name: "Travel", value: 8200, color: "#EF4444" },
  { name: "Utilities", value: 5400, color: "#FBBF24" },
  { name: "Rent", value: 15000, color: "#0F172A" },
  { name: "Professional Services", value: 6800, color: "#22C55E" },
  { name: "Other", value: 3100, color: "#A78BFA" },
];

const total = data.reduce((s, d) => s + d.value, 0);

export function ExpenseDonut() {
  return (
    <div className="flex items-center gap-6">
      <div className="h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`AED ${Number(value).toLocaleString()}`, ""]}
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
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
              <span className="text-text-secondary">{d.name}</span>
            </div>
            <span className="font-mono font-medium text-text-primary">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
