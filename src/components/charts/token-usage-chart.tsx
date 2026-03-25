"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const emptyData: Array<{ day: string; tokens: number }> = [];

interface TokenUsageChartProps {
  data?: Array<{ day: string; tokens: number }>;
}

export function TokenUsageChart({ data }: TokenUsageChartProps) {
  const chartData = data && data.length > 0 ? data : emptyData;
  const totalUsed = chartData.reduce((s, d) => s + d.tokens, 0);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-text-meta">30-Day Usage</p>
          <p className="text-[20px] font-bold text-text-primary">{totalUsed.toLocaleString()} tokens</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-text-meta">Daily Average</p>
          <p className="text-[14px] font-semibold text-text-primary">{Math.round(totalUsed / 30)} / day</p>
        </div>
      </div>
      <div className="h-[140px]">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[12px] text-text-meta">No token usage yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis dataKey="day" tick={false} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [`${Number(value)} tokens`, ""]}
              contentStyle={{
                background: "white",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="tokens" fill="var(--accent-ai)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
